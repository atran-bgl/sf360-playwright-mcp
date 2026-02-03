import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { AssertionError } from 'chai';
import { axios, expect } from '../util.js';
import { context } from '../../data/context.js';
import testUtil from '../test-util.js';
import * as firmUtil from '../firm-util.js';

async function getDocumentTags(isSystem = true) {
  const tagType = isSystem ? 'System' : 'User';
  let response;
  try {
    response = await axios.get(
      `${context.TestConfig.apiGatewayURL}/service/document-API-V2/api/tags?entityId=${context.TestConfig.entityId}&tagType=${tagType}&tagName=`,
      {
        headers: { Authorization: `Bearer ${await firmUtil.getJWTToken()}` },
      },
    );
  } catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function addDocumentTag(tagName) {
  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.apiGatewayURL}/service/document-API-V2/api/tags?entityId=${context.TestConfig.entityId}`,
      {
        tagType: 'User',
        value: tagName,
      },
      {
        headers: { Authorization: `Bearer ${await firmUtil.getJWTToken()}` },
      },
    );
  } catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function uploadDocument(inputs) {
  const { docFilePath } = inputs;

  if (!fs.existsSync(docFilePath)) {
    throw new Error(`${docFilePath} does not exist`);
  }

  const form = new FormData();
  form.append(
    'uploadFile',
    fs.readFileSync(docFilePath),
    path.basename(docFilePath),
  );

  const payload = {
    signRequired: false,
    systemTags: [],
    userTags: [],
    taxonomies: {
      financial_year: [],
      parent_taccount: [],
    },
    status: 'UPLOADED',
  };

  if (Array.isArray(inputs.financialYears)) {
    payload.taxonomies.financial_year.push(...inputs.financialYears);
  }
  else {
    payload.taxonomies.financial_year.push('Permanent');
  }

  if (Array.isArray(inputs.parentTaccounts)) {
    payload.taxonomies.parent_taccount.push(...inputs.parentTaccounts);
  }

  if (Array.isArray(inputs.systemTags)) {
    const tagList = await getDocumentTags(true);
    inputs.systemTags.forEach((t) => {
      const foundTag = tagList.find((e) => e.value === t);
      if (!foundTag) throw new Error(`Failed to find system tag:${t}`);
      payload.systemTags.push(foundTag.id);
    });
  }

  if (Array.isArray(inputs.userTags)) {
    const tagList = await getDocumentTags(false);
    await Promise.all(inputs.userTags.map(async (t) => {
      const foundTag = tagList.find((e) => e.value === t);
      if (foundTag) {
        payload.userTags.push(foundTag.id);
      } else {
        const newTag = await addDocumentTag(t);
        payload.userTags.push(newTag.id);
      }
    }));
  }

  form.append(
    'json',
    JSON.stringify(payload),
  );

  const headers = { Authorization: `Bearer ${await firmUtil.getJWTToken()}` };
  Object.assign(headers, form.getHeaders());

  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.apiGatewayURL}/service/document-API-V2/api/core/documents?entityId=${context.TestConfig.entityId}&returnQuick=false`,
      form,
      {
        headers,
      },
    );
  } catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data.bglGRID;
}

