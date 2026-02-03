import { axios, expect } from '../lib/util.js';
import { context } from '../data/context.js';

import testUtil from './test-util.js';
import chartUtil from './chart-util.js';

import Decimal from 'decimal.js';

import format from 'date-fns/format';
import parse from 'date-fns/parse';
import sub from 'date-fns/sub';
import add from 'date-fns/add';

const CORP_ACTIONS = {
  RETURN_OF_CAPITAL: "ReturnOfCapital",
  DEMERGER: "Demerger",
  MERGER: "Merger",
  RENOUNCEABLEISSUE: "RenounceableIssue",
  NONRENOUNCEABLEISSUE: "NonRenounceableIssue",
  DRP: "DividendReinvestmentPlan",
  SHAREPURCHASEPLAN: "SharePurchasePlan",
  CODECHANGE: "CodeChange",
  SHARECONSOLIDATION: "ShareConsolidation",
  SHARESPLIT: "ShareSplit",
  BONUSISSUE: "BonusIssue"
};

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

function fractionRounding(rounding, unitsBeforeRounding) {
  switch (rounding) {
    case 50: //.50 or more rounded up
      return new Decimal(unitsBeforeRounding).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    case 60: //over 0.5 round up
      return new Decimal(unitsBeforeRounding).toDecimalPlaces(0, Decimal.ROUND_HALF_DOWN);
    case 200: //round_down
    case 300:
    case 500:
      return new Decimal(unitsBeforeRounding).toDecimalPlaces(0, Decimal.ROUND_DOWN);
    case 100: //round_up
    case 400:
      return new Decimal(unitsBeforeRounding).toDecimalPlaces(0, Decimal.ROUND_UP);
    default:
      throw new Error(`Unsupported Fraction Rounding ${rounding}`);
  }
}


