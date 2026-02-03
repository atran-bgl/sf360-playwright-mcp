import { axios, expect } from '../util.js';
import { context } from '../../data/context.js';
import testUtil from '../test-util.js';

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

const SUPERSTREAM_CENTRE_HUB_CONFIG = {
  SF360: {
    friendlyName: 'sf360',
    aggregatorId: 'ThreeSixty'
  },
  SF: {
    friendlyName: 'sf-desktop',
    aggregatorId: 'SimpleFund'
  },
};

const DESKTOP_SUPERSTREAM_TEST_CLIENTS = {
  uat: {
    abn: '91960419540',
    productId: 'SFBG7810235ANNA360',
    customerId: '1029748',
    userEmail: 'atran+ANNA360@bglcorp.com.au'
  },
  production: {
    abn: '91960419540',
    productId: 'SFBG6759345ANNA2',
    customerId: '1012095',
    userEmail: 'atran+ANNA2@bglcorp.com.au'
  }
}

function getFundStatusInCentrehub(aggregator, abn, productId=context.TestConfig.firm, customerId) {
  return new Promise((resolve, reject) => {
    let payload;

    if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF.friendlyName) {
      payload = {
          aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF.aggregatorId,
          apikey: context.TestConfig.superStreamCentreHubSFApiKey,
          customerid: customerId,
          abnList: [
            {
              abn: abn
            }
          ],
          productid: productId
      };
    }
    else if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.friendlyName) {
      payload = {
        aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.aggregatorId,
        apikey: context.TestConfig.superStreamCentreHubSf360ApiKey,  // not added yet
        abnList: [
          {
            abn: abn
          }
        ],
        productid: productId
      };
    }
    else {
      reject(new Error(`Unsupported aggregator: ${aggregator}`));
    }

    axios
      .post(
        `${
        context.TestConfig.superStreamCentreHubURL
        }/centralhub/rest/getFundStatus`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'SuperStream Centrehub - Get Fund Status'
        );

        expect(response.data.errors).to.eql(
          null,
          'SuperStream Centrehub - no errors for Get Fund Status'
        );

        const list = response.data.list;
        const found = list.find(item => item.productid === productId);

        resolve(found);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkFundStatusInCentrehubWithRetry = (aggregator, abn, 
  productId=context.TestConfig.firm, customerId, expectedResult,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_fund_status_In_Centrehub_retry = (aggregator, abn, 
      productId, customerId, expectedResult, n) => {
      return getFundStatusInCentrehub(aggregator, abn, 
        productId, customerId).then(fundStatus => {
        let statusPassed;
        if (fundStatus == null) {
          if (expectedResult == null) {
            statusPassed = true;
          }
          else {
            throw reject(`Unable to find fund status for ${abn} in ${productId}`);
          }
        }

        statusPassed = (fundStatus.status === expectedResult.status);
        
        if (expectedResult.hasOwnProperty('entityId')) {
          statusPassed = statusPassed && (fundStatus.fundid === expectedResult.entityId);
        }

        if (statusPassed) {
          // console.log(`Confirmed fund status for ${abn} to be ${expectedStatus.status}`);
          return resolve(fundStatus);
        }
        else if (n === 1) {
          throw reject(`Unable to confirm fund status to be ${expectedResult.status} in SuperStream Centrehub before time out. Last status: ${fundStatus.status}`);
        }
        else {
          // console.log(`Waiting to check fund status in SuperStream Centrehub. Current status: ${fund.status}`);
          setTimeout(() => {
            check_fund_status_In_Centrehub_retry(aggregator, abn, 
              productId, customerId, expectedResult, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_fund_status_In_Centrehub_retry(aggregator, abn, 
      productId, customerId, expectedResult, numberOfRetry);
  });
}

function deleteFundInCentrehub(aggregator, abn, productId=context.TestConfig.firm, customerId) {
  return new Promise((resolve, reject) => {
    let payload;
    if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF.friendlyName) {
      payload = {
          aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF.aggregatorId,
          apikey: context.TestConfig.superStreamCentreHubSFApiKey,
          customerid: customerId,
          list: [abn],
          productid: productId
      };
    }
    else if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.friendlyName) {
      payload = {
        aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.aggregatorId,
        apikey: context.TestConfig.superStreamCentreHubSf360ApiKey,
        abnList: [
          {
            abn: abn
          }
        ],
        productid: productId
      };
    }
    else {
      reject(new Error(`Unsupported aggregator: ${aggregator}`));
    }

    axios
      .post(
        `${
        context.TestConfig.superStreamCentreHubURL
        }/centralhub/rest/deleteFund`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'SuperStream Centrehub - Delete Fund'
        );
        expect(response.data.errors).to.eql(
          null,
          'SuperStream Centrehub - no errors for Delete Fund'
        );
        resolve(checkFundStatusInCentrehubWithRetry(aggregator, abn, 
          productId, customerId, { status: 'Cancelled' }));
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function registerFundInCentrehub(aggregator, abn, productId=context.TestConfig.firm, customerId) {
  return new Promise((resolve, reject) => {
    let payload;
    let expectedStatus;
    let expectedEntityId = null;

    if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF.friendlyName) {
      payload = {
        aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF.aggregatorId,
        apikey: context.TestConfig.superStreamCentreHubSFApiKey,
        customerid: customerId,
        list: [
          {
            abn: abn,
            relationship_to_fund: 'Accountant',
            promocode: 'BGLXZSMSF14'
          }
        ],
        productid: productId
      };
      expectedStatus = 'PendingPayment';
    }
    else if (aggregator == SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.friendlyName) {
      payload = {
        aggregatorid: SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.aggregatorId,
        apikey: context.TestConfig.superStreamCentreHubSf360ApiKey,  // not added yet
        list: [
          {
            abn: abn,
            relationship_to_fund: 'Accountant',
            fundid: context.TestConfig.entityId
          }
        ],
        productid: productId
      };
      expectedStatus = 'Registered';
      expectedEntityId = context.TestConfig.entityId;
    }
    else {
      reject(new Error(`Unsupported aggregator: ${aggregator}`));
    }

    axios
      .post(
        `${
        context.TestConfig.superStreamCentreHubURL
        }/centralhub/rest/registerFund`,
        payload
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'SuperStream Centrehub - Register Fund'
        );
        expect(response.data.errors).to.eql(
          null,
          'SuperStream Centrehub - no errors for Register Fund'
        );

        resolve(checkFundStatusInCentrehubWithRetry(aggregator, abn, 
          productId, customerId, { status: expectedStatus, entityId: expectedEntityId }));
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function registerDefaultDesktopFund() {
  const env = context.TestConfig.environment;
  return registerFundInCentrehub(
    SUPERSTREAM_CENTRE_HUB_CONFIG.SF.friendlyName,
    DESKTOP_SUPERSTREAM_TEST_CLIENTS[env].abn,
    DESKTOP_SUPERSTREAM_TEST_CLIENTS[env].productId, 
    DESKTOP_SUPERSTREAM_TEST_CLIENTS[env].customerId);
}

function checkSF360FirmSuperStreamStatus(superStreamCancelled=true) {
  if (context.TestConfig.environment === 'production') {
    console.log('Skipping this due to this automated test is not allowed to access SF360 info in Centrehub Production');
    return;
  }
  
  const expectedStatus = superStreamCancelled ? 
    { status: 'Cancelled' } : 
    { status: 'Registered', entityId: null };
  
  return checkFundStatusInCentrehubWithRetry(
    SUPERSTREAM_CENTRE_HUB_CONFIG.SF360.friendlyName,
    '91960419540', context.TestConfig.firm, null, expectedStatus);
}

export {
  DESKTOP_SUPERSTREAM_TEST_CLIENTS,
  registerDefaultDesktopFund,
  checkSF360FirmSuperStreamStatus
};
