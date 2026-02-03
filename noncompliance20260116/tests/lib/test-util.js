import jwt from 'jsonwebtoken';
import fs from 'fs';
import otplib from 'otplib';
import { axios } from './util.js';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import TestSettings from '../../test-settings.json' assert { type: 'json' };

let localTestConfig = {};
try {
  const module = await import('../../test-config-local.json', { assert: { type: 'json' } });
  localTestConfig = module.default;
} catch (ex) {
  localTestConfig = {};
}


const AWS_TEST_USER = 'sf360autotest';
const AWS_TEST_USER_FIRM_CREATION = 'nc-autotest001';

const testConfig = {};
const shareData = [];

function getcognitoURL() {
  return `https://${testConfig.cognitoAddress}`;
}

function getSSOURL() {
  return `https://${testConfig.ssoServer}`;
}
function getServerURL() {
  return `https://${testConfig.server}`;
}

function getAPIGatewayURL() {
  return `https://${testConfig.apiGatewayServer}`;
}

async function getUserIdToken() {
  let initAuthResponse;

  try {
    initAuthResponse = await axios.post(
      testConfig.cognitoURL, {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: testConfig.cognitoClientId,
      AuthParameters: {
        USERNAME: testConfig.username,
        PASSWORD: testConfig.userPassword,
      },
      ClientMetadata: {},
    }, {
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
    });
  }
  catch (error) {
    throw createErrorForAxios(error);
  }

  let resToAuthChallengeResponse;
  try {
    resToAuthChallengeResponse = await axios.post(
      testConfig.cognitoURL, {
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      ChallengeResponses: {
        USERNAME: testConfig.username,
        SOFTWARE_TOKEN_MFA_CODE: otplib.authenticator.generate(testConfig.userSecret),
      },
      ClientId: testConfig.cognitoClientId,
      Session: initAuthResponse.data.Session,
    }, {
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
      },
    });
  }
  catch (error) {
    throw createErrorForAxios(error);
  }

  testConfig.userIdToken = resToAuthChallengeResponse.data.AuthenticationResult.IdToken;
  return testConfig.userIdToken;
}