async function searchDocument(filters) {
  const payload = {
    query: {
      bool: {
        filter: [
          {
            range: {
              createdDate: {},
            },
          },
        ],
      },
    },
    sort: [
      {
        createdDate: 'desc',
      },
    ],
    from: 0,
    size: 20,
    aggs: {
      parent_account_terms: {
        terms: {
          field: 'taxonomyTags.parent_taccount',
          size: 10000,
        },
      },
      sub_account_terms: {
        terms: {
          field: 'taxonomyTags.sub_taccount',
          size: 10000,
        },
      },
      normal_account_terms: {
        terms: {
          field: 'taxonomyTags.normal_taccount',
          size: 10000,
        },
      },
      sign_required_terms: {
        terms: {
          field: 'signRequired',
          size: 10000,
        },
      },
    },
  };

  if (Object.prototype.hasOwnProperty.call(filters, 'keyword')) {
    payload.query.bool.filter.push({
      wildcard: { 'originName.keyword': `*${filters.keyword}*` },
    });
  }

  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.apiGatewayURL}/service/document-API-V2/api/documents/search?entityId=${context.TestConfig.entityId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${await firmUtil.getJWTToken()}` },
      },
    );
  } catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function checkDocumentDetail(actualDocList, expectedDoc) {
  const foundDoc = actualDocList.find((e) => (e.documentKey === expectedDoc.documentKey || e.originName === expectedDoc.originName));

  if (!foundDoc) throw new AssertionError(`Unable to find document:${expectedDoc.originName}-${expectedDoc.documentKey}`);

  expect(foundDoc).to.containSubset(expectedDoc, `Document:${expectedDoc.originName}-${expectedDoc.documentKey}`);
}

async function checkDocumentSearch(inputs) {
  const searchResponse = await searchDocument(inputs.filters);

  const docList = searchResponse.hits.hits.map((e) => e._source);

  if (Object.prototype.hasOwnProperty.call(inputs.expectedResult, 'expectedDocCount')) {
    expect(docList.length).to.eql(inputs.expectedResult.expectedDocCount,
      `There should be ${inputs.expectedResult.expectedDocCount} documents returned in document search`);
  }

  if (Array.isArray(inputs.expectedResult.expectedDocuments)) {
    for (const expectedDoc of inputs.expectedResult.expectedDocuments) {
      await checkDocumentDetail(docList, expectedDoc);
    }
  }
}

const checkDocumentSearchWithRetry = async (inputs,
  ms = context.TestSettings.retry.shortInterval,
  numberOfRetry = context.TestSettings.retry.supeMaxAttempt) => {
  const check_doc_search_retry = async (n) => {
    try {
      await checkDocumentSearch(inputs);
      console.info('Confirmed completing document search check.');
    } catch (error) {
      if (error instanceof AssertionError) {
        if (n === 1) {
          throw error;
        }
        else {
          console.info('Assertion error...Waiting to check document search again...');
          await testUtil.sleep(ms);
          await check_doc_search_retry(n - 1);
        }
      }
      else {
        throw error;
      }
    }
  }

  await check_doc_search_retry(numberOfRetry);
}

async function viewDocument(bglGRID) {
  let response;
  try {
    response = await axios.put(
      `${context.TestConfig.apiGatewayURL}/service/document-API-V2/api/documents/${bglGRID}/status/VIEWED?entityId=${context.TestConfig.entityId}`,
      '',
      {
        headers: { Authorization: `Bearer ${await firmUtil.getJWTToken()}` }
      }
    )
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function viewSearchedDocument(inputs) {
  const searchResponse = await searchDocument(inputs.filters);

  const docList = searchResponse.hits.hits.map((e) => e._source);

  if (docList.length === 0) throw new Error(`No doc to view for ${JSON.stringify(inputs.filters)}`);
  await Promise.all(docList.map(async (doc) => {
    await viewDocument(doc.bglGRID);
    console.log(`Viewed document:${doc.bglGRID}`);
  }));
}

const viewDocumentWithRetry = async (docName) => {
  let viewDone = false;
  let numberOfRetry = 0;
  const searchFilters = { keyword: docName };

  while (!viewDone) {
    const docList = (await searchDocument(searchFilters)).hits.hits.map((e) => e._source);

    if (docList.length === 0) {
      console.warn(`No document to view for ${docName}`);
    }
    else {
      await Promise.all(docList.map(async (doc) => {
        await viewDocument(doc.bglGRID);
        console.log(`Viewed document:${doc.bglGRID}`);
      }));

      try {
        await checkDocumentSearchWithRetry({
          filters: searchFilters,
          expectedResult: {
            expectedDocCount: 1,
            expectedDocuments: [
              {
                originName: docName,
                status: 'VIEWED',
              },
            ],
          },
        });
        viewDone = true;
        return;
      } catch (error) {
        if (!(error instanceof AssertionError)) {
          throw error;
        }
      }
    }

    if (numberOfRetry === context.TestSettings.retry.minAttempt) {
      throw new Error(`Time out to check viewed document for ${docName}`);
    }

    numberOfRetry += 1;
    console.info('Waiting to view document and check again...');
    await testUtil.sleep(context.TestSettings.retry.interval);
  }
};

export default {
  uploadDocument,
  checkDocumentSearchWithRetry,
  checkDocumentSearch,
  addDocumentTag,
  viewDocumentWithRetry,
};
