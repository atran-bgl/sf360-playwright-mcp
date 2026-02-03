import Decimal from 'decimal.js';
import compareAsc from 'date-fns/compareAsc';
import format from 'date-fns/format';
import parse from 'date-fns/parse';

import { _, axios, expect, assert } from './util';
import { context } from '../data/context';

import testUtil from './test-util.js';
import contactUtil from '../lib/contact-util.js';
import chartUtil from '../lib/chart-util.js';
import transUtil from './transaction-util.js';
import entityUtil from './entity-util.js';
import * as firmUtil from '../lib/firm-util.js';
import * as reportUtil from '../lib/report-util.js';
context.ShareData.memberAccounts = {};
context.ShareData.memberTransactions = {};
context.ShareData.externalMemberAccount = {};

function getAPIParams() {
    return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

async function getMembersByCode() {
    let response;

    try {
        response = await axios.post(
            `${context.TestConfig.serverURL
            }/chart/chartmvc/MemberController/getMemberByCode/${context.TestConfig.entityId}/m/24200?${getAPIParams()}`
        );
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }

    return response.data;
}

async function getMemberDataByPeopleId(PeopleId) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/contact/${PeopleId}?${getAPIParams()}`);
        expect(response.status).to.eql(200, "Can not get Person Data From PeopleId");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addAccumulationAccount(contact, accumulation, memberCode) {
    const fieldsArray = ["currentSalary", "previousSalary", "deathBenefit", "disabilityBenefit",
        "centrelinkProductReference", "centrelinkOriginalPurchasePrice", "employerABN"]
    for (field of fieldsArray) {
        if (accumulation[field] === undefined) accumulation[field] = "";
    }
    const beneficiaries = [];
    if (accumulation.beneficiaries !== null && accumulation.beneficiaries !== undefined) {
        for (beneficary of accumulation.beneficiaries) {
            beneficiaries.push(
                {
                    beneficiary: {
                        companyId: context.ShareData.contacts[beneficary.selectedTestContactId].companyId,
                        entityType: beneficary.entityType
                    },
                    relationship: beneficary.relationship,
                    proportion: beneficary.proportion
                })
        }
    }
    let serviceDate = accumulation.startDate;
    if (accumulation.serviceDate !== undefined && accumulation.serviceDate !== null)
        serviceDate = accumulation.serviceDate;

    let endDate = null;
    if (accumulation.endDate != undefined && accumulation.endDate != null && accumulation.endDate != '')
        endDate = `${accumulation.endDate}${context.Constants.DATE_SUFFIX}`

    let requestBody = {
        id: null,
        code: memberCode,
        accDes: "Accumulation",
        accType: "Accumulation",
        startDate: `${accumulation.startDate}${context.Constants.DATE_SUFFIX}`,
        endDate: endDate,
        serviceDate: `${serviceDate}${context.Constants.DATE_SUFFIX}`,
        taxFree: null,
        balance: null,
        proportion: null,
        toPrepare: false,
        reversionary: false,
        originalTerm: null,
        selectedAmount: null,
        needRefreshTransferCap: false,
        selectedDate: null,
        entireTakenOut: false,
        dob: null,
        conversionDate: null,
        conversionDateFromTRISRetire: null,
        changeContact: false,
        formType: null, //pending
        timeframe: null, //pending
        nominationEndDate: null, //pending
        capAt1thJuly: false,
        reversionDate: null,
        original: false,
        atFirstYear: false,
        reversionProportion: null,
        peopleId: null,
        originalId: null,
        allowedFunds: false,
        allowedTrusts: false,
        allowedCompanies: false,
        externalMemberCode: null,
        accmulationTotal: null,
        retirementPhaseTotal: null,
        noJournalCreate: false,
        reversionAccountId: null,
        checkJournalFromDate: `${accumulation.startDate}${context.Constants.DATE_SUFFIX}`,
        memberId: null,
        fundId: context.TestConfig.entityId,
        accountId: null,
        contact: {
            id: contact.peopleId,
            name: `${contact.surname}, ${contact.firstname}`
        },
        beneficiaries: beneficiaries,
        financials: [
            {
                id: null,
                memberAccountId: null,
                fieldName: "Current Salary",
                isShow: true,
                fieldValue: accumulation.currentSalary,
                withCheckbox: true
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Previous Salary",
                isShow: true,
                fieldValue: accumulation.previousSalary,
                withCheckbox: true
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Death Benefit",
                isShow: true,
                fieldValue: accumulation.deathBenefit,
                withCheckbox: true
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Disability Benefit",
                isShow: true,
                fieldValue: accumulation.disabilityBenefit,
                withCheckbox: true
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Centrelink Product Reference",
                isShow: false,
                fieldValue: accumulation.centrelinkProductReference,
                withCheckbox: true
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Centrelink Original Purchase Price",
                isShow: false,
                fieldValue: accumulation.centrelinkOriginalPurchasePrice,
                withCheckbox: false
            },
            {
                id: null,
                memberAccountId: null,
                fieldName: "Employer's ABN",
                isShow: false,
                fieldValue: accumulation.employerABN,
                withCheckbox: true
            }
        ],
        cease: false,
        amount: null,
        maintain: false,
        preserved: null,
        restricted: null,
        unrestricted: null,
        taxed: null,
        untaxed: null
    };
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/save?${getAPIParams()}`,
            requestBody);
        expect(response.status).to.eql(200, "add Accumulation Account");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addOpeningBalForAccumulationAcc(accumulation) {
    const fieldsArray = ["taxFree", "taxed", "untaxed", "preserved", "restrictedNonPreserved", "unrestrictedNonPreserved"];
    for (field of fieldsArray) {
        if (accumulation[field] === undefined || accumulation[field] === null) accumulation[field] = 0;
    }
    const rolloverComponents = (new Decimal(accumulation.taxFree)
        .plus(accumulation.taxed)
        .plus(accumulation.untaxed))
        .toDecimalPlaces(2, 4);
    const preservationAmounts = (new Decimal(accumulation.preserved)
        .plus(accumulation.restrictedNonPreserved)
        .plus(accumulation.unrestrictedNonPreserved))
        .toDecimalPlaces(2, 4);
    if (!rolloverComponents.equals(preservationAmounts))
        throw new Error(`Total Rollover(${rolloverComponents}) is not equal to total Preservation(${preservationAmounts}).`);
    if (!rolloverComponents.equals(accumulation.openingBal))
        throw new Error(`Total Rollover(${rolloverComponents}) is not equal to opening balance(${accumulation.openingBal}).`);

    const taccIdMemberOpeningBal = (await chartUtil.getChartAccDataByFullAccCode
        (`50010/${context.ShareData.memberAccounts[accumulation.internalTestAccountId].memberCode}`,
            ["Active", "Inactive"])).records[0].id;

    let toAccountId = '';
    let toChartCode = '';
    let toSubAccCode = ''
    if (accumulation.postToBank === 'Yes') {
        const bankAccountData = await transUtil.getBankChartAccount(accumulation.startDate)
        toAccountId = bankAccountData.id;
        toChartCode = '60400';
        toSubAccCode = `/${bankAccountData.pcode.split('/')[1]}`;
    } else {
        toAccountId = (await chartUtil.getChartAccDataByFullAccCode('94920')).records[0].id;
        toChartCode = '94920';
    }

    const transref = await transUtil.getNextTransactionRef();

    let requestBody = {
        id: null,
        fundId: null,
        transactionDate: `${accumulation.startDate}${context.Constants.DATE_SUFFIX}`,
        transref: transref,
        entryTransList: [
            {
                id: null,
                type: "MemberBalance",
                entryId: null,
                entryDTO: {
                    subType: "MemberBalance",
                    ignoreDelta: false,
                    taxFreeProportion: null,
                    taxFree: accumulation.taxFree,
                    taxed: accumulation.taxed,
                    untaxed: accumulation.untaxed,
                    preserved: accumulation.preserved,
                    restrictedNonPreserved: accumulation.restrictedNonPreserved,
                    unrestrictedNonPreserved: accumulation.unrestrictedNonPreserved,
                    obFlag: null,
                    lastCreateEntryDate: null,
                    id: null,
                    taccId: taccIdMemberOpeningBal,
                    chartCode: "50010",
                    accountName: null,
                    amount: -accumulation.openingBal,
                    gstAmount: "0.00"
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
                defaultBankAccountFlag: null,
                editable: true,
                cgtGroupRef: null,
                unallocatedEntry: false
            },
            {
                id: null,
                type: "General",
                entryId: null,
                entryDTO: {
                    subType: "General",
                    id: null,
                    taccId: toAccountId,
                    chartCode: toChartCode,
                    accountName: null,
                    amount: accumulation.openingBal,
                    gstAmount: "0.00"
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
                defaultBankAccountFlag: null,
                editable: true,
                cgtGroupRef: null,
                unallocatedEntry: false
            }
        ],
        description: `Add 0pening balance for ${context.ShareData.memberAccounts[accumulation.internalTestAccountId].memberCode}`,
        type: "GeneralJournal",
        createSource: "SF360",
        divReinvest: false,
        matched: false,
        matchingNew: false,
        editable: true,
        lockByTBAR: false,
        hasAttachment: false,
        proccessTaxInstalment: false
    };
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/save?${getAPIParams()}`,
            requestBody);
        expect(response.status).to.eql(200, "Can not add opening balance for Accumulation Account");
        if (accumulation.internalTransactionId !== undefined && accumulation.internalTransactionId !== null) {
            const memberTransactionData =
            {
                date: accumulation.startDate,
                entryDTOs: [
                    {
                        debit: 0,
                        credit: accumulation.openingBal,
                        chartCode: `50010/${context.ShareData.memberAccounts[accumulation.internalTestAccountId].memberCode}`,

                    },
                    {
                        debit: accumulation.openingBal,
                        credit: 0,
                        chartCode: toChartCode + toSubAccCode,

                    }
                ]
            }
            context.ShareData.memberTransactions[accumulation.internalTransactionId] = memberTransactionData;
        }
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addMember(contactInputs, accumulationInputs) {
    let memberData;
    if (contactInputs.newContact) {
        contactInputs.peopleId = await contactUtil.addPerson(contactInputs);
        memberData = await getMemberDataByPeopleId(contactInputs.peopleId);
        context.ShareData.contacts[contactInputs.internalTestContactId] =
        {
            newContact: true,
            peopleId: memberData.id,
            companyId: memberData.companyId,
            firstName: memberData.firstName,
            surname: memberData.surname
        };
    } else {
        if (contactInputs.selectedTestContactId !== undefined && contactInputs.selectedTestContactId !== null && contactInputs.selectedTestContactId !== '') {
            const personDetails = await contactUtil.getPersonDetails(context.ShareData.contacts[contactInputs.selectedTestContactId].companyId);
            contactInputs.peopleId = personDetails.id;
            memberData = await getMemberDataByPeopleId(contactInputs.peopleId);
            context.ShareData.contacts[contactInputs.selectedTestContactId].peopleId = personDetails.id;
            context.ShareData.contacts[contactInputs.selectedTestContactId].firstName = personDetails.firstName;
            context.ShareData.contacts[contactInputs.selectedTestContactId].surname = personDetails.surname;
        } else {
            const existingContacts = await contactUtil.getContactsByName(`${contactInputs.surname}, ${contactInputs.firstname}`);
            let foundContact = [];

            if (contactInputs.birthday === undefined || contactInputs.birthday === null || contactInputs.birthday === '')
                throw new Error('Please supply the DOB of the exsiting contact!')
            const dateObject = parse(contactInputs.birthday, 'yyyy-MM-dd', new Date());
            const date = format(dateObject, 'dd/MM/yyyy');

            for (existingContact of existingContacts) {
                if (existingContact.type === 'PersonProxy') {
                    let contactDetails = await contactUtil.getPersonDetails(existingContact.masterId);
                    if (contactDetails.birthday === date) {
                        foundContact.push(contactDetails);
                    }
                }
            }
            if (foundContact.length > 0) {
                if (foundContact.length > 1) console.log('WARNING: Found more than one existing contacts with same name & DOB!!!');
                context.ShareData.contacts[contactInputs.internalTestContactId] =
                {
                    newContact: false,
                    peopleId: foundContact[0].id,
                    companyId: foundContact[0].company.id,
                    firstName: foundContact[0].firstName,
                    surname: foundContact[0].surname
                };
                contactInputs.peopleId = foundContact[0].id;
                memberData = await getMemberDataByPeopleId(contactInputs.peopleId);
            } else {
                contactInputs.peopleId = await contactUtil.addPerson(contactInputs);
                memberData = await getMemberDataByPeopleId(contactInputs.peopleId);
                context.ShareData.contacts[contactInputs.internalTestContactId] =
                {
                    newContact: true,
                    peopleId: memberData.id,
                    companyId: memberData.companyId,
                    firstName: memberData.firstName,
                    surname: memberData.surname
                };
            }
        }
    }
    await addAccumulationAccount(contactInputs, accumulationInputs, memberData.code);
    context.ShareData.memberAccounts[accumulationInputs.internalTestAccountId] = {
        memberCode: memberData.code, peopleId: memberData.id, memberName: memberData.name
    };
    if (accumulationInputs.hasOwnProperty('openingBal')) await addOpeningBalForAccumulationAcc(accumulationInputs);
}

async function getAllAvailableAccumulationAccountsData() {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/accumulations?${getAPIParams()}`);
        expect(response.status).to.eql(200, "Can not get all accumulation accounts data");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getAccumulationAccountData(memberCode) {
    responseData = await getAllAvailableAccumulationAccountsData();
    for (accumulation of responseData) {
        for (account of accumulation.accounts) {
            if (account.code === memberCode) return account;
        }
    }
}

async function getTransferCapForCreatePension(memberAccumulationAccId, pensionInputs) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/transferCap?${getAPIParams()}`,
            {
                id: memberAccumulationAccId,
                accType: "Accumulation",
                selectedAmount: pensionInputs.pensionAmount,
                event: pensionInputs.event,
                selectedDate: `${pensionInputs.startDate}${context.Constants.DATE_SUFFIX}`,
                fundId: context.TestConfig.entityId,
                pensionAccountType: pensionInputs.pensionAccountType
            });
        expect(response.status).to.eql(200, "Can not get pension transfer cap for create pension");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getAllMembersDataFromMemberList(entityId) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/list?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${entityId}`,
            { fundId: entityId });
        expect(response.status).to.eql(200, "Can not get all members data from member list");
        return response.data.result.records;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getMemberAccountDataFromMemberList(memberCode) {
    responseData = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    for (member of responseData) {
        for (account of member.accounts) {
            if (account.code === memberCode) {
                return account;
            }
        }
    }
}

async function getMemberAccountDataByMemberAccountId(memberAccountId) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/memberaccount/${memberAccountId}?${getAPIParams()}`);
        expect(response.status).to.eql(200, "Can not get member account data by using  member account id");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getAllMemberContacts(entityCode) {
    const memberContactsArray = [];
    const entitiesData = await firmUtil.getEntities(entityCode);
    for (let entity of entitiesData) {
        if (entity.code === entityCode) {
            const membersData = await getAllMembersDataFromMemberList(entity.masterId);
            for (let member of membersData) {
                memberContactsArray.push(member.companyId);
            }
            break;
        }
    }
    return memberContactsArray;
}

async function getRolloverFundId(entityCode) {
    const entitiesData = await firmUtil.getEntities(entityCode);
    for (let entity of entitiesData) {
        if (entity.code === entityCode) {
            context.TestConfig.entityId = entity.masterId
            const fundDetails = await entityUtil.getEntityDetail();
            const filters = {
                "startDate": fundDetails.financialYearFrom.slice(0, 10),
                "endDate": fundDetails.financialYearEnd.slice(0, 10),
                "keyword": "46000"
            };
            const transactions = await transUtil.searchTransactions(filters);
            for (transaction of transactions) {
                for (entry of transaction.entryTransList) {
                    if (entry.entryDTO.rolloverFundId !== undefined && entry.entryDTO.rolloverFundId !== null) {
                        return entry.entryDTO.rolloverFundId;
                    }
                }
            }
            return null;
        }
    }
}

async function addPensionAccountRequest(pensionInputs, accumulationAccountData, transferCapData) {
    const accountStartYear = accumulationAccountData.startDate.slice(0, 10).split('-')[0];
    const accountStartMonth = accumulationAccountData.startDate.slice(0, 10).split('-')[1];
    const accountStartDay = accumulationAccountData.startDate.slice(0, 10).split('-')[2];

    const transactionYear = pensionInputs.startDate.split('-')[0];
    const transactionMonth = pensionInputs.startDate.split('-')[1];
    const transactionDay = pensionInputs.startDate.split('-')[2];

    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYear}-${accountStartMonth}-${accountStartDay}`)) < 0)
        throw new Error('Can not create pension prior to accumulation account start date');

    let reversionaryFlag = false;
    let beneficiaries = [];
    if (pensionInputs.beneficiaries !== null && pensionInputs.beneficiaries !== undefined) {
        reversionaryFlag = true;
        for (beneficary of pensionInputs.beneficiaries) {
            beneficiaries.push(
                {
                    beneficiary: {
                        companyId: context.ShareData.contacts[beneficary.selectedTestContactId].companyId,
                        entityType: beneficary.entityType
                    },
                    relationship: beneficary.relationship,
                    proportion: beneficary.proportion
                })
        }
    } else beneficiaries = null;
    let pensionComponentType = 'UnrestrictedNonPreserved';
    if (pensionInputs.maintainCurrentPreservationComponents === true)
        pensionComponentType = 'MaintainCurrentPreservation';

    let formType = null, timeframe = null, nominationEndDate = null;
    if (accumulationAccountData.formType !== null)
        formType = accumulationAccountData.formType;
    if (accumulationAccountData.timeframe !== null)
        timeframe = accumulationAccountData.timeframe;
    if (accumulationAccountData.nominationEndDate !== null)
        nominationEndDate = accumulationAccountData.nominationEndDate;

    const taxFree = (new Decimal(pensionInputs.pensionAmount)
        .times(accumulationAccountData.taxFree)
        .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);
    const taxed = (new Decimal(pensionInputs.pensionAmount)
        .times(accumulationAccountData.taxed)
        .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);
    const untaxed = (new Decimal(pensionInputs.pensionAmount)
        .times(accumulationAccountData.untaxed)
        .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);

    let preserved = 0, restricted = 0, unrestricted = 0;
    if (pensionInputs.maintainCurrentPreservationComponents) {
        preserved = (new Decimal(pensionInputs.pensionAmount)
            .times(accumulationAccountData.preserved)
            .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);
        restricted = (new Decimal(pensionInputs.pensionAmount)
            .times(accumulationAccountData.restricted)
            .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);
        unrestricted = (new Decimal(pensionInputs.pensionAmount)
            .times(accumulationAccountData.unrestricted)
            .dividedBy(accumulationAccountData.balance)).toDecimalPlaces(2, 4);
    } else {
        preserved = 0;
        restricted = 0;
        unrestricted = -pensionInputs.pensionAmount;
    }

    let requestBody = {
        id: accumulationAccountData.id,
        code: context.ShareData.memberAccounts[pensionInputs.selectedAccumulationAccountId].memberCode,
        accDes: "Accumulation",
        accType: "Accumulation",
        startDate: `${pensionInputs.startDate}${context.Constants.DATE_SUFFIX}`,
        endDate: `${pensionInputs.startDate}${context.Constants.DATE_SUFFIX}`,
        serviceDate: null,
        balance: pensionInputs.pensionAmount,
        proportion: null,
        toPrepare: false,
        reversionary: reversionaryFlag,
        originalTerm: null,
        needRefreshTransferCap: false,
        event: null,
        entireTakenOut: false,
        dob: null,
        conversionDate: null,
        conversionDateFromTRISRetire: null,
        commencementConditionOfRelease: pensionInputs.conditionOfRelease,
        changeContact: false,
        formType: formType,
        timeframe: timeframe,
        nominationEndDate: nominationEndDate,
        capAt1thJuly: false,
        reversionDate: null,
        original: false,
        atFirstYear: false,
        reversionProportion: null,
        peopleId: null,
        originalId: null,
        accmulationTotal: null,
        retirementPhaseTotal: null,
        noJournalCreate: false,
        reversionAccountId: null,
        checkJournalFromDate: `${pensionInputs.startDate}${context.Constants.DATE_SUFFIX}`,
        memberId: accumulationAccountData.memberId,
        fundId: context.TestConfig.entityId,
        contact: {
            id: accumulationAccountData.contact.id
        },
        beneficiaries: beneficiaries,
        financials: null,
        cease: pensionInputs.ceaseAccumulationAcc,
        amount: pensionInputs.pensionAmount,
        pensionAccountType: pensionInputs.pensionAccountType,
        pensionComponentType: pensionComponentType,
        maintain: pensionInputs.maintainCurrentPreservationComponents,
        preserved: preserved,
        restricted: restricted,
        unrestricted: unrestricted,
        taxFree: taxFree,
        taxed: taxed,
        untaxed: untaxed
    };
    if (pensionInputs.pensionAccountType === 'MarketLinkedPension') {
        if (pensionInputs.originalTerm !== undefined)
            requestBody.originalTerm = pensionInputs.originalTerm;
    }
    if (pensionInputs.pensionAccountType === 'TransitionToRetirement') {
        requestBody.selectedAmount = accumulationAccountData.balance;
        requestBody.selectedDate = null;
    } else {
        requestBody.selectedAmount = pensionInputs.pensionAmount;
        requestBody.selectedDate = `${pensionInputs.startDate}${context.Constants.DATE_SUFFIX}`;
        requestBody.transferCap = transferCapData;
        requestBody.event = pensionInputs.event;
    }
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/savePension?${getAPIParams()}`, requestBody);
        expect(response.status).to.eql(200, "Can not add the pension account");
    } catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addPensionAccount(pensionInputs) {
    const pensionStartYear = pensionInputs.startDate.split('-')[0];
    const pensionStartMonth = pensionInputs.startDate.split('-')[1];
    const pensionStartDay = pensionInputs.startDate.split('-')[2];
    if (compareAsc(new Date(`${pensionStartYear}-${pensionStartMonth}-${pensionStartDay}`),
        new Date(`${context.TestConfig.financialYear}-06-30`)) > 0 ||
        compareAsc(new Date(`${pensionStartYear}-${pensionStartMonth}-${pensionStartDay}`),
            new Date(`${Number(context.TestConfig.financialYear) - 1}-07-01`)) < 0)
        throw new Error('Pension Start Date must be in the fund current financial year!')

    const accumulationAccountData = await getAccumulationAccountData(
        context.ShareData.memberAccounts[pensionInputs.selectedAccumulationAccountId].memberCode);

    if (pensionInputs.pensionAmount > accumulationAccountData.balance)
        throw new Error('Pension Amount is greater than member balance!');
    if (pensionInputs.pensionAmount < accumulationAccountData.balance)
        pensionInputs.ceaseAccumulationAcc = false;

    const allMembersDataBefore = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    let allMemberCodesForCurrentMemberBefore = [];
    for (member of allMembersDataBefore) {
        if (accumulationAccountData.contact.id === member.contactId) {
            for (account of member.accounts) allMemberCodesForCurrentMemberBefore.push(account.code);
            break;
        }
    }

    let transferCapData = null;
    const startYear = pensionInputs.startDate.split('-')[0];
    const startMonth = pensionInputs.startDate.split('-')[1];
    const startDay = pensionInputs.startDate.split('-')[2];
    if (pensionInputs.pensionAccountType !== 'TransitionToRetirement' &&
        compareAsc(new Date(`${startYear}-${startMonth}-${startDay}`), new Date('2017-06-30')) === 1) {
        if (pensionInputs.event === undefined || pensionInputs.event === null) pensionInputs.event = 'SIS'
        transferCapData = await getTransferCapForCreatePension(accumulationAccountData.id, pensionInputs);
        // console.log("transferCapDataAddPension---->", JSON.stringify(transferCapData));
        transferCapData.date = `${transferCapData.date.slice(0, 10)}${context.Constants.DATE_SUFFIX}`;
        if (pensionInputs.expectedTbarCapLimit !== undefined && pensionInputs.expectedTbarCapLimit !== null)
            assert.equal(pensionInputs.expectedTbarCapLimit, transferCapData.capLimit,
                'The Tbar Cap Limit is not correct! (add pension)');

        if (pensionInputs.expectedCurrentAccountBalance !== undefined && pensionInputs.expectedCurrentAccountBalance !== null)
            assert.equal(pensionInputs.expectedCurrentAccountBalance, transferCapData.currentBalance,
                'The Current Account Balance is not correct! (add pension)');

        if (pensionInputs.expectedCapRemainingPrior !== undefined && pensionInputs.expectedCapRemainingPrior !== null)
            assert.equal(pensionInputs.expectedCapRemainingPrior, transferCapData.remaining,
                'The Cap Remaining Prior is not correct! (add pension)');

        if (pensionInputs.expectedCapRemainingAfter !== undefined && pensionInputs.expectedCapRemainingAfter !== null)
            assert.equal(pensionInputs.expectedCapRemainingAfter, transferCapData.transferBalanceACP,
                'The Cap Remaining After is not correct! (add pension)');
    }

    await addPensionAccountRequest(pensionInputs, accumulationAccountData, transferCapData);
    await testUtil.sleep(3000);

    const allMembersDataAfter = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    let allMemberCodesForCurrentMemberAfter = [];
    for (member of allMembersDataAfter) {
        if (accumulationAccountData.contact.id === member.contactId) {
            for (account of member.accounts) allMemberCodesForCurrentMemberAfter.push({ accountCode: account.code, accountId: account.id });
            break;
        }
    }
    for (memberCode of allMemberCodesForCurrentMemberAfter) {
        if (!allMemberCodesForCurrentMemberBefore.includes(memberCode.accountCode)) {
            context.ShareData.memberAccounts[pensionInputs.internalTestAccountId] = {
                memberCode: memberCode.accountCode,
                accountId: memberCode.accountId
            };
            break;
        }
    }
    if (pensionInputs.internalTransactionId !== undefined && pensionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: pensionInputs.startDate,
            entryDTOs: [
                {
                    debit: 0,
                    credit: pensionInputs.pensionAmount,
                    chartCode: `56100/${context.ShareData.memberAccounts[pensionInputs.internalTestAccountId].memberCode}`,

                },
                {
                    debit: pensionInputs.pensionAmount,
                    credit: 0,
                    chartCode: `57100/${context.ShareData.memberAccounts[pensionInputs.selectedAccumulationAccountId].memberCode}`,

                }
            ],
        }
        // if (pensionInputs.pensionAccountType !== 'TransitionToRetirement' && transferCapData !== null) {
        //   memberTransactionData.memberCode = context.ShareData.memberAccounts[pensionInputs.internalTestAccountId].memberCode;
        //   memberTransactionData.event = pensionInputs.event;
        //   memberTransactionData.credit = -pensionInputs.pensionAmount;
        //   memberTransactionData.debit = null;
        //   memberTransactionData.remainingCap = transferCapData.transferBalanceACP;
        // }
        context.ShareData.memberTransactions[pensionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function createContributionEntry(memberTransactionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode);
    const accountStartYear = memberAccountData.startDate.slice(0, 10).split('-')[0];
    const accountStartMonth = memberAccountData.startDate.slice(0, 10).split('-')[1];
    const accountStartDay = memberAccountData.startDate.slice(0, 10).split('-')[2];

    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];

    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYear}-${accountStartMonth}-${accountStartDay}`)) < 0)
        throw new Error('Can not post contribution prior to account start date');

    const fieldsArray = ["employerCC", "personalCC", "personalNonCC", "spouseAndChild", "govCoContrib",
        "anyOther", "directTerminationPayTaxable", "directTerminationPayTaxFree", "cgt15Year", "cgtRetirement",
        "personalInjury", "otherFamilyFriends", "foreignAssess", "foreignNonAssess", "transReservesAssess",
        "transReservesNonAssess", "nonComplying", "nonMandated", "reservesEmployerCC", "reservesPersonalCC",
        "reservesPersonalNonCC", "downsizer", "covidRecontribution"];
    let totalAmount = 0;
    for (field of fieldsArray) {
        if (memberTransactionInputs[field] === undefined || memberTransactionInputs[field] === null) memberTransactionInputs[field] = 0;
        totalAmount = new Decimal(totalAmount).plus(memberTransactionInputs[field]);
    }
    totalAmount = (new Decimal(totalAmount)).toDecimalPlaces(2, 4);
    const taccIdMemberContribution = (await chartUtil.getChartAccDataByFullAccCode
        (`24200/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,
            ["Active", "Inactive"])).records[0].id;

    const contributionEntry = {
        id: null,
        type: "Contribution",
        entryId: null,
        entryDTO: {
            subType: "Contribution",
            id: null,
            memberName: context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberName,
            peopleId: context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].peopleId,
            employerCC: memberTransactionInputs.employerCC,
            personalCC: memberTransactionInputs.personalCC,
            personalNonCC: memberTransactionInputs.personalNonCC,
            spouseAndChild: memberTransactionInputs.spouseAndChild,
            govCoContrib: memberTransactionInputs.govCoContrib,
            anyOther: memberTransactionInputs.anyOther,
            directTerminationPayTaxable: memberTransactionInputs.directTerminationPayTaxable,
            directTerminationPayTaxFree: memberTransactionInputs.directTerminationPayTaxFree,
            cgt15Year: memberTransactionInputs.cgt15Year,
            cgtRetirement: memberTransactionInputs.cgtRetirement,
            personalInjury: memberTransactionInputs.personalInjury,
            otherFamilyFriends: memberTransactionInputs.otherFamilyFriends,
            foreignAssess: memberTransactionInputs.foreignAssess,
            foreignNonAssess: memberTransactionInputs.foreignNonAssess,
            transReservesAssess: memberTransactionInputs.transReservesAssess,
            transReservesNonAssess: memberTransactionInputs.transReservesNonAssess,
            nonComplying: memberTransactionInputs.nonComplying,
            nonMandated: memberTransactionInputs.nonMandated,
            reservesEmployerCC: memberTransactionInputs.reservesEmployerCC,
            reservesPersonalCC: memberTransactionInputs.reservesPersonalCC,
            reservesPersonalNonCC: memberTransactionInputs.reservesPersonalNonCC,
            downsizer: memberTransactionInputs.downsizer,
            covidRecontribution: memberTransactionInputs.covidRecontribution,
            taccId: taccIdMemberContribution,
            chartCode: "24200",
            accountName: null,
            amount: -totalAmount,
            gstAmount: "0.00"
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
        defaultBankAccountFlag: null,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
    }
    return contributionEntry;
}

async function addContribution(memberTransactionInputs) {
    const contributionEntry = await createContributionEntry(memberTransactionInputs);
    const bankEntry = await transUtil.createBankEntry(memberTransactionInputs.transactionDate, -contributionEntry.entryDTO.amount);
    const transref = await transUtil.getNextTransactionRef();
    const transDesc = (memberTransactionInputs.hasOwnProperty('transactionDescription')) ? memberTransactionInputs.transactionDescription :
        `Add contribution for ${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`;

    await transUtil.addBankTransaction(memberTransactionInputs.transactionDate,
        transDesc,
        [bankEntry, contributionEntry], transref);

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: memberTransactionInputs.transactionDate,
            entryDTOs: [
                {
                    debit: bankEntry.entryDTO.amount,
                    credit: 0,
                    chartCode: `60400/${bankEntry.entryDTO.chartCode}`,

                },
                {
                    debit: 0,
                    credit: -contributionEntry.entryDTO.amount,
                    chartCode: `24200/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,

                }
            ]
        }
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function createRollinEntry(memberTransactionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode);
    const accountStartYear = memberAccountData.startDate.slice(0, 10).split('-')[0];
    const accountStartMonth = memberAccountData.startDate.slice(0, 10).split('-')[1];
    const accountStartDay = memberAccountData.startDate.slice(0, 10).split('-')[2];

    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];

    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYear}-${accountStartMonth}-${accountStartDay}`)) < 0)
        throw new Error('Can not post rollin prior to account start date');

    const fieldsArray = ["taxFree", "taxed", "untaxed", "pres", "rnp", "unp"];
    for (field of fieldsArray) {
        if (memberTransactionInputs[field] === undefined || memberTransactionInputs[field] === null) memberTransactionInputs[field] = 0;
    }
    const rolloverComponents = (new Decimal(memberTransactionInputs.taxFree)
        .plus(memberTransactionInputs.taxed)
        .plus(memberTransactionInputs.untaxed))
        .toDecimalPlaces(2, 4);
    const preservationAmounts = (new Decimal(memberTransactionInputs.pres)
        .plus(memberTransactionInputs.rnp)
        .plus(memberTransactionInputs.unp))
        .toDecimalPlaces(2, 4);
    if (!rolloverComponents.equals(preservationAmounts))
        throw new Error(`Total Preservation amounts(${preservationAmounts}) is not equal to Rollover components(${rolloverComponents}).`);

    const taccIdMemberRollin = (await chartUtil.getChartAccDataByFullAccCode
        (`28500/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`)).records[0].id;
    const accumulationAccountData = await getAccumulationAccountData(
        context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode);
    const memberAccountId = accumulationAccountData.id;
    const servicePeriodStartDate = accumulationAccountData.serviceDate;

    const rollinEntry = {
        id: null,
        type: "MemberRollin",
        entryId: null,
        entryDTO: {
            subType: "MemberRollin",
            memberAccountId: memberAccountId,
            startDate: servicePeriodStartDate,
            taxFree: memberTransactionInputs.taxFree,
            taxed: memberTransactionInputs.taxed,
            untaxed: memberTransactionInputs.untaxed,
            pres: memberTransactionInputs.pres,
            rnp: memberTransactionInputs.rnp,
            unp: memberTransactionInputs.unp,
            financialYearEnding: null,
            employerCC: 0,
            personalCC: 0,
            cgtRea: 0,
            cgt15Year: 0,
            personalInjury: 0,
            spouseChild: 0,
            otherFamilyFriends: 0,
            directedTerminationPayments: 0,
            aff: 0,
            naff: 0,
            atr: 0,
            natr: 0,
            acrcy: 0,
            id: null,
            taccId: taccIdMemberRollin,
            chartCode: "28500",
            accountName: null,
            amount: -preservationAmounts,
            gstAmount: "0.00"
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
        defaultBankAccountFlag: null,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
    }
    return rollinEntry;
}

async function addMemberRollin(memberTransactionInputs) {
    const rollinEntry = await createRollinEntry(memberTransactionInputs);
    const bankEntry = await transUtil.createBankEntry(memberTransactionInputs.transactionDate, -rollinEntry.entryDTO.amount);
    const transref = await transUtil.getNextTransactionRef();
    await transUtil.addBankTransaction(memberTransactionInputs.transactionDate,
        `Add member rollin for ${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,
        [bankEntry, rollinEntry], transref);

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: memberTransactionInputs.transactionDate,
            entryDTOs: [
                {
                    debit: bankEntry.entryDTO.amount,
                    credit: 0,
                    chartCode: `60400/${bankEntry.entryDTO.chartCode}`,

                },
                {
                    debit: 0,
                    credit: -rollinEntry.entryDTO.amount,
                    chartCode: `28500/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,

                }
            ]
        }
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function createPensionPaymentEntry(memberTransactionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode);
    const accountStartYear = memberAccountData.startDate.slice(0, 10).split('-')[0];
    const accountStartMonth = memberAccountData.startDate.slice(0, 10).split('-')[1];
    const accountStartDay = memberAccountData.startDate.slice(0, 10).split('-')[2];

    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];

    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYear}-${accountStartMonth}-${accountStartDay}`)) < 0)
        throw new Error('Can not post pension payment prior to pension start date');

    if (memberTransactionInputs.payg === undefined || memberTransactionInputs.payg === null)
        memberTransactionInputs.payg = 0;

    const taccIdPensionPayment = (await chartUtil.getChartAccDataByFullAccCode
        (`41600/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`)).records[0].id;
    const pensionPaymentEntry = {
        id: null,
        type: "PensionPayment",
        entryId: null,
        entryDTO: {
            subType: "PensionPayment",
            netDrawdown: memberTransactionInputs.netDrawdown,
            payg: -memberTransactionInputs.payg,
            id: null,
            taccId: taccIdPensionPayment,
            chartCode: "41600",
            accountName: null,
            amount: memberTransactionInputs.netDrawdown,
            gstAmount: "0.00"
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
        defaultBankAccountFlag: null,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
    }
    return pensionPaymentEntry;
}

