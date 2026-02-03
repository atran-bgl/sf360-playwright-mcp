import jwt from 'jsonwebtoken';
import * as util from './util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';

const { axios, expect } = util;

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`;
}

function loginToSSOPromise(firm, app = 'sf360') {
  return new Promise((resolve, reject) => {
    axios.post(`${context.TestConfig.ssoURL}/login_token_check?ajax=true&app=${app}&firm=${firm}`, {}, {
      headers: {
        Authorization: `Bearer ${context.TestConfig.userIdToken}`,
      },
    })
      .then((response) => {
        expect(response.status).to.eql(200, 'SSO Token Login Check is failed');
        axios.get(`${context.TestConfig.ssoURL}/selectfirm?app=sf360&firm=${firm}`)
          .then((res) => {
            expect(res.status).to.eql(200, 'SSO Select App and Firm is failed');
            // expect(res.data).not.to.contain('You need to enable JavaScript to run this app.'); //only one fund will be failed?
            util.cookieJar.getCookies(context.TestConfig.ssoURL, (err, cookies) => {
              resolve(cookies);
            });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getBadgeNamesPromise() {
  return new Promise((resolve, reject) => {
    axios.post(`${context.TestConfig.serverURL}/d/Badges/getBadgeNames?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`,
      context.TestConfig.firm, { headers: { 'Content-Type': 'text/plain' } })
      .then((response) => {
        expect(response.status).to.eql(200, 'Get badge names is failed');
        resolve(response.data);
      })
      .catch((error) => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getEntitiesPromise(keyword) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/entity/mvc/grid/getEntityListFromGrid?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`,
        {
          example: {
            // type: 'SMSF',
            product: 'SFUND',
            name: keyword,
            userId: context.TestConfig.uid
          }
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get entities failed');
        resolve(response.data.records);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function deleteEntityPromise(entityId) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/d/DeleteFund/sendDeleteFundMsg?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`,
        {
          list: [{
            masterId: entityId,
            cancelRegistration: true
          }]
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Delete entity failed');
        resolve();
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkEntityDeletedWithRetry = (keyword,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_entity_deleted_retry = (keyword, n) => {
      return getEntitiesPromise(keyword).then(entities => {
        if (entities.length === 0) {
          console.log(`Confirmed all entities deleted for "${keyword}"`);
          return resolve(entities);
        }
        else if (n === 1) {
          throw reject('Unable to confirm all entities deleted before time out');
        }
        else {
          console.log(`Waiting to check entity deleted. Got ${entities.length} entities left`);
          setTimeout(() => {
            check_entity_deleted_retry(keyword, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_entity_deleted_retry(keyword, numberOfRetry);
  });
}

function addEntityPromise(entity) {
  return new Promise((resolve, reject) => {
    getBadgeNamesPromise().then(function (badges) {
      const uid = context.TestConfig.uid;

      expect(badges.length).to.be.at.least(1, `There should be at least one badge`);

      const defaultBadgeId = badges[0].id;
      const abn = (entity.hasOwnProperty('insertSuperStreamTestABN') && entity.insertSuperStreamTestABN)
        ? SUPERSTREAM_TEST_CLIENTS[context.TestConfig.environment].abn
        : ((entity.abn === undefined) ? '' : entity.abn);

      let payload = {
        userId: null,
        firmShortName: `${context.TestConfig.firm}`,
        product: 'SFUND',
        master: {
          type: 'fund',
          establishment: false,
          tfn: entity.tfn === undefined ? '' : entity.tfn,
          abn: abn,
          establishmentDate: (entity.financialYearToStart - 5) + '-07-01T00:00:00.000+0000',
          entityType: 'SMSF',
          fundType: "SMSF",
          yearFrom: (entity.financialYearToStart - 1) + '-07-01T00:00:00.000+0000',
          yearTo: entity.financialYearToStart + '-06-30T00:00:00.000+0000',
          hideTfn: false,
          hideAbn: false,
          systemtStartDate: null,
          code: null,
          portalCode: entity.entityCode,
          name: entity.entityName,
          firstName: "",
          surname: "",
          id: null,
          docUUID: null,
          entityType: entity.entityType,
          badgeId: defaultBadgeId,
          childEntities: null,
          remarkStatus: 'FROM_QUICK_SETUP'
        },
        entityList: []
      }
      if (entity.entityType === 'BillableTrust') {
        if (entity.trustType !== null && entity.trustType !== undefined && entity.trustType !== '')
          payload.master.billableTrustType = entity.trustType;
        else payload.master.billableTrustType = 'Discretionary';
      } else if (entity.entityType === 'BillableCompany') {
        if (entity.acn !== null && entity.acn !== undefined)
          payload.master.acn = entity.acn;
        else payload.master.acn = '';
        if (entity.companyType !== null && entity.companyType !== undefined && entity.companyType !== '')
          payload.master.billableCompanyType = entity.companyType;
        else payload.master.billableCompanyType = 'Private';
      } else if (entity.entityType === 'BillableIndividual') {
        if (!entity.hasOwnProperty('firstName')) {
          reject(new Error('firstName is required to create billable individual'));
        }
        if (!entity.hasOwnProperty('surname')) {
          reject(new Error('surname is required to create billable individual'));
        }
        payload.master.firstName = entity.firstName;
        payload.master.surname = entity.surname;
        payload.master.name = `${entity.surname}, ${entity.firstName}`;
        payload.master.peopleId = null;
      }

      axios
        .post(
          `${context.TestConfig.serverURL}/d/Entities/addEntity?${getAPIParams()}`,
          payload
        )
        .then(response => {
          expect(response.status).to.eql(200, 'Add entity');
          const entityId = response.data;
          context.TestConfig.entityId = entityId;
          context.TestConfig.financialYear = entity.financialYearToStart;
          resolve(entityId);
        })
        .catch(error => {
          reject(testUtil.createErrorForAxios(error));
        });
    });
  });
}

async function getFundCounter() {
  let response = null;
  try {
    response = await axios.post(`${context.TestConfig.serverURL}/entity/mvc/base/getFundCounter?${getAPIParams()}`);
    expect(response.status).to.eql(200, "Can not get fund counter");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function logout() {
  try {
    const response = await axios.get(`${context.TestConfig.ssoURL}/logout?app=sf360`);
    expect(response.status).to.eql(200);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getJWTToken() {
  const getNewJwtToken = async function () {
    let response;
    try {
      response = await axios.get(
        `${context.TestConfig.serverURL}/jauth/token`
      );
      context.TestConfig.jwtToken = response.data.token;
    } catch (error) {
      throw testUtil.createErrorForAxios(error);
    }
  }

  if (context.TestConfig.hasOwnProperty('jwtToken')) {
    const decoded = jwt.decode(context.TestConfig.jwtToken);
    if ((Date.now() + 10000) >= (decoded.exp * 1000)) {
      await getNewJwtToken();
    }
  }
  else {
    await getNewJwtToken();
  }

  return context.TestConfig.jwtToken;
}


export async function login(firm, app = 'sf360') {
  try {
    const cookies = await loginToSSOPromise(firm, app);
    return cookies;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getBadgeNames() {
  try {
    const response = await getBadgeNamesPromise();
    return response;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEntities(keyword) {
  try {
    const response = await getEntitiesPromise(keyword);
    return response;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteEntities(keyword) {
  try {
    const response = await getEntitiesPromise(keyword);
    for (const entity of response) {
      await deleteEntityPromise(entity.masterId);
    }
    await checkEntityDeletedWithRetry(keyword);
    /* to execute in parallel
        await Promise.all(response.map(async (entity) => {
          await deleteEntityPromise(entityData.frim, entity.masterId);
        }));
    */
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function addEntity(entityData) {
  try {
    const response = await addEntityPromise(entityData);
    await testUtil.sleep(2000);
    return response;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export async function addEntityNotThrowError(entityData) {
  try {
    const response = await addEntityPromise(entityData);
    return response;
  }
  catch (error) {
    return error;
  }
}

export { getFundCounter, logout, getJWTToken };