function prepareAWSParamsMaps() { //'names' failed to satisfy constraint: Member must have length less than or equal to 10.
  const awsParamsMap = new Map();
  const awsParamsMapArray = [];

  let env = 'uat';
  if (localTestConfig.environment != null) {
    switch (localTestConfig.environment) {
      case 'uat':
      case 'staging':
      case 'production':
        env = localTestConfig.environment;
        break;
      case 'prod':
        env = 'production';
        break;
      default:
        env = 'uat';
        break;
    }
  }

  testConfig.environment = env;

  const paramPrefix = `/${env}/sf360/test-automation`;
  awsParamsMap.set(`${paramPrefix}/server/ADDRESS`, 'server');
  awsParamsMap.set(`${paramPrefix}/aws-cognito/ADDRESS`, 'cognitoAddress');
  awsParamsMap.set(`${paramPrefix}/aws-cognito/ID`, 'cognitoClientId');
  awsParamsMap.set(`${paramPrefix}/sso/ADDRESS`, 'ssoServer');
  awsParamsMap.set(`${paramPrefix}/users/twang-test/NAME`, 'username_T');
  awsParamsMap.set(`${paramPrefix}/server/AUTH_TOKEN`, 'sfAuthToken');
  awsParamsMap.set(`${paramPrefix}/sugar/ADDRESS-JENKINS`, 'sugarServer');
  awsParamsMap.set(`${paramPrefix}/sugar/NAME`, 'sugarUN');
  awsParamsMap.set(`${paramPrefix}/sugar/PASSWORD`, 'sugarPW');
  awsParamsMap.set(`${paramPrefix}/api-gateway/ADDRESS`, 'apiGatewayServer');
  awsParamsMap.set(`${paramPrefix}/support-tool/ADDRESS`, 'supportToolURL');

  if (localTestConfig[env] == undefined) localTestConfig[env] = {};

  if (localTestConfig[env].username != null && localTestConfig[env].username != undefined && localTestConfig[env].username != '') {
    testConfig.username = localTestConfig[env].username;

    if (localTestConfig[env].userPassword != null) {
      testConfig.userPassword = localTestConfig[env].userPassword;
    } else {
      throw new Error('userPassword is not set in test config');
    }

    if (localTestConfig[env].userSecret != null) {
      testConfig.userSecret = localTestConfig[env].userSecret;
    } else {
      throw new Error('userSecret is not set in test config');
    }

    if (localTestConfig[env].uid != null) {
      testConfig.uid = localTestConfig[env].uid;
    } else {
      throw new Error('uid is not set in test config');
    }
  } else {
    if (localTestConfig[env].firmCreationTest || localTestConfig[env].supportCallTest) {
      const userParamPrefix = `${paramPrefix}/users/${AWS_TEST_USER_FIRM_CREATION}`;
      awsParamsMap.set(`${userParamPrefix}/NAME`, 'username');
      awsParamsMap.set(`${userParamPrefix}/PASSWORD`, 'userPassword');
      awsParamsMap.set(`${userParamPrefix}/SECRET`, 'userSecret');
      awsParamsMap.set(`${userParamPrefix}/UID`, 'uid');
    } else {
      const userParamPrefix = `${paramPrefix}/users/${AWS_TEST_USER}`;
      awsParamsMap.set(`${userParamPrefix}/NAME`, 'username');
      awsParamsMap.set(`${userParamPrefix}/PASSWORD`, 'userPassword');
      awsParamsMap.set(`${userParamPrefix}/SECRET`, 'userSecret');
      awsParamsMap.set(`${userParamPrefix}/UID`, 'uid');
    }
  }

  //*****************************************
  if (localTestConfig[env].dbHost != null) {
    testConfig.dbHost = localTestConfig[env].dbHost;
  } else {
    awsParamsMap.set(`${paramPrefix}/db/HOST`, 'dbHost');
  }

  if (localTestConfig[env].dbPort != null) {
    testConfig.dbPort = localTestConfig[env].dbPort;
  } else {
    awsParamsMap.set(`${paramPrefix}/db/PORT`, 'dbPort');
  }

  if (localTestConfig[env].dbUserName != null) {
    testConfig.dbUserName = localTestConfig[env].dbUserName;
  } else {
    awsParamsMap.set(`${paramPrefix}/db/USERNAME`, 'dbUserName');
  }

  if (localTestConfig[env].dbUserPassword != null) {
    testConfig.dbUserPassword = localTestConfig[env].dbUserPassword;
  } else {
    awsParamsMap.set(`${paramPrefix}/db/USER_PASSWORD`, 'dbUserPassword');
  }

  if (localTestConfig[env].dbHostSR != null) {
    testConfig.dbHostSR = localTestConfig[env].dbHostSR;
  } else {
    awsParamsMap.set(`${paramPrefix}/db-super-rollover/HOST`, 'dbHostSR');
  }

  if (localTestConfig[env].dbPortSR != null) {
    testConfig.dbPortSR = localTestConfig[env].dbPortSR;
  } else {
    awsParamsMap.set(`${paramPrefix}/db-super-rollover/PORT`, 'dbPortSR');
  }

  if (localTestConfig[env].dbUserNameSR != null) {
    testConfig.dbUserNameSR = localTestConfig[env].dbUserNameSR;
  } else {
    awsParamsMap.set(`${paramPrefix}/db-super-rollover/USERNAME`, 'dbUserNameSR');
  }

  if (localTestConfig[env].dbUserPasswordSR != null) {
    testConfig.dbUserPasswordSR = localTestConfig[env].dbUserPasswordSR;
  } else {
    awsParamsMap.set(`${paramPrefix}/db-super-rollover/USER_PASSWORD`, 'dbUserPasswordSR');
  }

  //*****************************************
  if (localTestConfig[env].email != null) {
    testConfig.email = localTestConfig[env].email;
  }
  // else {
  //   awsParamsMap.set(`${paramPrefix}/email/ADDRESS`, 'email');
  // }

  if (localTestConfig[env].emailPW != null) {
    testConfig.emailPW = localTestConfig[env].emailPW;
  }
  // else {
  //   awsParamsMap.set(`${paramPrefix}/email/PASSWORD`, 'emailPW');
  // }

  if (localTestConfig[env].emailUS != null) {
    testConfig.emailUS = localTestConfig[env].emailUS;
  }
  // else {
  //   awsParamsMap.set(`${paramPrefix}/email/SECRET`, 'emailUS');
  // }

  const entries = Array.from(awsParamsMap); // convert the long Map to Array

  for (let i = 0; i < entries.length; i += 10) {
    const chunk = entries.slice(i, i + 10);
    awsParamsMapArray.push(new Map(chunk));
  }

  return awsParamsMapArray;
}

// function getTestParametersFromAWSPromise(awsParamsMap) {
//   return new Promise((resolve, reject) => {
//     const ssm = new AWS.SSM();
//     const ssmParams = {
//       Names: Array.from(awsParamsMap.keys()),
//       WithDecryption: true,
//     };
//     ssm.getParameters(ssmParams, (err, data) => {
//       if (err) reject(err);
//       else {
//         data.Parameters.forEach((param) => {
//           const paramName = param.Name;
//           if (awsParamsMap.has(paramName)) {
//             testConfig[awsParamsMap.get(paramName)] = param.Value;
//           }
//         });

//         testConfig.serverURL = getServerURL();
//         testConfig.cognitoURL = getcognitoURL();
//         testConfig.ssoURL = getSSOURL();
//         testConfig.apiGatewayURL = getAPIGatewayURL();

//         resolve(testConfig);
//       }
//     });
//   });
// }

