import { _, axios, expect } from "../lib/util.js";
import { context } from "../data/context.js";
import testUtil from './test-util.js';
import * as firmUtil from './firm-util.js';

const DATE_SUFFIX = context.Constants.DATE_SUFFIX;

const REPORT_NAMES = {
  CAPITAL_GAIN_RECONCILIATION: "CapitalGainsReconciliation",
  CGT_REGISTER: "CGTRegister",
  DISTRIBUTION_RECONCILIATION_REPORT: "DistributionReconciliationReport",
  INVESTMENT_INCOME: "InvestmentIncome",
  INVESTMENT_SUMMARY: "InvestmentSummary",
  MEMBERS_STATEMENT: "MembersStatement",
  OPERATING_STATEMENT: "OperatingStatement",
  REALISED_CAPITAL_GAIN: "RelaisedCapitalGainWPReport",
  STATEMENT_OF_FINANCIAL_POSITION: "BalanceSheet",
  TRANSACTION_LIST: "TransactionList",
  TRANSFER_BALANCE_ACCOUNT: "TransferBalanceAccount",
  TRIAL_BALANCE: "TrialBalance",
  UNREALISED_CAPITAL_GAIN: "ProjectedInvestmentDisposal",
  UNREALISED_CAPITAL_GAIN_DETAILED: "UnrealisedCapitalGainsDetailed"
}

function getAPIParams() {
  return `firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`;
}

function createReportSettings(fromDate, toDate) {
  return new Promise((resolve, reject) => {
    firmUtil.getBadgeNames().then(function (badges) {
      expect(badges.length).to.be.at.least(
        1,
        `There should be at least one badge`
      );

      const settings = {
        fundId: context.TestConfig.entityId,
        fromDate: `${fromDate}${DATE_SUFFIX}`,
        toDate: `${toDate}${DATE_SUFFIX}`,
        dateFormed: null,
        badgeId: badges[0].id,
        memberAccountId: null
      };
      resolve(settings);
    }).catch(error => {
      reject(testUtil.createErrorForAxios(error));
    });
  });
}

function getJSONReportPromise(reportName, fromDate, toDate) {
  return new Promise((resolve, reject) => {
    createReportSettings(fromDate, toDate).then(function (settings) {
      if (!Object.values(REPORT_NAMES).includes(reportName)) {
        reject(new Error(`Unsupported report ${reportName}`));
        return;
      }

      axios
        .post(
          `${
          context.TestConfig.serverURL
          }/d/Reports/fundData/${reportName}/get/${context.TestConfig.entityId}.json?${getAPIParams()}`,
          settings
        )
        .then(response => {
          expect(response.status).to.eql(200, `Get ${reportName}`);
          resolve(response.data);
        })
        .catch(error => {
          reject(testUtil.createErrorForAxios(error));
        });
    }).catch(error => {
      reject(testUtil.createErrorForAxios(error));
    });
  });
}

async function getJSONReport(reportName, fromDate, toDate) {
  try {
    const response = await getJSONReportPromise(reportName, fromDate, toDate);
    return response;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

export {
  REPORT_NAMES,
  getJSONReport
};
