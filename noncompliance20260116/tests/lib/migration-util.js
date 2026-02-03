import { context } from '../data/context.js';
import { _, axios, expect } from './util.js';
import { v4 as uuid } from 'uuid';
import FormData from 'form-data';
import fs from 'fs';
import JSZip from 'jszip';
import testUtil from './test-util.js';

import { DESKTOP_SUPERSTREAM_TEST_CLIENTS } from './superstream/superstream-centrehub-util.js';


const SF_MIG_FILE_NAME = 'SFMigration_SUPERVISOR.xml';

function getNewMigrationTokenFromSSO() {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.ssoURL}/api/migration`,
        {
          "subApp": "sf360",
          "type": "Migration"
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'SSO Generate Migration Token');
        if (response.data.token) {
          resolve(response.data.token);
        }
        else {
          reject(new Error('Unable to find migration token from response'));
        }

      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getUpdatedMigrationXMLString(xmlFolderPath, migrationOptions = {}) {
  if (context.TestConfig.firm == null) {
    throw new Error('Firm is not set in TestConfig');
  }

  if (context.TestConfig.username == null) {
    throw new Error('Username is not set in TestConfig');
  }

  const xmlFilePath = `${xmlFolderPath}/${SF_MIG_FILE_NAME}`;

  if (!fs.existsSync(xmlFilePath)) {
    throw new Error(`${SF_MIG_FILE_NAME} does not exist in ${xmlFolderPath}`);
  }

  let xmlFileStr = fs.readFileSync(xmlFilePath).toString();

  const regexFirm = /<AccountShortName>.*<\/AccountShortName>/;
  if (xmlFileStr.match(regexFirm)) {
    xmlFileStr = xmlFileStr.replace(regexFirm,
      `<AccountShortName>${context.TestConfig.firm}</AccountShortName>`);
  }
  else {
    throw new Error('Failed to find SF360 firm element in XML');
  }

  const regexUsername = /<AdminUserName>.*<\/AdminUserName>/;
  if (xmlFileStr.match(regexUsername)) {
    xmlFileStr = xmlFileStr.replace(regexUsername,
      `<AdminUserName>${context.TestConfig.username}</AdminUserName>`);
  }
  else {
    throw new Error('Failed to find admin username element in XML');
  }

  for (const opt in migrationOptions) {
    if (opt === 'replaceAccountIDForSuperStreamTest' && migrationOptions[opt] === true) {
      const regexAccountId = /<AccountID>.*<\/AccountID>/;
      const accId = DESKTOP_SUPERSTREAM_TEST_CLIENTS[context.TestConfig.environment].productId;
      if (xmlFileStr.match(regexAccountId)) {
        xmlFileStr = xmlFileStr.replace(regexAccountId,
          `<AccountID>${accId}</AccountID>`);
      }
      else {
        throw new Error('Failed to find account id element in XML');
      }
    }
  }

  return xmlFileStr;
}

async function getUpdatedMigrationZipContent(xmlFolderPath, migrationOptions = {}) {
  const updatedXMLStr = getUpdatedMigrationXMLString(xmlFolderPath, migrationOptions);

  const zip = new JSZip();
  zip.file(SF_MIG_FILE_NAME, updatedXMLStr);

  const content = await zip.generateAsync({ type: 'nodebuffer' });

  return content;
}

function uploadMigrationFileToSF360(migToken, migrationFolderPath, migrationOptions = {}) {
  return new Promise(async (resolve, reject) => {
    const importUID = uuid();
    console.log(`Migration Import UID: ${importUID}`);

    let zipContent;
    try {
      zipContent = await getUpdatedMigrationZipContent(migrationFolderPath, migrationOptions);
    }
    catch (error) {
      reject(error);
    }

    const form = new FormData();
    form.append(
      importUID,
      zipContent,
      `${importUID}.zip`);

    axios
      .post(
        `${context.TestConfig.serverURL}/d/MigrationFileUpload/receiveSfMigrationFile`,
        form,
        {
          headers: form.getHeaders(),
          params: {
            shortname: context.TestConfig.firm,
            username: context.TestConfig.username,
            token: migToken,
            importuid: importUID,
            path: 'migrationfiles/'
          }
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'SF360 Receive Sf Migration File');
        expect(response.data).to.eql('Migration Queued', 'SF360 Receive Sf Migration Response');
        resolve(importUID);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function checkMigrationStatus(migToken, importUID) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL}/d/TrackMigration/isMigrationFinished`,
        {},
        {
          params: {
            shortname: context.TestConfig.firm,
            username: context.TestConfig.username,
            token: migToken,
            importuid: importUID,
            cancel: false
          }
        }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Check Migration Status');
        const jsonData = JSON.parse(response.data);
        resolve(jsonData);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

const checkEntityMigratedWithRetry = (migToken, importUID,
  ms = context.TestSettings.retry.interval,
  numberOfRetry = context.TestSettings.retry.maxAttempt) => {
  return new Promise((resolve, reject) => {
    const check_entity_migrated_retry = (migToken, importUID, n) => {
      return checkMigrationStatus(migToken, importUID).then(response => {
        if (response.status == 'Migration finished') {
          console.log('Confirmed migration finished for ' + importUID);
          expect(response.results.length).to.be.above(0, 'Migration status contain 1 result');
          expect(response.results[0].errorMsg).to.eql('Successfully migrated', 'Migration status has no error message');
          return resolve(response.results[0]);
        }
        else if (response.status == null) {
          throw reject(`Server returned null migration status for ${importUID}`);
        }
        else if (n === 1) {
          throw reject(`Unable to confirm entity migrated before time out. Current status: ${response.status}`);
        }
        else {
          console.log(`Waiting to check entity migrated. Current status: ${response.status}`);
          setTimeout(() => {
            check_entity_migrated_retry(migToken, importUID, n - 1);
          }, ms);
        }
      }).catch(function (error) {
        reject(error)
      });
    }
    return check_entity_migrated_retry(migToken, importUID, numberOfRetry);
  });
}

async function migrateEntity(entityCode, migrationFolderPath, migrationOptions = {}) {
  const migToken = await getNewMigrationTokenFromSSO();

  const uid = await uploadMigrationFileToSF360(migToken, migrationFolderPath, migrationOptions);
  const migEntity = await checkEntityMigratedWithRetry(migToken, uid);

  const entityId = migEntity.fundId360;
  context.TestConfig.entityId = entityId;
  return entityId;
}

export {
  migrateEntity
};
