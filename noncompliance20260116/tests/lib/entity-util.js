import { _, axios, assert, expect } from './util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';


function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

const ENTITY_TYPES = {
  SMSF: 'SMSF',
  COMPANY: 'Billable Company',
  TRUST: 'Billable Trust',
  INDIVIDUAL: 'Billable Individual'
}

function getEntityDetail(entityId = context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/entity/mvc/funddetail/getFundDetail?${getAPIParams()}`
      )
      .then((response) => {
        expect(response.status).to.eql(200, `Get Entity Detail`);
        resolve(response.data);
      })
      .catch((error) => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function checkEntityDetail(expectedResult, entityId = context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    getEntityDetail(entityId).then((detail) => {
      if (expectedResult.hasOwnProperty('superStreamStatus')) {
        expect(detail.status).to.eql(expectedResult.superStreamStatus);
      }
      resolve();
    })
      .catch((error) => {
        reject(error);
      });
  });
}

async function updateEntityDetail(changes, entityId = context.TestConfig.entityId) {
  const detail = await getEntityDetail(entityId);
  const payload = Object.assign({}, detail);

  if (
    changes.hasOwnProperty("insertSuperStreamTestABN") &&
    changes.insertSuperStreamTestABN
  ) {
    payload.abn = SUPERSTREAM_TEST_CLIENTS[context.TestConfig.environment].abn;
  } else if (changes.hasOwnProperty("abn")) {
    payload.abn = changes.abn;
  }
  if (changes.hasOwnProperty("financialYearFrom")) {
    payload.financialYearFrom =
      changes.financialYearFrom + context.Constants.DATE_SUFFIX;
  }
  if (changes.hasOwnProperty("financialYearEnd")) {
    payload.financialYearEnd =
      changes.financialYearEnd + context.Constants.DATE_SUFFIX;
  }
  if (changes.hasOwnProperty("deedSourceLastUpdated")) {
    payload.deedSourceLastUpdated =
      changes.deedSourceLastUpdated + context.Constants.DATE_SUFFIX;
  }
  if (changes.hasOwnProperty("shareTradingEntity")) {
    payload.shareTradingEntity = changes.shareTradingEntity;
  }
  if (changes.hasOwnProperty("disposalMethod")) {
    payload.disposalMethod = changes.disposalMethod;
  }
  if (changes.hasOwnProperty("fundDetailPostalAddressStreetLine1")) {
    payload.fundDetailPostalAddressStreetLine1 = changes.fundDetailPostalAddressStreetLine1;
    payload.fundDetailPostalAddressStreetLine2 = changes.fundDetailPostalAddressStreetLine2;
    payload.fundDetailPostalAddressSurub = changes.fundDetailPostalAddressSurub;
    payload.fundDetailPostalAddressPostCode = changes.fundDetailPostalAddressPostCode;
    payload.fundDetailPostalAddressState = changes.fundDetailPostalAddressState;
    payload.fundDetailPostalAddressCountry = changes.fundDetailPostalAddressCountry;

    if (changes.hasOwnProperty("physicalAddressSameAsPostalAddress")) {
      payload.fundDetailPhysicalAddressStreetLine1 = payload.fundDetailPostalAddressStreetLine1;
      payload.fundDetailPhysicalAddressStreetLine2 = payload.fundDetailPostalAddressStreetLine2;
      payload.fundDetailPhysicalAddressSurub = payload.fundDetailPostalAddressSurub;
      payload.fundDetailPhysicalAddressPostCode = payload.fundDetailPostalAddressPostCode;
      payload.fundDetailPhysicalAddressState = payload.fundDetailPostalAddressState;
      payload.fundDetailPhysicalAddressCountry = payload.fundDetailPostalAddressCountry;
    }
  }

  if (changes.hasOwnProperty('revalDisabled')) {
    payload.revalDisabled = changes.revalDisabled;
  }

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/entity/mvc/funddetail/saveFundDetailDTO?${getAPIParams(entityId)}`,
      payload
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  if (changes.hasOwnProperty('financialYearEnd')) {
    context.TestConfig.financialYear = changes.financialYearEnd.split('-')[0];
  }

  return response.data;
}

async function deleteFundAPI(shortFirmName, fundCode, cancelSuperStream) {
  let fundId;
  await browser.call(() => axios.post(`${context.TestConfig.serverURL}/entity/mvc/grid/getEntityListFromGrid?firm=${shortFirmName}&uid=${context.TestConfig.uid}&`,
    { example: { type: 'SMSF', name: fundCode } }).then((res) => {
      assert.equal(res.data.totalRecords, 1, 'Get 0 or more than 1 result!');
      fundId = res.data.records[0].masterId;
    }));
  await browser.call(() => axios.post(`${context.TestConfig.serverURL}/d/DeleteFund/sendDeleteFundMsg?firm=${shortFirmName}&uid=${context.TestConfig.uid}&`,
    { list: [{ masterId: fundId, cancelRegistration: cancelSuperStream }] }).then((res) => {
      assert.equal(res.status, 200, 'Delete fund failed!');
    }));
}

export default {
  ENTITY_TYPES,
  getEntityDetail,
  checkEntityDetail,
  updateEntityDetail,
  deleteFundAPI
};
