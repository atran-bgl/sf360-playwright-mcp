import { _, axios, expect } from '../lib/util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';
import securityUtil from './security-util.js';

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

function getDefaultSettingForBankAccountPromise(parentAccountCode = '60400') {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL
        }/chart/chartmvc/ChartController/getDefaultSettingByCode/${context.TestConfig.entityId}/${parentAccountCode}?${getAPIParams()}`
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Get default settings for bank account'
        );
        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getBankBSBAddressListPromise(keyword = _.random(100, 999)) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL
        }/d/BankfeedsMng/listBSBAddressByBsb?${getAPIParams()}`,
        keyword.toString(),
        { headers: { 'Content-Type': 'text/plain' } }
      )
      .then(response => {
        expect(response.status).to.eql(200, 'Get bank bsb addresses');
        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function addBankAccount(inputs) {
  return new Promise((resolve, reject) => {
    let parentCodeInput = '60400';
    let subCodeInput;
    let bsbInput;
    let accNumInput;
    let accNameInput;
    let isDefaultForTransaction = 'N';

    if (inputs != null) {
      if (inputs.hasOwnProperty('accountCode')) {
        const codeParts = inputs.accountCode.split('/');
        expect(codeParts.length).to.eql(2, 'Full Bank Account code should be <Parent Code>/<Subcode>');

        parentCodeInput = codeParts[0];
        subCodeInput = codeParts[1];
      }

      inputs.hasOwnProperty('bsb') && (bsbInput = inputs.bsb);
      inputs.hasOwnProperty('accountNumber') && (accNumInput = inputs.accountNumber);
      inputs.hasOwnProperty('accountName') && (accNameInput = inputs.accountName);
      if (inputs.isDefaultForTransaction)
        isDefaultForTransaction = inputs.isDefaultForTransaction;
    }

    Promise.all([
      getDefaultSettingForBankAccountPromise(parentCodeInput),
      getBankBSBAddressListPromise(bsbInput)
    ]).then(function (values) {
      const defaultSettings = values[0];
      const bsbAddresses = values[1];

      expect(bsbAddresses.length).to.above(0, 'There should be at least one BSB addresses');

      const bankLinkedList = defaultSettings.linkedList;
      const taxLabelsList = defaultSettings.taxLabelsList;

      const bankAccNum = (accNumInput) ? accNumInput : _.random(10000000, 999999999);
      const selectedBank = _.sample(bsbAddresses);
      const bankBSB = selectedBank.bsb;
      const bankCode = (subCodeInput) ? subCodeInput : selectedBank.bankCode + bankAccNum;
      const bankName = (accNameInput) ? accNameInput : `${bankCode} Bank`;

      axios
        .post(
          `${context.TestConfig.serverURL
          }/chart/chartmvc/ChartController/saveTAccount?${getAPIParams()}`,
          {
            id: null,
            accountClass: 'S',
            accountType: 'AssetBank',
            status: 'Active',
            accountId: null,
            pid: null,
            code: bankCode,
            name: bankName,
            isApplyToAllFund: 'N',
            linkedFundsNum: null,
            balanceTotal: null,
            tagids: null,
            linkedids: null,
            accountClassStr: null,
            accountTypeStr: null,
            gstRate: 'NotApplicable',
            srn: null,
            registry: null,
            securityID: null,
            bsb: bankBSB,
            bankAccNum: bankAccNum,
            isDefaultForTransaction: isDefaultForTransaction,
            fundIDForBank: null,
            memberID: null,
            fundLinks: null,
            linkedList: bankLinkedList,
            subLinkedList: null,
            tagList: [],
            fundList: [
              {
                id: context.TestConfig.entityId
              }
            ],
            fundIdList: null,
            taxLabelsList: taxLabelsList,
            moreDetailsLabelsList: null,
            taccountDepreciationList: null,
            fundId: null,
            pcode: parentCodeInput,
            bankcode: `${bankCode}`
          }
        )
        .then(response => {
          expect(response.status).to.eql(200, 'Add bank account');
          expect(response.data.errorMsg).to.eql(null, 'No error when adding bank account');
          resolve(response.data);
        })
        .catch(error => {
          reject(testUtil.createErrorForAxios(error));
        });
    }).catch(function (error) {
      reject(error);
    });
  });
}

function findInvestmentControlAccountPromise(controlAccountCode) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL
        }/chart/chartmvc/ChartController/findInvestmentControlTAccounts?${getAPIParams()}`
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Find Investment Control Account'
        );

        const found = response.data.find(
          element => element.code === controlAccountCode
        );
        if (found) {
          resolve(found);
        } else {
          reject(new Error('Unable to find investment control account'));
        }
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

function getInvestmentControlAccountDetailPromise(controlAccountId) {
  return new Promise((resolve, reject) => {
    axios
      .post(
        `${context.TestConfig.serverURL
        }/chart/chartmvc/ChartController/getInvestmentTAccount/${controlAccountId}/0/${context.TestConfig.financialYear}?${getAPIParams()}`
      )
      .then(response => {
        expect(response.status).to.eql(
          200,
          'Get Investment Control Account Detail'
        );
        resolve(response.data);
      })
      .catch(error => {
        reject(testUtil.createErrorForAxios(error));
      });
  });
}

async function addInvestmentSubAccount(accountCode) {
  const codeParts = accountCode.split('/');
  expect(codeParts.length).to.eql(2, 'Full Investment Sub Account code should be <Parent code>/<Investment code>');

  const parentCode = codeParts[0];
  const securityCode = codeParts[1];

  const parentAcc = await findInvestmentControlAccountPromise(parentCode);
  const parentAccDetail = await getInvestmentControlAccountDetailPromise(parentAcc.id);

  let securityId = null;
  let accName = null;
  let accCode = null;

  if (parentAccDetail.moreDetailsLabel.code == 'SYSTEM_UNITISED_INVESTMENT') {
    const secList = await securityUtil.getSecurityList(securityCode);
    expect(secList.length).to.be.at.least(1, `There should be at least one security for ${securityCode}`);

    securityId = secList[0].id;
    accName = secList[0].name;
    accCode = secList[0].code;
  }
  else {
    accName = securityCode;
    accCode = securityCode;
  }

  let response;
  try {
    response = await axios.post(
      `${context.TestConfig.serverURL
      }/chart/chartmvc/ChartController/saveTAccount?${getAPIParams()}`,
      {
        id: null,
        accountClass: "S",
        accountType: "Investment",
        status: "Active",
        accountId: null,
        pid: parentAcc.id,
        code: accCode,
        name: accName,
        isApplyToAllFund: "N",
        linkedFundsNum: null,
        balanceTotal: null,
        tagids: null,
        linkedids: null,
        accountClassStr: null,
        accountTypeStr: null,
        taxLabel: parentAccDetail.taxLabel,
        moreDetailsLabel: parentAccDetail.moreDetailsLabel,
        gstRate: parentAccDetail.gstRate,
        isAssetToCGT: parentAccDetail.isAssetToCGT,
        isIncludeInvestReport: parentAccDetail.isIncludeInvestReport,
        isAssetToLimitedRecourse: parentAccDetail.isAssetToLimitedRecourse,
        isDepreciableAsset: parentAccDetail.isDepreciableAsset,
        inHouseStatus: parentAccDetail.inHouseStatus,
        srn: null,
        registry: "",
        securityID: securityId,
        bsb: null,
        bankAccNum: null,
        fundIDForBank: null,
        memberID: null,
        fundLinks: null,
        linkedList: parentAccDetail.linkedList,
        subLinkedList: [],
        tagList: [],
        fundList: [
          {
            id: context.TestConfig.entityId,
            name: null,
            code: null,
            financialYear: null,
          },
        ],
        fundIdList: null,
        taxLabelsList: null,
        moreDetailsLabelsList: null,
        taccountDepreciationList: [],
        fundId: null,
        pcode: parentAcc.code,
        pname: null,
        findCode: false,
        queryCode: 0,
        bankcode: null,
        securityCode: null,
        fundids: null,
        fromUISource: null,
        modifiedTime: null,
        peopleId: null,
        peopleName: null,
        memberAccountID: null,
        holdingID: null,
        globalView: false,
        inactiveLinkedAccount: false,
        institutionCode: null,
        keepSameNameWithCode: false,
        isNonUnitised: (parentAccDetail.moreDetailsLabel.code != 'SYSTEM_UNITISED_INVESTMENT'),
        investCode: null,
        extId: null,
        servicePeriodStartDate: null,
        errorMsg: null,
        fromUI: false,
      }
    );
  } catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  expect(response.status).to.eql(200, 'Add investment sub account');
  expect(response.data.errorMsg).to.eql(null, 'No error when adding investment sub account');

  return response.data;
}

async function getControlAccForSecurity(code) {
  const securityData = (await axios.post(
    `${context.TestConfig.serverURL}/d/SecuritiesController/getSecurityList4Dropdown?${getAPIParams()}`,
    { qsContent: code })).data;
  if (securityData.records.length == 0) {
    return null;
  }
  const marketType = securityData.records[0].marketType;
  const securityType = securityData.records[0].securityType;
  switch (marketType) {
    case 'NQ':
    case 'NY':
    case 'LX':
    case 'HKX':
    case 'SGX':
      return '77700'
    case 'AX':
      if (securityType == 'Trust_Units') return '78200';
      else if (securityType == 'Floating_Rate_Notes') return '72450';
      else return '77600';
    default:
      return '76100';
  }
}

async function addInvestmentSubAccountForSecurity(securityCode) {
  const controlAcc = await getControlAccForSecurity(securityCode);
  if (controlAcc == null) {
    throw new Error(`Can not find control account for security code: ${securityCode}`);
  }
  const securityTaccData = await addInvestmentSubAccount(`${controlAcc}/${securityCode}`);
  return securityTaccData;
}

async function getChartAccDataByFullAccCode(fullAccCode) {
  try {
    const response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/ChartController/chartdto/list?${getAPIParams()}`,
      { fundId: context.TestConfig.entityId, searchText: fullAccCode });
    expect(response.status).to.eql(200, 'can not get chart account data by searching full account code');
    return response.data;
  } catch (error) {
    throw (testUtil.createErrorForAxios(error));
  }
}

