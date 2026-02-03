import { axios, expect } from './util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';
import entityUtil from './entity-util.js';
import chartUtil from './chart-util.js';

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

async function requestToCreateEntries(financialYear) {
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/createEntries?${getAPIParams()}`,
      {
        endDateStr: `30/06/${financialYear}`,
        fundId: `${context.TestConfig.entityId}`,
        startDateStr: `01/07/${financialYear - 1}`,
        plWorksheet: false,
        doSegregation: true,
        doSegregationIncome: false,
        smartCEOption: "s1"
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function requestToCreatePartialYearEntries(financialYear) {
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/createEntries?${getAPIParams()}`,
      {
        endDateStr: `${financialYear.endDate.split('-')[2]}/${financialYear.endDate.split('-')[1]}/${financialYear.endDate.split('-')[0]}`,
        fundId: `${context.TestConfig.entityId}`,
        startDateStr: `${financialYear.startDate.split('-')[2]}/${financialYear.startDate.split('-')[1]}/${financialYear.startDate.split('-')[0]}`,
        plWorksheet: false,
        doSegregation: true,
        doSegregationIncome: false,
        smartCEOption: "s1"
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function getCreateEntriesStatus(ceId) {
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesStatusController/query/${ceId}?${getAPIParams()}`
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}


const checkCreateEntriesWithRetry = async (
  ceId,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt
) => {
  const check_create_entries_retry = async (keyword, n) => {
    const result = await getCreateEntriesStatus(ceId);

    if (result.genericProcessStatus === "F") {
      return result;
    } else if (n === 1) {
      throw new Error(
        `Unable to confirm create entries completed before time out for ${ceId}`
      );
    } else {
      await testUtil.sleep(ms);
      return await check_create_entries_retry(keyword, n - 1);
    }
  };
  return await check_create_entries_retry(ceId, numberOfRetry);
};

async function createEntries(financialYear) {
  const ceId = await requestToCreateEntries(financialYear);

  const ceResult = await checkCreateEntriesWithRetry(ceId);

  expect(ceResult.genericProcessResult).to.eql('S', 'Create Entries Process Result');

  return ceResult;
}

async function createPartialYearEntries(financialYear) {
  const ceId = await requestToCreatePartialYearEntries(financialYear);

  const ceResult = await checkCreateEntriesWithRetry(ceId);

  expect(ceResult.genericProcessResult).to.eql('S', 'Create Entries Process Result');

  return ceResult;
}

async function CECPMultipleFY(financialYear) {
  for (let i = financialYear.startYear; i <= financialYear.endYear; i++) {
    console.log(`Create Entries for FY${i}`);
    await createEntries(i);
    await testUtil.sleep(2000);
    console.log('close entries');
    await closeEntries(i);
    await testUtil.sleep(2000);
  }
}

async function getSysEntriesList() {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/getSysEntriesList/${context.TestConfig.entityId}/?${getAPIParams()}&p=SFUND`);
    expect(response.status).to.eql(200, "Can not get system entries list");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function closeEntries(test) {
  const entryId = (await getSysEntriesList()).sysEntries[0].id;
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/closeEntries/${entryId}/${context.TestConfig.entityId}/?${getAPIParams()}&p=SFUND`);
    expect(response.status).to.eql(200, "Can not close entry");
    const fundDetails = await entityUtil.getEntityDetail();
    context.TestConfig.financialYear = fundDetails.financialYearEnd.split('-')[0];
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function reverseEntries(inputs) {
  const entry = (await getSysEntriesList()).sysEntries[0];

  expect(entry.finYear).to.eql(inputs.financialYear, "Reverse Entries Financial Year");

  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/deleteEntries/${entry.id}/${context.TestConfig.entityId}/?${getAPIParams()}&p=SFUND`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getTaxAdjustments() {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/getTaxAdjustments/${context.TestConfig.entityId}/?${getAPIParams()}&p=SFUND`);
    expect(response.status).to.eql(200, "Get Tax Adjustments");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getTaxAdjustmentOptions() {
  try {
    const response = await axios.get(
      `${context.TestConfig.serverURL}/s/js/create-entries/options_js.json?t=${new Date().getTime()}`);
    expect(response.status).to.eql(200, "Get Tax Adjustment Options");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function addTaxAdjustments(inputs) {
  const taxAdjOptions = await getTaxAdjustmentOptions();
  const existing = await getTaxAdjustments();

  const payload = {
    enabledEdit: true,
    fundId: context.TestConfig.entityId,
    finYear: existing.finYear,
    taxAdjustmentItemList: [],
    accountList: []
  };

  for (t of inputs.taxAdjustments) {
    const foundOption = taxAdjOptions.taxAdjLabels.find(o => o.label === t.taxLabel);
    if (!foundOption) throw new Error(`Unsupported tax adjustment label: ${t.taxLabel}`);

    const newItem = {
      taxLabel: foundOption.code,
      amount: t.amount
    }

    if (t.hasOwnProperty('accountCode')) {
      const getAccResponse = await chartUtil.getChartAccDataByFullAccCode(t.accountCode);
      if (getAccResponse.records.length == 0) throw Error(`Unable to find chart account: ${t.accountCode}`);

      const foundAcc = getAccResponse.records[0];
      newItem.accountId = foundAcc.id;

      payload.accountList.push({
        id: foundAcc.id,
        name: foundAcc.name
      });
    }
    payload.taxAdjustmentItemList.push(newItem);
  }

  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/addTaxAdjustments?${getAPIParams()}&p=SFUND`,
      payload);
    expect(response.status).to.eql(200, "Add Tax Adjustments");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function deleteTaxAdjustments(inputs) {
  const taxAdjOptions = await getTaxAdjustmentOptions();
  const existing = await getTaxAdjustments();

  for (t of inputs.taxAdjustments) {
    const foundOption = taxAdjOptions.taxAdjLabels.find(o => o.label === t.taxLabel);
    if (!foundOption) throw new Error(`Unsupported tax adjustment label: ${t.taxLabel}`);

    const foundAdj = existing.taxAdjustmentItemList.find(e => foundOption.code === e.taxLabel &&
      e.amount === t.amount);
    if (!foundAdj) throw new Error(`Unable to find tax adjustment: ${t.taxLabel} with amount: ${t.amount}`);

    try {
      const response = await axios.post(
        `${context.TestConfig.serverURL}/chart/chartmvc/EntriesController/deleteTaxAdjustment/${foundAdj.id}/${context.TestConfig.entityId}/?${getAPIParams()}`);
      expect(response.status).to.eql(200, "Delete Tax Adjustment");
      return response.data;
    }
    catch (error) {
      throw testUtil.createErrorForAxios(error);
    }
  }
}

async function getAnnualReturn(financialYear = context.TestConfig.financialYear) {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/AnnualReturnPageController/getAnnualReturnSection/${financialYear}?${getAPIParams()}`);

    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function checkSMSFAnnualReturn(inputs) {

  let financialYear = inputs.financialYear;

  if (financialYear === undefined || financialYear === null) {
    const annualReturnMain = await getAnnualReturnMain();
    financialYear = annualReturnMain.finYear;
  }

  const actualAnnualReturn = await getAnnualReturn(financialYear);

  expect(actualAnnualReturn).to.containSubset(inputs.expectedResult, "SMSF Annual Return test");
}

async function getAnnualReturnMain() {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/AnnualReturnPageController/getAnnualReturnMain/finYear?${getAPIParams()}`);
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getAnnualReturnSection(financialYear, memberId) {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/AnnualReturnPageController/getAnnualReturnSection/${financialYear}/${memberId}?${getAPIParams()}`);
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function checkSMSFMemberAnnualReturn(inputs) {
  const annualReturnMain = await getAnnualReturnMain();
  const member = annualReturnMain.members.find(m => { return m.memberName === inputs.memberName; });

  if (!member) throw new Error(`Failed to find member:${inputs.memberName} in annual return`);

  const actualAnnualReturn = await getAnnualReturnSection(inputs.financialYear, member.id);

  expect(actualAnnualReturn).to.containSubset(inputs.expectedResult, `SMSF member Annual Return test for ${inputs.memberName}`);
}

async function getCGTSchedule(financialYear = context.TestConfig.financialYear) {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/FormInstancesPageController/edit/CGTSche/${financialYear}?${getAPIParams()}`);
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function checkCGTSchedule(inputs) {
  const actualCGTSchedule = await getCGTSchedule(inputs.financialYear);

  expect(actualCGTSchedule).to.containSubset(inputs.expectedResult, "SMSF CGT Schedule test");
}

async function getGenericStatus(id) {
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/GenericStatusController/query/${id}`
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

const checkGenericStatusWithRetry = async (
  id,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt
) => {
  const check_generic_status_retry = async (keyword, n) => {
    await testUtil.sleep(ms);
    const result = await getGenericStatus(id);

    if (result.genericProcessStatus === "F") {
      return result;
    } else if (n === 1) {
      throw new Error(
        `Unable to confirm process completed before time out for ${id}`
      );
    } else {
      await testUtil.sleep(ms);
      return await check_generic_status_retry(keyword, n - 1);
    }
  };
  return await check_generic_status_retry(id, numberOfRetry);
};

async function validateSMSFAnnualReturnNew(financialYear = context.TestConfig.financialYear) {
  const payload = {
    serviceType: 'PRE_LODGE',
    items: [
      {
        year: financialYear,
        fundId: context.TestConfig.entityId,
        formInstanceType: 'SMSF_ANNUAL_RETURN',
      },
    ],
  };
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/SSBRLodgementController/process?${getAPIParams()}`,
      payload
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  await checkGenericStatusWithRetry(response.data);

};

async function checkValidateSMSFAnnualReturnNew(test, testObject, testSuite) {

  let financialYear = test.financialYear;

  if (financialYear === undefined || financialYear === null) {
    const annualReturnMain = await getAnnualReturnMain();
    financialYear = annualReturnMain.finYear;
  }

  let getAnnualReturnResult = await getAnnualReturn(financialYear);

  await validateSMSFAnnualReturnNew(financialYear);
};

export default {
  createEntries,
  createPartialYearEntries,
  CECPMultipleFY,
  reverseEntries,
  closeEntries,
  getTaxAdjustments,
  getTaxAdjustmentOptions,
  addTaxAdjustments,
  deleteTaxAdjustments,
  checkSMSFAnnualReturn,
  checkSMSFMemberAnnualReturn,
  checkCGTSchedule,
  checkValidateSMSFAnnualReturnNew
};
