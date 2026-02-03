import { assert, axios, expect, _ } from '../lib/util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';

import format from 'date-fns/format';
import parse from 'date-fns/parse';

const DATE_SUFFIX = context.Constants.DATE_SUFFIX;

async function deleteTransactionAPI(shortFirmName, fundId, keywords) {
  let transactionId;
  await browser.call(() => axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/search?firm=${shortFirmName}&uid=${context.TestConfig.uid}&mid=${fundId}&`,
    {
      keyWord: keywords,
    }).then((res) => {
      assert.equal(res.data.totalRecords, 1, 'Get 0 or more than 1 result!');
      transactionId = res.data.records[0].id;
    }));

  await browser.call(() => axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/delete?firm=${shortFirmName}&uid=${context.TestConfig.uid}&mid=${fundId}&`,
    [transactionId]).then((res) => {
      assert.equal(res.status, 200, 'Delete transaction failed!');
    }));
}

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

function getBankChartAccount(transactionDate, accountCode = null) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/banklist?${getAPIParams()}`,
        {
          'itemCount4Display': null,
          'searchTerm': accountCode,
          'columnNames4sorting': null,
          'columnDirection4sorting': 'asc',
          'fromMatching': false,
          'retrieveTransaction': false,
          'pcode': null,
          'fundId': null,
          'memberId': null,
          'ignoreInvestmentType': false,
          'excludedSuspendedAccount': false,
          'needPensionPayment': false,
          'transactionDate': `${transactionDate}${DATE_SUFFIX}`,
          'includeLrba': true,
          'memberAccountOnly': false,
          'globalView': false,
          'pageNum': 0,
          'onlyQuerySubAccount': false
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get bank chart account for transaction');
        expect(response.data.length).to.be.at.least(2, 'Get bank chart account should have at least 2 results returned');
        if (accountCode == null) {
          resolve(response.data[1]);
        }
        else {
          const found = response.data.find(
            element => element.code === accountCode
          );

          if (found) {
            resolve(found);
          }
          else {
            // resolve(response.data[1]);
            reject('can not find the specified bank/LRBA account!');
          }
        }
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getChartAccount(transactionDate, accountCode, assertExist = true, accountType = null) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/nonebanklist/${context.TestConfig.entityId}?${getAPIParams()}`,
        {
          'itemCount4Display': null,
          'searchTerm': accountCode,
          'columnNames4sorting': null,
          'columnDirection4sorting': 'asc',
          'fromMatching': false,
          'retrieveTransaction': false,
          'pcode': null,
          'fundId': null,
          'memberId': null,
          'ignoreInvestmentType': false,
          'excludedSuspendedAccount': false,
          'needPensionPayment': false,
          'transactionDate': `${transactionDate}${DATE_SUFFIX}`,
          'includeLrba': false,
          'memberAccountOnly': false,
          'pageNum': 0,
          'onlyQuerySubAccount': false,
          'taccountType': accountType
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get chart account for transaction');

        if (assertExist) {
          expect(response.data.length).to.be.at.least(2, 'Get chart account should have at least 2 results returned');
        }

        if (response.data.length >= 2) {
          resolve(response.data[1]);
        }
        else {
          resolve();
        }
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function createBankEntry(transactionDate, amount, accountCode = null) {
  return new Promise((resolve, reject) => {
    getBankChartAccount(transactionDate, accountCode).then(function (bankAcc) {
      const entry = {
        id: null,
        type: 'BasicBankEntry',
        entryId: null,
        entryDTO: {
          subType: 'BasicBankEntry',
          id: null,
          taccId: bankAcc.id,
          chartCode: `${bankAcc.code}`,
          accountName: null,
          amount: amount,
          gstAmount: null
        },
        seqNum: 0,
        originalTransId: null,
        visible: true,
        amount: null,
        units: null,
        transactionDate: null,
        fundId: null,
        commutationFlag: null,
        taxInstalmentRefFlag: null,
        // defaultBankAccountFlag: false,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
      }
      resolve(entry);
    })
      .catch(error => {
        reject(error);
      });
  });
}

function createGeneralEntry(transactionDate, accountCode, amount) {
  return new Promise((resolve, reject) => {
    getChartAccount(transactionDate, accountCode).then(function (acc) {
      const entry = {
        id: null,
        type: 'General',
        entryId: null,
        entryDTO: {
          subType: 'General',
          id: null,
          taccId: acc.id,
          chartCode: `${acc.code}`,
          accountName: null,
          amount: amount,
          gstAmount: null
        },
        seqNum: 1,
        originalTransId: null,
        visible: true,
        amount: null,
        units: null,
        transactionDate: null,
        fundId: null,
        commutationFlag: null,
        taxInstalmentRefFlag: null,
        defaultBankAccountFlag: false,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
      }
      resolve(entry);
    })
      .catch(error => {
        reject(error);
      });
  });
}

function updateTransEntriesSeqNum(transEntries) {
  for (let i = 0; i < transEntries.length; i++) {
    transEntries[i].seqNum = i;
  }
}

function createBankTransactionPayload(transactionDate, description, transEntries, transRef = null) {
  updateTransEntriesSeqNum(transEntries);
  return {
    id: null,
    fundId: null,
    transactionDate: `${transactionDate}${DATE_SUFFIX}`,
    transref: transRef,
    entryTransList: transEntries,
    description: description,
    type: 'BankStatement',
    createSource: 'SF360',
    divReinvest: false,
    createdBy: null,
    createdTime: null,
    lastModifiedBy: null,
    lastModifiedTime: null,
    matched: false,
    matchTransId: null,
    matchingNew: false,
    editable: true,
    hasAttachment: false,
    cnXmlFile: null,
    extRef: null,
    commonList: [],
    fileTag: null,
    proccessTaxInstalment: false
  }
}

function addBankTransaction(transactionDate, description, transEntries, transRef = null) {
  return new Promise((resolve, reject) => {
    const transBody = createBankTransactionPayload(transactionDate, description, transEntries, transRef);

    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/save?${getAPIParams()}`,
        transBody
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Save transaction');
        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function addBankTransactionWithGeneralEntry(transactionDate, description, amount,
  generalAccountCode = 91000, bankAccountCode = null, transRef = null) {
  return new Promise((resolve, reject) => {
    Promise.all([
      createBankEntry(transactionDate, amount, bankAccountCode),
      createGeneralEntry(transactionDate, generalAccountCode, -amount)
    ]).then(function (values) {
      resolve(addBankTransaction(transactionDate, description, values, transRef));
    }).catch(function (error) {
      reject(error);
    });
  });
}

function buildSearchTransactionsPayload(inputFilters) {
  const payload = {};
  const filterList = [];

  if (!inputFilters.startDate) {
    throw new Error('Transaction start date must be set');
  }

  if (!inputFilters.endDate) {
    throw new Error('Transaction end date must be set');
  }

  if (inputFilters.startDate.includes('-') && inputFilters.endDate.includes('-')) {
    inputFilters.startDate = format(
      parse(inputFilters.startDate, 'yyyy-MM-dd', new Date()),
      'dd/MM/yyyy');
    inputFilters.endDate = format(
      parse(inputFilters.endDate, 'yyyy-MM-dd', new Date()),
      'dd/MM/yyyy');
  }

  filterList.push({
    filterType: 'TransactionDate',
    matchOption: 'range',
    rangeValueStart: inputFilters.startDate,
    rangeValueEnd: inputFilters.endDate
  })

  payload.keyWord = (inputFilters.keyword) ? inputFilters.keyword : '';

  if (inputFilters.ref) {
    filterList.push({
      filterType: 'Ref',
      matchOption: 'equals',
      value: inputFilters.ref
    })
  }

  if (inputFilters.account) {
    filterList.push({
      filterType: 'Account',
      matchOption: 'equals',
      value: inputFilters.account
    })
  }

  if (inputFilters.debit) {
    filterList.push({
      filterType: 'Debit',
      matchOption: 'equals',
      value: inputFilters.debit
    })
  }

  if (inputFilters.credit) {
    filterList.push({
      filterType: 'Credit',
      matchOption: 'equals',
      value: inputFilters.credit
    })
  }

  payload.filterList = filterList;

  return payload;

}

function searchTransactions(filters) {
  return new Promise((resolve, reject) => {
    const payload = buildSearchTransactionsPayload(filters);

    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/search?${getAPIParams()}`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Search Transactions');
        resolve(response.data.records);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function deleteTransactions(filters) {
  return new Promise((resolve, reject) => {
    const delete_transactions_multiple_times = (filters, n) => {
      return searchTransactions(filters).then(transList => {
        // Delete editable only
        const transIdList = transList
          .filter((trans) => {
            return trans.editable;
          })
          .map((trans) => {
            return trans.id;
          });

        const containNonEditableTrans = (transIdList.length < transList.length);

        axios
          .post(
            `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/delete?${getAPIParams()}`,
            transIdList
          )
          .then(response => {
            expect(response.status).to.eql(200, `Delete Transactions for ${n}`);
            if (containNonEditableTrans) {
              if (n === 1) {
                throw reject(`Unable to delete the non-editable transactions for ${JSON.stringify(filters)}`);
              }
              else {
                delete_transactions_multiple_times(filters, n - 1);
              }
            }
            else {
              return resolve();
            }
          })
          .catch(error => {
            reject(testUtil.createErrorForAxios(error));
          });
      }).catch(function (error) {
        reject(error)
      });
    };

    return delete_transactions_multiple_times(filters, 3);
  });
}

const checkTransactionsMatchedWithRetry = (filters,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_transactions_matched_retry = (filters, n) => {
      return searchTransactions(filters).then(transList => {
        const allMatched = ((transList.length > 0) && transList.every(t => (t.matched === true)));
        if (allMatched) {
          //console.info('Confirmed transactions matched');
          return resolve();
        }
        else if (n === 1) {
          throw reject(`Unable to confirm transactions matched before time out for ${JSON.stringify(filters)}`);
        }
        else {
          //console.info('Waiting to check transactions matched');
          setTimeout(() => {
            check_transactions_matched_retry(filters, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_transactions_matched_retry(filters, numberOfRetry);
  });
}

function checkAndWaitUntilAllTransactionsMatched(filters) {
  if (filters.hasOwnProperty('autoMatchedCount')) { // Internal filter that can't be used in SF360
    const filtersAuto = Object.assign({}, filters);
    delete filtersAuto.autoMatchedCount;
    return checkTransactionsAutoMatchedCountWithRetry(filtersAuto, filters.autoMatchedCount);
  }
  else if (filters.hasOwnProperty('refList')) { // Internal filter that can't be used in SF360
    return Promise.all(filters.refList.map(async (f) => {
      const filtersByRef = Object.assign({}, filters);
      delete filtersByRef.refList;
      filtersByRef.ref = f;
      await checkAndWaitUntilAllTransactionsMatched(filtersByRef);
    }));
  } else {
    return checkTransactionsMatchedWithRetry(filters);
  }
}

function getTransactionsAutoMatchedCount(filters) {
  return new Promise((resolve, reject) => {
    const payload = buildSearchTransactionsPayload(filters);
    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/autoMatchedCount?${getAPIParams()}`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get Transactions Auto Matched Count');

        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkTransactionsAutoMatchedCountWithRetry = (filters, expectedCount,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_transactions_auto_matched_count_retry = (filters, expectedCount, n) => {
      return getTransactionsAutoMatchedCount(filters).then(actualCount => {
        if (actualCount >= expectedCount) {
          //console.info('Confirmed actual transactions auto matched count is right');
          return resolve();
        }
        else if (n === 1) {
          throw reject(`Unable to confirm transactions auto matched count to be at least ${expectedCount} before time out for ${JSON.stringify(filters)}`);
        }
        else {
          //console.info(`Waiting to check transactions auto matched count. ${actualCount}/${expectedCount}`);
          setTimeout(() => {
            check_transactions_auto_matched_count_retry(filters, expectedCount, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_transactions_auto_matched_count_retry(filters, expectedCount, numberOfRetry);
  });
}

function getTransactionsUnmatchedCount(filters) {
  return new Promise((resolve, reject) => {
    const payload = buildSearchTransactionsPayload(filters);
    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/unMatchedCount?${getAPIParams()}`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get Transactions Unmatched Count');

        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getTransactionsManualMatchedCount(filters) {
  return new Promise((resolve, reject) => {
    const payload = buildSearchTransactionsPayload(filters);
    axios
      .post(
        `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/manuallyMatchedCount?${getAPIParams()}`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get Transactions Manual Matched Count');

        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

async function checkTransactionsCounts(filters, expectedResults) {
  const actualResults = {};

  if (expectedResults.hasOwnProperty('totalTransactionsCount')) {
    const expectedTotalTransactionsCount = expectedResults.totalTransactionsCount;
    const actualTrans = await searchTransactions(filters);

    actualResults.totalTransactionsCount = actualTrans.length;
  }

  if (expectedResults.hasOwnProperty('autoMatchedCount')) {
    const expectedAutoMatchedCount = expectedResults.autoMatchedCount;
    const actualAutoMatchedCount = await getTransactionsAutoMatchedCount(filters);

    actualResults.autoMatchedCount = actualAutoMatchedCount;
  }

  if (expectedResults.hasOwnProperty('unmatchedCount')) {
    const expectedUnmatchedCount = expectedResults.unmatchedCount;
    const actualUnmatchedCount = await getTransactionsUnmatchedCount(filters);

    actualResults.unmatchedCount = actualUnmatchedCount;
  }

  if (expectedResults.hasOwnProperty('manualMatchedCount')) {
    const expectedManualMatchedCount = expectedResults.manualMatchedCount;
    const actualManualMatchedCount = await getTransactionsManualMatchedCount(filters);

    actualResults.manualMatchedCount = actualManualMatchedCount;
  }

  expect(actualResults).to.eql(expectedResults, 'Transactions Count');
}

async function getNextTransactionRef() {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/nextref?${getAPIParams()}`);
    expect(response.status).to.eql(200, "Can not get next transaction ref");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getAttachedDocuments(searchText) {
  const payload = {
    "userName": null,
    "permissionSet": [],
    "product": "SFUND",
    "masterUUID": null,
    "masterDocUuid": null,
    "rootFolderUUID": null,
    "returnDocumentCountOnly": false,
    "userID": -1,
    "queryType": "DocModifiedRecently",
    "searchText": searchText,
    "firstResult": 0,
    "maxResult": 50,
    "needSignInfoJson": false,
    "firmDocUUID": null,
    "transId": null,
    "bglGRID": null,
    "systemTags": null,
    "userTags": null,
    "hasAttachedTx": false,
    "includeTxs": null,
    "taxonomies": {}
  };
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/entity/mvc/doc/queryDocT?${getAPIParams()}`, payload);
    expect(response.status).to.eql(200, "Can not get the attached documents");
    return response.data.records;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function deleteTransactionsById(transIdList) {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/delete?${getAPIParams()}`,
      transIdList);
    expect(response.status).to.eql(200, "Can not delete the transaction!");
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

function createTransactionPayload(transactionDate, description, transEntries, transRef = null, transType = 'BankStatement') {
  updateTransEntriesSeqNum(transEntries);
  return {
    id: null,
    fundId: null,
    transactionDate: `${transactionDate}${DATE_SUFFIX}`,
    transref: transRef,
    entryTransList: transEntries,
    description: description,
    type: transType,
    createSource: 'SF360',
    divReinvest: false,
    createdBy: null,
    createdTime: null,
    lastModifiedBy: null,
    lastModifiedTime: null,
    matched: false,
    matchTransId: null,
    matchingNew: false,
    editable: true,
    hasAttachment: false,
    cnXmlFile: null,
    extRef: null,
    commonList: [],
    fileTag: null,
    proccessTaxInstalment: false
  }
}

async function addGeneralJournal(transactionDate, description, transEntries, transRef = null, divReinvest = false) {
  const transBody = createTransactionPayload(transactionDate, description, transEntries, transRef, 'GeneralJournal');
  if (divReinvest != false)
    transBody.divReinvest = divReinvest;

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/save?${getAPIParams()}`,
      transBody
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function addDepreciationJournal(transactionDate, description, transEntries, transRef = null, divReinvest = false) {
  const transBody = createTransactionPayload(transactionDate, description, transEntries, transRef, 'Depreciation');
  if (divReinvest != false)
    transBody.divReinvest = divReinvest;

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/save?${getAPIParams()}`,
      transBody
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

export default {
  deleteTransactionAPI,
  getBankChartAccount,
  getChartAccount,
  createBankEntry,
  createGeneralEntry,
  createBankTransactionPayload,
  addBankTransaction,
  addBankTransactionWithGeneralEntry,
  searchTransactions,
  deleteTransactions,
  checkAndWaitUntilAllTransactionsMatched,
  checkTransactionsCounts,
  getNextTransactionRef,
  getAttachedDocuments,
  deleteTransactionsById,
  addGeneralJournal,
  addDepreciationJournal
};