async function addPensionPayment(memberTransactionInputs) {
    const pensionPaymentEntry = await createPensionPaymentEntry(memberTransactionInputs);
    const bankEntry = await transUtil.createBankEntry(memberTransactionInputs.transactionDate, -pensionPaymentEntry.entryDTO.amount);
    const transref = await transUtil.getNextTransactionRef();
    await transUtil.addBankTransaction(memberTransactionInputs.transactionDate,
        `Add pension payment for ${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,
        [bankEntry, pensionPaymentEntry], transref);

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: memberTransactionInputs.transactionDate,
            entryDTOs: [
                {
                    debit: 0,
                    credit: -bankEntry.entryDTO.amount,
                    chartCode: `60400/${bankEntry.entryDTO.chartCode}`,

                },
                {
                    debit: Number((new Decimal(pensionPaymentEntry.entryDTO.netDrawdown).minus(pensionPaymentEntry.entryDTO.payg)).toDecimalPlaces(2, 4)),
                    credit: 0,
                    chartCode: `41600/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,

                }
            ]
        }
        if (pensionPaymentEntry.entryDTO.payg !== 0)
            memberTransactionData.entryDTOs.push({
                debit: 0,
                credit: -pensionPaymentEntry.entryDTO.payg,
                chartCode: '86000',
            });
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function getMemberBalanceByTAccId(taccIdRolloverPayment) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/membersbalance/${taccIdRolloverPayment}?${getAPIParams()}`,
            'null', { headers: { 'Content-Type': 'application/json' } });
        expect(response.status).to.eql(200, "Can not get member balance by TAccount id");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getTransferCapForPensionRolloverPayment(memberAccountId, memberTransactionInputs) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/getTransferCapDTO?${getAPIParams()}`,
            {
                id: memberAccountId,
                selectedAmount: memberTransactionInputs.payAmount,
                event: memberTransactionInputs.event,
                selectedDate: `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`
            });
        expect(response.status).to.eql(200, "Can not get pension transfer cap for pension rollover payment");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function createRolloverPaymentEntry(memberTransactionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode);
    const accountStartYear = memberAccountData.startDate.slice(0, 10).split('-')[0];
    const accountStartMonth = memberAccountData.startDate.slice(0, 10).split('-')[1];
    const accountStartDay = memberAccountData.startDate.slice(0, 10).split('-')[2];

    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];

    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYear}-${accountStartMonth}-${accountStartDay}`)) < 0)
        throw new Error('Can not post rollover payment prior to account start date');

    const memberAccountId = memberAccountData.id;
    const servicePeriodStartDate = memberAccountData.serviceDate;

    let displayInOperationStatement = memberTransactionInputs.displayInOperationStatement;
    if (memberTransactionInputs.displayInOperationStatement === undefined || memberTransactionInputs.displayInOperationStatement === null) {
        if (memberTransactionInputs.paymentType === 'TransferToAnother')
            displayInOperationStatement = true;
        else displayInOperationStatement = false;
    }

    const taccIdRolloverPayment = (await chartUtil.getChartAccDataByFullAccCode
        (`46000/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,
            ["Active", "Inactive"])).records[0].id;
    let memberBlanceData = await getMemberBalanceByTAccId(taccIdRolloverPayment);
    console.log("createRolloverPaymentEntry -> memberBlance", memberBlanceData.amount);

    let taxWithheld = 0;
    if (memberTransactionInputs.taxWithheld !== undefined && memberTransactionInputs.taxWithheld !== null)
        taxWithheld = memberTransactionInputs.taxWithheld;
    const totalAmount = (new Decimal(memberTransactionInputs.payAmount).plus(taxWithheld)).toDecimalPlaces(2, 4);

    let percent = 0, taxFree = 0, taxed = 0, untaxed = 0;
    // from UI can add the transaction if the current balance is 0 - will get negative balance
    if (memberBlanceData.amount == 0) {
        percent = 100.00;
        taxFree = -totalAmount;
    }
    else if (totalAmount.greaterThan(memberBlanceData.amount)) {
        throw new Error(`The payment amount (${totalAmount}) is greater than the account balance (${memberBlanceData.amount})`);
    } else {
        percent = totalAmount.dividedBy(memberBlanceData.amount).times(100).toDecimalPlaces(2, 4);
        taxFree = totalAmount.times(memberBlanceData.taxFree).dividedBy(memberBlanceData.amount).toDecimalPlaces(2, 4);
        taxed = totalAmount.times(memberBlanceData.taxed).dividedBy(memberBlanceData.amount).toDecimalPlaces(2, 4);
        untaxed = totalAmount.times(memberBlanceData.untaxed).dividedBy(memberBlanceData.amount).toDecimalPlaces(2, 4);
    }

    let unp = 0, rnp = 0, pres = 0;
    if (totalAmount.greaterThanOrEqualTo(-memberBlanceData.unrestrictedNonPreserved)) {
        unp = -memberBlanceData.unrestrictedNonPreserved;
        let remainingAmount = totalAmount.plus(memberBlanceData.unrestrictedNonPreserved).toDecimalPlaces(2, 4);
        if (remainingAmount.greaterThanOrEqualTo(-memberBlanceData.restrictedNonPreserved)) {
            rnp = -memberBlanceData.restrictedNonPreserved;
            pres = remainingAmount.plus(memberBlanceData.restrictedNonPreserved).toDecimalPlaces(2, 4);
        } else rnp = remainingAmount;
    } else unp = totalAmount;

    let financialYearEnding = (await entityUtil.getEntityDetail()).financialYearEnd.slice(0, 10);

    const rolloverPaymentEntry = {
        id: null,
        type: "RolloverPayment",
        entryId: null,
        entryDTO: {
            subType: "RolloverPayment",
            paymentType: memberTransactionInputs.paymentType,
            memberAccountId: memberAccountId,
            beneficiary: null, // DeathBenefit
            spouse: null, //ContributionsSplitForSpouse
            startDate: servicePeriodStartDate,
            fundId: null,
            rolloverFundId: null, // DeathBenefit, TransferToAnother
            displayInOperationStatement: displayInOperationStatement, // TransferToAnother: default true 
            paymentDate: `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`,
            percent: percent,
            payAmount: memberTransactionInputs.payAmount,
            taxWithheld: taxWithheld,
            taxFree: -taxFree,
            taxed: -taxed,
            untaxed: -untaxed,
            pres: pres,
            rnp: rnp,
            unp: unp,
            financialYearEnding: `${financialYearEnding}${context.Constants.DATE_SUFFIX}`,
            employerCC: null,
            personalCC: null,
            cgtRea: null,
            cgt15Year: null,
            personalInjury: null,
            spouseChild: null,
            otherFamilyFriends: null,
            directedTerminationPayments: null,
            aff: null,
            naff: null,
            atr: null,
            natr: null,
            acrcy: "0.00",
            id: null,
            taccId: taccIdRolloverPayment,
            chartCode: "46000",
            accountName: null,
            amount: memberTransactionInputs.payAmount,
            gstAmount: "0.00"
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
        defaultBankAccountFlag: null,
        editable: true,
        cgtGroupRef: null,
        unallocatedEntry: false
    }

    if (memberAccountData.accType === 'Pension'
        && memberAccountData.pensionAccountType !== 'TransitionToRetirement'
        && memberTransactionInputs.paymentType !== 'ContributionsSplitForSpouse'
        && compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`), new Date('2017-06-30')) === 1) {
        if (memberTransactionInputs.event === undefined || memberTransactionInputs.event === null)
            memberTransactionInputs.event = 'MCO';
        if (memberTransactionInputs.commutationPaidDirectly === undefined || memberTransactionInputs.commutationPaidDirectly === null)
            memberTransactionInputs.commutationPaidDirectly = false;
        const transferCapData = await getTransferCapForPensionRolloverPayment(memberAccountId, memberTransactionInputs);
        // console.log("transferCapDataRollover---->", JSON.stringify(transferCapData));
        transferCapData.date = `${transferCapData.date.slice(0, 10)}${context.Constants.DATE_SUFFIX}`;
        transferCapData.commutationPaidDirectly = memberTransactionInputs.commutationPaidDirectly;
        rolloverPaymentEntry.entryDTO.transferCap = transferCapData;

        if (memberTransactionInputs.expectedTbarCapLimit !== undefined && memberTransactionInputs.expectedTbarCapLimit !== null)
            assert.equal(memberTransactionInputs.expectedTbarCapLimit, transferCapData.capLimit,
                'The Tbar Cap Limit is not correct! (rollover)');

        if (memberTransactionInputs.expectedCurrentAccountBalance !== undefined && memberTransactionInputs.expectedCurrentAccountBalance !== null)
            assert.equal(memberTransactionInputs.expectedCurrentAccountBalance, transferCapData.currentBalance,
                'The Current Account Balance is not correct! (rollover)');

        if (memberTransactionInputs.expectedCapRemainingPrior !== undefined && memberTransactionInputs.expectedCapRemainingPrior !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingPrior, transferCapData.remaining,
                'The Cap Remaining Prior is not correct! (rollover)');

        if (memberTransactionInputs.expectedCapRemainingAfter !== undefined && memberTransactionInputs.expectedCapRemainingAfter !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingAfter, transferCapData.transferBalanceACP,
                'The Cap Remaining After is not correct! (rollover)');
    }

    if (memberTransactionInputs.paymentType === 'ContributionsSplitForSpouse') {
        if (memberTransactionInputs.spouseSelectedTestContactId !== undefined && memberTransactionInputs.spouseSelectedTestContactId !== null)
            rolloverPaymentEntry.entryDTO.spouse = context.ShareData.contacts[memberTransactionInputs.spouseSelectedTestContactId].peopleId;
        else if (memberTransactionInputs.spousePeopleId !== undefined && memberTransactionInputs.spousePeopleId !== null)
            rolloverPaymentEntry.entryDTO.spouse = memberTransactionInputs.spousePeopleId;
    }

    if (memberTransactionInputs.paymentType === 'DeathBenefit') {
        if (memberTransactionInputs.deathBenefitType === undefined || memberTransactionInputs.deathBenefitType === null)
            throw new Error('deathBenefitType is not set in the test data file');
        else rolloverPaymentEntry.entryDTO.deathBenefitType = memberTransactionInputs.deathBenefitType;

        if (memberTransactionInputs.beneficiarySelectedTestContactId !== undefined && memberTransactionInputs.beneficiarySelectedTestContactId !== null)
            rolloverPaymentEntry.entryDTO.beneficiary = context.ShareData.contacts[memberTransactionInputs.beneficiarySelectedTestContactId].peopleId;
        else if (memberTransactionInputs.beneficiaryPeopleId !== undefined && memberTransactionInputs.beneficiaryPeopleId !== null)
            rolloverPaymentEntry.entryDTO.beneficiary = memberTransactionInputs.beneficiaryPeopleId;

        if (memberTransactionInputs.rolloverFund !== undefined && memberTransactionInputs.rolloverFund !== null)
            rolloverPaymentEntry.entryDTO.rolloverFundId = context.ShareData.contacts[memberTransactionInputs.rolloverFund].companyId;
    }

    if (memberTransactionInputs.paymentType === 'TransferToAnother') {
        rolloverPaymentEntry.entryDTO.displayInOperationStatement = true;
        if (memberTransactionInputs.rolloverFund === undefined || memberTransactionInputs.rolloverFund === null)
            throw new Error('Rollover fund is not set in the test data file for transferring from one Super Fund to another');
        else rolloverPaymentEntry.entryDTO.rolloverFundId = context.ShareData.contacts[memberTransactionInputs.rolloverFund].companyId;
    }

    if (memberTransactionInputs.paymentType === 'EarlyAccessToSuper') {
        if (memberTransactionInputs.specialConditionsReleaseType === undefined || memberTransactionInputs.specialConditionsReleaseType === null)
            throw new Error('specialConditionsReleaseType is not set in the test data file');
        else rolloverPaymentEntry.entryDTO.specialConditionsReleaseType = memberTransactionInputs.specialConditionsReleaseType;
        if (memberTransactionInputs.specialConditionsReleaseType === 'Coronavirus') {
            if (totalAmount.greaterThan(10000)) throw new Error('Cannot withdraw more than $10,000 for Coronavirus - Early Release');
            const year = memberTransactionInputs.transactionDate.split('-')[0];
            const month = memberTransactionInputs.transactionDate.split('-')[1];
            const date = memberTransactionInputs.transactionDate.split('-')[2];
            if (compareAsc(new Date(`${year}-${month}-${date}`), new Date('2020-04-20')) < 0 ||
                compareAsc(new Date(`${year}-${month}-${date}`), new Date('2020-12-31')) > 0)
                throw new Error('Can only apply COVID-19 early release between 20 April and 31 December 2020 - ATO');
        }
    }
    return rolloverPaymentEntry;
}

async function addRolloverPayment(memberTransactionInputs) {
    const rolloverPaymentEntry = await createRolloverPaymentEntry(memberTransactionInputs);
    const bankEntry = await transUtil.createBankEntry(memberTransactionInputs.transactionDate, -rolloverPaymentEntry.entryDTO.amount);
    const transref = await transUtil.getNextTransactionRef();
    await transUtil.addBankTransaction(memberTransactionInputs.transactionDate,
        `Add rollover payment (${memberTransactionInputs.paymentType}) for ${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,
        [bankEntry, rolloverPaymentEntry], transref);

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        const debit = Number((new Decimal(rolloverPaymentEntry.entryDTO.amount).plus(rolloverPaymentEntry.entryDTO.taxWithheld)).toDecimalPlaces(2, 4));
        const memberTransactionData =
        {
            date: memberTransactionInputs.transactionDate,
            entryDTOs: [
                {
                    debit: 0,
                    credit: -bankEntry.entryDTO.amount,
                    chartCode: `60400/${bankEntry.entryDTO.chartCode}`,

                },
                {
                    debit: debit,
                    credit: 0,
                    chartCode: `46000/${context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode}`,

                }
            ]
        }
        if (rolloverPaymentEntry.entryDTO.taxWithheld !== 0)
            memberTransactionData.entryDTOs.push({
                debit: 0,
                credit: rolloverPaymentEntry.entryDTO.taxWithheld,
                chartCode: '86000',
            });
        // if (rolloverPaymentEntry.entryDTO.transferCap !== undefined && rolloverPaymentEntry.entryDTO.transferCap !== null) {
        //   memberTransactionData.memberCode = context.ShareData.memberAccounts[memberTransactionInputs.selectedTestAccountId].memberCode;
        //   memberTransactionData.event = rolloverPaymentEntry.entryDTO.transferCap.event;
        //   memberTransactionData.credit = null;
        //   memberTransactionData.debit = debit;
        //   memberTransactionData.remainingCap = Number((new Decimal(rolloverPaymentEntry.entryDTO.transferCap.transferBalanceACP)
        //     .plus(rolloverPaymentEntry.entryDTO.taxWithheld)).toDecimalPlaces(2, 4));
        // }
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function getTransferCapForPensionCommutationInterTrans(memberTransactionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.out.selectedTestAccountId].memberCode);
    let entireTakenOut = false;
    if (memberTransactionInputs.amount === memberAccountData.balance) entireTakenOut = true;
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/transferCap?${getAPIParams()}`,
            {
                id: memberAccountData.id,
                accType: memberAccountData.accType,
                selectedAmount: memberTransactionInputs.amount,
                event: memberTransactionInputs.event,
                selectedDate: `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`,
                memberId: memberAccountData.memberId,
                fundId: context.TestConfig.entityId,
                pensionAccountType: memberAccountData.pensionAccountType,
                entireTakenOut: entireTakenOut
            });
        expect(response.status).to.eql(200, "Can not get pension transfer cap for commutation");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getMemberBalanceByMemberAccId(memberAccountId, date = null) {
    try {
        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/getTransferMemberBalance?${getAPIParams()}`;
        const payload = {
            accounts: [{ id: memberAccountId }],
            transferDate: date
        };
        const headers = { 'Content-Type': 'application/json' };
        const response = await axios.post(url, payload, { headers });
        expect(response.status).to.eql(200, "Can not get members balance by member account id");
        return response.data[0];
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function generateMemberCodeA(contactId, firstName, surname) {
    try {
        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/generatecode/A?${getAPIParams()}`;
        const payload = {
            id: contactId,
            firstName: firstName,
            surname: surname
        };
        const headers = { 'Content-Type': 'application/json' };
        const response = await axios.post(url, payload, { headers });
        expect(response.status).to.eql(200, "Can not generate member Code (Accumulation)");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addCommutation(memberTransactionInputs) {
    const memberAccountDataOut = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.out.selectedTestAccountId].memberCode);
    const memberBlanceDataOut = await getMemberBalanceByMemberAccId(memberAccountDataOut.id,
        `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`);
    const bankAccountData = await transUtil.getBankChartAccount(null);

    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];

    if (memberAccountDataOut.accType === 'Accumulation')
        throw new Error('Can not commute from accumulation account');
    if (memberBlanceDataOut.balance === 0)
        throw new Error(`Can not commute, the balance of ${memberAccountDataOut.code} is 0 at ${memberTransactionInputs.transactionDate}`);
    if (memberTransactionInputs.amount > memberBlanceDataOut.balance)
        throw new Error('The commutation amount is greater than the pension balance');

    let entireBalanceTakenOutFlag = false;
    if (memberTransactionInputs.amount === memberBlanceDataOut.balance) entireBalanceTakenOutFlag = true;

    let transferCapData = null;
    if (memberAccountDataOut.pensionAccountType !== 'TransitionToRetirement' &&
        compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`), new Date('2017-06-30')) === 1) {
        if (memberTransactionInputs.event === undefined || memberTransactionInputs.event === null) {
            if (entireBalanceTakenOutFlag === true) memberTransactionInputs.event = 'STO';
            else memberTransactionInputs.event = 'MCO';
        }
        if (memberTransactionInputs.commutationPaidDirectly === undefined || memberTransactionInputs.commutationPaidDirectly === null)
            memberTransactionInputs.commutationPaidDirectly = false;
        transferCapData = await getTransferCapForPensionCommutationInterTrans(memberTransactionInputs);
        // console.log("transferCapDataCommutation---->", JSON.stringify(transferCapData));
        transferCapData.date = `${transferCapData.date.slice(0, 10)}${context.Constants.DATE_SUFFIX}`;
        transferCapData.commutationPaidDirectly = memberTransactionInputs.commutationPaidDirectly;
        if (memberTransactionInputs.expectedTbarCapLimit !== undefined && memberTransactionInputs.expectedTbarCapLimit !== null)
            assert.equal(memberTransactionInputs.expectedTbarCapLimit, transferCapData.capLimit,
                'The Tbar Cap Limit is not correct! (commutation)');

        if (memberTransactionInputs.expectedCurrentAccountBalance !== undefined && memberTransactionInputs.expectedCurrentAccountBalance !== null)
            assert.equal(memberTransactionInputs.expectedCurrentAccountBalance, transferCapData.currentBalance,
                'The Current Account Balance is not correct! (commutation)');

        if (memberTransactionInputs.expectedCapRemainingPrior !== undefined && memberTransactionInputs.expectedCapRemainingPrior !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingPrior, transferCapData.remaining,
                'The Cap Remaining Prior is not correct! (commutation)');

        if (memberTransactionInputs.expectedCapRemainingAfter !== undefined && memberTransactionInputs.expectedCapRemainingAfter !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingAfter, transferCapData.transferBalanceACP,
                'The Cap Remaining After is not correct! (commutation)');
    }

    const balanceOut = new Decimal(memberBlanceDataOut.balance).minus(memberTransactionInputs.amount).toDecimalPlaces(2, 4);
    const taxFree = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.taxFree)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const taxed = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.taxed)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const untaxed = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.untaxed)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const preserved = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.preserved)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const restricted = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.restricted)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const unrestricted = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.unrestricted)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);

    let requestBody = {
        transfers: [
            {
                out: {
                    id: memberAccountDataOut.id,
                    code: context.ShareData.memberAccounts[memberTransactionInputs.out.selectedTestAccountId].memberCode,
                    amount: memberTransactionInputs.amount,
                    balance: balanceOut,
                    taxFree: taxFree,
                    taxed: taxed,
                    untaxed: untaxed,
                    preserved: preserved,
                    restricted: restricted,
                    unrestricted: unrestricted,
                    accDes: null,
                    startDate: null,
                    endDate: null,
                    serviceDate: null,
                    proportion: null,
                    toPrepare: false,
                    reversionary: false,
                    originalTerm: null,
                    selectedAmount: null,
                    needRefreshTransferCap: false,
                    selectedDate: null,
                    entireTakenOut: false,
                    dob: null,
                    conversionDate: null,
                    conversionDateFromTRISRetire: null,
                    changeContact: false,
                    nominationEndDate: null,
                    capAt1thJuly: false,
                    reversionDate: null,
                    original: false,
                    atFirstYear: false,
                    reversionProportion: null,
                    peopleId: null,
                    originalId: null,
                    accmulationTotal: null,
                    retirementPhaseTotal: null,
                    noJournalCreate: false,
                    reversionAccountId: null,
                    checkJournalFromDate: null,
                    memberId: null,
                    fundId: null,
                    accountId: null,
                    beneficiaries: null,
                    financials: null,
                    cease: false,
                    maintain: false
                },
                entireBalanceTakenOut: entireBalanceTakenOutFlag,
                transferCap: transferCapData
            }
        ],
        commute: true,
        toPrepare: false,
        accountId: null,
        fundId: null,
        date: `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`,
        bankAccountId: null,
        toComply: false
    };

    if (memberTransactionInputs.in.BalanceGo === 'ExistingAccumulationAccount') {
        const memberAccountDataIn = await getMemberAccountDataFromMemberList(
            context.ShareData.memberAccounts[memberTransactionInputs.in.selectedTestAccountId].memberCode);
        if (memberAccountDataIn.contact.id !== memberAccountDataOut.contact.id)
            throw new Error("Can not commute to different member");
        const accountStartYearIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[0];
        const accountStartMonthIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[1];
        const accountStartDayIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[2];
        if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
            new Date(`${accountStartYearIn}-${accountStartMonthIn}-${accountStartDayIn}`)) < 0)
            throw new Error('Can not commute prior to the start date of the accumulation account');

        const balanceIn = new Decimal(memberAccountDataIn.balance).plus(memberTransactionInputs.amount).toDecimalPlaces(2, 4);
        requestBody.transfers[0].in = {
            id: memberAccountDataIn.id,
            code: context.ShareData.memberAccounts[memberTransactionInputs.in.selectedTestAccountId].memberCode,
            accDes: null,
            startDate: null,
            endDate: null,
            serviceDate: null,
            amount: memberTransactionInputs.amount,
            balance: balanceIn,
            taxFree: taxFree,
            taxed: taxed,
            untaxed: untaxed,
            preserved: preserved,
            restricted: restricted,
            unrestricted: unrestricted,
            proportion: null,
            toPrepare: false,
            reversionary: false,
            originalTerm: null,
            selectedAmount: null,
            needRefreshTransferCap: false,
            selectedDate: null,
            entireTakenOut: false,
            dob: null,
            conversionDate: null,
            conversionDateFromTRISRetire: null,
            changeContact: false,
            nominationEndDate: null,
            capAt1thJuly: false,
            reversionDate: null,
            original: false,
            atFirstYear: false,
            reversionProportion: null,
            peopleId: null,
            originalId: null,
            accmulationTotal: null,
            retirementPhaseTotal: null,
            noJournalCreate: false,
            reversionAccountId: null,
            checkJournalFromDate: null,
            memberId: null,
            fundId: null,
            accountId: null,
            beneficiaries: null,
            financials: null,
            cease: false,
            maintain: false
        };
    }
    else if (memberTransactionInputs.in.BalanceGo === 'CashOut') {
        requestBody.bankAccountId = bankAccountData.id;
    }
    else if (memberTransactionInputs.in.BalanceGo === 'NewAccumulationAccount') {
        if (context.ShareData.contacts[memberTransactionInputs.in.selectedTestContactId].peopleId !==
            memberAccountDataOut.contact.id)
            throw new Error("Can not commute to different member");
        const memberCode = await generateMemberCodeA(context.ShareData.contacts[memberTransactionInputs.in.selectedTestContactId].peopleId,
            context.ShareData.contacts[memberTransactionInputs.in.selectedTestContactId].firstName,
            context.ShareData.contacts[memberTransactionInputs.in.selectedTestContactId].surname);
        requestBody.transfers[0].in = {
            id: null,
            code: memberCode,
            accDes: null,
            startDate: null,
            endDate: null,
            serviceDate: null,
            amount: memberTransactionInputs.amount,
            balance: 0,
            taxFree: taxFree,
            taxed: taxed,
            untaxed: untaxed,
            preserved: preserved,
            restricted: restricted,
            unrestricted: unrestricted,
            proportion: null,
            toPrepare: false,
            reversionary: false,
            originalTerm: null,
            selectedAmount: null,
            needRefreshTransferCap: false,
            selectedDate: null,
            entireTakenOut: false,
            dob: null,
            conversionDate: null,
            conversionDateFromTRISRetire: null,
            changeContact: false,
            nominationEndDate: null,
            capAt1thJuly: false,
            reversionDate: null,
            original: false,
            atFirstYear: false,
            reversionProportion: null,
            peopleId: null,
            originalId: null,
            accmulationTotal: null,
            retirementPhaseTotal: null,
            noJournalCreate: false,
            reversionAccountId: null,
            checkJournalFromDate: null,
            memberId: null,
            fundId: null,
            accountId: null,
            contact: {
                id: context.ShareData.contacts[memberTransactionInputs.in.selectedTestContactId].peopleId
            },
            beneficiaries: null,
            financials: null,
            cease: false,
            maintain: false
        };
    }
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/saveTransfer?${getAPIParams()}`, requestBody);
        expect(response.status).to.eql(200, "Can not add commutation");
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        let memberTransactionData = {};
        if (memberTransactionInputs.in.BalanceGo === 'ExistingAccumulationAccount'
            || memberTransactionInputs.in.BalanceGo === 'NewAccumulationAccount') {
            memberTransactionData =
            {
                date: memberTransactionInputs.transactionDate,
                entryDTOs: [
                    {
                        debit: requestBody.transfers[0].out.amount,
                        credit: 0,
                        chartCode: `57100/${requestBody.transfers[0].out.code}`,

                    },
                    {
                        debit: 0,
                        credit: requestBody.transfers[0].in.amount,
                        chartCode: `56100/${requestBody.transfers[0].in.code}`,

                    }
                ]
            };

        } else if (memberTransactionInputs.in.BalanceGo === 'CashOut') {
            memberTransactionData =
            {
                date: memberTransactionInputs.transactionDate,
                entryDTOs: [
                    {
                        debit: 0,
                        credit: requestBody.transfers[0].out.amount,
                        chartCode: bankAccountData.pcode,

                    },
                    {
                        debit: requestBody.transfers[0].out.amount,
                        credit: 0,
                        chartCode: `46000/${requestBody.transfers[0].out.code}`,

                    }
                ]
            }
        }
        // if (requestBody.transfers[0].transferCap !== null) {
        //   memberTransactionData.memberCode = requestBody.transfers[0].out.code;
        //   memberTransactionData.event = requestBody.transfers[0].transferCap.event;
        //   memberTransactionData.credit = null;
        //   memberTransactionData.debit = requestBody.transfers[0].out.amount;
        //   memberTransactionData.remainingCap = requestBody.transfers[0].transferCap.transferBalanceACP;
        // }
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function addInternalTransfer(memberTransactionInputs) {
    const memberAccountDataOut = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.out.selectedTestAccountId].memberCode);
    const memberBlanceDataOut = await getMemberBalanceByMemberAccId(memberAccountDataOut.id,
        `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`);
    const memberAccountDataIn = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[memberTransactionInputs.in.selectedTestAccountId].memberCode);

    if (memberBlanceDataOut.balance === 0)
        throw new Error(`Can not transfer, the balance of ${memberAccountDataOut.code} is 0 at ${memberTransactionInputs.transactionDate}`)
    if (memberTransactionInputs.amount > memberBlanceDataOut.balance)
        throw new Error('The internal transfer amount is greater than the account balance');

    if (memberAccountDataIn.contact.id === memberAccountDataOut.contact.id)
        throw new Error("Can not transfer to the same member");
    if (memberAccountDataIn.accType === 'Pension')
        throw new Error("Can not transfer to the pension account");
    const accountStartYearIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[0];
    const accountStartMonthIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[1];
    const accountStartDayIn = memberAccountDataIn.startDate.slice(0, 10).split('-')[2];
    const transactionYear = memberTransactionInputs.transactionDate.split('-')[0];
    const transactionMonth = memberTransactionInputs.transactionDate.split('-')[1];
    const transactionDay = memberTransactionInputs.transactionDate.split('-')[2];
    if (compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`),
        new Date(`${accountStartYearIn}-${accountStartMonthIn}-${accountStartDayIn}`)) < 0)
        throw new Error('Can not transfer prior to the start date of transfer in account');

    let entireBalanceTakenOutFlag = false;
    if (memberTransactionInputs.amount === memberBlanceDataOut.balance) entireBalanceTakenOutFlag = true;

    const balanceIn = new Decimal(memberAccountDataIn.balance).plus(memberTransactionInputs.amount).toDecimalPlaces(2, 4);
    const balanceOut = new Decimal(memberBlanceDataOut.balance).minus(memberTransactionInputs.amount).toDecimalPlaces(2, 4);
    const taxFree = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.taxFree)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const taxed = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.taxed)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const untaxed = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.untaxed)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const preserved = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.preserved)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const restricted = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.restricted)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);
    const unrestricted = (new Decimal(memberTransactionInputs.amount)
        .times(memberBlanceDataOut.unrestricted)
        .dividedBy(memberBlanceDataOut.balance)).toDecimalPlaces(2, 4);

    let requestBody = {
        transfers: [
            {
                out: {
                    id: memberAccountDataOut.id,
                    code: context.ShareData.memberAccounts[memberTransactionInputs.out.selectedTestAccountId].memberCode,
                    amount: memberTransactionInputs.amount,
                    balance: balanceOut,
                    taxFree: taxFree,
                    taxed: taxed,
                    untaxed: untaxed,
                    preserved: preserved,
                    restricted: restricted,
                    unrestricted: unrestricted,
                    accDes: null,
                    startDate: null,
                    endDate: null,
                    serviceDate: null,
                    proportion: null,
                    toPrepare: false,
                    reversionary: false,
                    originalTerm: null,
                    selectedAmount: null,
                    needRefreshTransferCap: false,
                    selectedDate: null,
                    entireTakenOut: false,
                    dob: null,
                    conversionDate: null,
                    conversionDateFromTRISRetire: null,
                    changeContact: false,
                    nominationEndDate: null,
                    capAt1thJuly: false,
                    reversionDate: null,
                    original: false,
                    atFirstYear: false,
                    reversionProportion: null,
                    peopleId: null,
                    originalId: null,
                    accmulationTotal: null,
                    retirementPhaseTotal: null,
                    noJournalCreate: false,
                    reversionAccountId: null,
                    checkJournalFromDate: null,
                    memberId: null,
                    fundId: null,
                    accountId: null,
                    beneficiaries: null,
                    financials: null,
                    cease: false,
                    maintain: false
                },
                in: {
                    id: memberAccountDataIn.id,
                    code: context.ShareData.memberAccounts[memberTransactionInputs.in.selectedTestAccountId].memberCode,
                    accDes: null,
                    startDate: null,
                    endDate: null,
                    serviceDate: null,
                    amount: memberTransactionInputs.amount,
                    balance: balanceIn,
                    taxFree: taxFree,
                    taxed: taxed,
                    untaxed: untaxed,
                    preserved: preserved,
                    restricted: restricted,
                    unrestricted: unrestricted,
                    proportion: null,
                    toPrepare: false,
                    reversionary: false,
                    originalTerm: null,
                    selectedAmount: null,
                    needRefreshTransferCap: false,
                    selectedDate: null,
                    entireTakenOut: false,
                    dob: null,
                    conversionDate: null,
                    conversionDateFromTRISRetire: null,
                    changeContact: false,
                    nominationEndDate: null,
                    capAt1thJuly: false,
                    reversionDate: null,
                    original: false,
                    atFirstYear: false,
                    reversionProportion: null,
                    peopleId: null,
                    originalId: null,
                    accmulationTotal: null,
                    retirementPhaseTotal: null,
                    noJournalCreate: false,
                    reversionAccountId: null,
                    checkJournalFromDate: null,
                    memberId: null,
                    fundId: null,
                    accountId: null,
                    beneficiaries: null,
                    financials: null,
                    cease: false,
                    maintain: false
                },
                entireBalanceTakenOut: entireBalanceTakenOutFlag,
                transferCap: null
            }
        ],
        commute: false,
        toPrepare: false,
        accountId: null,
        fundId: null,
        date: `${memberTransactionInputs.transactionDate}${context.Constants.DATE_SUFFIX}`,
        bankAccountId: null,
        toComply: false
    };
    if (memberAccountDataOut.accType === 'Pension' &&
        memberAccountDataOut.pensionAccountType !== 'TransitionToRetirement' &&
        compareAsc(new Date(`${transactionYear}-${transactionMonth}-${transactionDay}`), new Date('2017-06-30')) === 1) {
        if (memberTransactionInputs.event === undefined || memberTransactionInputs.event === null) {
            if (entireBalanceTakenOutFlag === true) memberTransactionInputs.event = 'STO';
            else memberTransactionInputs.event = 'MCO';
        }
        if (memberTransactionInputs.commutationPaidDirectly === undefined || memberTransactionInputs.commutationPaidDirectly === null)
            memberTransactionInputs.commutationPaidDirectly = false;

        const transferCapData = await getTransferCapForPensionCommutationInterTrans(memberTransactionInputs);
        // console.log("transferCapDataInternalTrans---->", JSON.stringify(transferCapData));
        transferCapData.date = `${transferCapData.date.slice(0, 10)}${context.Constants.DATE_SUFFIX}`;
        transferCapData.commutationPaidDirectly = memberTransactionInputs.commutationPaidDirectly;

        requestBody.transfers[0].transferCap = transferCapData;

        if (memberTransactionInputs.expectedTbarCapLimit !== undefined && memberTransactionInputs.expectedTbarCapLimit !== null)
            assert.equal(memberTransactionInputs.expectedTbarCapLimit, transferCapData.capLimit,
                'The Tbar Cap Limit is not correct! (Internal Transfer)');

        if (memberTransactionInputs.expectedCurrentAccountBalance !== undefined && memberTransactionInputs.expectedCurrentAccountBalance !== null)
            assert.equal(memberTransactionInputs.expectedCurrentAccountBalance, transferCapData.currentBalance,
                'The Current Account Balance is not correct! (Internal Transfer)');

        if (memberTransactionInputs.expectedCapRemainingPrior !== undefined && memberTransactionInputs.expectedCapRemainingPrior !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingPrior, transferCapData.remaining,
                'The Cap Remaining Prior is not correct! (Internal Transfer)');

        if (memberTransactionInputs.expectedCapRemainingAfter !== undefined && memberTransactionInputs.expectedCapRemainingAfter !== null)
            assert.equal(memberTransactionInputs.expectedCapRemainingAfter, transferCapData.transferBalanceACP,
                'The Cap Remaining After is not correct! (Internal Transfer)');
    }
    console.log('requestBody---->', JSON.stringify(requestBody))
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/saveTransfer?${getAPIParams()}`, requestBody);
        expect(response.status).to.eql(200, "Can not add internal transaction");
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }

    if (memberTransactionInputs.internalTransactionId !== undefined && memberTransactionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: memberTransactionInputs.transactionDate,
            entryDTOs: [
                {
                    debit: requestBody.transfers[0].out.amount,
                    credit: 0,
                    chartCode: `57100/${requestBody.transfers[0].out.code}`,

                },
                {
                    debit: 0,
                    credit: requestBody.transfers[0].in.amount,
                    chartCode: `56100/${requestBody.transfers[0].in.code}`,

                }
            ]
        };
        // if (requestBody.transfers[0].transferCap !== null) {
        //   memberTransactionData.memberCode = requestBody.transfers[0].out.code;
        //   memberTransactionData.event = requestBody.transfers[0].transferCap.event;
        //   memberTransactionData.credit = null;
        //   memberTransactionData.debit = requestBody.transfers[0].out.amount;
        //   memberTransactionData.remainingCap = requestBody.transfers[0].transferCap.transferBalanceACP;
        // }
        context.ShareData.memberTransactions[memberTransactionInputs.internalTransactionId] = memberTransactionData;
    }
}

async function addMemberTransaction(memberTransactionInputs) {
    if (memberTransactionInputs.transactionType === 'Contribution')
        await addContribution(memberTransactionInputs);
    else if (memberTransactionInputs.transactionType === 'MemberRollin')
        await addMemberRollin(memberTransactionInputs);
    else if (memberTransactionInputs.transactionType === 'PensionPayment')
        await addPensionPayment(memberTransactionInputs);
    else if (memberTransactionInputs.transactionType === 'RolloverPayment')
        await addRolloverPayment(memberTransactionInputs);
    else if (memberTransactionInputs.transactionType === 'Commutation')
        await addCommutation(memberTransactionInputs);
    else if (memberTransactionInputs.transactionType === 'InternalTransfer')
        await addInternalTransfer(memberTransactionInputs);
    await testUtil.sleep(3000);
}

async function verifyTransactionsForMember(testInputs) {
    const transactionListExpectedResult = [];
    const transferBalanceAccountExpectedResult = [];

    for (let trans of testInputs.transactionsTobeVerified) {
        const transData = context.ShareData.memberTransactions[trans];
        const dateObject = parse(transData.date, 'yyyy-MM-dd', new Date());
        const date = format(dateObject, 'dd/MM/yyyy');
        transactionListExpectedResult.push({ date: date, entryDTOs: transData.entryDTOs });
    }
    console.log(`\nMember Transactions Expected Result:\n${JSON.stringify(transactionListExpectedResult)}\n`);
    const reportTestUtil = require('../lib/report-test-util.js');
    await reportTestUtil.checkReportToContainsSubset({
        reportName: 'Transaction List',
        startDate: testInputs.startDate,
        endDate: testInputs.endDate,
        expectedResult: transactionListExpectedResult
    });
}

async function verifyTransferBalanceAccount(testInputs) {
    await testUtil.sleep(3000);
    for (account of testInputs.expectedResult) {
        if (account.hasOwnProperty('external')) {
            delete account.external;
        } else {
            if (account.memberCode !== undefined && account.memberCode !== null && account.memberCode !== '')
                account.memberCode = context.ShareData.memberAccounts[account.memberCode].memberCode;
            else account.memberCode = null;
        }
        account.entryDate = account.entryDate + 'T00:00:00.000+0000';
    }
    console.log(`\nTransfer Balance Accounts Expected Result:\n${JSON.stringify(testInputs.expectedResult)}\n`);
    const reportTestUtil = require('../lib/report-test-util.js');
    await reportTestUtil.checkReportToContainsSubset({
        reportName: 'Transfer Balance Account Summary',
        startDate: testInputs.startDate,
        endDate: testInputs.endDate,
        expectedResult: testInputs.expectedResult
    });
}

async function verifyPensions(testInputs) {
    await testUtil.sleep(3000);
    let actualResult = {};
    try {
        response = await axios.get(
            `${context.TestConfig.serverURL}/api/fund/${context.TestConfig.entityId}/pensionSummary/${testInputs.financialYear}`,
            { headers: { 'Authorization': context.TestConfig.sfAuthToken } });
        expect(response.status).to.eql(200, "Can not get pension summary");
        actualResult = response.data;
        // console.log("verifyPensions ----->", JSON.stringify(actualResult), '<------')
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
    for (let i = 0; i < testInputs.expectedResult.pensions.length; i += 1) {
        for (let j = 0; j < testInputs.expectedResult.pensions[i].accounts.length; j += 1) {
            testInputs.expectedResult.pensions[i].accounts[j].memberCode =
                context.ShareData.memberAccounts[testInputs.expectedResult.pensions[i].accounts[j].memberCode].memberCode;
        }
    }

    console.log(`\nPensions Expected Result(${testInputs.financialYear}):\n${JSON.stringify(testInputs.expectedResult)}\n`);
    expect(actualResult).to.containSubset(testInputs.expectedResult);
}

async function addExternalTSB(externalTSBInputs) {
    try {
        const finYearLast = (await entityUtil.getEntityDetail()).financialYearFrom.slice(0, 4);
        const finYearCurr = (await entityUtil.getEntityDetail()).financialYearEnd.slice(0, 4);

        await axios.post(`${context.TestConfig.serverURL}/d/Startup/fund/${context.TestConfig.entityId}?${getAPIParams()}`);
        await axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/list?${getAPIParams()}`);

        const response0 = await axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/sendDueDateTask?${getAPIParams()}`);
        await axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/GenericStatusController/query/${response0.data}?${getAPIParams()}`);
        await axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/checkOpenningBalanceHistory/${finYearCurr}?${getAPIParams()}`);
        await testUtil.sleep(5000);

        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/updateExternalTSB?${getAPIParams()}&p=SFUND`;

        const payload = {
            fundId: context.TestConfig.entityId,
            contactId: context.ShareData.contacts[externalTSBInputs.selectedTestContactId].peopleId,
            eTsbLast: `${externalTSBInputs.externalTSBLastFY}`,
            finYearLast: parseInt(finYearLast),
            eTsbCurr: `${externalTSBInputs.externalTSBCurrentFY}`,
            finYearCurr: parseInt(finYearCurr)
        };
        const response = await axios.post(url, payload);
        expect(response.status).to.eql(200, "Can not add external TSB");
        await testUtil.sleep(3000);
        await axios.post(url, payload);
        await testUtil.sleep(2000);
        await axios.post(url, payload);
        // console.log('url--->', url);
        // console.log('payload--->', JSON.stringify(payload));
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function getTransferCapForPensionReversion(requestBody) {
    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/transferCap?${getAPIParams()}`, requestBody);
        expect(response.status).to.eql(200, "Can not get transfer cap for pension reversion");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function createPensionReversionRequestBody(reversionInputs) {
    const memberAccountData = await getMemberAccountDataFromMemberList(
        context.ShareData.memberAccounts[reversionInputs.originalPensionAccountId].memberCode);
    const memberAccountDataMoreInfo = await getMemberAccountDataByMemberAccountId(memberAccountData.id);

    if (memberAccountDataMoreInfo.beneficiaries === null)
        throw new Error('No beneficiary!');

    const startDate = memberAccountDataMoreInfo.startDate.slice(0, 10) + context.Constants.DATE_SUFFIX;
    const serviceDate = memberAccountDataMoreInfo.serviceDate.slice(0, 10) + context.Constants.DATE_SUFFIX;

    const selectedDate = reversionInputs.reversionDate + 'T11:00:00.000+1100';
    const dob = memberAccountDataMoreInfo.dob.slice(0, 10) + context.Constants.DATE_SUFFIX;

    const transferCapRequestBody = {
        id: memberAccountData.id,
        accType: memberAccountData.accType,
        selectedAmount: memberAccountData.balance,
        event: 'NA',
        startDate: startDate,
        selectedDate: selectedDate,
        dob: dob,
        fundId: context.TestConfig.entityId,
        pensionAccountType: memberAccountData.pensionAccountType,
        entireTakenOut: true
    }
    const transferCap = await getTransferCapForPensionReversion(transferCapRequestBody);
    transferCap.date = transferCap.date.slice(0, 10) + 'T11:00:00.000+1100';

    if (reversionInputs.expectedOriginalTbarCapLimit !== undefined && reversionInputs.expectedOriginalTbarCapLimit !== null)
        assert.equal(reversionInputs.expectedOriginalTbarCapLimit, transferCap.capLimit,
            `The Tbar Cap Limit of ${reversionInputs.originalPensionAccountId} is not correct! (reversion-original)`);

    const fundDTO = memberAccountDataMoreInfo.fundDTO;
    fundDTO.financialYearFrom = fundDTO.financialYearFrom.slice(0, 10) + context.Constants.DATE_SUFFIX;
    fundDTO.financialYearEnd = fundDTO.financialYearEnd.slice(0, 10) + context.Constants.DATE_SUFFIX;

    const contact = memberAccountDataMoreInfo.contact;
    const dodObject = parse(reversionInputs.dateOfDeath, 'yyyy-MM-dd', new Date());
    const dod = format(dodObject, 'dd/MM/yyyy');
    contact.dod = dod;

    const beneficiaries = memberAccountDataMoreInfo.beneficiaries;
    for (beneficiary of beneficiaries) {
        beneficiary.relationship = null;
        beneficiary.lastUpdated = null;

        let beneficiaryDobObject = parse(beneficiary.beneficiary.dob, 'dd/MM/yyyy', new Date());
        let beneficiaryDob = format(beneficiaryDobObject, 'yyyy-MM-dd') + 'T00:00:00.000+1000';
        let selectedAmount = (new Decimal(memberAccountDataMoreInfo.balance)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryTransferCapRequestBody = {
            id: null,
            accType: 'Pension',
            selectedAmount: selectedAmount,
            event: 'IRS',
            startDate: startDate, //
            selectedDate: selectedDate,
            dob: beneficiaryDob,
            sex: beneficiary.beneficiary.sex,
            peopleId: beneficiary.beneficiary.id,
            fundId: context.TestConfig.entityId,
            pensionAccountType: memberAccountData.pensionAccountType, //
            entireTakenOut: true
        }
        const beneficiaryTransferCap = await getTransferCapForPensionReversion(beneficiaryTransferCapRequestBody);
        beneficiaryTransferCap.date = beneficiaryTransferCap.date.slice(0, 10) + 'T11:00:00.000+1100';
        beneficiary.cap = beneficiaryTransferCap;

        let beneficiaryPreserved = (new Decimal(memberAccountDataMoreInfo.preserved)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryRestricted = (new Decimal(memberAccountDataMoreInfo.restricted)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryUnrestricted = (new Decimal(memberAccountDataMoreInfo.unrestricted)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryTaxFree = (new Decimal(memberAccountDataMoreInfo.taxFree)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryTaxed = (new Decimal(memberAccountDataMoreInfo.taxed)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        let beneficiaryUntaxed = (new Decimal(memberAccountDataMoreInfo.untaxed)
            .times(beneficiary.proportion).dividedBy(100)).toDecimalPlaces(2, 4);
        const beneficiaryComponents = {
            preserved: -beneficiaryPreserved,
            restricted: -beneficiaryRestricted,
            unrestricted: -beneficiaryUnrestricted,
            taxFree: -beneficiaryTaxFree,
            taxed: -beneficiaryTaxed,
            untaxed: -beneficiaryUntaxed
        }
        beneficiary.components = beneficiaryComponents;
    }

    const pensionReversionRequestBody = {
        id: memberAccountDataMoreInfo.id,
        code: memberAccountDataMoreInfo.code,
        accDes: memberAccountDataMoreInfo.accDes,
        accType: memberAccountDataMoreInfo.accType,
        startDate: startDate,
        endDate: memberAccountDataMoreInfo.endDate,
        serviceDate: serviceDate,
        taxFree: memberAccountDataMoreInfo.taxFree,
        balance: memberAccountDataMoreInfo.balance,
        proportion: memberAccountDataMoreInfo.proportion,
        toPrepare: memberAccountDataMoreInfo.toPrepare,
        reversionary: memberAccountDataMoreInfo.reversionary,
        originalTerm: memberAccountDataMoreInfo.originalTerm,
        selectedAmount: memberAccountDataMoreInfo.balance,
        needRefreshTransferCap: memberAccountDataMoreInfo.needRefreshTransferCap,
        transferCap: transferCap,
        selectedDate: selectedDate,
        entireTakenOut: false,
        dob: dob,
        conversionDate: memberAccountDataMoreInfo.conversionDate,
        conversionDateFromTRISRetire: memberAccountDataMoreInfo.conversionDateFromTRISRetire,
        commencementConditionOfRelease: memberAccountDataMoreInfo.commencementConditionOfRelease,
        fundDTO: fundDTO,
        changeContact: memberAccountDataMoreInfo.changeContact,
        nominationEndDate: memberAccountDataMoreInfo.nominationEndDate,
        capAt1thJuly: memberAccountDataMoreInfo.capAt1thJuly,
        reversionDate: selectedDate,
        original: memberAccountDataMoreInfo.original,
        atFirstYear: memberAccountDataMoreInfo.atFirstYear,
        reversionProportion: memberAccountDataMoreInfo.reversionProportion,
        peopleId: memberAccountDataMoreInfo.peopleId,
        originalId: memberAccountDataMoreInfo.originalId,
        allowedFunds: memberAccountDataMoreInfo.allowedFunds,
        allowedTrusts: memberAccountDataMoreInfo.allowedTrusts,
        allowedCompanies: memberAccountDataMoreInfo.allowedCompanies,
        accmulationTotal: memberAccountDataMoreInfo.accmulationTotal,
        retirementPhaseTotal: memberAccountDataMoreInfo.retirementPhaseTotal,
        noJournalCreate: memberAccountDataMoreInfo.noJournalCreate,
        reversionAccountId: memberAccountDataMoreInfo.reversionAccountId,
        checkJournalFromDate: selectedDate,
        memberId: memberAccountDataMoreInfo.memberId,
        fundId: memberAccountDataMoreInfo.fundId,
        accountId: memberAccountDataMoreInfo.accountId,
        contact: contact,
        beneficiaries: beneficiaries,
        financials: memberAccountDataMoreInfo.financials,
        cease: false,
        amount: memberAccountDataMoreInfo.amount,
        pensionAccountType: memberAccountDataMoreInfo.pensionAccountType,
        maintain: false,
        preserved: memberAccountDataMoreInfo.preserved,
        restricted: memberAccountDataMoreInfo.restricted,
        unrestricted: memberAccountDataMoreInfo.unrestricted,
        taxed: memberAccountDataMoreInfo.taxed,
        untaxed: memberAccountDataMoreInfo.untaxed
    }
    return pensionReversionRequestBody;
}

async function revertToReversionaryBeneficiary(reversionInputs) {
    const dateOfDeathYear = reversionInputs.dateOfDeath.split('-')[0];
    const dateOfDeathMonth = reversionInputs.dateOfDeath.split('-')[1];
    const dateOfDeathDay = reversionInputs.dateOfDeath.split('-')[2];
    const reversionDateYear = reversionInputs.reversionDate.split('-')[0];
    const reversionDateMonth = reversionInputs.reversionDate.split('-')[1];
    const reversionDateDay = reversionInputs.reversionDate.split('-')[2];
    if (compareAsc(new Date(`${dateOfDeathYear}-${dateOfDeathMonth}-${dateOfDeathDay}`),
        new Date(`${reversionDateYear}-${reversionDateMonth}-${reversionDateDay}`)) > 0)
        throw new Error('The reversion date must be the same or after the date of death');

    const requestBody = await createPensionReversionRequestBody(reversionInputs);

    const allBeneficariesAllPensionMemeberCodesBeforeReversion = {};
    const allMembersBeforeReversion = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    for (beneficiaryPensionAccount of reversionInputs.newBeneficiaryPensionAccounts) {
        for (beneficary of requestBody.beneficiaries) {
            if (context.ShareData.contacts[beneficiaryPensionAccount.beneficiary].peopleId == beneficary.peopleId) {
                // context.ShareData.memberAccounts[beneficiaryPensionAccount.internalTestAccountId] = { memberCode: beneficary.memberCode };
                allBeneficariesAllPensionMemeberCodesBeforeReversion[context.ShareData.contacts[beneficiaryPensionAccount.beneficiary].peopleId] =
                {
                    internalTestAccountId: beneficiaryPensionAccount.internalTestAccountId,
                    pensionMemberCodes: []
                };
                for (let member of allMembersBeforeReversion) {
                    if (context.ShareData.contacts[beneficiaryPensionAccount.beneficiary].peopleId == member.contactId) {
                        for (let account of member.accounts) {
                            if (account.accType == "Pension")
                                allBeneficariesAllPensionMemeberCodesBeforeReversion[context.ShareData.contacts[beneficiaryPensionAccount.beneficiary].peopleId].pensionMemberCodes.push(account.code);
                        }
                    }
                }
                if (beneficiaryPensionAccount.expectedBeneficiaryTbarCapLimit !== undefined &&
                    beneficiaryPensionAccount.expectedBeneficiaryTbarCapLimit !== null) {
                    assert.equal(beneficiaryPensionAccount.expectedBeneficiaryTbarCapLimit, beneficary.cap.capLimit,
                        `The Tbar Cap Limit of ${beneficiaryPensionAccount.beneficiary} is not correct! (reversion-beneficiary)`)
                }
            }
        }
    }

    // console.log('allBeneficariesAllPensionMemeberCodesBeforeReversion ---> ', JSON.stringify(allBeneficariesAllPensionMemeberCodesBeforeReversion));

    try {
        const response = await axios.post(
            `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/savePensionReversion?${getAPIParams()}`, requestBody);
        expect(response.status).to.eql(200, "Can not revert to reversionary beneficiary");
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }

    // THREESIXSF-36837 start "The member code is only generated on save not before save."
    await testUtil.sleep(5000);
    const allBeneficariesNewPensionMemeberCodeAfterReversion = {};
    const allMembersAfterReversion = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    for (const property in allBeneficariesAllPensionMemeberCodesBeforeReversion) {
        for (let member of allMembersAfterReversion) {
            if (member.contactId == property) {
                if (allBeneficariesAllPensionMemeberCodesBeforeReversion[property].pensionMemberCodes.length == 0) {
                    for (let account of member.accounts) {
                        if (account.accType == "Pension") {
                            context.ShareData.memberAccounts[allBeneficariesAllPensionMemeberCodesBeforeReversion[property].internalTestAccountId] = { memberCode: account.code };
                            allBeneficariesNewPensionMemeberCodeAfterReversion[property] = account.code;
                        }
                    }
                } else {
                    for (let account of member.accounts) {
                        if (account.accType == "Pension" && !allBeneficariesAllPensionMemeberCodesBeforeReversion[property].pensionMemberCodes.includes(account.code)) {
                            context.ShareData.memberAccounts[allBeneficariesAllPensionMemeberCodesBeforeReversion[property].internalTestAccountId] = { memberCode: account.code };
                            allBeneficariesNewPensionMemeberCodeAfterReversion[property] = account.code;
                        }
                    }
                }
            }
        }
    }
    // THREESIXSF-36837 end

    if (reversionInputs.internalTransactionId !== undefined && reversionInputs.internalTransactionId !== null) {
        const memberTransactionData =
        {
            date: reversionInputs.reversionDate,
            entryDTOs: [
                {
                    debit: requestBody.selectedAmount,
                    credit: 0,
                    chartCode: `57100/${requestBody.code}`
                }
            ]
        };
        for (beneficary of requestBody.beneficiaries) {
            for (const property in allBeneficariesNewPensionMemeberCodeAfterReversion) {
                if (beneficary.beneficiary.id == property)
                    memberTransactionData.entryDTOs.push({
                        debit: 0,
                        credit: -beneficary.cap.amount,
                        chartCode: `56100/${allBeneficariesNewPensionMemeberCodeAfterReversion[property]}`
                    })
            }
        }

        memberTransactionData.transferBalanceAccounts = [];
        let event = '';
        if (requestBody.transferCap.event === 'NA') event = 'N/A'
        else event = requestBody.transferCap.event;
        memberTransactionData.transferBalanceAccounts.push({
            memberCode: requestBody.code,
            event: event,
            credit: null,
            debit: requestBody.transferCap.amount,
            remainingCap: requestBody.transferCap.transferBalanceACP
        })
        for (beneficary of requestBody.beneficiaries) {
            for (const property in allBeneficariesNewPensionMemeberCodeAfterReversion) {
                if (beneficary.beneficiary.id == property)
                    memberTransactionData.transferBalanceAccounts.push({
                        memberCode: allBeneficariesNewPensionMemeberCodeAfterReversion[property],
                        event: beneficary.cap.event,
                        credit: beneficary.cap.amount,
                        debit: null,
                        remainingCap: beneficary.cap.transferBalanceACP
                    })
            }
        }

        context.ShareData.memberTransactions[reversionInputs.internalTransactionId] = memberTransactionData;
        // console.log("revertToReversionaryBeneficiary --------> ", JSON.stringify(memberTransactionData), '<------')
    }
}

async function addExternalContributions(exContributionInputs) {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/ContributionDashboardController/saveExternalContributions?${getAPIParams()}`;
    const allMembersData = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    for (exContributionInput of exContributionInputs) {
        if (!['CONCESSIONAL', 'NON_CONCESSIONAL'].includes(exContributionInput.contributionType))
            throw new Error('Wrong "contribution type"!');
        if (isNaN(exContributionInput.contributionAmount)) throw new Error('Wrong "contribution amount"!');
        else if (exContributionInput.contributionAmount <= 0) throw new Error('"contribution amount" must more than 0!');

        try {
            let memberId = '';
            for (memberData of allMembersData) {
                if (memberData.contactId === context.ShareData.contacts[exContributionInput.selectedTestContactId].peopleId) {
                    memberId = memberData.id;
                    break;
                }
            }
            const payload = {
                contribution: exContributionInput.contributionAmount,
                contributionType: exContributionInput.contributionType,
                contributionTypeText: null,
                description: exContributionInput.description,
                displayName: null,
                externalFund: exContributionInput.externalFundName,
                finYear: exContributionInput.financialYear,
                fundId: context.TestConfig.entityId,
                id: null,
                memberId: memberId,
                peopleId: context.ShareData.contacts[exContributionInput.selectedTestContactId].peopleId,
                updateDate: null
            };
            const response = await axios.post(url, payload);
            expect(response.status).to.eql(200, "Can not add the external contribution");
        }
        catch (error) {
            throw testUtil.createErrorForAxios(error);
        }
    }
}

