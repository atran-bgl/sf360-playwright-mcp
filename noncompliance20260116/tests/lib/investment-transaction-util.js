import { _, axios, expect, assert } from '../lib/util.js';
import { context } from '../data/context.js';
import testUtil from './test-util.js';
import chartUtil from './chart-util.js';
import transUtil from './transaction-util.js';

const { waitTime } = context.TestSettings;
const DATE_SUFFIX = context.Constants.DATE_SUFFIX;

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

async function checkInvestmentAccountAndAddToEntityIfNotExist(transactionDate, accountCode, isAssetToCGT = null) {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode, false);

  if (acc) {
    return acc;
  }
  else {
    return await chartUtil.addInvestmentSubAccount(accountCode, isAssetToCGT);
  }
}

async function createInvestmentPurchaseEntry(transactionDate, accountCode, units, amount, isAssetToCGT = null) {
  const acc = await checkInvestmentAccountAndAddToEntityIfNotExist(transactionDate, accountCode, isAssetToCGT);
  const unitPrice = (amount / units).toFixed(4);

  const entry = {
    'id': null,
    'type': 'InvestmentPurchase',
    'entryId': null,
    'entryDTO': {
      'subType': 'Investment',
      'contractDate': `${transactionDate}${DATE_SUFFIX}`,
      'settlementDate': `${transactionDate}${DATE_SUFFIX}`,
      'consideration': amount,
      'units': units,
      'unitPrice': unitPrice,
      'brokerage': null,
      'gstOnPurchaseOrDisposal': null,
      'contractNo': '',
      'accountNo': '',
      'hin': '',
      'defaultHin': false,
      'useTransactionDateFlag': null,
      'capitalGainV': null,
      'capitalGainW': null,
      'capitalGainX': null,
      'capitalLoss': null,
      'investmentType': 'Purchase',
      'parcels': [],
      'cgtList': null,
      'costBaseResetGroupFlag': null,
      'notionalGainPreExempt': null,
      'netNotionalGain': null,
      'cgtRelief': null,
      'id': null,
      'taccId': acc.id,
      'chartCode': `${acc.pcode.split('/')[0]}`,
      'accountName': null,
      'amount': amount,
      'gstAmount': '0.00'
    },
    'seqNum': 1,
    'originalTransId': null,
    'visible': true,
    'amount': null,
    'units': null,
    'transactionDate': null,
    'fundId': null,
    'commutationFlag': null,
    'taxInstalmentRefFlag': null,
    'defaultBankAccountFlag': null,
    'editable': true,
    'cgtGroupRef': null,
    'unallocatedEntry': false
  }

  return entry;
}

async function addInvestmentPurchase(transactionDate, description, accountCode, units, amount, generalAccountCode = null, isAssetToCGT = null) {
  if (generalAccountCode === null) {
    const entries = await Promise.all([
      transUtil.createBankEntry(transactionDate, -amount),
      createInvestmentPurchaseEntry(transactionDate, accountCode, units, amount, isAssetToCGT)
    ]);

    return await transUtil.addBankTransaction(transactionDate, description, entries);
  }
  else if (generalAccountCode.includes('23800')) {
    const components = {};
    const entries = await Promise.all([
      createDistributionInterestEntry(transactionDate, generalAccountCode, amount * -1, components),
      createInvestmentPurchaseEntry(transactionDate, accountCode, units, amount, isAssetToCGT)
    ]);
    return await transUtil.addGeneralJournal(transactionDate, description, entries, null, true);
  }
  else {
    const entries = await Promise.all([
      transUtil.createGeneralEntry(transactionDate, generalAccountCode, -amount),
      createInvestmentPurchaseEntry(transactionDate, accountCode, units, amount, isAssetToCGT)
    ]);

    return await transUtil.addGeneralJournal(transactionDate, description, entries);
  }
}