async function searchSystemCorpActions(actionDate, accountCode) {
  const dateTime = new Date(actionDate).getTime();
  const searchBody = {
    keyword: accountCode,
    startDate: dateTime,
    endDate: dateTime,
  };

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/CorporateActionController/searchCorpActionCustoms?${getAPIParams()}`,
      searchBody
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function getMatchedSystemCorpAction(corpActionInputs) {
  let corpActions = await searchSystemCorpActions(
    corpActionInputs.actionDate,
    corpActionInputs.accountCode
  );

  if (corpActionInputs.actionType == "Delisted") {
    if (corpActions.length == 0) {
      let oneDayAgo = sub(new Date(corpActionInputs.actionDate), { days: 1 }).toLocaleDateString("en-AU"); // dd/mm/yyyy
      oneDayAgo = format(parse(oneDayAgo, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd');
      corpActionInputs.actionDate = oneDayAgo;
      console.log('actionDate - 1day --->', corpActionInputs.actionDate, corpActionInputs.accountCode);
      corpActions = await searchSystemCorpActions(
        corpActionInputs.actionDate,
        corpActionInputs.accountCode
      );

      if (corpActions.length == 0) {
        let oneDayAgo = add(new Date(corpActionInputs.actionDate), { days: 2 }).toLocaleDateString("en-AU"); // dd/mm/yyyy
        oneDayAgo = format(parse(oneDayAgo, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd');
        corpActionInputs.actionDate = oneDayAgo;
        console.log('actionDate + 1day --->', corpActionInputs.actionDate, corpActionInputs.accountCode);
        corpActions = await searchSystemCorpActions(
          corpActionInputs.actionDate,
          corpActionInputs.accountCode
        );
      }
    }
  }

  expect(corpActions.length).to.be.above(
    0,
    "Search system corp action contains at least 1 result"
  );
  expect(corpActions[0].corporateActionType).to.eql(
    corpActionInputs.actionType,
    "Corp Action type is matched"
  );
  return corpActions[0];
}

async function processReturnOfCapital(sysCorpAction, corpActionInputs) {
  const costBaseEffect = corpActionInputs.payment
    ? -1 * corpActionInputs.payment
    : -1 * sysCorpAction.unitsOnHand * sysCorpAction.totalReturn;

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,
    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    costBaseEffect: costBaseEffect,
    unitsOnHand: sysCorpAction.unitsOnHand,
    description: sysCorpAction.description,
  };

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/CorporateActionController/postCorporateAction/ReturnOfCapital?${getAPIParams()}`,
      requestBody
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function processSystemDemerger(sysCorpAction, corpActionInputs) {
  const demergedSecurityData = (await axios.post(
    `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
    { qsContent: sysCorpAction.objectSecurityCode })).data;
  if (demergedSecurityData.totalRecords == 0)
    throw new Error(`Demerged Security "${sysCorpAction.objectSecurityCode}" does not exist in fund!`);

  let demergedSecurityTaccId = 0;
  const demergedSecurityTaccData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/investmentAccountList/get?${getAPIParams()}`,
    sysCorpAction.objectSecurityCode, { headers: { 'Content-Type': 'text/plain' } })).data;
  if (demergedSecurityTaccData.length >= 1) {
    for (let i = 0; i < demergedSecurityTaccData.length; i += 1) {
      if (demergedSecurityTaccData[i].investCode == sysCorpAction.objectSecurityCode) {
        demergedSecurityTaccId = demergedSecurityTaccData[i].id;
        break;
      }
    }
  } else {
    demergedSecurityTaccId = (await chartUtil.addInvestmentSubAccountForSecurity(sysCorpAction.objectSecurityCode)).id;
  }

  let demergedUnitsAfter = 0;
  if (corpActionInputs.demergedUnitsAfter != "${AUTO_CALCULATED}") demergedUnitsAfter = corpActionInputs.demergedUnitsAfter;
  else {
    demergedUnitsAfter = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processSystemDemerger -> demergedUnitsAfter: ", demergedUnitsAfter);
  }

  if (corpActionInputs.costPerUnitFlag == true && corpActionInputs.demergedCostPerUnit == null) {
    throw new Error('please set value of "demergedCostPerUnit" in test data file!');
  } else if (corpActionInputs.costPerUnitFlag == false && corpActionInputs.demergedRatio == null) {
    throw new Error('please set value of "demergedRatio" in test data file!');
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    demergedSecurityTaccId: demergedSecurityTaccId,
    demergedSecurityCode: sysCorpAction.objectSecurityCode,
    unitsOnHand: sysCorpAction.unitsOnHand,

    units: sysCorpAction.unitsOnHand,
    demergedUnitsAfter: demergedUnitsAfter,
    contractDateFlag: corpActionInputs.contractDateFlag,
    costPerUnitFlag: corpActionInputs.costPerUnitFlag,
    demergedCostPerUnit: corpActionInputs.demergedCostPerUnit,
    demergedRatio: corpActionInputs.demergedRatio,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/Demerger?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Demerger");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processSystemMerger(sysCorpAction, corpActionInputs) {
  let mergedSecurityTaccId = "";
  if (sysCorpAction.objectSecurityCode == "" || sysCorpAction.objectSecurityCode == null) {
    mergedSecurityTaccId = null;
  } else {
    const mergedSecurityData = (await axios.post(
      `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
      { qsContent: sysCorpAction.objectSecurityCode })).data;
    if (mergedSecurityData.totalRecords == 0)
      throw new Error(`Merged Security "${sysCorpAction.objectSecurityCode}" does not exist in fund!`);

    const mergedSecurityTaccData = (await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/investmentAccountList/get?${getAPIParams()}`,
      sysCorpAction.objectSecurityCode, { headers: { 'Content-Type': 'text/plain' } })).data;
    if (mergedSecurityTaccData.length >= 1) {
      mergedSecurityTaccId = mergedSecurityTaccData[0].id;
    } else {
      mergedSecurityTaccId = (await chartUtil.addInvestmentSubAccountForSecurity(sysCorpAction.objectSecurityCode)).id;
    }
  }

  let unitsInNewInvestment = 0;
  if (corpActionInputs.unitsInNewInvestment != "${AUTO_CALCULATED}") unitsInNewInvestment = corpActionInputs.unitsInNewInvestment;
  else {
    if (sysCorpAction.multiplier == null || sysCorpAction.divisor == null) throw new Error('No multiplier or divisor!');
    unitsInNewInvestment = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processSystemMerger -> unitsInNewInvestment: ", unitsInNewInvestment);
  }

  let totalMarketValue = 0;
  if (corpActionInputs.totalMarketValue != "${AUTO_CALCULATED}") totalMarketValue = corpActionInputs.totalMarketValue;
  else {
    if (sysCorpAction.marketValue == null) throw new Error(`No market value!`);
    else totalMarketValue = (new Decimal(unitsInNewInvestment)).times(sysCorpAction.marketValue).toDecimalPlaces(2, 4);
    console.log("    processSystemMerger -> totalMarketValue: ", totalMarketValue);
  }

  let totalCashProceeds = 0;
  if (corpActionInputs.totalCashProceeds != "${AUTO_CALCULATED}") totalCashProceeds = corpActionInputs.totalCashProceeds;
  else {
    if (sysCorpAction.capitalAmount != null)
      totalCashProceeds = (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.capitalAmount).toDecimalPlaces(2, 4);
    else totalCashProceeds = 0;
    console.log("    processSystemMerger -> totalCashProceeds: ", totalCashProceeds);
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    demergedSecurityTaccId: mergedSecurityTaccId,
    demergedSecurityCode: sysCorpAction.objectSecurityCode,
    unitsOnHand: sysCorpAction.unitsOnHand,

    units: sysCorpAction.unitsOnHand,
    unitsInNewInvestment: unitsInNewInvestment,
    totalMarketValue: totalMarketValue,
    totalCashProceeds: totalCashProceeds,
    scripForScripRollover: corpActionInputs.scripForScripRollover,
    mergerFrankedAmount: corpActionInputs.mergerFrankedAmount,
    mergerUnfrankedAmount: corpActionInputs.mergerUnfrankedAmount,
    mergerFrankingCredits: corpActionInputs.mergerFrankingCredits,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/Merger?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Merger");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processSystemRightsIssueStep1(sysCorpAction, corpActionInputs) {
  const issuedSecurityData = (await axios.post(
    `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
    { qsContent: sysCorpAction.objectSecurityCode })).data;
  if (issuedSecurityData.totalRecords == 0)
    throw new Error(`Issued Security "${sysCorpAction.objectSecurityCode}" does not exist in fund!`);

  let issuedSecurityTaccId = 0;
  const issuedSecurityTaccData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/investmentAccountList/get?${getAPIParams()}`,
    sysCorpAction.objectSecurityCode, { headers: { 'Content-Type': 'text/plain' } })).data;
  if (issuedSecurityTaccData.length >= 1) {
    for (let i = 0; i < issuedSecurityTaccData.length; i += 1) {
      if (issuedSecurityTaccData[i].investCode == sysCorpAction.objectSecurityCode) {
        issuedSecurityTaccId = issuedSecurityTaccData[i].id;
        break;
      }
    }
  } else {
    issuedSecurityTaccId = (await chartUtil.addInvestmentSubAccountForSecurity(sysCorpAction.objectSecurityCode)).id;
  }

  let rightsIssued = 0;
  if (corpActionInputs.rightsIssued != "${AUTO_CALCULATED}") rightsIssued = corpActionInputs.rightsIssued;
  else {
    rightsIssued = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processReturnOfCapital -> rightsIssued: ", rightsIssued);
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    demergedSecurityTaccId: issuedSecurityTaccId,
    demergedSecurityCode: sysCorpAction.objectSecurityCode,
    unitsOnHand: sysCorpAction.unitsOnHand,

    rightsIssued: rightsIssued,
    amountPaid: corpActionInputs.amountPaid,

    description: sysCorpAction.description,
  };
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/${sysCorpAction.corporateActionType}?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Right Issues step1");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processSystemRightsIssueStep2(sysCorpAction, corpActionInputs) {
  let issuedSecurityTaccCode = '';
  const issuedSecurityTaccData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/investmentAccountList/get?${getAPIParams()}`,
    sysCorpAction.objectSecurityCode, { headers: { 'Content-Type': 'text/plain' } })).data;
  if (issuedSecurityTaccData.length >= 1) {
    for (let i = 0; i < issuedSecurityTaccData.length; i += 1) {
      if (issuedSecurityTaccData[i].investCode == sysCorpAction.objectSecurityCode) {
        issuedSecurityTaccCode = issuedSecurityTaccData[i].code;
        break;
      }
    }
  } else {
    throw new Error(`Can not find the investment account of ${sysCorpAction.objectSecurityCode}`);
  }

  newCorpActionInputs = {
    actionDate: sysCorpAction.corporateActionDate,
    actionType: `${sysCorpAction.corporateActionType}Exercised`,
    accountCode: issuedSecurityTaccCode
  }
  const newSysCorpAction = await getMatchedSystemCorpAction(newCorpActionInputs);

  const requestBody = {
    securityCode: newSysCorpAction.securityCode,
    corporateActionDateStr: newSysCorpAction.despatchDate,
    effectiveDateStr: newSysCorpAction.exBalanceDate,

    taccountId: newSysCorpAction.taccId,
    taccountCode: newSysCorpAction.taccCode,
    corporateActionType: newSysCorpAction.corporateActionType,
    originalTaccountId: sysCorpAction.taccId,

    exercised: corpActionInputs.exercised,
    sold: corpActionInputs.sold,
    lapsed: corpActionInputs.lapsed,

  };
  if (corpActionInputs.sold == true) {
    requestBody.soldDTO = {
      contractDate: newSysCorpAction.despatchDate,
      settlementDate: newSysCorpAction.despatchDate,
      rightsSold: corpActionInputs.rightsSold,
      netSaleProceeds: corpActionInputs.netSaleProceeds
    };
  } else if (corpActionInputs.exercised == true) {
    requestBody.exercisedDTO = {
      transactionDate: newSysCorpAction.despatchDate,
      contractDate: newSysCorpAction.despatchDate,
      settlementDate: newSysCorpAction.despatchDate,
      newSharesAcquired: corpActionInputs.newSharesAcquired,
      offerPrice: corpActionInputs.offerPrice
    };
  } else if (corpActionInputs.lapsed == true) {
    const incomeTAccountId = (await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/getIncomeAccount/${sysCorpAction.taccId}?${getAPIParams()}`)).data[0].taccId;
    requestBody.lapsedDTO = {
      transactionDate: newSysCorpAction.despatchDate,
      incomeTAccountId: incomeTAccountId,
      rightsLapsed: corpActionInputs.rightsLapsed,
      premiumReceived: corpActionInputs.premiumReceived,
      tfnAmountsWithheld: corpActionInputs.tfnAmountsWithheld
    };
  }

  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/${newSysCorpAction.corporateActionType}?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Right Issues step2");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processSystemRightsIssue(sysCorpAction, corpActionInputs) {
  await processSystemRightsIssueStep1(sysCorpAction, corpActionInputs);
  await processSystemRightsIssueStep2(sysCorpAction, corpActionInputs);
}