async function searchAccount(accountCode) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/ChartController/chartdto/list?${getAPIParams()}`;
    const payload = {
      typeList: ["Income", "Expense", "Allocation", "Asset", "AssetBank", "Investment", "Liability", "Unallocated",
        "IncomeMember", "ExpenseMember", "AllocationMember", "Member", "MemberReserve", "LiabilityLrba"
      ],
      statusList: ["Active"],
      fundCategoryList: null,
      tagList: null,
      fundId: context.TestConfig.entityId,
      accountId: null,
      pid: null,
      searchText: accountCode,
      selectedAccount: null,
      updatedTags: null,
      userId: null
    };
    const response = await axios.post(url, payload);
    expect(response.status).to.eql(200, "Can not search the account in the chart of accounts page");
    let result = null;
    for (const record of response.data.records) {
      if (record.code === accountCode) {
        result = record;
        break;
      }
    }
    return result;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function getAccountDetails(accountCode) {
  const accountData = await searchAccount(accountCode);
  if (accountData === null) throw new Error('Can not find the specified account!');
  let urlPart = '';
  if (accountData.accountType === 'Investment')
    urlPart = `getInvestmentTAccount/${accountData.id}/0/${context.TestConfig.financialYear}`;
  else if (accountData.accountType === 'AssetBank')
    urlPart = `banktaccount/${accountData.id}/${context.TestConfig.financialYear}`;
  else if (accountData.accountType === 'Member')
    urlPart = `getMemberTAccount/${accountData.id}/0/${context.TestConfig.financialYear}`;
  else
    urlPart = `othertaccount/${accountData.id}/${context.TestConfig.financialYear}`;

  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/ChartController/${urlPart}?${getAPIParams()}`;
    const response = await axios.post(url);
    expect(response.status).to.eql(200, "Can not get the account details!");
    return response.data;
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

export default {
  addBankAccount,
  addInvestmentSubAccount,
  addInvestmentSubAccountForSecurity,
  getControlAccForSecurity,
  getChartAccDataByFullAccCode,
  searchAccount,
  getAccountDetails
};
