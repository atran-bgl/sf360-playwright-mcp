import { context } from '../data/context.js';
import { axios, expect } from './util.js';
import testUtil from './test-util.js';

context.ShareData.trustBeneficiaries = {};

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

async function verifyPropertySecurityCode(code) {
  let response;
  try {
    response = await axios.get(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/PropertyChartController/verifyNewSecurityCode/?code=${code}`
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function addPropertyChartAccount(inputs) {
  const investCode = await verifyPropertySecurityCode(inputs.address.streetLine1.replace(' ', '').substring(0, 4).toLowerCase());
  if (inputs.parentCode == undefined || inputs.parentCode == null || inputs.parentCode == '')
    inputs.parentCode = "77200";
  const payload = {
    "investCode": investCode,
    "parentCode": inputs.parentCode,
    "name": inputs.name,
    "type": inputs.type,
    "formatAddress": inputs.formatAddress,
    "address": inputs.address,
    "lat": (inputs.lat) ? inputs.lat : '',
    "lng": (inputs.lng) ? inputs.lng : '',
    "doesSubjectToLRBA": false,
    "doesReportPCTaxReturn": false
  };

  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/PropertyChartController/postPropertyCharts/?${getAPIParams()}`,
      payload
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function getAllPropertyCharts() {
  let response;
  try {
    response = await axios.get(`${context.TestConfig.serverURL}/chart/chartmvc/PropertyChartController/getPropertyCharts/?${getAPIParams()}`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
  return response.data.propertyList;
}

export {
  addPropertyChartAccount,
  getAllPropertyCharts
};