async function processDRP(sysCorpAction, corpActionInputs) {
  if (corpActionInputs.assessableForeignSourceIncome == null) corpActionInputs.assessableForeignSourceIncome = 0;
  if (corpActionInputs.foreignIncomeTaxCredits == null) corpActionInputs.foreignIncomeTaxCredits = 0;
  if (corpActionInputs.tfnAmountsWithheld == null) corpActionInputs.tfnAmountsWithheld = 0;
  if (corpActionInputs.nonResidentWithholdingTax == null) corpActionInputs.nonResidentWithholdingTax = 0;
  if (corpActionInputs.licDeduction == null) corpActionInputs.licDeduction = 0;

  let incomeAccountId = '';
  let incomeAccountCode = '';
  let incomeAccountName = '';
  const incomeAccountData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/getIncomeAccount/${sysCorpAction.taccId}?${getAPIParams()}`)).data;
  if (incomeAccountData.length == 0)
    throw new Error(`Can not get Income Account for ${sysCorpAction.taccCode}`);
  else {
    incomeAccountId = incomeAccountData[0].taccId;
    incomeAccountCode = incomeAccountData[0].taccCode;
    incomeAccountName = incomeAccountData[0].taccName;
  }

  let residualAccountId = '';
  let residualAccountCode = '';
  let residualAccountName = '';
  let accrualAccountId = '';
  const residualAccountData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/getResidualAccount/${sysCorpAction.taccId}?${getAPIParams()}`)).data;
  if (residualAccountData.length == 0)
    throw new Error(`Can not get Residual Account for ${sysCorpAction.taccCode}`);
  else {
    for (let i = 0; i < residualAccountData.length; i += 1) {
      if (residualAccountData[i].taccName == 'Reinvestment Residual Account') { // 62550
        residualAccountId = residualAccountData[i].taccId;
        residualAccountCode = residualAccountData[i].taccCode;
        residualAccountName = residualAccountData[i].taccName;
      } else if (residualAccountData[i].taccName.includes('Receivable')) // Dividend-62000/Distribution-61800
        accrualAccountId = residualAccountData[i].taccId;
    }
  }

  const frankedAmount = (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.currentDividendAmount).times(sysCorpAction.frankedPercent)
    .times(0.01).toDecimalPlaces(2, 4);
  console.log("    processDRP -> frankedAmount: ", frankedAmount);
  const unfrankedAmount = (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.currentDividendAmount)
    .times((new Decimal(1)).minus((new Decimal(sysCorpAction.frankedPercent)).times(0.01))).toDecimalPlaces(2, 4);
  console.log("    processDRP -> unfrankedAmount: ", unfrankedAmount);

  let frankingCredits = 0;
  const getCorpTaxRateFrankingCreditResponse = await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/getCorpTaxRateFrankingCredit/${incomeAccountId}?${getAPIParams()}`);
  expect(getCorpTaxRateFrankingCreditResponse.status).to.eql(200, `Can Not Get Corp Tax Rate Franking Credit for ${incomeAccountCode}!`);
  const corpTaxRateFrankingCredit = getCorpTaxRateFrankingCreditResponse.data;
  if (corpTaxRateFrankingCredit != 27.5)
    frankingCredits = (new Decimal(3)).dividedBy(7).times(frankedAmount).toDecimalPlaces(2, 4);
  else
    frankingCredits = (new Decimal(2.75)).dividedBy(7.25).times(frankedAmount).toDecimalPlaces(2, 4);
  console.log("    processDRP -> frankingCredits: ", frankingCredits);

  let grossPayment = 0;
  if (sysCorpAction.drpType == 'Dividend')
    grossPayment = (new Decimal(frankedAmount)).plus(unfrankedAmount).plus(corpActionInputs.assessableForeignSourceIncome).toDecimalPlaces(2, 4);
  else if (sysCorpAction.drpType == 'Distribution')
    grossPayment = (new Decimal(frankedAmount)).plus(unfrankedAmount).toDecimalPlaces(2, 4);
  console.log("    processDRP -> grossPayment: ", grossPayment);

  let netPayment = 0;
  if (sysCorpAction.drpType == 'Dividend')
    netPayment = (new Decimal(frankedAmount)).plus(unfrankedAmount).plus(corpActionInputs.assessableForeignSourceIncome)
      .minus(corpActionInputs.tfnAmountsWithheld).minus(corpActionInputs.nonResidentWithholdingTax).toDecimalPlaces(2, 4);
  else if (sysCorpAction.drpType == 'Distribution')
    netPayment = (new Decimal(frankedAmount)).plus(unfrankedAmount).toDecimalPlaces(2, 4);
  console.log("    processDRP -> netPayment: ", netPayment);

  const getResidualBalanceResponse = await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/getResidualBalance/${context.TestConfig.entityId}/${residualAccountId}?${getAPIParams()}`,
    sysCorpAction.corporateActionDate, { headers: { 'Content-Type': 'text/plain' } });
  expect(getResidualBalanceResponse.status).to.eql(200, `Can Not Get Residual Balance for ${residualAccountCode}!`);
  let residualBalanceBroughtForward = getResidualBalanceResponse.data;
  console.log("    processDRP -> residualBalanceBroughtForward: ", residualBalanceBroughtForward);

  let amountAvailable = 0;
  if (sysCorpAction.drpType == 'Dividend')
    amountAvailable = netPayment;
  else if (sysCorpAction.drpType == 'Distribution') {
    const income = corpActionInputs.hasOwnProperty('income') ? corpActionInputs.income : netPayment;
    amountAvailable = (new Decimal(income)).plus(corpActionInputs.accrualValue).toDecimalPlaces(2, 4);
  }
  console.log("    processDRP -> amountAvailable: ", amountAvailable);

  const reinvestmentAmount = (new Decimal(amountAvailable)).times(corpActionInputs.reinvestmentPercentage).times(0.01).plus(residualBalanceBroughtForward).toDecimalPlaces(2, 4);
  console.log("    processDRP -> reinvestmentAmount: ", reinvestmentAmount);

  let drpPricePerShare = 0;
  if (sysCorpAction.drpPrice == 0) throw new Error(`DRP Price is 0 !`);
  else drpPricePerShare = sysCorpAction.drpPrice;
  console.log("    processDRP -> drpPricePerShare: ", drpPricePerShare);

  const sharesAllotedNumber = Math.trunc(reinvestmentAmount / drpPricePerShare);
  console.log("    processDRP -> sharesAllotedNumber: ", sharesAllotedNumber);
  const costOfShares = (new Decimal(sharesAllotedNumber)).times(drpPricePerShare).toDecimalPlaces(2, 4);
  console.log("    processDRP -> costOfShares: ", costOfShares);
  const residualBalanceCarriedForward = (new Decimal(reinvestmentAmount)).minus(costOfShares).toDecimalPlaces(2, 4);
  console.log("    processDRP -> residualBalanceCarriedForward: ", residualBalanceCarriedForward);
  const cashReceived = (new Decimal(amountAvailable)).plus(residualBalanceBroughtForward).minus(reinvestmentAmount).toDecimalPlaces(2, 4);
  console.log("    processDRP -> cashReceived: ", cashReceived);

  if (residualBalanceBroughtForward == 0) residualBalanceBroughtForward = null;

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,

    drpDype: sysCorpAction.drpType,
    incomeAccountId: incomeAccountId,
    incomeAccountCode: incomeAccountCode,
    incomeAccountName: incomeAccountName,
    incomeValue: corpActionInputs.hasOwnProperty('income') ? corpActionInputs.income : netPayment,
    accrualAccountId: accrualAccountId,

    reinvestmentPercentage: corpActionInputs.reinvestmentPercentage,
    residualAccountId: residualAccountId,
    residualAccountCode: residualAccountCode,
    residualAccountName: residualAccountName,
    residualBalanceBroughtForward: residualBalanceBroughtForward,
    amountAvailable: amountAvailable,
    reinvestmentAmount: reinvestmentAmount,
    drpPricePerShare: drpPricePerShare,
    sharesAllotedNumber: sharesAllotedNumber,
    costOfShares: costOfShares,
    residualBalanceCarriedForward: residualBalanceCarriedForward,
    cashReceived: cashReceived,

    description: sysCorpAction.description,
  };

  if (sysCorpAction.drpType == 'Dividend') {
    requestBody.assessableForeignSourceIncome = corpActionInputs.assessableForeignSourceIncome;
    requestBody.foreignIncomeTaxCredits = corpActionInputs.foreignIncomeTaxCredits;
    requestBody.tfnAmountsWithheld = corpActionInputs.tfnAmountsWithheld;
    requestBody.nonResidentWithholdingTax = corpActionInputs.nonResidentWithholdingTax;
    requestBody.licDeduction = corpActionInputs.licDeduction;
    requestBody.frankedAmount = frankedAmount;
    requestBody.unfrankedAmount = unfrankedAmount;
    requestBody.frankingCredits = frankingCredits;
    requestBody.grossPayment = grossPayment;
    requestBody.netPayment = netPayment;
  } else if (sysCorpAction.drpType == 'Distribution') {
    requestBody.accrualValue = corpActionInputs.accrualValue;
    requestBody.frankedAmount = null;
    requestBody.unfrankedAmount = null;
    requestBody.frankingCredits = null;
    requestBody.grossPayment = null;
    requestBody.netPayment = null;
  }

  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/DividendReinvestmentPlan?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process DRP");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processSharePurchasePlan(sysCorpAction, corpActionInputs) {
  if (sysCorpAction.parentPrice == null) throw new Error(`No Share Purchase Plan Price for ${sysCorpAction.taccCode} !`);
  console.log("   processSharePurchasePlan -> SharePurchasePlanPrice", sysCorpAction.parentPrice);
  const unitsToPurchase = (new Decimal(corpActionInputs.unitsToPurchase)).toDecimalPlaces(0, 4);
  console.log("   processSharePurchasePlan -> unitsToPurchase", unitsToPurchase);
  const totalPurchaseAmount = (new Decimal(unitsToPurchase)).times(sysCorpAction.parentPrice).toDecimalPlaces(2, 4);
  console.log("   processSharePurchasePlan -> totalPurchaseAmount", totalPurchaseAmount);

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,

    cashReceived: 0,
    parentPrice: sysCorpAction.parentPrice,
    unitsToPurchase: unitsToPurchase,
    totalPurchaseAmount: totalPurchaseAmount,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/SharePurchasePlan?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Share Purchase Plan");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processCodeChange(sysCorpAction, corpActionInputs) {
  console.log("    processCodeChange -> newSecurityCode", sysCorpAction.objectSecurityCode);
  const newSecurityData = (await axios.post(
    `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
    { qsContent: sysCorpAction.objectSecurityCode })).data;
  if (newSecurityData.totalRecords == 0)
    throw new Error(`New Security "${sysCorpAction.objectSecurityCode}" does not exist in fund!`);

  let newSecurityTaccId = 0;
  const newSecurityTaccData = (await axios.post(
    `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/investmentAccountList/get?${getAPIParams()}`,
    sysCorpAction.objectSecurityCode, { headers: { 'Content-Type': 'text/plain' } })).data;
  if (newSecurityTaccData.length >= 1) {
    for (let i = 0; i < newSecurityTaccData.length; i += 1) {
      if (newSecurityTaccData[i].investCode == sysCorpAction.objectSecurityCode) {
        newSecurityTaccId = newSecurityTaccData[i].id;
        break;
      }
    }
  } else {
    newSecurityTaccId = (await chartUtil.addInvestmentSubAccountForSecurity(sysCorpAction.objectSecurityCode)).id;
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,
    units: sysCorpAction.unitsOnHand,

    demergedSecurityCode: sysCorpAction.objectSecurityCode,
    demergedSecurityTaccId: newSecurityTaccId,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/CodeChange?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Code Change");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processShareConsolidation(sysCorpAction, corpActionInputs) {
  let unitsAfterShareConsolidation = 0;
  if (corpActionInputs.unitsAfterShareConsolidation != "${AUTO_CALCULATED}") unitsAfterShareConsolidation = corpActionInputs.unitsAfterShareConsolidation;
  else {
    unitsAfterShareConsolidation = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processShareConsolidation -> unitsAfterShareConsolidation: ", unitsAfterShareConsolidation);
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,
    units: unitsAfterShareConsolidation,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/ShareConsolidation?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Share Consolidation");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processShareSplit(sysCorpAction, corpActionInputs) {
  let unitsAfterShareSplit = 0;
  if (corpActionInputs.unitsAfterShareSplit != "${AUTO_CALCULATED}") unitsAfterShareSplit = corpActionInputs.unitsAfterShareSplit;
  else {
    unitsAfterShareSplit = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processShareSplit -> unitsAfterShareSplit: ", unitsAfterShareSplit);
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,
    units: unitsAfterShareSplit,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/ShareSplit?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Share Split");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function processBonusIssue(sysCorpAction, corpActionInputs) {
  let bonusIssueUnits = 0;
  if (corpActionInputs.bonusIssueUnits != "${AUTO_CALCULATED}") bonusIssueUnits = corpActionInputs.bonusIssueUnits;
  else {
    bonusIssueUnits = fractionRounding(sysCorpAction.fractionRounding,
      (new Decimal(sysCorpAction.unitsOnHand)).times(sysCorpAction.multiplier).dividedBy(sysCorpAction.divisor));
    console.log("    processBonusIssue -> bonusIssueUnits: ", bonusIssueUnits);
  }

  const requestBody = {
    securityCode: sysCorpAction.securityCode,
    corporateActionDateStr: sysCorpAction.corporateActionDate,
    effectiveDateStr: sysCorpAction.exBalanceDate,

    taccountId: sysCorpAction.taccId,
    taccountCode: sysCorpAction.taccCode,
    corporateActionType: sysCorpAction.corporateActionType,
    unitsOnHand: sysCorpAction.unitsOnHand,
    units: bonusIssueUnits,

    description: sysCorpAction.description,
  };
  let response = null;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/CorporateActionController/postCorporateAction/BonusIssue?${getAPIParams()}`,
      requestBody);
    expect(response.status).to.eql(200, "Process Bonus Issue");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function verifyMultipleCorpAction(corpActionData) {
  console.log('Verifying Multiple Corp Action');
  let actionData = [];
  if (corpActionData != null) actionData = corpActionData;
  else actionData = context.ShareData;

  const findCorpAction = async (action) => {
    try {
      await getMatchedSystemCorpAction(action);
      return null;
    } catch (error) {
      return action.accountCode.split('/')[1]; // return security code
    }
  }
  const promiseChain = actionData.map((action) => findCorpAction(action));
  const responseData = await Promise.all(promiseChain);

  const notExistingCode = responseData.filter(data => data !== null);
  // console.log(`WARNING !!! - ${notExistingCode.length} corp action(s) not existing: [ ${notExistingCode} ]`);
  return notExistingCode;
  // expect(notExistingCode.length).to.eql(0, `${notExistingCode.length} corp action(s) not existing: [ ${notExistingCode} ]`);
}

async function processSystemCorpAction(corpActionInputs) {
  expect(Object.values(CORP_ACTIONS)).include(
    corpActionInputs.actionType,
    "Unsupported corp action type"
  );

  const sysCorpAction = await getMatchedSystemCorpAction(corpActionInputs);

  switch (corpActionInputs.actionType) {
    case CORP_ACTIONS.RETURN_OF_CAPITAL:
      return processReturnOfCapital(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.DEMERGER:
      return processSystemDemerger(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.MERGER:
      return processSystemMerger(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.RENOUNCEABLEISSUE:
    case CORP_ACTIONS.NONRENOUNCEABLEISSUE:
      return processSystemRightsIssue(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.DRP:
      return processDRP(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.SHAREPURCHASEPLAN:
      return processSharePurchasePlan(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.CODECHANGE:
      return processCodeChange(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.SHARECONSOLIDATION:
      return processShareConsolidation(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.SHARESPLIT:
      return processShareSplit(sysCorpAction, corpActionInputs);
    case CORP_ACTIONS.BONUSISSUE:
      return processBonusIssue(sysCorpAction, corpActionInputs);
    default:
      throw new Error(`Unsupported corp action type: ${corpActionInputs.actionType}`);
  }
}

export default {
  searchSystemCorpActions,
  processSystemCorpAction,
  verifyMultipleCorpAction
};
