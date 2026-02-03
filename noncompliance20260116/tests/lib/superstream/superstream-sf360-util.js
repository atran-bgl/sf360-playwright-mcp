import { axios, expect } from '../util.js';
import { context } from '../../data/context.js';
import testUtil from '../test-util.js';
import entityUtil from '../entity-util.js';

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

function searchEntitySuperStreamInfo(keyword) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${
        context.TestConfig.serverURL
        }/entity/mvc/superstream/getPageInfo?${getAPIParams()}`,
        {
          searchText: keyword
        }
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Get Entity SuperStream'
        );

        resolve(response.data.results.records);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkEntitySuperStreamStatusWithRetry = (abn, status, entityId=context.TestConfig.entityId,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_entity_superstream_status_retry = (abn, entityId, status, n) => {
      return searchEntitySuperStreamInfo(abn).then(results => {
        if (results == null | results.length == 0) {
          throw reject(`Unable to find SuperStream status for ${abn}`);
        }

        const entity = results.find(res => res.fundid === entityId);
        if (entity == null) {
          throw reject(`Unable to find SuperStream status for entity:${entityId} abn:${abn}`);
        }

        if (entity.status === status) {
          // console.log(`Confirmed SuperStream status for ${abn} to be ${status}`);
          return resolve(entity);
        }
        else if (n === 1) {
          throw reject(`Unable to confirm SuperStream status to be ${status} for ${abn} before time out. Last status: ${entity.status}`);
        }
        else {
          // console.log(`Waiting to check SuperStream status. Current status: ${entity.status}`);
          setTimeout(() => {
            check_entity_superstream_status_retry(abn, entityId, status, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_entity_superstream_status_retry(abn, entityId, status, numberOfRetry);
  });
}

function getEntityABN(entityId=context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    entityUtil.getEntityDetail(entityId).then(detail => {
      if (detail.abn == null) {
        reject(new Error(`Entity:${entityId} does not contain ABN`));
      }
      else {
        resolve(detail.abn);
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}

function cancelSuperStream(entityId=context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    getEntityABN(entityId).then(abn => {
      axios
      .post(
        `${
        context.TestConfig.serverURL
        }/entity/mvc/superstream/cancelRegistration?${getAPIParams()}`,
        {
          funds: [{
              abn: abn,
              fundid: entityId
            }
          ]
        }
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Cancel SuperStream Registration'
        );
        resolve(checkEntitySuperStreamStatusWithRetry(abn, 'Cancelled', entityId));
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
    })
    .catch(error => {
      reject(error);
    });
  });
}

function validateRegistrationList(additionalContacts, abn, entityId) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${
        context.TestConfig.serverURL
        }/entity/mvc/superstream/validateRegistrationList?${getAPIParams()}`,
        {
          funds: [{
              abn: abn,
              fundid: entityId,
              additional_contacts: additionalContacts
            }
          ]
        }
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Validate SuperStream Registration List'
        );
        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function registerSuperStream(additionalContacts=null, entityId=context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    getEntityABN(entityId).then(abn => {
      validateRegistrationList(additionalContacts, abn, entityId).then(regList => {
        if (regList.length == 0) {
          reject(new Error(`Unable to validate registration for abn:${abn}`));
        }
  
        if (regList[0].errors != null) {
          reject(new Error(`There is validation error for abn:${abn}. ${regList[0].errors}`));
        }
  
        axios
        .post(
          `${
          context.TestConfig.serverURL
          }/entity/mvc/superstream/registerFund?${getAPIParams()}`,
          {
            funds: [{
                abn: abn,
                fundid: entityId,
                additional_contacts: additionalContacts
              }
            ]
          }
        )
        .then(response => {
          expect(response.status).to.eql(
            200,
            'Register SuperStream'
          );
          resolve(checkEntitySuperStreamStatusWithRetry(abn, 'Registered', entityId));
        })
        .catch(error => {
          reject(testUtil.createErrorForAxios(error));
        });
      })
      .catch(error => {
        reject(error);
      });
    })
    .catch(error => {
      reject(error);
    });
    
  });
}

function checkEntitySuperStreamStatus(status, entityId=context.TestConfig.entityId) {
  return new Promise((resolve, reject) => {
    getEntityABN(entityId).then(abn => {
      resolve(checkEntitySuperStreamStatusWithRetry(abn, status, entityId));
    })
    .catch(error => {
      reject(error);
    });
  });
}

function getEntitySuperStreamTransactionList(
  startDate,
  endDate,
  entityId = context.TestConfig.entityId
) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${
          context.TestConfig.serverURL
        }/chart/chartmvc/TransactionController/superstreamTransList/${startDate}/${endDate}?${getAPIParams()}`
      )
      .then((response) => {
        expect(response.status).to.eql(200, "Get SuperStream Transaction List");
        resolve(response.data);
      })
      .catch((error) => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkEntitySuperStreamTransactionListWithRetry = (startDate, endDate, expectedResult, 
  entityId=context.TestConfig.entityId,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  
  return new Promise((resolve, reject) => {
    const check_entity_superstream_transaction_retry = (startDate, endDate, expectedResult, n) => {
      return getEntitySuperStreamTransactionList(startDate, endDate, entityId).then(tranList => {
        let testPassed = false;
        if (expectedResult.transactionExist) {
          testPassed = (tranList.length > 0);
        }
        else {
          testPassed = (tranList.length === 0);
        }
        
        if (testPassed) {
          // console.log(`Confirmed SuperStream transaction list to be exist:${expectedResult.transactionExist}`);
          return resolve(testPassed);
        }
        else if (n === 1) {
          throw reject(`Unable to confirm SuperStream transaction existence to be ${expectedResult.transactionExist} before time out. Transactions: ${tranList.length}`);
        }
        else {
          // console.log(`Waiting to check SuperStream transaction list. Current status: ${tranList.length}`);
          setTimeout(() => {
            check_entity_superstream_transaction_retry(startDate, endDate, expectedResult, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }

    if (!expectedResult.hasOwnProperty('transactionExist')) {
      reject(new Error('transactionExist is not defined in expectResult field for SuperStream Transaction List'));  
    }
    return check_entity_superstream_transaction_retry(startDate, endDate, expectedResult, numberOfRetry);
  });
}

export default {
  cancelSuperStream,
  registerSuperStream,
  checkEntitySuperStreamStatus,
  checkEntitySuperStreamTransactionList: checkEntitySuperStreamTransactionListWithRetry
};
