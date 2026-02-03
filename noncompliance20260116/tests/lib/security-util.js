import { axios, expect } from '../lib/util.js';
import { context } from '../data/context.js';

import format from 'date-fns/format';
import parse from 'date-fns/parse';
import subYears from 'date-fns/subYears';

import * as cheerio from 'cheerio';

import testUtil from './test-util.js';
import chartUtil from './chart-util.js';

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`;
}

async function getSecurityList(keyword) {
  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
      {
        globalView: true,
        fundId: null,
        badgeId: null,
        quickSearch: true,
        qsContent: keyword,
        matchSearch: false,
        filterList: null,
        pagingInfo: {
          filter: null,
          firstResult: 0,
          maxResult: 50
        },
        securityId: null,
        ids: null,
        market: null,
        priceDate: null,
        code: null
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data.records;
}

async function getCorpActionData(actionType) {
  if (actionType == 'Delisted') {
    // const eles = [];
    // const html = (await axios.get('https://www.asx.com.au/listings/how-to-list/guides-rules-and-resources/delisted-entities')).data;
    // const $ = cheerio.load(html);
    // $('#delistedCompaniesWidgetData tr').each((index, ele) => {
    //   eles.push(ele);
    // });

    // let response = (await axios.get('https://www.asx.com.au/asx/1/delisted-companies?callback=processDelistedCompanies',
    //   { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' } }
    // )).data
    //   .replace('processDelistedCompanies', '');
    // response = eval(response);

    const response = [];
    const html = (await axios.get('https://www.delisted.com.au/failed-companies/delisted/')).data;
    const $ = cheerio.load(html);

    for (let i = 3; i < 13; i++) {
      response.push({
        'code': $(`.table-responsive>.table:not(.yearfiles)>tbody>tr:nth-child(${i})>td:nth-child(1)>a>b`).text(),
        'delisting_date': $(`.table-responsive>.table:not(.yearfiles)>tbody>tr:nth-child(${i})>td:nth-child(2)>b`).text()
      });
    }

    for (let se of response) {
      se.code = se.code.split('(')[1].substring(0, 3);

      se.delisting_date = new Date(se.delisting_date).toLocaleString("en-US", { timeZone: "Australia/Sydney" }).split(',')[0].split('/');
      se.delisting_date = `${se.delisting_date[2]}-${se.delisting_date[0].length == 1 ? '0' + se.delisting_date[0] : se.delisting_date[0]}-${se.delisting_date[1].length == 1 ? '0' + se.delisting_date[1] : se.delisting_date[1]}`;
    }
    console.log('Last 10 companies delisted from ASX: ', response);

    if (response.length == 0 || response.length == undefined)
      throw new Error('Can not get delisted companies!');

    // const { getControlAccForSecurity } = require('./chart-util.js');
    const getControlAcc = async (res) => {
      // const row = $(ele).find('td');
      // const code = `${row.eq(1).text().trim()}.AX`;
      // const rawDateString = row.eq(2).text().trim();
      // const dateObject = parse(rawDateString, 'dd/MM/yyyy', new Date());
      // const actionDate = format(dateObject, 'yyyy-MM-dd');
      // const transactionDate = format(subYears(dateObject, 1), 'yyyy-MM-dd');
      let code = `${res.code}.AX`;
      const actionDate = res.delisting_date;
      const dateObject = parse(actionDate, 'yyyy-MM-dd', new Date());
      const transactionDate = format(subYears(dateObject, 1), 'yyyy-MM-dd');
      // console.log("getControlAcc ------> code", code)
      // console.log("getControlAcc ------> actionDate", actionDate)
      // console.log("getControlAcc ------> transactionDate", transactionDate)

      let controlAcc = await chartUtil.getControlAccForSecurity(code);
      if (controlAcc == null) { return code; }

      return {
        accountCode: `${controlAcc}/${code}`,
        actionType: actionType,
        actionDate: actionDate,
        transactionDate: transactionDate,
        unit: 10,
        amount: 10,
      };
    };

    const promiseChain = response.map(res => getControlAcc(res));
    const responseData = await Promise.all(promiseChain);

    const existingData = responseData.filter(data => typeof data !== 'string');
    context.ShareData = existingData;

    const notExistingCode = responseData.filter(data => typeof data === 'string');
    if (notExistingCode.length > 0)
      console.log(`WARNING !!! - ${notExistingCode.length} investment not existing in SF360:\n`, notExistingCode);
  }
}

async function addSecurity(parameters) {
  let response;
  const name = parameters.name || parameters.code;
  const securityType = parameters.securityType || 'Ordinary_Shares';

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/d/SecuritiesController/saveSecurity?${getAPIParams()}`,
      {
        id: null,
        accountId: null,
        code: parameters.code,
        name: name,
        description: '',
        dataSrc: 'MANUAL',
        marketType: parameters.marketType,
        securityType: securityType,
        gicsCode: null,
        folioNo: '',
        propertyId: '',
        createdBy: context.TestConfig.username,
        createdDate: null,
        modifiedBy: context.TestConfig.username,
        modifiedDate: null,
        priceList: [],
        incomeList: [],
        assetList: [],
        priceDate: null,
        priceValue: null,
        fundId: null,
        investOrderUUTValue: null,
        investOrderAXValue: null,
        isin: null,
        exchangeRate: null,
        pcode: null
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function deleteSecurities(keyword) {
  const secList = await getSecurityList(keyword);

  if (secList.length === 0) return;

  const secIdList = secList.map(sec => { return sec.id });

  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/d/SecuritiesController/getUsedSecurity?${getAPIParams()}`,
      {
        ids: secIdList
      }
    );

    response = await axios.post(
      `${context.TestConfig.serverURL}/d/SecuritiesController/delete?${getAPIParams()}`,
      {
        ids: secIdList
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

export default {
  getSecurityList,
  getCorpActionData,
  addSecurity,
  deleteSecurities
};