async function addMultipleInvestmentPurchase(investmentData) {
  let allPurchaseData = [];
  if (investmentData != null) allPurchaseData = investmentData;
  else allPurchaseData = context.ShareData;

  const purchase = async (purchaseData) => {
    await addInvestmentPurchase(purchaseData.transactionDate, `Purchase ${purchaseData.accountCode}`,
      purchaseData.accountCode, purchaseData.unit, purchaseData.amount);
  };
  const promiseChain = allPurchaseData.map(purchaseData => purchase(purchaseData));
  await Promise.all(promiseChain);
}

async function getInvestmentParcelList(transactionDate, accountCode) {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode);

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/parcellist/${acc.id}?${getAPIParams()}`,
      'null',
      { headers: { 'Content-Type': 'text/plain' } }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  return response.data;
}

async function createInvestmentInstalmentEntry(transactionDate, accountCode, amount, parcels) {
  const [acc, parcelList] = await Promise.all([
    transUtil.getChartAccount(transactionDate, accountCode),
    getInvestmentParcelList(transactionDate, accountCode),
  ]);

  const parcelsToInstal = [];

  parcelList.forEach((p) => {
    let addToList = false;
    if (parcels) {
      if (
        parcels.find((costBaseLinkage) => costBaseLinkage == p.costBaseLinkage)
      ) {
        addToList = true;
      }
    } else {
      addToList = true;
    }

    if (addToList) {
      parcelsToInstal.push({
        actPercentUsed: null,
        adjustedCostBase: null,
        cgtRegisterTransId: null,
        cgtRelief: false,
        contractDate: p.contractDate,
        consideration: null,
        costBase: null,
        costBaseLinkage: p.costBaseLinkage,
        deferGain: false,
        description: null,
        investmentEntryId: null,
        units: p.units,
        unitPrice: null,
        units2Sell: null,
      });
    }
  });

  if (parcels && parcels.length != parcelsToInstal.length) {
    console.warn("Selecting parcel for instalment may not be correct.");
  }

  const entry = {
    id: null,
    type: "InvestmentInstalment",
    entryId: null,
    entryDTO: {
      subType: "Investment",
      contractDate: `${transactionDate}${DATE_SUFFIX}`,
      settlementDate: `${transactionDate}${DATE_SUFFIX}`,
      consideration: amount,
      units: "0.000000",
      unitPrice: null,
      brokerage: null,
      gstOnPurchaseOrDisposal: null,
      contractNo: "",
      accountNo: "",
      hin: "",
      defaultHin: false,
      useTransactionDateFlag: true,
      capitalGainV: null,
      capitalGainW: null,
      capitalGainX: null,
      capitalLoss: null,
      investmentType: "Instalment",
      parcels: parcelsToInstal,
      cgtList: null,
      costBaseResetGroupFlag: null,
      notionalGainPreExempt: null,
      netNotionalGain: null,
      cgtRelief: null,
      purchaseCostBaseLinkage: null,
      id: null,
      taccId: acc.id,
      chartCode: `${acc.pcode.split("/")[0]}`,
      accountName: null,
      amount: amount,
      gstAmount: "0.00",
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
    unallocatedEntry: false,
  };

  return entry;
}

async function addInvestmentInstalment(transactionDate, description, accountCode, amount, parcels) {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, -amount),
    createInvestmentInstalmentEntry(transactionDate, accountCode, amount, parcels)
  ]);

  return await transUtil.addBankTransaction(transactionDate, description, entries);
}

async function createInvestmentReturnEntry(transactionDate, accountCode, amount, parcels, useParcelDate = true) {
  const [acc, parcelList] = await Promise.all([
    transUtil.getChartAccount(transactionDate, accountCode),
    getInvestmentParcelList(transactionDate, accountCode),
  ]);
  const parcelsToReturn = [];

  parcelList.forEach((p) => {
    let addToList = false;
    if (parcels) {
      if (
        parcels.find((costBaseLinkage) => costBaseLinkage == p.costBaseLinkage)
      ) {
        addToList = true;
      }
    } else {
      addToList = true;
    }

    if (addToList) {
      parcelsToReturn.push({
        actPercentUsed: null,
        adjustedCostBase: null,
        cgtRegisterTransId: null,
        cgtRelief: false,
        contractDate: p.contractDate,
        consideration: null,
        costBase: null,
        costBaseLinkage: p.costBaseLinkage,
        deferGain: false,
        description: null,
        investmentEntryId: null,
        units: p.units,
        unitPrice: null,
        units2Sell: null,
      });
    }
  });

  if (parcels && parcels.length != parcelsToReturn.length) {
    console.warn("Selecting parcel for return of capital may not be correct.");
  }

  const entry = {
    id: null,
    type: "InvestmentReturn",
    entryId: null,
    entryDTO: {
      subType: "Investment",
      contractDate: `${transactionDate}${DATE_SUFFIX}`,
      settlementDate: `${transactionDate}${DATE_SUFFIX}`,
      consideration: amount,
      units: "0.000000",
      unitPrice: null,
      brokerage: null,
      gstOnPurchaseOrDisposal: null,
      contractNo: "",
      accountNo: "",
      hin: "",
      defaultHin: false,
      useTransactionDateFlag: useParcelDate,
      capitalGainV: null,
      capitalGainW: null,
      capitalGainX: null,
      capitalLoss: null,
      investmentType: "ReturnOfCapital",
      parcels: parcelsToReturn,
      cgtList: null,
      costBaseResetGroupFlag: null,
      notionalGainPreExempt: null,
      netNotionalGain: null,
      cgtRelief: null,
      purchaseCostBaseLinkage: null,
      id: null,
      taccId: acc.id,
      chartCode: `${acc.pcode.split("/")[0]}`,
      accountName: null,
      amount: `-${amount}`,
      gstAmount: "0.00",
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
    unallocatedEntry: false,
  };

  return entry;
}

async function addInvestmentReturnOfCapital(transactionDate, description, accountCode, amount, parcels, useParcelDate) {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, amount),
    createInvestmentReturnEntry(transactionDate, accountCode, amount, parcels, useParcelDate)
  ]);

  return await transUtil.addBankTransaction(transactionDate, description, entries);
}

async function getDisposalParcelList(transactionDate, accountCode, units, amount, disposalMethod = 'MTE') {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode);

  let response;

  try {
    response = await axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/TransactionController/getAutoDisposalParcelList/${acc.id}?${getAPIParams()}`,
      {
        contractDate: `${transactionDate}${DATE_SUFFIX}`,
        consideration: amount,
        units: units,
        unitPrice: amount / units,
        disposalMethod: disposalMethod
      }
    );
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }

  const investParcelListToSell = [];

  for (p of response.data) {
    investParcelListToSell.push({
      costBaseLinkage: p.costBaseLinkage,
      units: '-' + p.units2Sell,
      consideration: amount,
      calculateMethod: p.calculateMethod
    });
  }

  return investParcelListToSell;
}