async function getTestParametersFromAWSPromise(awsParamsMap) {
  const ssmClient = new SSMClient({ region: "ap-southeast-2" });
  const ssmParams = {
    Names: Array.from(awsParamsMap.keys()),
    WithDecryption: true,
  };

  try {
    const command = new GetParametersCommand(ssmParams);
    const data = await ssmClient.send(command);

    if (data.Parameters) {
      data.Parameters.forEach((param) => {
        const paramName = param.Name;
        if (awsParamsMap.has(paramName)) {
          testConfig[awsParamsMap.get(paramName)] = param.Value;
        }
      });
    }

    testConfig.serverURL = getServerURL();
    testConfig.cognitoURL = getcognitoURL();
    testConfig.ssoURL = getSSOURL();
    testConfig.apiGatewayURL = getAPIGatewayURL();

    return testConfig;

  } catch (err) {
    throw err;
  }
}

const ID_TOKEN_FILE = 'idToken.txt';
async function generateIdToken() {
  if (fs.existsSync(ID_TOKEN_FILE)) {
    try {
      fs.accessSync(ID_TOKEN_FILE, fs.constants.W_OK);
    } catch (err) {
      console.error('No Write access to ID_TOKEN_FILE');
      throw err;
    }
  }
  const maxRetry = TestSettings.retry.maxAttemptForInternalError;
  let retry = 0;
  let done = false;

  while (!done) {
    retry += 1;
    if (fs.existsSync(ID_TOKEN_FILE)) {
      const idToken = fs.readFileSync(ID_TOKEN_FILE);
      const decoded = jwt.decode(idToken);
      if ((Date.now() + 60000) >= (decoded.exp * 1000) || decoded.email !== testConfig.username || testConfig.cognitoClientId !== decoded.aud) {
        try {
          await this.getUserIdToken();
          fs.writeFileSync(ID_TOKEN_FILE, testConfig.userIdToken);
          done = true;
        }
        catch (error) {
          if (error.message === '400 - {"__type":"ExpiredCodeException","message":"Your software token has already been used once."}') {
            if (retry >= maxRetry) {
              throw new Error('Timed out in generating user id token due to MFA code used once');
            } else {
              console.log('MFA token has been used....Waiting to get user id again...');
              await sleep(TestSettings.retry.interval);
            }
          } else {
            throw error;
          }
        }
      }
      else {
        testConfig.userIdToken = idToken;
        done = true;
      }
    }
    else {
      await this.getUserIdToken();
      fs.writeFileSync(ID_TOKEN_FILE, testConfig.userIdToken);
      done = true;
    }
  }
}

async function readTestConfig() {
  await this.initTest();
  const idToken = fs.readFileSync(ID_TOKEN_FILE);
  testConfig.userIdToken = idToken;
}

function createErrorForAxios(axiosError) {
  if (axiosError.response) {
    let axiosRespData;
    let errMessage;

    if (axiosError.response.headers['content-type'] && axiosError.response.headers['content-type'].includes('json')) {
      axiosRespData = JSON.stringify(axiosError.response.data);
    }
    else {
      axiosRespData = axiosError.response.data;
    }

    if (axiosRespData.length > 400) {
      errMessage = `${axiosRespData.substring(0, 199)} ... ${axiosRespData.substring(axiosRespData.length - 201, axiosRespData.length - 1)}`
    }
    else {
      errMessage = axiosRespData;
    }

    return new Error(`${axiosError.response.status} - ${errMessage}`);
  }

  return axiosError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function replaceValueInString(stringBefore) {
  if (!stringBefore instanceof String) throw new Error(`Invalid String: ${stringBefore}`);

  let stringReturn = stringBefore.slice();

  if (testConfig.hasOwnProperty('jenKinsCurrentBuildId') && stringReturn.includes('${jenKinsCurrentBuildId}')) {
    stringReturn = stringReturn.replace(/\$\{jenKinsCurrentBuildId\}/g, testConfig.jenKinsCurrentBuildId);
  }

  if (testConfig.hasOwnProperty('jenKinsPreviousBuildId') && stringReturn.includes('${jenKinsPreviousBuildId}')) {
    stringReturn = stringReturn.replace(/\$\{jenKinsPreviousBuildId\}/g, testConfig.jenKinsPreviousBuildId);
  }

  return stringReturn;
}

async function initTest() {
  try {
    const awsParamsMaps = prepareAWSParamsMaps();
    for (let i = 0; i < awsParamsMaps.length; i += 1)
      if (awsParamsMaps[i].size > 0)
        await getTestParametersFromAWSPromise(awsParamsMaps[i]);
  } catch (error) {
    console.error(error);
  }
}

export default {
  initTest,
  getUserIdToken,
  TestConfig: testConfig,
  ShareData: shareData,
  generateIdToken,
  readTestConfig,
  createErrorForAxios,
  sleep,
  replaceValueInString
};
