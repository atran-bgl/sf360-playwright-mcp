import * as transUtil from './transaction-util.js';
import * as investTransUtil from './investment-transaction-util.js';

/**
 * All amounts can be positive or negative
 * Positive amount means debit
 * Negative amount means credit
 * Total amount must be balanced
 */
async function addTransactionWithMultiEntries(inputs) {
    const transactionDate = inputs.transactionDate;
    const entries = [];
    let createBankTransaction = false;

    for (const e of inputs.transactionEntryList) {
        let tranEntry;
        switch (e.entryType) {
            case 'Bank':
                tranEntry = await transUtil.createBankEntry(transactionDate, e.amount, e.chartAccountCode);
                createBankTransaction = (inputs.transactionEntryList.indexOf(e) === 0);
                break;
            case 'General':
                tranEntry = await transUtil.createGeneralEntry(transactionDate, e.chartAccountCode, e.amount);
                break;
            case 'Distribution':
                tranEntry = await investTransUtil.createDistributionInterestEntry(transactionDate, e.chartAccountCode, e.amount, e.components);
                break;
            case 'Interest':
                tranEntry = await investTransUtil.createDistributionInterestEntry(transactionDate, e.chartAccountCode, e.amount, { interest: Math.abs(e.amount) });
                break;
            case 'Dividend':
                tranEntry = await investTransUtil.createDividendEntry(transactionDate, e.chartAccountCode, e.amount, e.components);
                break;
            case 'Rental':
                tranEntry = await investTransUtil.createRentalEntry(transactionDate, e.chartAccountCode, e.amount);
                break;
            case 'Disposal':
                tranEntry = await investTransUtil.createInvestmentDisposalEntry(transactionDate, e.chartAccountCode, e.unit, e.amount, e.disposalMethod);
                break;
            case 'Purchase':
                tranEntry = await investTransUtil.createInvestmentPurchaseEntry(transactionDate, e.chartAccountCode, e.unit, e.amount, e.isAssetToCGT);
                break;
            default:
                throw new Error(`Unsupported transaction entry type:${e.entryType}`);
        }
        entries.push(tranEntry);
    }

    if (createBankTransaction) {
        return await transUtil.addBankTransaction(transactionDate, inputs.transactionDescription, entries, inputs.transactionReference);
    }
    else if (inputs.transactionType == "Depreciation") {
        return await transUtil.addDepreciationJournal(transactionDate, inputs.transactionDescription, entries, inputs.transactionReference);
    }
    else {
        return await transUtil.addGeneralJournal(transactionDate, inputs.transactionDescription, entries, inputs.transactionReference);
    }
}


export {
    addTransactionWithMultiEntries
  };