async function createInvestmentDisposalEntry(transactionDate, accountCode, units, amount, disposalMethod = 'MTE',
  contractDate = '', settlementDate = '') {
  const absAmount = Math.abs(amount);
  const [acc, parcelListToDispose] = await Promise.all([
    transUtil.getChartAccount(transactionDate, accountCode),
    getDisposalParcelList(transactionDate, accountCode, units, absAmount, disposalMethod)
  ]);
  let totalUnitToDispose = 0;

  parcelListToDispose.forEach(parcel => totalUnitToDispose -= parseFloat(parcel.units));

  if (totalUnitToDispose != units) {
    console.log(`disposing units of ${totalUnitToDispose} although asked for ${units}`);
  }

  const unitPrice = (absAmount / totalUnitToDispose).toFixed(4);

  let cd = transactionDate;
  if (contractDate != '')
    cd = contractDate;

  let sd = transactionDate
  if (settlementDate != '')
    sd = settlementDate;
  else if (contractDate != '')
    sd = contractDate;

  const entry = {
    id: null,
    type: 'InvestmentDisposal',
    entryId: null,
    entryDTO: {
      subType: 'Investment',
      contractDate: `${cd}${DATE_SUFFIX}`,
      settlementDate: `${sd}${DATE_SUFFIX}`,
      consideration: absAmount,
      units: `-${totalUnitToDispose}`,
      unitPrice: unitPrice,
      brokerage: null,
      gstOnPurchaseOrDisposal: null,
      contractNo: '',
      accountNo: '',
      hin: '',
      defaultHin: false,
      useTransactionDateFlag: null,
      disposalMethod: disposalMethod,
      capitalGainV: null,
      capitalGainW: null,
      capitalGainX: null,
      capitalLoss: null,
      investmentType: 'Disposal',
      parcels: parcelListToDispose,
      cgtList: null,
      costBaseResetGroupFlag: null,
      notionalGainPreExempt: null,
      netNotionalGain: null,
      cgtRelief: null,
      id: null,
      taccId: acc.id,
      chartCode: null,
      accountName: null,
      amount: amount,
      gstAmount: 0.00
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
  return entry;
}

async function addInvestmentDisposal(transactionDate, description, accountCode, units, amount, disposalMethod,
  contractDate = '', settlementDate = '') {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, amount),
    createInvestmentDisposalEntry(transactionDate, accountCode, units, amount * -1, disposalMethod, contractDate, settlementDate)
  ]);

  return await transUtil.addBankTransaction(transactionDate, description, entries);
}

