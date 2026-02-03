import format from 'date-fns/format';
import parse from 'date-fns/parse';
import { _, axios, expect } from './util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';
context.ShareData.contacts = {};

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}`;
}

async function addPerson(person, personProxyId = null) {
  if (person.firstname === undefined || person.surname === undefined)
    throw new Error('First Name and Surname are mandatory feilds for Person!');
  let requestBody =
  {
    people: {
      firstname: testUtil.replaceValueInString(person.firstname),
      surname: testUtil.replaceValueInString(person.surname),
      birthday: null,
      deathDay: null,
      addressDto: {}
    }
  }
  if (person.birthday !== null && person.birthday !== undefined) {
    const birthdayObject = parse(person.birthday, 'yyyy-MM-dd', new Date());
    person.birthday = format(birthdayObject, 'dd/MM/yyyy');
  }
  if (person.deathDay !== null && person.deathDay !== undefined) {
    const deathDayObject = parse(person.deathDay, 'yyyy-MM-dd', new Date());
    person.deathDay = format(deathDayObject, 'dd/MM/yyyy');
  }
  const fieldsArray = ["title", "sex", "email", "phone", "mobileNumber", "abn", "tfn", "birthday",
    "otherNames", "preferredName", "smsfAuditorNumber", "professionalBodyNum", "professionalBody", "birthPlace", "deathDay",
    "birthState", "birthCountry"]
  for (const field of fieldsArray) {
    if (person[field] !== null && person[field] !== undefined) requestBody.people[field] = person[field];
  }
  const addressFields = ["streetLine1", "streetLine2", "state", "postCode", "country", "suburb"];
  for (const field of addressFields) {
    if (person[field] !== null && person[field] !== undefined) requestBody.people.addressDto[field] = person[field];
  }
  let url = '';
  if (personProxyId === null)
    url = `${context.TestConfig.serverURL}/entity/mvc/base/addPeople?${getAPIParams()}`;
  else if (personProxyId === 1)
    url = `${context.TestConfig.serverURL}/entity/mvc/base/addPeople?${getAPIParams()}&personProxyId=1`;
  try {
    const response = await axios.post(url, requestBody);
    expect(response.status).to.eql(200, "Can not add persion");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function addContact(contactInputs, personProxyId = 1) {
  if (contactInputs.entityType === 'People') {
    const companyId = await addPerson(contactInputs, personProxyId); // personProxyId = 1 return companyId otherwise return peopleId
    let peopleId = '';
    if (companyId != '') {
      peopleId = (await getPersonDetails(companyId)).id;
    }
    context.ShareData.contacts[contactInputs.internalTestContactId] =
    {
      newContact: true,
      companyId: companyId,
      peopleId: peopleId,
      entityType: contactInputs.entityType,
      contactInputs: contactInputs
    };
  } else {
    let requestBody = {};
    if (contactInputs.entityType === 'Company') {
      if (contactInputs.name === undefined || contactInputs.acn === undefined)
        throw new Error('Name and ACN are mandatory feilds for Company!')
      requestBody = {
        product: "CAS",
        master: {
          type: "company",
          name: contactInputs.name,
          acn: contactInputs.acn,
          entityType: contactInputs.entityType,
        },
        entityList: []
      }
      const fieldsAarry = ["solePurposeTrustee", "email", "phone", "abn"];
      for (const field of fieldsAarry) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) requestBody.master[field] = contactInputs[field];
      }
      const addressFields = ["streetLine1", "streetLine2", "state", "postCode", "country", "suburb"];
      for (const field of addressFields) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) {
          if (requestBody.master.address === undefined) requestBody.master.address = {};
          requestBody.master.address[field] = contactInputs[field];
        }
      }
    } else if (contactInputs.entityType === 'Trust') {
      if (contactInputs.name === undefined)
        throw new Error('Name is mandatory feild for Trust!')
      requestBody = {
        product: "CAS",
        master: {
          type: "company",
          name: contactInputs.name,
          entityType: contactInputs.entityType,
        },
        entityList: []
      }
      if (contactInputs.estDate !== null && contactInputs.estDate !== undefined) {
        const dateObject = parse(contactInputs.estDate, 'yyyy-MM-dd', new Date());
        contactInputs.estDate = format(dateObject, 'dd/MM/yyyy');
      }
      const fieldsAarry = ["abn", "tfn", "estDate"];
      for (const field of fieldsAarry) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) requestBody.master[field] = contactInputs[field];
      }
      const addressFields = ["streetLine1", "streetLine2", "state", "postCode", "country", "suburb"];
      for (const field of addressFields) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) {
          if (requestBody.master.address === undefined) requestBody.master.address = {};
          requestBody.master.address[field] = contactInputs[field];
        }
      }
    } else if (contactInputs.entityType === 'OtherEntity') {
      if (contactInputs.name === undefined)
        throw new Error('Name is mandatory feild for OtherEntity!')
      requestBody = {
        product: "CAS",
        master: {
          type: "company",
          name: contactInputs.name,
          entityType: contactInputs.entityType
        },
        entityList: []
      }
      const fieldsArray = ["email", "phone", "abn", "usi", "spin", "memberAccountNum"];
      for (const field of fieldsArray) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) requestBody.master[field] = contactInputs[field];
      }
      const addressFields = ["streetLine1", "streetLine2", "state", "postCode", "country", "suburb"];
      for (const field of addressFields) {
        if (contactInputs[field] !== undefined && contactInputs[field] !== null) {
          if (requestBody.master.address === undefined) requestBody.master.address = {};
          requestBody.master.address[field] = contactInputs[field];
        }
      }
    }
    let response = null;
    try {
      response = await axios.post(
        `${context.TestConfig.serverURL}/d/Entities/addEntity?${getAPIParams()}`,
        requestBody);
      expect(response.status).to.eql(200, `can not add ${contactInputs.entityType}`);
      context.ShareData.contacts[contactInputs.internalTestContactId] =
      {
        newContact: true,
        companyId: response.data,
        entityType: contactInputs.entityType,
        contactInputs: contactInputs
      };
    }
    catch (error) {
      throw testUtil.createErrorForAxios(error);
    }
  }
}

async function getPersonDetails(companyId) {
  try {
    const url = `${context.TestConfig.serverURL}/entity/mvc/base/queryPeople?${getAPIParams()}`;
    const payload = {
      filter: {
        example: {
          company: {
            type: "company",
            id: companyId
          },
          hideMobile: false,
          hideBirthday: false,
          hideTfn: false,
          notProvidedNumber: false
        }
      }
    };
    const response = await axios.post(url, payload);
    expect(response.status).to.eql(200, "Can not get person details!");
    return response.data.records[0];
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function deleteContacts(companyIdArray) {
  for (const companyId of companyIdArray) {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/entity/mvc/ContactsController/deleteContactList?${getAPIParams()}`, [companyId]);
    if (response.data.errorMsg !== null)
      console.log(`WARNING!! ${response.data.errorMsg} companyId: ${companyId}`)
  }
}

async function deleteContactsByName(contactNames) {
  const contactIds = [];
  for (const name of contactNames) {
    let requestBody = {
      example: {
        name: name,
        needAddress: true,
        getContactType: true,
        product: "CAS",
        supportTypes: [
          "Company",
          "Trust",
          "OtherEntity",
          "PersonProxy"
        ]
      }
    };
    const response = await axios.post(
      `${context.TestConfig.serverURL}/entity/mvc/grid/getEntityListFromGrid?${getAPIParams()}`, requestBody);
    expect(response.status).to.eql(200, "Search contacts failed");
    for (const contact of response.data.records) {
      if (contact.name === name) contactIds.push(contact.masterId);
    }
  }
  await deleteContacts(contactIds);
}

export default {
  addPerson,
  addContact,
  deleteContacts,
  deleteContactsByName
};