async function verifyCalculationContributionAPIV2(testInputs) {
    await testUtil.sleep(3000);
    let actualResult = {};
    try {
        response = await axios.get(
            `${context.TestConfig.calServer}/contribution/v2/funds/${context.TestConfig.entityId}/financialYear/${testInputs.financialYear}`);
        expect(response.status).to.eql(200, "Can not get response from calculation contribution API V2");
        actualResult = response.data.contributions;
        // console.log("verifyCalculationContributionAPIV2 ----->", JSON.stringify(actualResult), '<------')
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
    expect(actualResult).to.containSubset(testInputs.expectedResult);
}

async function addBankTransactionWithGeneralEntryForMember(transactionDate, description, amount,
    generalAccountCode, bankAccountCode = null, transRef = null, selectedMemberAccountId) {
    let memberGeneralAccountCode = `${generalAccountCode}/` +
        context.ShareData.memberAccounts[selectedMemberAccountId].memberCode;
    await transUtil.addBankTransactionWithGeneralEntry(transactionDate, description, amount,
        memberGeneralAccountCode, bankAccountCode, transRef);
    await testUtil.sleep(3000);
}

async function checkPensionDashboard(testInputs) {
    let actualResult = '';
    try {
        const urlGetPensionList = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/getPensionList/${testInputs.financialYear}?${getAPIParams()}`;
        let pensionList = (await axios.post(urlGetPensionList)).data;
        pensionList.map(pension => {
            delete pension.amountPercentage;
            delete pension.taxFreeProportion;
            delete pension.member.address;
            pension.member.accounts.map(account => {
                delete account.amountPercentage;
                delete account.taxFreeProportion;
            });
        });

        const urlgetPensionDashboardList = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/getPensionDashboardList?${getAPIParams()}`;
        const payload = {
            accounts: pensionList,
            year: testInputs.financialYear,
            accountId: null,
            fundId: null,
            pageRequest: false
        };
        const response = await axios.post(urlgetPensionDashboardList, payload);
        expect(response.status).to.eql(200, "Can not get members balance by member account id");
        actualResult = response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
    testInputs.expectedResult.map(r => r.code = context.ShareData.memberAccounts[r.code].memberCode);
    expect(actualResult).to.containSubset(testInputs.expectedResult);
}

async function updateCapLimit(test) {
    if (context.TestConfig.financialYear != 2022)
        throw new Error('Can only update the Cap Limit in 2022!');

    if (isNaN(test.newCapLimit) || test.newCapLimit == '' || test.newCapLimit == null)
        throw new Error('The Cap Limit must be a valid number!');

    const allMembersData = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
    let memberId = '';
    for (memberData of allMembersData) {
        if (memberData.contactId === context.ShareData.contacts[test.selectedTestContactId].peopleId) {
            memberId = memberData.id;
            break;
        }
    }

    const inputs = {
        reportName: 'Transfer Balance Account Summary',
        startDate: `${Number(context.TestConfig.financialYear) - 1}-07-01`,
        endDate: `${context.TestConfig.financialYear}-06-30`,
    }
    const transferBalanceAccountReportData = await reportUtil.getJSONReport(inputs);
    let updatable = false;
    for (record of transferBalanceAccountReportData) {
        if (record.memberId === memberId && (record.event.includes('Cap Indexation') || record.event.includes('Cap Limit Adjustment')))
            updatable = true;
    }

    if (!updatable) throw new Error('Can not update the Cap Limit, please close Entries first!');

    try {
        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/insertOrUpdateCapLimitIndexationAdjustmentForMember?${getAPIParams()}&p=SFUND`;
        const payload = {
            memberId: memberId,
            finYear: context.TestConfig.financialYear,
            fundId: context.TestConfig.entityId,
            capLimit: test.newCapLimit,
            description: "Cap Limit Adjustment",
            editedDescription: "Cap Limit Adjustment"
        };
        const response = await axios.post(url, payload);
        expect(response.status).to.eql(200, "Can not update Cap Limit!");
        return response.data;
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function checkContributionSummaryAPI(testInputs) {
    try {
        const url = `${context.TestConfig.serverURL}/api/fund/${context.TestConfig.entityId}/contributionSummary/${testInputs.financialYear}`;
        const headers = { Authorization: context.TestConfig.sfAuthToken };
        const response = await axios.get(url, { headers });
        expect(response.status).to.eql(200, 'Contribution Summary API Failed!!');
        // console.log('checkContributionSummaryAPI----->', JSON.stringify(response.data));
        expect(response.data).to.containSubset(testInputs.expectedResult);
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function checkContributionBreakdownAPI(testInputs) {
    try {
        const url = `${context.TestConfig.serverURL}/api/sf/funds/${context.TestConfig.entityId}/reports/contributionBreakdown?financialYear=${testInputs.financialYear}`;
        const headers = { Authorization: context.TestConfig.sfAuthToken };
        const response = await axios.get(url, { headers });
        expect(response.status).to.eql(200, 'Contribution Breakdown API Failed!!');
        // console.log('checkContributionBreakdownAPI----->', JSON.stringify(response.data));
        expect(response.data).to.containSubset(testInputs.expectedResult);
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addTBARCapAdjustment(adjustmentInputs) { // This is for external only !! (Select "EXTERNAL" for Member Account Code)
    try {
        const response1 = await axios.post(`${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/list/${adjustmentInputs.financialYear}?${getAPIParams()}&p=SFUND`,
            `"${adjustmentInputs.financialYear}"`);
        expect(response1.status).to.eql(200);
        const response2 = await axios.post(`${context.TestConfig.serverURL}/d/TbarReportSettings/getSettings?${getAPIParams()}&p=SFUND`,
            { "fundId": context.TestConfig.entityId, "year": adjustmentInputs.financialYear });
        expect(response2.status).to.eql(200);

        // check "Account Type", "Account Status", "Event Type"
        const accountTypes = [
            'Account Based Pension',
            'Allocated Pension',
            'Market Linked Pension',
            'Complying Pension',
            'Lifetime Pension (IS2)',
            'Lifetime Pension (IS4)'
        ];
        const accountStatuses = ['Open', 'Closed'];
        const eventTypes = ['SIS', 'LRB', 'IRS', 'ICB', 'ICR', 'MCO', 'CC1', 'CC2', 'CC3', 'CC4', 'SSP', 'STO', 'APV', 'RPV', 'NTC', 'N/A'];
        assert.equal(accountTypes.includes(adjustmentInputs.accountType), true, 'The accountType is not correct!');
        assert.equal(accountStatuses.includes(adjustmentInputs.accountStatus), true, 'The accountStatus is not correct!');
        assert.equal(eventTypes.includes(adjustmentInputs.eventType), true, 'The eventType is not correct!');
        assert.equal([adjustmentInputs.debit, adjustmentInputs.credit].includes(0), true, 'debit or credit should be 0!');

        let dateObject = parse(adjustmentInputs.entryDate, 'yyyy-MM-dd', new Date());
        const entryDate = format(dateObject, 'dd/MM/yyyy');
        dateObject = parse(adjustmentInputs.lodgementDueDate, 'yyyy-MM-dd', new Date());
        const lodgementDueDate = format(dateObject, 'dd/MM/yyyy');

        let accountType = '';
        switch (adjustmentInputs.accountType) {
            case 'Account Based Pension':
                accountType = 'ACCOUNT_BASED_PENSION';
                break;
            case 'Allocated Pension':
                accountType = 'ALLOCATED_PENSION';
                break;
            case 'Market Linked Pension':
                accountType = 'MARKET_LINKED_PENSION';
                break;
            case 'Complying Pension':
                accountType = 'COMPLYING_PENSION';
                break;
            case 'Lifetime Pension (IS2)':
                accountType = 'LIFETIME_PENSION_IS2';
                break;
            case 'Lifetime Pension (IS4)':
                accountType = 'LIFETIME_PENSION_IS4';
                break;
        }

        const externalFundId = (await contactUtil.getContactsByName(adjustmentInputs.externalFund))[0].masterId;

        const memberCode = context.ShareData.memberAccounts[adjustmentInputs.selectedAccumulationAccountId].memberCode;
        const accumulationAccountData = await getAccumulationAccountData(memberCode);
        const memberId = accumulationAccountData.memberId;

        let commonId = '';
        let accountCode = '';
        if (adjustmentInputs.hasOwnProperty('newExternalMemberAccount')) {
            commonId = '#';
            accountCode = adjustmentInputs.newExternalMemberAccount;
        } else {
            commonId = context.ShareData.externalMemberAccount[adjustmentInputs.existingExternalMemberAccount].commonId;
            accountCode = context.ShareData.externalMemberAccount[adjustmentInputs.existingExternalMemberAccount].code;
        }

        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/addMemberTransferBalance?${getAPIParams()}&p=SFUND`;
        const payload = {
            "debit": adjustmentInputs.debit != 0 ? `${adjustmentInputs.debit}` : 0,
            "credit": adjustmentInputs.credit != 0 ? `${adjustmentInputs.credit}` : 0,
            "invalidDate": false,
            "entryDate": entryDate,
            "dueDate": lodgementDueDate,
            "sourceType": "AddAdjustment",
            "event": adjustmentInputs.transactionType,
            "commonId": commonId,
            "externalMemberAccount": {
                "code": accountCode,
                "type": accountType,
                "status": adjustmentInputs.accountStatus,
                "externalFund": {
                    "id": externalFundId,
                    "name": adjustmentInputs.externalFund
                },
                "memberId": memberId
            },
            "eventType": adjustmentInputs.eventType,
            "tbaReportZero": false,
            "amount": adjustmentInputs.debit != 0 ? `${adjustmentInputs.debit}` : `-${adjustmentInputs.credit}`,
            "memberId": memberId,
            "memberAccountId": null,
            "finYear": adjustmentInputs.financialYear
        };
        if (adjustmentInputs.hasOwnProperty('existingExternalMemberAccount')) {
            payload.externalMemberAccount.id = context.ShareData.externalMemberAccount[adjustmentInputs.existingExternalMemberAccount].id;
            payload.externalMemberAccount.externalFund.abn = context.ShareData.externalMemberAccount[adjustmentInputs.existingExternalMemberAccount].abn;
        }
        // console.log('payload ------->', JSON.stringify(payload), '<------');
        const response = await axios.post(url, payload);
        expect(response.status).to.eql(200, "Can not add adjustment!");

        if (adjustmentInputs.hasOwnProperty('newExternalMemberAccount')) {
            let currentMemberTransferBalanceEntryDTO = '';
            loop1:
            for (let memberTransferBalanceEntryMemberDTO of response.data.memberTransferBalanceEntryMemberDTOs) {
                for (let memberTransferBalanceEntryDTO of memberTransferBalanceEntryMemberDTO.memberTransferBalanceEntryDTOs) {
                    if (memberTransferBalanceEntryDTO.hasOwnProperty('externalMemberAccount')
                        && memberTransferBalanceEntryDTO.externalMemberAccount.code == accountCode) {
                        currentMemberTransferBalanceEntryDTO = memberTransferBalanceEntryDTO;
                        break loop1;
                    }
                }
            }

            context.ShareData.externalMemberAccount[adjustmentInputs.newExternalMemberAccount] = {
                commonId: currentMemberTransferBalanceEntryDTO.commonId,
                code: currentMemberTransferBalanceEntryDTO.externalMemberAccount.code,
                id: currentMemberTransferBalanceEntryDTO.externalMemberAccount.id,
                abn: currentMemberTransferBalanceEntryDTO.externalMemberAccount.externalFund.abn
            }
        }
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function addTBARCapAdjustmentInternal(adjustmentInputs) { // This is for internal only !! (Select existing Member Account Code)
    try {
        let memberId = '';
        let memberAccountId = '';
        const allMembersData = await getAllMembersDataFromMemberList(context.TestConfig.entityId);
        for (let memberData of allMembersData) {
            for (let account of memberData.accounts) {
                if (account.code == adjustmentInputs.memberAccountCode) {
                    memberId = memberData.id;
                    memberAccountId = account.id;
                    break;
                }
            }
            if (memberId != '' && memberAccountId != '') break;
        }

        const url = `${context.TestConfig.serverURL}/chart/chartmvc/MemberTransferBalanceEntryController/addMemberTransferBalance?${getAPIParams()}&p=SFUND`;
        const payload = {
            "event": adjustmentInputs.transactionType,
            "isCapLimitInputInvalid": false,
            "debit": adjustmentInputs.debit,
            "credit": adjustmentInputs.credit,
            "invalidDate": false,
            "entryDate": adjustmentInputs.entryDate,
            "dueDate": adjustmentInputs.lodgementDueDate,
            "openingBalanceManualExtraFieldsError": false,
            "hasOBMOption": true,
            "sourceType": "AddAdjustment",
            "commonId": `${memberAccountId}_0`,
            "eventType": adjustmentInputs.eventType,
            "tbaReportZero": false,
            "externalMemberAccount": null,
            "amount": adjustmentInputs.debit != 0 ? `${adjustmentInputs.debit}` : `-${adjustmentInputs.credit}`,
            "memberId": memberId,
            "memberAccountId": memberAccountId,
            "finYear": adjustmentInputs.financialYear
        };
        // console.log('payload ------->', JSON.stringify(payload), '<------');

        const response = await axios.post(url, payload);
        expect(response.status).to.eql(200, "Can not add adjustment!");
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

async function updatePensionAccountDetails(testInputs) {
    const pensionAccountId = context.ShareData.memberAccounts[testInputs.selectedPensionAccountId].accountId;
    // console.log('pension account id ------> ', pensionAccountId);

    try {
        const urlGetPensionAccountDetails = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/memberaccount/${pensionAccountId}?${getAPIParams()}`;
        const pensionAccountDetails = (await axios.post(urlGetPensionAccountDetails)).data;

        const urlUpdatePensionAccountDetails = `${context.TestConfig.serverURL}/chart/chartmvc/MemberController/save?${getAPIParams()}`;
        const payload = pensionAccountDetails;
        if (testInputs.changes.endDate != null && testInputs.changes.endDate != undefined && testInputs.changes.endDate != '') {
            payload.endDate = testInputs.changes.endDate + 'T10:00:00.000+1000';
        }
        // console.log('payload ------> ', JSON.stringify(payload), ' <------');
        const response = await axios.post(urlUpdatePensionAccountDetails, payload);
        expect(response.status).to.eql(200, 'can not update the pension account details!!');
    }
    catch (error) {
        throw testUtil.createErrorForAxios(error);
    }
}

export default {
    getMembersByCode,
    addMember,
    getAllMembersDataFromMemberList,
    addPensionAccount,
    addMemberTransaction,
    addExternalTSB,
    verifyTransactionsForMember,
    verifyTransferBalanceAccount,
    verifyPensions,
    revertToReversionaryBeneficiary,
    getAllMemberContacts,
    getRolloverFundId,
    addExternalContributions,
    verifyCalculationContributionAPIV2,
    addBankTransactionWithGeneralEntryForMember,
    checkPensionDashboard,
    updateCapLimit,
    getMemberDataByPeopleId,
    checkContributionSummaryAPI,
    checkContributionBreakdownAPI,
    addTBARCapAdjustment,
    addTBARCapAdjustmentInternal,
    updatePensionAccountDetails
};