function getDistributionComponent(components, componentName) {
  if (components.hasOwnProperty(componentName)) {
    const compVal = components[componentName];
    return compVal;
  }
  else {
    return null;
  }
}

async function createDistributionInterestEntry(transactionDate, accountCode, amount, components) {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode);

  // A
  const unfrankedDividend = getDistributionComponent(components, 'unfrankedDividend');
  const interest = getDistributionComponent(components, 'interest');
  const otherIncome = getDistributionComponent(components, 'otherIncome');
  const otherIncomeNCMI = getDistributionComponent(components, 'otherIncomeNCMI'); // new
  const otherIncomeExcNCMI = getDistributionComponent(components, 'otherIncomeExcNCMI'); // new
  const trustDeduction = getDistributionComponent(components, 'trustDeduction');

  // B
  const primaryProductionIncomeExcNCMI = getDistributionComponent(components, 'primaryProductionIncomeExcNCMI'); // new
  const primaryProductionIncomeNCMI = getDistributionComponent(components, 'primaryProductionIncomeNCMI'); // new
  const otherPrimaryProductionIncome = getDistributionComponent(components, 'otherPrimaryProductionIncome'); // new

  // C
  const frankedDividend = getDistributionComponent(components, 'frankedDividend');
  const frankingCredit = getDistributionComponent(components, 'frankingCredit');

  const discountedCapitalGainRate = getDistributionComponent(components, 'discountedCapitalGainRate'); // 50% toggle removed
  const discountedCapitalGain = getDistributionComponent(components, 'discountedCapitalGain');
  const cgtConcessionAmount = getDistributionComponent(components, 'cgtConcessionAmount');
  const capitalGainIndexation = getDistributionComponent(components, 'capitalGainIndexation');
  const capitalGainOther = getDistributionComponent(components, 'capitalGainOther');
  const discountedGainNCMI = getDistributionComponent(components, 'discountedGainNCMI'); // new
  const discountedGainExcNCMI = getDistributionComponent(components, 'discountedGainExcNCMI'); // new
  const otherGainNCMI = getDistributionComponent(components, 'otherGainNCMI'); // new
  const otherGainExcNCMI = getDistributionComponent(components, 'otherGainExcNCMI'); // new
  const foreignDiscountedCapitalGain = getDistributionComponent(components, 'foreignDiscountedCapitalGain');
  const foreignDiscountedCapitalGainOffset = getDistributionComponent(components, 'foreignDiscountedCapitalGainOffset');
  const foreignCapitalGainIndexation = getDistributionComponent(components, 'foreignCapitalGainIndexation');
  const foreignCapitalGainIndexationOffset = getDistributionComponent(components, 'foreignCapitalGainIndexationOffset');
  const foreignCapitalGainOther = getDistributionComponent(components, 'foreignCapitalGainOther');
  const foreignCapitalGainOtherOffset = getDistributionComponent(components, 'foreignCapitalGainOtherOffset');

  // D
  const assessableForeignSourceIncome = getDistributionComponent(components, 'assessableForeignSourceIncome');
  const foreignIncomeTaxPaidOffset = getDistributionComponent(components, 'foreignIncomeTaxPaidOffset');
  const ausFrankingCreditFromNZ = getDistributionComponent(components, 'ausFrankingCreditFromNZ');
  const otherNetForeignSourceIncome = getDistributionComponent(components, 'otherNetForeignSourceIncome');
  const CFCIncome = getDistributionComponent(components, 'CFCIncome'); // new

  // Other Non-Assessable Amounts
  const taxExempted = getDistributionComponent(components, 'taxExempted');
  const taxFree = getDistributionComponent(components, 'taxFree');
  const taxDefer = getDistributionComponent(components, 'taxDefer');

  // Attribution Managed Investment Trust ('AMIT') Cost Base Adjustments
  const amitShortfall = getDistributionComponent(components, 'amitShortfall');
  const amitExcess = getDistributionComponent(components, 'amitExcess');

  // Other Deductions From Distribution
  const tfnAmountsWithheld = getDistributionComponent(components, 'tfnAmountsWithheld');
  const lessABNNotQuotedTaxWithheld = getDistributionComponent(components, 'lessABNNotQuotedTaxWithheld'); // new
  const foreignResidentCGWithholding = getDistributionComponent(components, 'foreignResidentCGWithholding'); // new
  const shareCreditsTFNWithheldPaymentFromCHT = getDistributionComponent(components, 'shareCreditsTFNWithheldPaymentFromCHT'); // new
  const otherExpenses = getDistributionComponent(components, 'otherExpenses');

  // Capital Gain - Trust Income Schedule
  const capitalLossApplied = getDistributionComponent(components, 'capitalLossApplied'); // new
  const smallBusinsessCGTConcession = getDistributionComponent(components, 'smallBusinsessCGTConcession'); // new

  // Other Tax Offsets
  const earlyStageVentureCapitalTaxOffset = getDistributionComponent(components, 'earlyStageVentureCapitalTaxOffset'); // new
  const earlyStageInvestorTaxOffset = getDistributionComponent(components, 'earlyStageInvestorTaxOffset'); // new
  const explorationCreditsDistributed = getDistributionComponent(components, 'explorationCreditsDistributed'); // new
  const nationalRentalTaxOffset = getDistributionComponent(components, 'nationalRentalTaxOffset'); // new

  // Other Trust Income Schedule Items
  const NonResidentBeneficiaryS98J = getDistributionComponent(components, 'NonResidentBeneficiaryS98J'); // new
  const NonResidentBeneficiaryS98K = getDistributionComponent(components, 'NonResidentBeneficiaryS98K'); // new
  const netSmallBusinessIncome = getDistributionComponent(components, 'netSmallBusinessIncome'); // new
  const Div6AAEligibleIncome = getDistributionComponent(components, 'Div6AAEligibleIncome'); // new
  const totalTFNWithheldFromATP = getDistributionComponent(components, 'totalTFNWithheldFromATP'); // new

  // Non-Cash Capital Gains / Losses
  const ncDiscountedCapitalGain = getDistributionComponent(components, 'ncDiscountedCapitalGain');
  const ncCapitalGainsIndexation = getDistributionComponent(components, 'ncCapitalGainsIndexation');
  const ncCapitalGainsOther = getDistributionComponent(components, 'ncCapitalGainsOther');
  const ncCapitalLosses = getDistributionComponent(components, 'ncCapitalLosses');

  const entry = {
    'amount': null,
    'cgtGroupRef': null,
    'commutationFlag': null,
    'defaultBankAccountFlag': null,
    'editable': true,
    'entryDTO': {
      'accountName': null,
      'amitExcess': amitExcess,
      'amitShortfall': amitShortfall,
      'amount': amount,
      'assessForSourceIncome': assessableForeignSourceIncome,
      'assessForSourceIncomeAFCNZ': ausFrankingCreditFromNZ,
      'assessForSourceIncomeForOffset': foreignIncomeTaxPaidOffset,
      'cashDistribution': '0E-19',
      'cgIndexationMethod': capitalGainIndexation,
      'cgIndexationMethodNTARP': null,
      'cgIndexationMethodTARP': null,
      'cgOtherMethod': capitalGainOther,
      'cgOtherMethodNTARP': null,
      'cgOtherMethodTARP': null,
      'cgtConcessionAmnt': cgtConcessionAmount,
      'chartCode': `${acc.pcode.split('/')[0]}`,
      'costBaseLinkage': null,
      'discountCgNTARP': null,
      'discountCGT': discountedCapitalGain,
      'discountCgTARP': null,

      'discountRate': discountedCapitalGainRate,

      'divFrankCred': frankingCredit,
      'divFrankDist': frankedDividend,
      'divUnfrankDist': unfrankedDividend,
      'foreignDiscountedCapitalGains': foreignDiscountedCapitalGain,
      'foreignDiscountedCapitalGainsForOffset': foreignDiscountedCapitalGainOffset,
      'foreignIndexationCapitalGains': foreignCapitalGainIndexation,
      'foreignIndexationCapitalGainsForOffset': foreignCapitalGainIndexationOffset,
      'foreignOtherCapitalGains': foreignCapitalGainOther,
      'foreignOtherCapitalGainsForOffset': foreignCapitalGainOtherOffset,
      'gstAmount': '0.00',
      'id': null,
      'interest': interest,
      'isInterest': false,
      'isNonResident': false,
      'ncCapitalLosses': ncCapitalLosses,
      'ncCGIndexationMethod': ncCapitalGainsIndexation,
      'ncCGOtherMethod': ncCapitalGainsOther,
      'ncDiscountedCG': ncDiscountedCapitalGain,
      'nonresidentWithheldTax': null,
      'otherExpenses': otherExpenses,
      'otherInc': otherIncome,
      'otherNetForeignSourceIncome': otherNetForeignSourceIncome,
      'recordDate': `${transactionDate}${DATE_SUFFIX}`,
      'subType': 'DistributionInterest',
      'taccId': acc.id,
      'taxDeferrAmounts': taxDefer,
      'taxExemptAmounts': taxExempted,
      'taxFreeAmounts': taxFree,
      'tfnAmountsWithheld': tfnAmountsWithheld,
      'trustDeductns': trustDeduction,
      // new
      'nppNCMI': otherIncomeNCMI,
      'nppExcNCMI': otherIncomeExcNCMI,
      'ppExcNCMI': primaryProductionIncomeExcNCMI,
      'ppNCMI': primaryProductionIncomeNCMI,
      'otherPPIncome': otherPrimaryProductionIncome,
      'discountGainNCMI': discountedGainNCMI,
      'discountGainExcNCMI': discountedGainExcNCMI,
      'otherGainNCMI': otherGainNCMI,
      'otherGainExcNCMI': otherGainExcNCMI,
      'cfcIncome': CFCIncome,
      'abnWithheldTax': lessABNNotQuotedTaxWithheld,
      'foreignResidentCGWithheldTax': foreignResidentCGWithholding,
      'tfnWithheldCloselyHeldTrust': shareCreditsTFNWithheldPaymentFromCHT,
      'capitalLossApplied': capitalLossApplied,
      'smallBusinessConcession': smallBusinsessCGTConcession,
      'earlyStageVentureCapitalOffset': earlyStageVentureCapitalTaxOffset,
      'earlyStageInvestorOffset': earlyStageInvestorTaxOffset,
      'explorationCredits': explorationCreditsDistributed,
      'nationalRentalOffset': nationalRentalTaxOffset,
      's98J': NonResidentBeneficiaryS98J,
      's98K': NonResidentBeneficiaryS98K,
      'smallBusinessIncome': netSmallBusinessIncome,
      'div6AA': Div6AAEligibleIncome,
      'tfnWithheldTrusteePayment': totalTFNWithheldFromATP
    },
    'entryId': null,
    'fundId': null,
    'id': null,
    'originalTransId': null,
    'seqNum': 1,
    'taxInstalmentRefFlag': null,
    'transactionDate': null,
    'type': 'DistributionInterest',
    'unallocatedEntry': false,
    'units': null,
    'visible': true
  }
  return entry;
}

async function addDistribution(transactionDate, description, accountCode, amount, components) {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, amount),
    createDistributionInterestEntry(transactionDate, accountCode, amount * -1, components)
  ]);

  return await transUtil.addBankTransaction(transactionDate, description, entries);
}

async function addDistributionAccrual(transactionDate, description, accountCode, amount, components, generalAccountCode) {
  const entries = await Promise.all([
    transUtil.createGeneralEntry(transactionDate, generalAccountCode, amount),
    createDistributionInterestEntry(transactionDate, accountCode, amount * -1, components)
  ]);

  return await transUtil.addGeneralJournal(transactionDate, description, entries);
}

async function addInterest(transactionDate, accountCode, amount) {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, amount),
    createDistributionInterestEntry(transactionDate, accountCode, amount * -1, { 'interest': amount })
  ]);

  return await transUtil.addBankTransaction(transactionDate, `Investment Interest for ${accountCode}`, entries);
}

async function verifyNetCash(financialYear, investmentCode, expectedNetCash) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response = await axios.get(url);
    assert.equal(response.status, 200, "Can not get PostAccrualData!!");
    let netCash = '';
    for (data of response.data) {
      if (data.investmentCode == investmentCode) {
        netCash = data.netCash;
        break;
      }
    }
    assert.equal(netCash, expectedNetCash, `The net cash of ${investmentCode} is not correct!!`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function verifyReceivableOB(financialYear, investmentCode, expectedReceivableOB) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response = await axios.get(url);
    assert.equal(response.status, 200, "Can not get PostAccrualData!!");
    let receivableOB = '';
    for (data of response.data) {
      if (data.investmentCode == investmentCode) {
        receivableOB = data.receivableOB;
        break;
      }
    }
    assert.equal(receivableOB, expectedReceivableOB, `The receivable OB of ${investmentCode} is not correct!!`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function verifyReverseAccrual(financialYear, investmentCode, expectedReverseAccrual) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response = await axios.get(url);
    assert.equal(response.status, 200, "Can not get PostAccrualData!!");
    let reverseAccrual = '';
    for (data of response.data) {
      if (data.investmentCode == investmentCode) {
        reverseAccrual = data.reverseAccrual;
        break;
      }
    }
    assert.equal(reverseAccrual, expectedReverseAccrual, `The reverse accrual of ${investmentCode} is not correct!!`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function verifyBankReceipt(financialYear, investmentCode, expectedBankReceipt) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response = await axios.get(url);
    assert.equal(response.status, 200, "Can not get PostAccrualData!!");
    let bankReceipt = '';
    for (data of response.data) {
      if (data.investmentCode == investmentCode) {
        bankReceipt = data.bankReceipt;
        break;
      }
    }
    assert.equal(bankReceipt, expectedBankReceipt, `The bank receipt of ${investmentCode} is not correct!!`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function verifyAccrualDebit(financialYear, investmentCode, expectedAccrualDebit) {
  try {
    const url = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response = await axios.get(url);
    assert.equal(response.status, 200, "Can not get PostAccrualData!!");
    let receivableDebits = '';
    for (data of response.data) {
      if (data.investmentCode == investmentCode) {
        receivableDebits = data.receivableDebits;
        break;
      }
    }
    assert.equal(receivableDebits, expectedAccrualDebit, `The accrual debit of ${investmentCode} is not correct!!`);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function postYearEndAccrual(financialYear, investmentCode) {
  try {
    const url1 = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/getPostAccrualData/${financialYear}?${getAPIParams()}`;
    const response1 = await axios.get(url1);
    assert.equal(response1.status, 200, "Can not get PostAccrualData!!");

    const requestBody = [];
    let counter = 0;
    for (data of response1.data) {
      if (investmentCode.includes(data.investmentCode)) {
        counter = counter + 1;
        const rb = {
          "incomeAccountId": data.incomeAccountId,
          "accrualAccountId": data.accrualAccountId,
          "accrualAmount": data.netCash,
          "investmentCode": data.investmentCode,
          "fYear": data.fYear
        };
        requestBody.push(rb);
      }
    }
    if (counter != investmentCode.length)
      console.log('WARNING: CAN NOT FIND ALL INVESTMENT CODES IN THE TEST DATA!!')

    const url2 = `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/postYearEndAccrual/?${getAPIParams()}`;
    const response2 = await axios.post(url2, requestBody);
    assert.equal(response2.status, 200, "Can not post the year end accrual!!");
    await testUtil.sleep(waitTime.superLong);
  }
  catch (error) {
    throw testUtil.createErrorForAxios(error);
  }
}

async function createDividendEntry(transactionDate, accountCode, amount, components) {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode);

  const unfrankedDividend = getDistributionComponent(components, 'unfrankedDividend');
  const frankedDividend = getDistributionComponent(components, 'frankedDividend');
  const frankingCredit = getDistributionComponent(components, 'frankingCredit');

  const forIncome = getDistributionComponent(components, 'foreignSourceIncome');
  const forIncomeTaxOffset = getDistributionComponent(components, 'foreignIncomeTaxOffset');
  const nzFrankingCredit = getDistributionComponent(components, 'ausFrankingCreditFromNZ');

  const tfnAmountsWithheld = getDistributionComponent(components, 'tfnAmountsWithheld');
  const nonResidentWithholdingTax = getDistributionComponent(components, 'foreignResidentWithholding');
  const licDeduct = getDistributionComponent(components, 'licDeduction');

  const entry = {
    id: null,
    type: 'Dividend',
    entryId: null,
    entryDTO: {
      subType: 'Dividend',
      divFrankedCashDist: frankedDividend,
      divFrankedCredits: frankingCredit,
      divUnfrankedCashDist: unfrankedDividend,
      foreignSourceIncome: forIncome,
      foreignIncomeTaxOffset: forIncomeTaxOffset,
      assessForSourceIncomeAFCNZ: nzFrankingCredit,
      tfnAmountsWithheld: tfnAmountsWithheld,
      nonResidentWithholdingTax: nonResidentWithholdingTax,
      licDeduct: licDeduct,
      id: null,
      taccId: acc.id,
      chartCode: "23900",
      accountName: null,
      amount: amount,
      gstAmount: null,
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
    unallocatedEntry: false,
  };
  return entry;
}

async function addDividend(transactionDate, description, accountCode, amount, components) {
  const entries = await Promise.all([
    transUtil.createBankEntry(transactionDate, amount),
    createDividendEntry(transactionDate, accountCode, amount * -1, components)
  ]);

  return await transUtil.addBankTransaction(transactionDate, description, entries);
}

async function createRentalEntry(transactionDate, accountCode, amount) {
  const acc = await transUtil.getChartAccount(transactionDate, accountCode);

  const entry = {
    id: null,
    type: "Rent",
    entryId: null,
    entryDTO: {
      subType: "Rent",
      foreignIncome: null,
      foreignIncomeTaxCredits: null,
      id: null,
      taccId: acc.id,
      chartCode: "28000",
      accountName: null,
      amount: amount,
      gstAmount: "0.00",
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
    unallocatedEntry: false,
  };
  return entry;
}

export default {
  addDistribution,
  addInterest,
  addInvestmentDisposal,
  addInvestmentInstalment,
  addInvestmentPurchase,
  addInvestmentReturnOfCapital,
  addMultipleInvestmentPurchase,
  verifyNetCash,
  verifyReceivableOB,
  addDistributionAccrual,
  verifyReverseAccrual,
  verifyBankReceipt,
  verifyAccrualDebit,
  postYearEndAccrual,
  addDividend,
  createDistributionInterestEntry,
  createDividendEntry,
  createRentalEntry,
  createInvestmentPurchaseEntry,
  createInvestmentDisposalEntry
};
