import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { NewMemberPage } from '../../pages/member/NewMemberPage.js';
import { ContactsPage } from '../../pages/settings/contactsPage.js';
import { context } from '../../data/context.js';
import testUtil from '../../lib/test-util.js';
import * as firmUtil from '../../lib/firm-util.js';
import contactUtil from '../../lib/contact-util.js';
import complianceUtil from '../../lib/compliance-util.js';
import transUtil from '../../lib/transaction-util.js';
import chartUtil from '../../lib/chart-util.js';
import memberUtil from '../../lib/member-util.js';
import { assert } from '../../lib/util.js';

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { waitTime } = context.TestSettings;

test.describe('new memember screen tests: ', () => {
  let testFirm;
  let page;
  let newMemberPage;

  const entity = {
    entityCode: 'NewMember001',
    entityName: 'fund for new member dashboard tests',
    entityType: "SMSF",
    financialYearToStart: 2025,
    bankBalanceToStart: 2565311.65
  };
  context.TestConfig.financialYear = entity.financialYearToStart;

  const allContacts = [
    {
      entityType: "People",
      firstname: 'member1',
      surname: 'newMemberTest',
      sex: "MALE",
      birthday: '1965-06-30',
      mobileNumber: '61413257208',
      email: 'member1@123.com',
      tfn: '999999531',
      createBeforeTest: true
    },
    {
      entityType: "People",
      firstname: 'member2',
      surname: 'newMemberTest',
      sex: "FEMALE",
      birthday: '1957-04-01',
      mobileNumber: '61413257209',
      email: 'member2@123.com',
      tfn: '999999791',
      createBeforeTest: true
    },
    {
      entityType: "People",
      firstname: 'member3',
      surname: 'newMemberTest',
      birthday: '1985-10-30',
      createBeforeTest: false
    },
    {
      entityType: "People",
      firstname: 'member4',
      surname: 'newMemberTest',
      birthday: '1960-06-15',
      createBeforeTest: false
    }
  ];

  const allAccumulationAccounts =
    [
      {
        personalDetails: {
          contact: allContacts[0],
          newContact: allContacts[0].createBeforeTest ? false : true,
          firstName: allContacts[0].firstname, // mandatory field
          surname: allContacts[0].surname, // mandatory field
          mobile: allContacts[0].mobileNumber == undefined ? '' : allContacts[0].mobileNumber,
          email: allContacts[0].email == undefined ? '' : allContacts[0].email,
          dob: `${allContacts[0].birthday.split('-')[2]}/${allContacts[0].birthday.split('-')[1]}/${allContacts[0].birthday.split('-')[0]}`, // mandatory field
          tfn: allContacts[0].tfn == undefined ? '' : allContacts[0].tfn
        },
        accountDetails: {
          accountType: 'Accumulation',
          accountDescription: 'Accumulation',
          memberCode: '', // to be filled in test
          accountStartDate: '01/07/2024',
          servicePeriodStartDate: '01/07/1990'
        },
        newMemberBalance: {
          postBalance: true,
          amount: '599986.63',
          balanceDate: '01/07/2024',
          balanceComponents: {
            taxFree: '156956.35',
            taxed: '6395.22',
            untaxed: '436635.06',
            preserved: '55968.33',
            restrictedNonPreserved: '123254.35',
            unrestrictedNonPreserved: '420763.95'
          },
          expectedBalanceComponents: {
            taxFree: '156,956.35',
            taxed: '377,535.02',
            untaxed: '',
            totalTaxComponents: 'Total Tax Components: $ 534,491.37',
            preserved: '-9,526.93',
            restrictedNonPreserved: '123,254.35',
            unrestrictedNonPreserved: '420,763.95',
            totalPreservationComponents: 'Total Preservation Components: $ 534,491.37'
          },
          expectedBalanceComponentsAfterCE: {
            taxFree: '58,858.63',
            taxed: '141,575.63',
            untaxed: '',
            totalTaxComponents: 'Total Tax Components: $ 200,434.26',
            preserved: '-7,145.20',
            restrictedNonPreserved: '92,440.77',
            unrestrictedNonPreserved: '115,138.69',
            totalPreservationComponents: 'Total Preservation Components: $ 200,434.26'
          }
        },
        memberBeneficiaries: {
          effectiveDate: '05/07/2024',
          nominationType: 'Binding Death Benefit - Non-Lapsing',
          defaultExpiryDate: '',
          beneficiaries: [
            {
              name: 'newMemberTest, member2',
              relationship: 'Spouse/De Facto',
              proportion: '100',
              tier: 'First'
            }
          ]
        },
        financialDetails: [
          { name: 'Current Salary', value: '53365.36', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
          { name: 'Previous Salary', value: '41365.22', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
          { name: 'Death Benefit', value: '276359.34', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
          { name: 'Disability Benefit', value: '140678.66', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
          { name: 'Centrelink Product Reference', value: '501', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false },
          { name: 'Centrelink Original Purchase Price', value: '100085.33', showOnStatementDefault: 'N/A', showOnStatement: 'N/A', custom: false },
          { name: "Employer's ABN", value: '84111122223', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false },
          // { name: 'Death Benefit Pension', value: 'Yes', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false }, // not be available for Accumulation account
          { name: 'Salary Continuance', value: '23489.22', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false },
          { name: 'AutoTestCustom', value: '101.33', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: true }
        ],
        edit: {
          newMobile: '61413251111',
          newServicePeriodStartDate: '01/07/1985',
          newBalanceComponents: {
            expectedTransactionDate: '30/06/2025',
            expectedBalance: 'Balance: $200,434.26',
            expectedLastCreateEntriesDate: '30/06/2025',
            balanceComponents: {
              taxFree: '48858.63',
              taxed: '141575.63',
              untaxed: '10000.00',
              preserved: '-8145.20',
              restrictedNonPreserved: '93440.77',
              unrestrictedNonPreserved: '115138.69'
            },
            expectedBalanceComponents: {
              taxFree: '48,858.63',
              taxed: '141,575.63',
              untaxed: '10,000.00',
              totalTaxComponents: 'Total Tax Components: $ 200,434.26',
              preserved: '-8,145.20',
              restrictedNonPreserved: '93,440.77',
              unrestrictedNonPreserved: '115,138.69',
              totalPreservationComponents: 'Total Preservation Components: $ 200,434.26'
            }
          },
          newMemberBeneficiaries:
            [
              {
                name: 'newMemberTest, member2',
                relationship: 'Spouse/De Facto',
                proportion: '65.5',
                tier: 'First'
              },
              {
                name: 'newMemberTest, member3',
                relationship: 'Child of Any Age',
                proportion: '34.5',
                tier: 'First'
              },
              {
                name: 'newMemberTest, member4',
                relationship: 'Financially Dependant',
                proportion: '100',
                tier: 'Second'
              }
            ],
          documentName: 'memberDocument.pdf',
          notes: 'Notes for auto test.',
          newFinancialDetails:
            [
              { name: 'Current Salary', value: '197767.89', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
              { name: 'Previous Salary', value: '171365.22', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
              { name: "Employer's ABN", value: '12004045634', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false }
            ]

        }
      },
      {
        personalDetails: {
          contact: allContacts[2],
          newContact: allContacts[2].createBeforeTest ? false : true,
          firstName: allContacts[2].firstname, // mandatory field
          surname: allContacts[2].surname, // mandatory field
          mobile: allContacts[2].mobileNumber == undefined ? '' : allContacts[2].mobileNumber,
          email: allContacts[2].email == undefined ? '' : allContacts[2].email,
          dob: `${allContacts[2].birthday.split('-')[2]}/${allContacts[2].birthday.split('-')[1]}/${allContacts[2].birthday.split('-')[0]}`, // mandatory field
          tfn: allContacts[2].tfn == undefined ? '' : allContacts[2].tfn
        },
        accountDetails: {
          accountType: 'Accumulation',
          accountDescription: 'Accumulation',
          memberCode: '', // to be filled in test
          accountStartDate: '01/01/2025',
          servicePeriodStartDate: '31/07/2018'
        },
        newMemberBalance: {
          postBalance: false,
        },
        memberBeneficiaries: {
          effectiveDate: '',
          nominationType: '',
          defaultExpiryDate: '',
          beneficiaries: []
        },
        financialDetails: []
      }
    ];

  const allNewPensionAcounts =
    [
      {
        selectAccumulationAccount: { // all fields mandatory
          accumulationAccount: allAccumulationAccounts[0],
          commencementDate: '02/07/2024',
          pensionType: 'Transition To Retirement',
          originalTerm: '',
          expectedAccountDescription: 'TRIS 0001',
          expectedConditionOfRelease: 'Attaining preservation age',
        },
        commencementBalance: {
          fullBalance: false,
          ceaseAccumulationAccount: false,
          percentageOfBalance: '50',
          specificAmount: 'N/A',
          maintainCuttentPreservationComponents: false,
          expectedTaxFreeProportion: '29.37',
        },
        expectedBalanceComponents: {
          taxFree: '78,478.18',
          taxed: '188,767.51',
          untaxed: '0.00',
          totalTaxComponents: 'Total Tax Components: $ 267,245.69',
          preserved: '0.00',
          restrictedNonPreserved: '0.00',
          unrestrictedNonPreserved: '267,245.69',
          totalPreservationComponents: 'Total Preservation Components: $ 267,245.69'
        },
        expectedTransferBalanceAccountDetails: {
          event: '',
          effectiveDate: '',
          currentBalance: '',
          capLimit: '',
          capRemainingBefore: '',
          capRemainingAfter: ''
        },
        memberBeneficiaries: {
          deathBenefitNomination: {
            effectiveDate: '05/07/2024',
            nominationType: 'Binding Death Benefit - Non-Lapsing',
            defaultExpiryDate: '',
            beneficiaries: [
              {
                name: 'newMemberTest, member2',
                relationship: 'Spouse/De Facto',
                proportion: '100',
                tier: 'First'
              },
              {
                name: 'newMemberTest, member3',
                relationship: 'Child of Any Age',
                proportion: '100',
                tier: 'Second'
              }
            ]
          },
          reversionaryNomination: [
            {
              name: 'newMemberTest, member2',
              relationship: 'Spouse/De Facto',
              proportion: '100'
            }
          ]
        }
      },
      {
        selectAccumulationAccount: { // all fields mandatory
          accumulationAccount: allAccumulationAccounts[0],
          commencementDate: '03/02/2025',
          pensionType: 'TRIS (Retirement Phase)',
          originalTerm: '',
          expectedAccountDescription: 'TRIS Pension 0001',
          conditionOfRelease: 'Retirement',
        },
        commencementBalance: {
          fullBalance: false,
          ceaseAccumulationAccount: false,
          percentageOfBalance: 'N/A',
          specificAmount: '66811.42',
          maintainCuttentPreservationComponents: true,
          expectedTaxFreeProportion: '29.37',
        },
        expectedBalanceComponents: {
          taxFree: '19,619.54',
          taxed: '47,191.88',
          untaxed: '0.00',
          totalTaxComponents: 'Total Tax Components: $ 66,811.42',
          preserved: '-2,381.73',
          restrictedNonPreserved: '30,813.58',
          unrestrictedNonPreserved: '38,379.57',
          totalPreservationComponents: 'Total Preservation Components: $ 66,811.42'
        },
        expectedTransferBalanceAccountDetails: {
          event: 'SIS - Superannuation Income Stream',
          effectiveDate: '',
          currentBalance: '$ 0.00',
          capLimit: '$ 1,900,000.00',
          capRemainingBefore: '$ 1,900,000.00',
          capRemainingAfter: '$ 1,833,188.58'
        },
        memberBeneficiaries: {
          deathBenefitNomination: {
            effectiveDate: '03/02/2025',
            nominationType: 'Binding Death Benefit - Lapsing',
            defaultExpiryDate: '02/02/2028',
            beneficiaries: [
              {
                name: 'newMemberTest, member2',
                relationship: 'Spouse/De Facto',
                proportion: '80',
                tier: 'First'
              },
              {
                name: 'newMemberTest, member3',
                relationship: 'Child of Any Age',
                proportion: '20',
                tier: 'First'
              }
            ]
          },
          reversionaryNomination: [
            {
              name: 'newMemberTest, member2',
              relationship: 'Spouse/De Facto',
              proportion: '80'
            },
            {
              name: 'newMemberTest, member3',
              relationship: 'Child - age 18 - 25 and financially dependent',
              proportion: '20'
            }
          ]
        }
      }
    ];

  const allExistingPensionAcounts =
    [
      {
        personalDetails: {
          contact: allContacts[1],
          newContact: allContacts[1].createBeforeTest ? false : true,
          firstName: allContacts[1].firstname, // mandatory field
          surname: allContacts[1].surname, // mandatory field
          mobile: allContacts[1].mobileNumber == undefined ? '' : allContacts[1].mobileNumber,
          email: allContacts[1].email == undefined ? '' : allContacts[1].email,
          dob: `${allContacts[1].birthday.split('-')[2]}/${allContacts[1].birthday.split('-')[1]}/${allContacts[1].birthday.split('-')[0]}`, // mandatory field
          tfn: allContacts[1].tfn == undefined ? '' : allContacts[1].tfn
        },
        accountDetails: {
          accountType: 'Pension',
          pensionType: 'Account Based Pension',
          sex: '',
          originalTerm: '',
          accountDescription: 'ABP 0001',
          memberCode: '', // to be filled in test
          accountStartDate: '31/07/2024',
          servicePeriodStartDate: '01/06/1981',
          conditionOfRelease: 'Attaining Age 65'
        },
        newMemberBalance: {
          postBalance: true,
          amount: '1965325.02',
          balanceDate: '01/08/2024',
          balanceComponents: {
            taxFree: '650235.33',
            taxed: '315089.69',
            untaxed: '1000000.00',
            preserved: '956312.33',
            restrictedNonPreserved: '9012.69',
            unrestrictedNonPreserved: '1000000.00'
          },
          expectedBalanceComponents: {
            taxFreeProportion: '33.09',
            taxFree: '650,235.33',
            taxed: '315,089.69',
            untaxed: '1,000,000.00',
            totalTaxComponents: 'Total Tax Components: $ 1,965,325.02',
            preserved: '956,312.33',
            restrictedNonPreserved: '9,012.69',
            unrestrictedNonPreserved: '1,000,000.00',
            totalPreservationComponents: 'Total Preservation Components: $ 1,965,325.02'
          },
          expectedBalanceComponentsAfterCE: {
            taxFree: '650,235.33',
            taxed: '315,089.69',
            untaxed: '1,000,000.00',
            totalTaxComponents: 'Total Tax Components: $ 1,965,325.02',
            preserved: '',
            restrictedNonPreserved: '',
            unrestrictedNonPreserved: '1,965,325.02',
            totalPreservationComponents: 'Total Preservation Components: $ 1,965,325.02'
          }
        },
        memberBeneficiaries: {
          deathBenefitNomination: {
            effectiveDate: '15/07/2013',
            nominationType: 'Binding Death Benefit - Lapsing',
            defaultExpiryDate: '14/07/2016',
            beneficiaries: [
              {
                name: 'newMemberTest, member1',
                relationship: 'Spouse/De Facto',
                proportion: '100',
                tier: 'First'
              },
              {
                name: 'newMemberTest, member3',
                relationship: 'Child of Any Age',
                proportion: '100',
                tier: 'Second'
              }
            ]
          },
          reversionaryNomination: [
            {
              name: 'newMemberTest, member1',
              relationship: 'Spouse/De Facto',
              proportion: '100'
            }
          ]
        },
        financialDetails: [
          { name: 'Current Salary', value: '53365.36', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
          { name: 'Previous Salary', value: '41365.22', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
          { name: 'Death Benefit', value: '276359.34', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
          { name: 'Disability Benefit', value: '140678.66', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
          { name: 'Centrelink Product Reference', value: '502', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false },
          { name: 'Centrelink Original Purchase Price', value: '96512.33', showOnStatementDefault: 'N/A', showOnStatement: 'N/A', custom: false },
          { name: "Employer's ABN", value: '84111122223', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false },
          { name: 'Death Benefit Pension', value: 'No', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false }, // not be available for Accumulation account
          { name: 'Salary Continuance', value: '23489.22', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false },
          { name: 'AutoTestCustom', value: '101.33', showOnStatementDefault: 'No', showOnStatement: 'No', custom: true }
        ],
        adjustmentInputsTBARCap: {
          "entryDate": "31/07/2024",
          "lodgementDueDate": "29/10/2024",
          "transactionType": "Add Existing Pension",
          "memberAccountCode": "", // to be filled in test
          "eventType": "SIS",
          "debit": 0,
          "credit": "1965325.02",
          "financialYear": entity.financialYearToStart
        },
        edit: {
          newEmail: 'member2A@123.com',
          newAccountDescription: 'ABP 0001A',
          newBalanceComponents: {
            expectedTransactionDate: '30/06/2025',
            expectedBalance: 'Balance: $1,965,325.02',
            expectedTaxFreeProportion: '33.09',
            expectedLastCreateEntriesDate: `30/06/2025`,
            balanceComponents: {
              taxFreeProportion: '50',
              preserved: '200000',
              restrictedNonPreserved: '800000',
              unrestrictedNonPreserved: '965325.02'
            },
            expectedBalanceComponents: {
              taxFreeProportion: '50',
              taxFree: '982,662.51',
              taxed: '235,441.61',
              untaxed: '747,220.90',
              totalTaxComponents: 'Total Tax Components: $ 1,965,325.02',
              preserved: '200,000.00',
              restrictedNonPreserved: '800,000.00',
              unrestrictedNonPreserved: '965,325.02',
              totalPreservationComponents: 'Total Preservation Components: $ 1,965,325.02'
            }
          },
          newMemberBeneficiaries: {
            deathBenefitNomination: {
              effectiveDate: '01/07/2024',
              nominationType: 'Non-Binding Death Benefit - Lapsing',
              expiryDate: '30/06/2027',
              beneficiaries: [
                {
                  name: 'newMemberTest, member1',
                  relationship: 'Spouse/De Facto',
                  proportion: '80',
                  tier: 'First'
                },
                {
                  name: 'newMemberTest, member3',
                  relationship: 'Child of Any Age',
                  proportion: '20',
                  tier: 'First'
                },
                {
                  name: 'newMemberTest, member4',
                  relationship: 'Legal Personal Representative',
                  proportion: '100',
                  tier: 'Second'
                }
              ]
            },
            reversionaryNomination: [
              {
                name: 'newMemberTest, member1',
                relationship: 'Spouse/De Facto',
                proportion: '60'
              },
              {
                name: 'newMemberTest, member3',
                relationship: 'Child - severely disabled',
                proportion: '40'
              }
            ]
          },
          documentName: 'memberDocument1.pdf',
          notes: 'Notes for auto test1.',
          newFinancialDetails:
            [
              { name: 'Current Salary', value: '53365', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
              { name: 'Previous Salary', value: '41365', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
              { name: 'Death Benefit', value: '276359', showOnStatementDefault: 'Yes', showOnStatement: 'Yes', custom: false },
              { name: 'Disability Benefit', value: '140678', showOnStatementDefault: 'Yes', showOnStatement: 'No', custom: false },
              { name: 'Centrelink Product Reference', value: '503', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false },
              { name: 'Centrelink Original Purchase Price', value: '96512', showOnStatementDefault: 'N/A', showOnStatement: 'N/A', custom: false },
              { name: "Employer's ABN", value: '37111155556', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false },
              { name: 'Death Benefit Pension', value: 'Yes', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: false }, // not be available for Accumulation account
              { name: 'Salary Continuance', value: '23489', showOnStatementDefault: 'No', showOnStatement: 'No', custom: false },
              { name: 'AutoTestCustom1', value: '101', showOnStatementDefault: 'No', showOnStatement: 'Yes', custom: true }
            ]
        }
      },
      {
        personalDetails: {
          contact: allContacts[3],
          newContact: allContacts[3].createBeforeTest ? false : true,
          firstName: allContacts[3].firstname, // mandatory field
          surname: allContacts[3].surname, // mandatory field
          mobile: allContacts[3].mobileNumber == undefined ? '' : allContacts[3].mobileNumber,
          email: allContacts[3].email == undefined ? '' : allContacts[3].email,
          dob: `${allContacts[3].birthday.split('-')[2]}/${allContacts[3].birthday.split('-')[1]}/${allContacts[3].birthday.split('-')[0]}`, // mandatory field
          tfn: allContacts[3].tfn == undefined ? '' : allContacts[3].tfn
        },
        accountDetails: {
          accountType: 'Pension',
          pensionType: 'Market Linked Pension',
          sex: 'Female',
          originalTerm: '26',
          accountDescription: 'MKL 0001',
          memberCode: '', // to be filled in test
          accountStartDate: '01/08/2024',
          servicePeriodStartDate: '01/06/1982',
          conditionOfRelease: 'Retirement'
        },
        newMemberBalance: {
          postBalance: false,
          expectedBalanceComponents: {
            taxFreeProportion: '0'
          }
        },
        memberBeneficiaries: {
          deathBenefitNomination: {
            effectiveDate: '',
            nominationType: '',
            defaultExpiryDate: '',
            beneficiaries: []
          },
          reversionaryNomination: []
        },
        financialDetails: []
      }
    ];

  test.beforeAll(async ({ browser }, testInfo) => {
    // testInfo.setTimeout(300000); // beforeAll time out 5 mins
    console.log('initTest...');
    await testUtil.initTest();

    console.log('generateIdToken...');
    await testUtil.generateIdToken();

    console.log('readTestConfig...');
    await testUtil.readTestConfig();

    if (context.TestConfig.environment === 'uat') {
      testFirm = context.TestFirmFundNames.firms.firm4;
    } else if (context.TestConfig.environment === 'production') {
      testFirm = context.TestFirmFundNames.firms.firm7;
    }
    context.TestConfig.firm = testFirm.shortFirmName;

    const pageContext = await browser.newContext();
    page = await pageContext.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.login_api(testFirm.shortFirmName);

    newMemberPage = new NewMemberPage(page);

    console.log('Delete existing entity created in last test');
    await firmUtil.deleteEntities(entity.entityCode);

    console.log('Delete all contacts created in the last test');
    let contactNames = [];
    for (const contact of allContacts) contactNames.push(`${contact.surname}, ${contact.firstname}`);
    await contactUtil.deleteContactsByName(contactNames);

    console.log('Adding new entity for this test');
    await firmUtil.addEntity(entity);

    console.log('Create all contacts for the current test');
    for (const contact of allContacts) {
      if (contact.createBeforeTest)
        await contactUtil.addContact(contact);
    }

    console.log('Adding bank account for the test entity');
    const bankData = await chartUtil.addBankAccount();
    context.ShareData.bank = { pcode: bankData.pcode, id: bankData.id };

    if (entity.bankBalanceToStart) {
      console.log('Adding balance to bank account for member data clearing');
      await transUtil.addBankTransactionWithGeneralEntry(
        `${parseInt(entity.financialYearToStart) - 1}-07-01`,
        'Default bank balance to start test',
        entity.bankBalanceToStart,
        '94920');
    }
  });

  // add and review all types of accounts (accumulaton, existing pension, new pension)
  for (const [index, accumulationAcount] of allAccumulationAccounts.entries()) {
    test(`Save accumulation account${index + 1} ${accumulationAcount.newMemberBalance.postBalance ? "and enter a balance" : "and do not enter a balance"}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
      await expect(newMemberPage.button_AddNewMember).toBeEnabled();
      await page.waitForTimeout(waitTime.medium);
      await newMemberPage.button_AddNewMember.click();

      // Personal Details
      await expect(newMemberPage.input_SearchContact_AddNewMember).toBeVisible();
      await expect(newMemberPage.input_SearchContact_AddNewMember).toBeEnabled();
      await newMemberPage.input_SearchContact_AddNewMember.fill(`${accumulationAcount.personalDetails.surname}, ${accumulationAcount.personalDetails.firstName}`);

      if (accumulationAcount.personalDetails.newContact) {
        const newPagePromise = page.waitForEvent('popup'); // Wait for contact page to open
        await expect(newMemberPage.button_CreateNewContact_AddNewMember).toBeEnabled();
        await newMemberPage.button_CreateNewContact_AddNewMember.click(); // Click that opens the contact page
        const newPage = await newPagePromise;
        // Wait for the contact page to load
        await newPage.waitForLoadState();
        // Create a new contact
        const contactsPage = new ContactsPage(newPage);
        await expect(contactsPage.input_FirstName).toBeEnabled();
        await contactsPage.input_FirstName.fill(accumulationAcount.personalDetails.firstName);
        await expect(contactsPage.input_Surname).toBeEnabled();
        await contactsPage.input_Surname.fill(accumulationAcount.personalDetails.surname);
        await expect(contactsPage.input_DateOfBirth).toBeEnabled();
        await contactsPage.input_DateOfBirth.fill(accumulationAcount.personalDetails.dob);
        await expect(contactsPage.button_CreatePerson).toBeEnabled();
        await contactsPage.button_CreatePerson.click();
        // The contact page will be closed automatically
      } else {
        await expect(newMemberPage.option_FirstResult_SelectContact_AddNewMember).toHaveText(`${accumulationAcount.personalDetails.surname}, ${accumulationAcount.personalDetails.firstName}`);
        await newMemberPage.option_FirstResult_SelectContact_AddNewMember.click();
      }

      await expect(newMemberPage.heading_PersonalDetails_AddNewMember).toBeVisible();
      await page.waitForTimeout(waitTime.medium);
      await expect(newMemberPage.input_FirstName_AddNewMember).toHaveValue(accumulationAcount.personalDetails.firstName);
      await expect(newMemberPage.input_Surname_AddNewMember).toHaveValue(accumulationAcount.personalDetails.surname);
      await expect(newMemberPage.input_Mobile_AddNewMember).toHaveValue(accumulationAcount.personalDetails.mobile);
      await expect(newMemberPage.input_Email_AddNewMember).toHaveValue(accumulationAcount.personalDetails.email);
      await expect(newMemberPage.input_DOB_AddNewMember).toHaveValue(accumulationAcount.personalDetails.dob);
      await expect(newMemberPage.input_TFN_AddNewMember).toHaveValue(accumulationAcount.personalDetails.tfn);

      // Account Details
      await expect(newMemberPage.dropDownButton_SelectAccountType_AddNewMember).toBeEnabled();
      await newMemberPage.dropDownButton_SelectAccountType_AddNewMember.click();
      await expect(newMemberPage.option_Accumulation_SelectAccountType_AddNewMember).toBeVisible();
      await newMemberPage.option_Accumulation_SelectAccountType_AddNewMember.click();

      await expect(newMemberPage.input_AccountDescription_AddNewMember).toHaveValue(accumulationAcount.accountDetails.accountDescription);
      await page.waitForTimeout(waitTime.medium);
      allAccumulationAccounts[index].accountDetails.memberCode = await newMemberPage.input_MemberCode_AddNewMember.inputValue();
      console.log('Member Account Code ---> ', allAccumulationAccounts[index].accountDetails.memberCode);
      expect(allAccumulationAccounts[index].accountDetails.memberCode).toMatch(/^[A-Z0-9]{12}$/);

      await newMemberPage.input_AccountStartDate_AddNewMember.fill(accumulationAcount.accountDetails.accountStartDate);
      await newMemberPage.input_ServicePeriodStartDate_AddNewMember.fill(accumulationAcount.accountDetails.servicePeriodStartDate);

      // New Member Balance
      if (accumulationAcount.newMemberBalance.postBalance) {
        await expect(newMemberPage.sliderButton_PostMemberBalance_AddNewMember).toBeEnabled();
        await newMemberPage.sliderButton_PostMemberBalance_AddNewMember.click();

        await expect(newMemberPage.input_Amount_Accumulation_AddNewMember).toBeEnabled();
        await newMemberPage.input_Amount_Accumulation_AddNewMember.fill(accumulationAcount.newMemberBalance.amount);
        await newMemberPage.input_Amount_Accumulation_AddNewMember.press('Tab');

        await expect(newMemberPage.input_BalanceDate_AddNewMember).toBeEnabled();
        const balanceDate = await newMemberPage.input_BalanceDate_AddNewMember.inputValue();
        if (balanceDate != accumulationAcount.newMemberBalance.balanceDate)
          await newMemberPage.input_BalanceDate_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceDate);

        // Balance Components
        await expect(newMemberPage.input_TaxFree_AddNewMember).toBeEnabled();
        await newMemberPage.input_TaxFree_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.taxFree);
        await expect(newMemberPage.input_Taxed_AddNewMember).toBeEnabled();
        await newMemberPage.input_Taxed_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.taxed);
        await expect(newMemberPage.input_Untaxed_AddNewMember).toBeEnabled();
        await newMemberPage.input_Untaxed_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.untaxed);
        await expect(newMemberPage.input_Preserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_Preserved_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.preserved);
        await expect(newMemberPage.input_RestrictedNonPreserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_RestrictedNonPreserved_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.restrictedNonPreserved);
        await expect(newMemberPage.input_UnrestrictedNonPreserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_UnrestrictedNonPreserved_AddNewMember.fill(accumulationAcount.newMemberBalance.balanceComponents.unrestrictedNonPreserved);
      }

      // Member Beneficiaries
      if (accumulationAcount.memberBeneficiaries.beneficiaries.length > 0) {
        await expect(newMemberPage.button_AddMemberBeneficiaries_AddNewMember).toBeEnabled();
        await newMemberPage.button_AddMemberBeneficiaries_AddNewMember.click();

        await expect(newMemberPage.input_EffectiveDate_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
        await newMemberPage.input_EffectiveDate_MemberDeathBeneficiaries_AddNewMember.fill(accumulationAcount.memberBeneficiaries.effectiveDate);

        await expect(newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
        await newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_AddNewMember.click();
        const option_NominationType_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_NominationType_MemberDeathBeneficiaries_AddNewMember(accumulationAcount.memberBeneficiaries.nominationType);
        await expect(option_NominationType_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
        await option_NominationType_MemberDeathBeneficiaries_AddNewMember.click();

        if (accumulationAcount.memberBeneficiaries.nominationType == 'Binding Death Benefit - Lapsing' || accumulationAcount.memberBeneficiaries.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(accumulationAcount.memberBeneficiaries.defaultExpiryDate);
        }

        for (const [index, beneficiary] of accumulationAcount.memberBeneficiaries.beneficiaries.entries()) {
          await expect(newMemberPage.button_AddDeathBeneficiary_AddNewMember).toBeEnabled();
          await newMemberPage.button_AddDeathBeneficiary_AddNewMember.click();

          // name
          const input_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(input_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await input_SearchContact_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.name);

          const option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(beneficiary.name);
          await expect(option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember.click();

          // Relationship
          const dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

          const option_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberDeathBeneficiaries_AddNewMember(beneficiary.relationship);
          await expect(option_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await option_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

          // Proportion
          const input_Proportion_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(input_Proportion_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await input_Proportion_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.proportion);

          // Tier Direction
          if (beneficiary.tier == 'Second') {
            const button_Tier_Second_MemberDeathBeneficiaries_AddNewMember = newMemberPage.button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(button_Tier_Second_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await button_Tier_Second_MemberDeathBeneficiaries_AddNewMember.click();
          }
          await page.waitForTimeout(waitTime.medium);
        }
      }

      // Member Financial Details
      if (accumulationAcount.financialDetails.length > 0) {
        await expect(newMemberPage.button_AddMemberFinancialDetails_AddNewMember).toBeEnabled();
        await newMemberPage.button_AddMemberFinancialDetails_AddNewMember.click();

        for (const [index, financialDetail] of accumulationAcount.financialDetails.entries()) {
          if (index != 0) {
            await expect(newMemberPage.button_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddNewFinancialItem_AddNewMember.click();
          }

          // Name
          if (!financialDetail.custom) {
            const dropDownButton_Name_FinancialDetails_AddNewMember = newMemberPage.dropDownButton_Name_FinancialDetails_AddNewMember(index);
            await expect(dropDownButton_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await dropDownButton_Name_FinancialDetails_AddNewMember.click();

            const option_Name_FinancialDetails_AddNewMember = newMemberPage.option_Name_FinancialDetails_AddNewMember(financialDetail.name);
            await expect(option_Name_FinancialDetails_AddNewMember).toBeVisible();
            await option_Name_FinancialDetails_AddNewMember.click();
          } else {
            const input_Name_FinancialDetails_AddNewMember = newMemberPage.input_Name_FinancialDetails_AddNewMember(index);
            await expect(input_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Name_FinancialDetails_AddNewMember.fill(financialDetail.name);
          }
          await page.waitForTimeout(waitTime.medium);

          // Value
          if (financialDetail.name != 'Death Benefit Pension') {
            const input_Value_FinancialDetails_AddNewMember = newMemberPage.input_Value_FinancialDetails_AddNewMember(index);
            await expect(input_Value_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Value_FinancialDetails_AddNewMember.fill(financialDetail.value);
          } else {
            await expect(newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            if (financialDetail.value == 'Yes') {
              await expect(newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            } else {
              await expect(newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            }
          }

          // Show On Statement
          if (financialDetail.showOnStatementDefault != financialDetail.showOnStatement) {
            const sliderButton_ShowOnStatement_FinancialDetails_AddNewMember = newMemberPage.sliderButton_ShowOnStatement_FinancialDetails_AddNewMember(index);
            await expect(sliderButton_ShowOnStatement_FinancialDetails_AddNewMember).toBeEnabled();
            await sliderButton_ShowOnStatement_FinancialDetails_AddNewMember.click();
          }
        }
      }

      await expect(newMemberPage.button_Save_AddNewMember).toBeEnabled();
      await newMemberPage.button_Save_AddNewMember.click();

      const text_AccountCode_MemberList = newMemberPage.text_AccountCode_MemberList(accumulationAcount.accountDetails.memberCode);
      await expect(text_AccountCode_MemberList).toBeVisible();

      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
      await expect(button_EditMemberAccount).toBeEnabled();

      await page.waitForTimeout(waitTime.superLong);
    });

    test(`View and check the accumulation account${index + 1}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);

      // View and check the newly added account
      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
      if (!await button_EditMemberAccount.isVisible()) {
        const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
        await buttonArea_EditMemberAccount.hover();
        await page.waitForTimeout(waitTime.medium);
      }
      await expect(button_EditMemberAccount).toBeEnabled();
      await button_EditMemberAccount.click();

      await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
      await newMemberPage.button_ViewAndEdit_ViewEdit.click();
      await page.waitForTimeout(waitTime.medium);

      // View and check Persional Details
      await expect(newMemberPage.input_FirstName_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_FirstName_ViewEdit).toHaveValue(accumulationAcount.personalDetails.firstName);

      await expect(newMemberPage.input_Surname_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Surname_ViewEdit).toHaveValue(accumulationAcount.personalDetails.surname);

      await expect(newMemberPage.input_Mobile_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Mobile_ViewEdit).toHaveValue(accumulationAcount.personalDetails.mobile);

      await expect(newMemberPage.input_Email_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Email_ViewEdit).toHaveValue(accumulationAcount.personalDetails.email);

      await expect(newMemberPage.input_DOB_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_DOB_ViewEdit).toHaveValue(accumulationAcount.personalDetails.dob);

      await expect(newMemberPage.input_TFN_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TFN_ViewEdit).toHaveValue(accumulationAcount.personalDetails.tfn);

      // View and check Account Details
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toHaveText(accumulationAcount.accountDetails.accountType);

      await expect(newMemberPage.input_AccountDescription_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountDescription_ViewEdit).toHaveValue(accumulationAcount.accountDetails.accountDescription);

      await expect(newMemberPage.input_MemberCode_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_MemberCode_ViewEdit).toHaveValue(accumulationAcount.accountDetails.memberCode);

      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toHaveValue(accumulationAcount.accountDetails.accountStartDate);

      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toHaveValue('');

      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toHaveValue(accumulationAcount.accountDetails.servicePeriodStartDate);

      // View and check Balance Components
      if (accumulationAcount.newMemberBalance.postBalance) {
        await newMemberPage.input_TaxFree_ViewEdit.scrollIntoViewIfNeeded();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();

        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(/.+/, { timeout: waitTime.superLong }); // wait for the value to be stable
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.taxFree);

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.taxed);

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.untaxed);

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(accumulationAcount.newMemberBalance.expectedBalanceComponents.totalTaxComponents)

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponents.unrestrictedNonPreserved);

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(accumulationAcount.newMemberBalance.expectedBalanceComponents.totalPreservationComponents);
      } else {
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue('');

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText('Total Tax Components: $ 0.00');

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue('');

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText('Total Preservation Components: $ 0.00');
      }

      // View and check Member Beneficiaries
      if (accumulationAcount.memberBeneficiaries.beneficiaries.length == 0) {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText('Select...');

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(0);
      } else {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue(accumulationAcount.memberBeneficiaries.effectiveDate);

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText(accumulationAcount.memberBeneficiaries.nominationType);

        if (accumulationAcount.memberBeneficiaries.nominationType == 'Binding Death Benefit - Lapsing' || accumulationAcount.memberBeneficiaries.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(accumulationAcount.memberBeneficiaries.defaultExpiryDate);
        }

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(accumulationAcount.memberBeneficiaries.beneficiaries.length);

        const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
        for (let i = 0; i < accumulationAcount.memberBeneficiaries.beneficiaries.length; i++) {
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(accumulationAcount.memberBeneficiaries.beneficiaries[i].name);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(accumulationAcount.memberBeneficiaries.beneficiaries[i].relationship);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(accumulationAcount.memberBeneficiaries.beneficiaries[i].proportion);
          await expect(deathBeneficiaryRows.nth(i).locator('button._button-checked_phmar_45')).toHaveText(accumulationAcount.memberBeneficiaries.beneficiaries[i].tier);
        }
      }

      // View and check Documents & Notes
      await expect(newMemberPage.addedDocuments_DocumentsNotes).toHaveText('No documents.');
      await expect(newMemberPage.documentsTab_DocumentsNotes).toHaveText('Documents0');
      await expect(newMemberPage.notesTab_DocumentsNotes).toHaveText('Notes0');

      // View and check Financial Details
      if (accumulationAcount.financialDetails.length == 0) {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(1);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        await expect(financialDetailRows.nth(0).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input#member-tfn-input')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input[type="checkbox"]')).not.toBeChecked();
      } else {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(accumulationAcount.financialDetails.length);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        for (let i = 0; i < accumulationAcount.financialDetails.length; i++) {
          await expect(financialDetailRows.nth(i).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue(accumulationAcount.financialDetails[i].name);

          if (accumulationAcount.financialDetails[i].name == 'Death Benefit Pension') {
            await expect(financialDetailRows.nth(i).locator('div.custom-scrollbar__value-container')).toHaveText(accumulationAcount.financialDetails[i].value);
          } else {
            await expect(financialDetailRows.nth(i).locator('input#member-tfn-input')).toHaveValue(accumulationAcount.financialDetails[i].value);
          }

          if (accumulationAcount.financialDetails[i].name == 'Centrelink Original Purchase Price') {
            await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toHaveCount(0);
          } else {
            if (accumulationAcount.financialDetails[i].showOnStatement == 'Yes')
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toBeChecked();
            else
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).not.toBeChecked();
          }
        }
      }
    });
  }

  for (const [index, newPensionAcount] of allNewPensionAcounts.entries()) {
    test(`Create new pension account${index + 1} - ${newPensionAcount.selectAccumulationAccount.pensionType} for accumulation ${newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.firstName}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
      await expect(newMemberPage.allAccountCodes_MemberList.first()).toBeVisible();

      // get all account codes before adding new pension account
      const accountCodesBefore = await newMemberPage.allAccountCodes_MemberList.allTextContents();
      console.log('Account codes before adding new pension account ---> ', accountCodesBefore);

      await expect(newMemberPage.button_CommencePension).toBeEnabled();
      await newMemberPage.button_CommencePension.click();

      // Select Accumulation Account
      const accumulationAccountCode = newPensionAcount.selectAccumulationAccount.accumulationAccount.accountDetails.memberCode;
      console.log('Selected accumulation account code ---> ', accumulationAccountCode);
      await newMemberPage.dropDownButton_SelectAccumulationAccount_CommencePension.click();
      const option_AccumulationAccount_CommencePension = newMemberPage.option_AccumulationAccount_CommencePension(accumulationAccountCode);
      await expect(option_AccumulationAccount_CommencePension).toBeVisible();
      await option_AccumulationAccount_CommencePension.click();
      await page.waitForTimeout(waitTime.medium);

      await expect(newMemberPage.input_CommencementDate_CommencePension).toBeEnabled();
      await newMemberPage.input_CommencementDate_CommencePension.fill(newPensionAcount.selectAccumulationAccount.commencementDate);

      await expect(newMemberPage.dropDownButton_PensionType_CommencePension).toBeEnabled();
      await newMemberPage.dropDownButton_PensionType_CommencePension.click();
      const option_PensionType_CommencePension = newMemberPage.option_PensionType_CommencePension(newPensionAcount.selectAccumulationAccount.pensionType);
      await expect(option_PensionType_CommencePension).toBeVisible();
      await option_PensionType_CommencePension.click();

      await expect(newMemberPage.input_AccountDescription_CommencePension).toBeEnabled();
      await expect(newMemberPage.input_AccountDescription_CommencePension).toHaveValue(newPensionAcount.selectAccumulationAccount.expectedAccountDescription);

      if (newPensionAcount.selectAccumulationAccount.hasOwnProperty('expectedConditionOfRelease')) {
        await expect(newMemberPage.input_ConditionOfRelease_CommencePension).toBeVisible();
        await expect(newMemberPage.input_ConditionOfRelease_CommencePension).toHaveText(newPensionAcount.selectAccumulationAccount.expectedConditionOfRelease);
      }
      else if (newPensionAcount.selectAccumulationAccount.hasOwnProperty('conditionOfRelease')) {
        await expect(newMemberPage.dropDownButton_ConditionOfRelease_CommencePension).toBeEnabled();
        await newMemberPage.dropDownButton_ConditionOfRelease_CommencePension.click();
        const option_ConditionOfRelease_CommencePension = newMemberPage.option_ConditionOfRelease_CommencePension(newPensionAcount.selectAccumulationAccount.conditionOfRelease);
        await expect(option_ConditionOfRelease_CommencePension).toBeVisible();
        await option_ConditionOfRelease_CommencePension.click();
      }

      // Commencement Balance
      if (newPensionAcount.commencementBalance.fullBalance) {
        await expect(newMemberPage.sliderButton_FullBalance_CommencePension).toBeEnabled();
        await newMemberPage.sliderButton_FullBalance_CommencePension.click();
        if (newPensionAcount.commencementBalance.ceaseAccumulationAccount) {
          await expect(newMemberPage.sliderButton_CeaseAccumulationAccount_CommencePension).toBeEnabled();
          await newMemberPage.sliderButton_CeaseAccumulationAccount_CommencePension.click();
        }
      } else {
        if (newPensionAcount.commencementBalance.percentageOfBalance != 'N/A') {
          await expect(newMemberPage.input_PercentageOfBalance_CommencePension).toBeEnabled();
          await newMemberPage.input_PercentageOfBalance_CommencePension.fill(newPensionAcount.commencementBalance.percentageOfBalance);
        }
        if (newPensionAcount.commencementBalance.specificAmount != 'N/A') {
          await expect(newMemberPage.input_SpecificAmount_CommencePension).toBeEnabled();
          await newMemberPage.input_SpecificAmount_CommencePension.fill(newPensionAcount.commencementBalance.specificAmount);
        }
      }

      if (newPensionAcount.commencementBalance.maintainCuttentPreservationComponents) {
        await expect(newMemberPage.radioButton_MaintainCurrentPreservationComponents_CommencePension).toBeEnabled();
        await newMemberPage.radioButton_MaintainCurrentPreservationComponents_CommencePension.click();
      } else {
        await expect(newMemberPage.radioButton_UnrestrictedNonPreserved_CommencePension).toBeEnabled();
        await newMemberPage.radioButton_UnrestrictedNonPreserved_CommencePension.click();
      }

      // Balance Components
      await expect(newMemberPage.input_TaxFree_CommencePension).toBeVisible();
      await expect(newMemberPage.input_TaxFree_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.taxFree);
      await expect(newMemberPage.input_Taxed_CommencePension).toBeVisible();
      await expect(newMemberPage.input_Taxed_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.taxed);
      await expect(newMemberPage.input_Untaxed_CommencePension).toBeVisible();
      await expect(newMemberPage.input_Untaxed_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.untaxed);
      await expect(newMemberPage.text_TotalTaxComponents_CommencePension).toBeVisible();
      await expect(newMemberPage.text_TotalTaxComponents_CommencePension).toHaveText(newPensionAcount.expectedBalanceComponents.totalTaxComponents);

      await expect(newMemberPage.input_Preserved_CommencePension).toBeVisible();
      await expect(newMemberPage.input_Preserved_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.preserved);
      await expect(newMemberPage.input_RestrictedNonPreserved_CommencePension).toBeVisible();
      await expect(newMemberPage.input_RestrictedNonPreserved_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.restrictedNonPreserved);
      await expect(newMemberPage.input_UnrestrictedNonPreserved_CommencePension).toBeVisible();
      await expect(newMemberPage.input_UnrestrictedNonPreserved_CommencePension).toHaveValue(newPensionAcount.expectedBalanceComponents.unrestrictedNonPreserved);
      await expect(newMemberPage.text_TotalPreservationComponents_CommencePension).toBeVisible();
      await expect(newMemberPage.text_TotalPreservationComponents_CommencePension).toHaveText(newPensionAcount.expectedBalanceComponents.totalPreservationComponents);

      // Transfer Balance Account Details
      if (newPensionAcount.selectAccumulationAccount.pensionType != 'Transition To Retirement') {
        await expect(newMemberPage.input_Event_TBA_CommencePension).toBeVisible();
        await expect(newMemberPage.input_Event_TBA_CommencePension).toHaveText(newPensionAcount.expectedTransferBalanceAccountDetails.event);

        if (newPensionAcount.expectedTransferBalanceAccountDetails.event == 'IRS - Reversionary Income Stream') {
          await expect(newMemberPage.input_EffectiveDate_TBA_CommencePension).toBeVisible();
          await expect(newMemberPage.input_EffectiveDate_TBA_CommencePension).toHaveValue(newPensionAcount.expectedTransferBalanceAccountDetails.effectiveDate);
        }

        await expect(newMemberPage.text_ValueOfCurrentBalance_TBA_CommencePension).toBeVisible();
        await expect(newMemberPage.text_ValueOfCurrentBalance_TBA_CommencePension).toHaveText(newPensionAcount.expectedTransferBalanceAccountDetails.currentBalance);

        await expect(newMemberPage.text_ValueOfCapLimit_TBA_CommencePension).toBeVisible();
        await expect(newMemberPage.text_ValueOfCapLimit_TBA_CommencePension).toHaveText(newPensionAcount.expectedTransferBalanceAccountDetails.capLimit);

        await expect(newMemberPage.text_ValueOfCapRemainingBefore_TBA_CommencePension).toBeVisible();
        await expect(newMemberPage.text_ValueOfCapRemainingBefore_TBA_CommencePension).toHaveText(newPensionAcount.expectedTransferBalanceAccountDetails.capRemainingBefore);

        await expect(newMemberPage.text_ValueOfCapRemainingAfter_TBA_CommencePension).toBeVisible();
        await expect(newMemberPage.text_ValueOfCapRemainingAfter_TBA_CommencePension).toHaveText(newPensionAcount.expectedTransferBalanceAccountDetails.capRemainingAfter);
      }

      // Member Beneficiaries (enabled by default, no need to toggle)
      // if (newPensionAcount.memberBeneficiaries.hasOwnProperty('deathBenefitNomination')
      //   || newPensionAcount.memberBeneficiaries.hasOwnProperty('reversionaryNomination')) {
      //   await expect(newMemberPage.sliderButton_WithBeneficiaries_CommencePension).toBeEnabled();
      //   await newMemberPage.sliderButton_WithBeneficiaries_CommencePension.click();
      // }

      if (newPensionAcount.memberBeneficiaries.hasOwnProperty('deathBenefitNomination')) {
        await expect(newMemberPage.input_EffectiveDate_DeathBenefitNomination_CommencePension).toBeEnabled();
        await newMemberPage.input_EffectiveDate_DeathBenefitNomination_CommencePension.fill(newPensionAcount.memberBeneficiaries.deathBenefitNomination.effectiveDate);

        await expect(newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_CommencePension).toBeEnabled();
        await newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_CommencePension.click();
        const option_NominationType_MemberDeathBeneficiaries_CommencePension = newMemberPage.option_NominationType_MemberDeathBeneficiaries_CommencePension(newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType);
        await expect(option_NominationType_MemberDeathBeneficiaries_CommencePension).toBeVisible();
        await option_NominationType_MemberDeathBeneficiaries_CommencePension.click();

        if (newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Binding Death Benefit - Lapsing'
          || newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_CommencePension).toBeEnabled();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_CommencePension).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.defaultExpiryDate);
        }

        for (const [index, beneficiary] of newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.entries()) {
          await expect(newMemberPage.button_AddDeathBeneficiary_AddNewMember).toBeEnabled();
          await newMemberPage.button_AddDeathBeneficiary_AddNewMember.click();

          // name
          const input_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(input_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await input_SearchContact_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.name);

          const option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(beneficiary.name);
          await expect(option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember.click();

          // Relationship
          const dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

          const option_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberDeathBeneficiaries_AddNewMember(beneficiary.relationship);
          await expect(option_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await option_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

          // Proportion
          const input_Proportion_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberDeathBeneficiaries_AddNewMember(index);
          await expect(input_Proportion_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await input_Proportion_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.proportion);

          // Tier Direction
          if (beneficiary.tier == 'Second') {
            const button_Tier_Second_MemberDeathBeneficiaries_AddNewMember = newMemberPage.button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(button_Tier_Second_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await button_Tier_Second_MemberDeathBeneficiaries_AddNewMember.click();
          }
          await page.waitForTimeout(waitTime.medium);
        }
      }

      if (newPensionAcount.memberBeneficiaries.hasOwnProperty('reversionaryNomination')) {
        await expect(newMemberPage.button_ReversionaryNominationn_AddNewMember).toBeEnabled();
        await newMemberPage.button_ReversionaryNominationn_AddNewMember.click();

        for (const [index, beneficiary] of newPensionAcount.memberBeneficiaries.reversionaryNomination.entries()) {
          await expect(newMemberPage.button_AddReversionaryBeneficiary_AddNewMember).toBeEnabled();
          await newMemberPage.button_AddReversionaryBeneficiary_AddNewMember.click();
          // name
          const input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = await newMemberPage.input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(index);
          await expect(input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
          await input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.name);

          const option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = await newMemberPage.option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.name);
          await expect(option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
          await option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.click();

          // relationship
          const dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember(index);
          await expect(dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
          await dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

          const option_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.relationship);
          await expect(option_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
          await option_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

          // proportion
          const input_Proportion_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberReversionaryBeneficiaries_AddNewMember(index);
          await expect(input_Proportion_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
          await input_Proportion_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.proportion);
          await input_Proportion_MemberReversionaryBeneficiaries_AddNewMember.press('Tab');
          await page.waitForTimeout(waitTime.medium);
        }
      }

      await expect(newMemberPage.button_Save_CommencePension).toBeEnabled();
      await newMemberPage.button_Save_CommencePension.click();
      await expect(newMemberPage.button_SaveOnly_CommencePension).toBeEnabled();
      await newMemberPage.button_SaveOnly_CommencePension.click();
      await expect(newMemberPage.button_Yes_SystemInformationDialog_CommencePension).toBeEnabled();
      await newMemberPage.button_Yes_SystemInformationDialog_CommencePension.click();

      await page.waitForTimeout(waitTime.superLong);

      await expect(newMemberPage.allAccountCodes_MemberList.first()).toBeVisible();

      // get all account codes after adding new pension account
      const accountCodesAfter = await newMemberPage.allAccountCodes_MemberList.allTextContents();
      console.log('Account codes after adding new pension account ---> ', accountCodesAfter);

      for (const accountCode of accountCodesAfter) {
        if (!accountCodesBefore.includes(accountCode)) {
          console.log('Newly added pension account code ---> ', accountCode);
          newPensionAcount.pensionAccountCode = accountCode;
          break;
        }
      }

      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(newPensionAcount.pensionAccountCode);
      await expect(button_EditMemberAccount).toBeEnabled();
    });

    test(`View and check the new pension account${index + 1}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);

      // View and check the newly added account
      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(newPensionAcount.pensionAccountCode);
      if (!await button_EditMemberAccount.isVisible()) {
        const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(newPensionAcount.pensionAccountCode);
        await buttonArea_EditMemberAccount.hover();
        await page.waitForTimeout(waitTime.medium);
      }
      await expect(button_EditMemberAccount).toBeEnabled();
      await button_EditMemberAccount.click();

      await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
      await newMemberPage.button_ViewAndEdit_ViewEdit.click();
      await page.waitForTimeout(waitTime.medium);

      // View and check Persional Details
      await expect(newMemberPage.input_FirstName_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_FirstName_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.firstName);

      await expect(newMemberPage.input_Surname_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Surname_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.surname);

      await expect(newMemberPage.input_Mobile_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Mobile_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.mobile);

      await expect(newMemberPage.input_Email_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Email_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.email);

      await expect(newMemberPage.input_DOB_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_DOB_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.dob);

      await expect(newMemberPage.input_TFN_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TFN_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.personalDetails.tfn);

      // View and check Account Details
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toHaveText('Pension');

      await expect(newMemberPage.input_SelectPensionType_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_SelectPensionType_ViewEdit).toHaveText(newPensionAcount.selectAccumulationAccount.pensionType);

      if (newPensionAcount.selectAccumulationAccount.pensionType == 'Market Linked Pension') {
        await expect(newMemberPage.input_OriginalTerm_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_OriginalTerm_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.originalTerm);
      }

      await expect(newMemberPage.input_AccountDescription_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountDescription_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.expectedAccountDescription);

      await expect(newMemberPage.input_MemberCode_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_MemberCode_ViewEdit).toHaveValue(newPensionAcount.pensionAccountCode);

      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.commencementDate);

      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toHaveValue('');

      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.accountDetails.servicePeriodStartDate);

      await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toHaveValue(newPensionAcount.commencementBalance.expectedTaxFreeProportion);

      await expect(newMemberPage.input_ConditionOfRelease_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_ConditionOfRelease_ViewEdit).toHaveText(newPensionAcount.selectAccumulationAccount.hasOwnProperty('expectedConditionOfRelease') ? newPensionAcount.selectAccumulationAccount.expectedConditionOfRelease : newPensionAcount.selectAccumulationAccount.conditionOfRelease);

      // View and check Balance Components
      await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.taxFree == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.taxFree);

      await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.taxed == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.taxed);

      await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.untaxed == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.untaxed);

      await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
      await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(newPensionAcount.expectedBalanceComponents.totalTaxComponents);

      await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.preserved == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.preserved);

      await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.restrictedNonPreserved == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.restrictedNonPreserved);

      await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(newPensionAcount.expectedBalanceComponents.unrestrictedNonPreserved == '0.00' ? '' : newPensionAcount.expectedBalanceComponents.unrestrictedNonPreserved);

      await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
      await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(newPensionAcount.expectedBalanceComponents.totalPreservationComponents);

      // View and check Member Beneficiaries - Death Benefit Nomination
      if (newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length == 0) {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText('Select...');

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(0);
      } else {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.effectiveDate);

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText(newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType);

        if (newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Binding Death Benefit - Lapsing' || newPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.defaultExpiryDate);
        }

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length);

        const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
        for (let i = 0; i < newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length; i++) {
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].name);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].relationship);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].proportion);
          await expect(deathBeneficiaryRows.nth(i).locator('button._button-checked_phmar_45')).toHaveText(newPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].tier);
        }
      }

      // View and check Member Beneficiaries - reversionary Nomination
      if (newPensionAcount.memberBeneficiaries.reversionaryNomination.length == 0) {
        await expect(newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit).toHaveCount(0);
      } else {
        await expect(newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit).toHaveCount(newPensionAcount.memberBeneficiaries.reversionaryNomination.length);
        const reversionaryBeneficiaryRows = newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit;
        for (let i = 0; i < newPensionAcount.memberBeneficiaries.reversionaryNomination.length; i++) {
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(newPensionAcount.memberBeneficiaries.reversionaryNomination[i].name);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(newPensionAcount.memberBeneficiaries.reversionaryNomination[i].relationship);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(newPensionAcount.memberBeneficiaries.reversionaryNomination[i].proportion);
        }
      }

      // View and check Documents & Notes
      await expect(newMemberPage.addedDocuments_DocumentsNotes).toHaveText('No documents.');
      await expect(newMemberPage.documentsTab_DocumentsNotes).toHaveText('Documents0');
      await expect(newMemberPage.notesTab_DocumentsNotes).toHaveText('Notes0');

      // View and check Financial Details
      if (newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails == 0) {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(1);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        await expect(financialDetailRows.nth(0).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input#member-tfn-input')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input[type="checkbox"]')).not.toBeChecked();
      } else {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails.length);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        for (let i = 0; i < newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails.length; i++) {
          await expect(financialDetailRows.nth(i).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].name);

          if (newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].name == 'Death Benefit Pension') {
            await expect(financialDetailRows.nth(i).locator('div.custom-scrollbar__value-container')).toHaveText(newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].value);
          } else {
            await expect(financialDetailRows.nth(i).locator('input#member-tfn-input')).toHaveValue(newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].value);
          }

          if (newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].name == 'Centrelink Original Purchase Price') {
            await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toHaveCount(0);
          } else {
            if (newPensionAcount.selectAccumulationAccount.accumulationAccount.financialDetails[i].showOnStatement == 'Yes')
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toBeChecked();
            else
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).not.toBeChecked();
          }
        }
      }
    });
  }

  for (const [index, existingPensionAcount] of allExistingPensionAcounts.entries()) {
    test(`Save existing pension account${index + 1} - ${existingPensionAcount.accountDetails.pensionType} ${existingPensionAcount.newMemberBalance.postBalance ? "and enter a balance" : "and do not enter a balance"}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
      await expect(newMemberPage.button_AddNewMember).toBeEnabled();
      await page.waitForTimeout(waitTime.medium);
      await newMemberPage.button_AddNewMember.click();

      // Personal Details
      await expect(newMemberPage.input_SearchContact_AddNewMember).toBeVisible();
      await expect(newMemberPage.input_SearchContact_AddNewMember).toBeEnabled();
      await newMemberPage.input_SearchContact_AddNewMember.fill(`${existingPensionAcount.personalDetails.surname}, ${existingPensionAcount.personalDetails.firstName}`);

      if (existingPensionAcount.personalDetails.newContact) {
        const newPagePromise = page.waitForEvent('popup'); // Wait for contact page to open
        await expect(newMemberPage.button_CreateNewContact_AddNewMember).toBeEnabled();
        await newMemberPage.button_CreateNewContact_AddNewMember.click(); // Click that opens the contact page
        const newPage = await newPagePromise;
        // Wait for the contact page to load
        await newPage.waitForLoadState();
        // Create a new contact
        const contactsPage = new ContactsPage(newPage);
        await expect(contactsPage.input_FirstName).toBeEnabled();
        await contactsPage.input_FirstName.fill(existingPensionAcount.personalDetails.firstName);
        await expect(contactsPage.input_Surname).toBeEnabled();
        await contactsPage.input_Surname.fill(existingPensionAcount.personalDetails.surname);
        await expect(contactsPage.input_DateOfBirth).toBeEnabled();
        await contactsPage.input_DateOfBirth.fill(existingPensionAcount.personalDetails.dob);
        await expect(contactsPage.button_CreatePerson).toBeEnabled();
        await contactsPage.button_CreatePerson.click();
        // The contact page will be closed automatically
      } else {
        await expect(newMemberPage.option_FirstResult_SelectContact_AddNewMember).toHaveText(`${existingPensionAcount.personalDetails.surname}, ${existingPensionAcount.personalDetails.firstName}`);
        await newMemberPage.option_FirstResult_SelectContact_AddNewMember.click();
      }

      await expect(newMemberPage.heading_PersonalDetails_AddNewMember).toBeVisible();
      await page.waitForTimeout(waitTime.medium);
      await expect(newMemberPage.input_FirstName_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.firstName);
      await expect(newMemberPage.input_Surname_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.surname);
      await expect(newMemberPage.input_Mobile_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.mobile);
      await expect(newMemberPage.input_Email_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.email);
      await expect(newMemberPage.input_DOB_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.dob);
      await expect(newMemberPage.input_TFN_AddNewMember).toHaveValue(existingPensionAcount.personalDetails.tfn);

      // Account Details
      await expect(newMemberPage.dropDownButton_SelectAccountType_AddNewMember).toBeEnabled();
      await newMemberPage.dropDownButton_SelectAccountType_AddNewMember.click();
      await expect(newMemberPage.option_Pension_SelectAccountType_AddNewMember).toBeVisible();
      await newMemberPage.option_Pension_SelectAccountType_AddNewMember.click();

      await expect(newMemberPage.dropDownButton_SelectPensionType_AddNewMember).toBeEnabled();
      await newMemberPage.dropDownButton_SelectPensionType_AddNewMember.click();
      const option_PensionType_AddNewMember = await newMemberPage.option_PensionType_AddNewMember(existingPensionAcount.accountDetails.pensionType);
      await expect(option_PensionType_AddNewMember).toBeVisible();
      await option_PensionType_AddNewMember.click();

      if (existingPensionAcount.accountDetails.pensionType == 'Market Linked Pension') {
        // !! Do not set the sex of the contact for Market Linked Pension, otherwise the dropDownButton_Sex_MLPension_AddNewMember will not display!!
        await expect(newMemberPage.dropDownButton_Sex_MLPension_AddNewMember).toBeEnabled();
        await newMemberPage.dropDownButton_Sex_MLPension_AddNewMember.click();
        if (existingPensionAcount.accountDetails.sex == 'Male') {
          await expect(newMemberPage.option_Male_Sex_MLPension_AddNewMember).toBeVisible();
          await newMemberPage.option_Male_Sex_MLPension_AddNewMember.click();
        } else {
          await expect(newMemberPage.option_Female_Sex_MLPension_AddNewMember).toBeVisible();
          await newMemberPage.option_Female_Sex_MLPension_AddNewMember.click();
        }
        await expect(newMemberPage.input_OriginalTerm_MLPension_AddNewMember).toBeEnabled();
        await newMemberPage.input_OriginalTerm_MLPension_AddNewMember.fill(existingPensionAcount.accountDetails.originalTerm);
      }

      await expect(newMemberPage.input_AccountDescription_AddNewMember).toHaveValue(existingPensionAcount.accountDetails.accountDescription);
      await page.waitForTimeout(waitTime.medium);
      allExistingPensionAcounts[index].accountDetails.memberCode = await newMemberPage.input_MemberCode_AddNewMember.inputValue();
      if (existingPensionAcount.hasOwnProperty('adjustmentInputsTBARCap'))
        allExistingPensionAcounts[index].adjustmentInputsTBARCap.memberAccountCode = allExistingPensionAcounts[index].accountDetails.memberCode;
      console.log('Member Account Code ---> ', allExistingPensionAcounts[index].accountDetails.memberCode);
      expect(allExistingPensionAcounts[index].accountDetails.memberCode).toMatch(/^[A-Z0-9]{12}$/);

      await newMemberPage.input_AccountStartDate_AddNewMember.fill(existingPensionAcount.accountDetails.accountStartDate);
      await newMemberPage.input_ServicePeriodStartDate_AddNewMember.fill(existingPensionAcount.accountDetails.servicePeriodStartDate);

      await expect(newMemberPage.dropDownButton_ConditionOfRelease_AddNewMember).toBeEnabled();
      await newMemberPage.dropDownButton_ConditionOfRelease_AddNewMember.click();
      const option_ConditionOfRelease_AddNewMember = await newMemberPage.option_ConditionOfRelease_AddNewMember(existingPensionAcount.accountDetails.conditionOfRelease);
      await expect(option_ConditionOfRelease_AddNewMember).toBeVisible();
      await option_ConditionOfRelease_AddNewMember.click();

      // New Member Balance
      if (existingPensionAcount.newMemberBalance.postBalance) {
        // sliderButton_PostMemberBalance_AddNewMember is "Yes" by default for Pension account!!
        await expect(newMemberPage.input_Amount_Pension_AddNewMember).toBeEnabled();
        await newMemberPage.input_Amount_Pension_AddNewMember.fill(existingPensionAcount.newMemberBalance.amount);
        await newMemberPage.input_Amount_Pension_AddNewMember.press('Tab');

        await expect(newMemberPage.input_BalanceDate_AddNewMember).toBeEnabled();
        const balanceDate = await newMemberPage.input_BalanceDate_AddNewMember.inputValue();
        if (balanceDate != existingPensionAcount.newMemberBalance.balanceDate)
          await newMemberPage.input_BalanceDate_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceDate);

        // Balance Components
        await expect(newMemberPage.input_TaxFree_AddNewMember).toBeEnabled();
        await newMemberPage.input_TaxFree_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.taxFree);
        await expect(newMemberPage.input_Taxed_AddNewMember).toBeEnabled();
        await newMemberPage.input_Taxed_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.taxed);
        await expect(newMemberPage.input_Untaxed_AddNewMember).toBeEnabled();
        await newMemberPage.input_Untaxed_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.untaxed);
        await expect(newMemberPage.input_Preserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_Preserved_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.preserved);
        await expect(newMemberPage.input_RestrictedNonPreserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_RestrictedNonPreserved_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.restrictedNonPreserved);
        await expect(newMemberPage.input_UnrestrictedNonPreserved_AddNewMember).toBeEnabled();
        await newMemberPage.input_UnrestrictedNonPreserved_AddNewMember.fill(existingPensionAcount.newMemberBalance.balanceComponents.unrestrictedNonPreserved);
      } else {
        // sliderButton_PostMemberBalance_AddNewMember is "Yes" by default for Pension account, if no balance need to set it to !!
        await expect(newMemberPage.sliderButton_PostMemberBalance_AddNewMember).toBeEnabled();
        await newMemberPage.sliderButton_PostMemberBalance_AddNewMember.click();
      }

      // Member Beneficiaries
      if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length > 0
        || existingPensionAcount.memberBeneficiaries.reversionaryNomination.length > 0) {
        await expect(newMemberPage.button_AddMemberBeneficiaries_AddNewMember).toBeEnabled();
        await newMemberPage.button_AddMemberBeneficiaries_AddNewMember.click();

        // Death benefit nomination 
        if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length > 0) {
          await expect(newMemberPage.input_EffectiveDate_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await newMemberPage.input_EffectiveDate_MemberDeathBeneficiaries_AddNewMember.fill(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.effectiveDate);

          await expect(newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
          await newMemberPage.dropDownButton_NominationType_MemberDeathBeneficiaries_AddNewMember.click();
          const option_NominationType_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_NominationType_MemberDeathBeneficiaries_AddNewMember(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType);
          await expect(option_NominationType_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await option_NominationType_MemberDeathBeneficiaries_AddNewMember.click();

          if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Binding Death Benefit - Lapsing'
            || existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Non-Binding Death Benefit - Lapsing') {
            await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.defaultExpiryDate);
          }

          for (const [index, beneficiary] of existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.entries()) {
            await expect(newMemberPage.button_AddDeathBeneficiary_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddDeathBeneficiary_AddNewMember.click();

            // name
            const input_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_SearchContact_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.name);

            const option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(beneficiary.name);
            await expect(option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember.click();

            // Relationship
            const dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            const option_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberDeathBeneficiaries_AddNewMember(beneficiary.relationship);
            await expect(option_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            // Proportion
            const input_Proportion_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_Proportion_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_Proportion_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.proportion);

            // Tier Direction
            if (beneficiary.tier == 'Second') {
              const button_Tier_Second_MemberDeathBeneficiaries_AddNewMember = newMemberPage.button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index);
              await expect(button_Tier_Second_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
              await button_Tier_Second_MemberDeathBeneficiaries_AddNewMember.click();
            }
            await page.waitForTimeout(waitTime.medium);
          }
        }
        // Reversionary nomination
        if (existingPensionAcount.memberBeneficiaries.reversionaryNomination.length > 0) {
          await expect(newMemberPage.button_ReversionaryNominationn_AddNewMember).toBeEnabled();
          await newMemberPage.button_ReversionaryNominationn_AddNewMember.click();

          for (const [index, beneficiary] of existingPensionAcount.memberBeneficiaries.reversionaryNomination.entries()) {
            await expect(newMemberPage.button_AddReversionaryBeneficiary_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddReversionaryBeneficiary_AddNewMember.click();
            // name
            const input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = await newMemberPage.input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.name);

            const option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = await newMemberPage.option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.name);
            await expect(option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
            await option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.click();

            // relationship
            const dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

            const option_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.relationship);
            await expect(option_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
            await option_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

            // proportion
            const input_Proportion_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(input_Proportion_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await input_Proportion_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.proportion);
          }
        }
      }

      // Member Financial Details
      if (existingPensionAcount.financialDetails.length > 0) {
        await expect(newMemberPage.button_AddMemberFinancialDetails_AddNewMember).toBeEnabled();
        await newMemberPage.button_AddMemberFinancialDetails_AddNewMember.click();

        for (const [index, financialDetail] of existingPensionAcount.financialDetails.entries()) {
          if (index != 0) {
            await expect(newMemberPage.button_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddNewFinancialItem_AddNewMember.click();
          }

          // Name
          if (!financialDetail.custom) {
            const dropDownButton_Name_FinancialDetails_AddNewMember = newMemberPage.dropDownButton_Name_FinancialDetails_AddNewMember(index);
            await expect(dropDownButton_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await dropDownButton_Name_FinancialDetails_AddNewMember.click();

            const option_Name_FinancialDetails_AddNewMember = newMemberPage.option_Name_FinancialDetails_AddNewMember(financialDetail.name);
            await expect(option_Name_FinancialDetails_AddNewMember).toBeVisible();
            await option_Name_FinancialDetails_AddNewMember.click();
          } else {
            const input_Name_FinancialDetails_AddNewMember = newMemberPage.input_Name_FinancialDetails_AddNewMember(index);
            await expect(input_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Name_FinancialDetails_AddNewMember.fill(financialDetail.name);
          }
          await page.waitForTimeout(waitTime.medium);

          // Value
          if (financialDetail.name != 'Death Benefit Pension') {
            const input_Value_FinancialDetails_AddNewMember = newMemberPage.input_Value_FinancialDetails_AddNewMember(index);
            await expect(input_Value_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Value_FinancialDetails_AddNewMember.fill(financialDetail.value);
          } else {
            await expect(newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            if (financialDetail.value == 'Yes') {
              await expect(newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            } else {
              await expect(newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            }
          }

          // Show On Statement
          if (financialDetail.showOnStatementDefault != financialDetail.showOnStatement) {
            const sliderButton_ShowOnStatement_FinancialDetails_AddNewMember = newMemberPage.sliderButton_ShowOnStatement_FinancialDetails_AddNewMember(index);
            await expect(sliderButton_ShowOnStatement_FinancialDetails_AddNewMember).toBeEnabled();
            await sliderButton_ShowOnStatement_FinancialDetails_AddNewMember.click();
          }
        }
      }

      await expect(newMemberPage.button_Save_AddNewMember).toBeEnabled();
      await newMemberPage.button_Save_AddNewMember.click();

      const text_AccountCode_MemberList = newMemberPage.text_AccountCode_MemberList(existingPensionAcount.accountDetails.memberCode);
      await expect(text_AccountCode_MemberList).toBeVisible();

      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
      await expect(button_EditMemberAccount).toBeEnabled();
    });

    test(`View and check the existing pension account${index + 1}`, async () => {
      newMemberPage = new NewMemberPage(page);
      await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);

      // View and check the newly added account
      const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
      if (!await button_EditMemberAccount.isVisible()) {
        const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
        await buttonArea_EditMemberAccount.hover();
        await page.waitForTimeout(waitTime.medium);
      }
      await expect(button_EditMemberAccount).toBeEnabled();
      await button_EditMemberAccount.click();

      await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
      await newMemberPage.button_ViewAndEdit_ViewEdit.click();
      await page.waitForTimeout(waitTime.medium);

      // View and check Persional Details
      await expect(newMemberPage.input_FirstName_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_FirstName_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.firstName);

      await expect(newMemberPage.input_Surname_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Surname_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.surname);

      await expect(newMemberPage.input_Mobile_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Mobile_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.mobile);

      await expect(newMemberPage.input_Email_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_Email_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.email);

      await expect(newMemberPage.input_DOB_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_DOB_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.dob);

      await expect(newMemberPage.input_TFN_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TFN_ViewEdit).toHaveValue(existingPensionAcount.personalDetails.tfn);

      // View and check Account Details
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_SelectAccountType_ViewEdit).toHaveText(existingPensionAcount.accountDetails.accountType);

      await expect(newMemberPage.input_SelectPensionType_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_SelectPensionType_ViewEdit).toHaveText(existingPensionAcount.accountDetails.pensionType);

      if (existingPensionAcount.accountDetails.pensionType == 'Market Linked Pension') {
        await expect(newMemberPage.input_OriginalTerm_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_OriginalTerm_ViewEdit).toHaveValue(existingPensionAcount.accountDetails.originalTerm);
      }

      await expect(newMemberPage.input_AccountDescription_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountDescription_ViewEdit).toHaveValue(existingPensionAcount.accountDetails.accountDescription);

      await expect(newMemberPage.input_MemberCode_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_MemberCode_ViewEdit).toHaveValue(existingPensionAcount.accountDetails.memberCode);

      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountStartDate_ViewEdit).toHaveValue(existingPensionAcount.accountDetails.accountStartDate);

      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_AccountEndDate_ViewEdit).toHaveValue('');

      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toHaveValue(existingPensionAcount.accountDetails.servicePeriodStartDate);

      await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.taxFreeProportion);

      await expect(newMemberPage.input_ConditionOfRelease_ViewEdit).toBeVisible();
      await expect(newMemberPage.input_ConditionOfRelease_ViewEdit).toHaveText(existingPensionAcount.accountDetails.conditionOfRelease);

      // View and check Balance Components
      if (existingPensionAcount.newMemberBalance.postBalance) {
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.taxFree);

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.taxed);

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.untaxed);

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(existingPensionAcount.newMemberBalance.expectedBalanceComponents.totalTaxComponents)

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponents.unrestrictedNonPreserved);

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(existingPensionAcount.newMemberBalance.expectedBalanceComponents.totalPreservationComponents);
      } else {
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue('');

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText('Total Tax Components: $ 0.00');

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue('');

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText('Total Preservation Components: $ 0.00');
      }

      // View and check Member Beneficiaries - Death Benefit Nomination
      if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length == 0) {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue('');

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText('Select...');

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(0);
      } else {
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.effectiveDate);

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType);

        if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Binding Death Benefit - Lapsing' || existingPensionAcount.memberBeneficiaries.deathBenefitNomination.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.defaultExpiryDate);
        }

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length);

        const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
        for (let i = 0; i < existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length; i++) {
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].name);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].relationship);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].proportion);
          await expect(deathBeneficiaryRows.nth(i).locator('button._button-checked_phmar_45')).toHaveText(existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries[i].tier);
        }
      }

      // View and check Member Beneficiaries - reversionary Nomination
      if (existingPensionAcount.memberBeneficiaries.reversionaryNomination.length == 0) {
        await expect(newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit).toHaveCount(0);
      } else {
        await expect(newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit).toHaveCount(existingPensionAcount.memberBeneficiaries.reversionaryNomination.length);
        const reversionaryBeneficiaryRows = newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit;
        for (let i = 0; i < existingPensionAcount.memberBeneficiaries.reversionaryNomination.length; i++) {
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.reversionaryNomination[i].name);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.reversionaryNomination[i].relationship);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(existingPensionAcount.memberBeneficiaries.reversionaryNomination[i].proportion);
        }
      }

      // View and check Documents & Notes
      await expect(newMemberPage.addedDocuments_DocumentsNotes).toHaveText('No documents.');
      await expect(newMemberPage.documentsTab_DocumentsNotes).toHaveText('Documents0');
      await expect(newMemberPage.notesTab_DocumentsNotes).toHaveText('Notes0');

      // View and check Financial Details
      if (existingPensionAcount.financialDetails.length == 0) {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(1);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        await expect(financialDetailRows.nth(0).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input#member-tfn-input')).toHaveValue('');
        await expect(financialDetailRows.nth(0).locator('input[type="checkbox"]')).not.toBeChecked();
      } else {
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(existingPensionAcount.financialDetails.length);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        for (let i = 0; i < existingPensionAcount.financialDetails.length; i++) {
          await expect(financialDetailRows.nth(i).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue(existingPensionAcount.financialDetails[i].name);

          if (existingPensionAcount.financialDetails[i].name == 'Death Benefit Pension') {
            await expect(financialDetailRows.nth(i).locator('div.custom-scrollbar__value-container')).toHaveText(existingPensionAcount.financialDetails[i].value);
          } else {
            await expect(financialDetailRows.nth(i).locator('input#member-tfn-input')).toHaveValue(existingPensionAcount.financialDetails[i].value);
          }

          if (existingPensionAcount.financialDetails[i].name == 'Centrelink Original Purchase Price') {
            await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toHaveCount(0);
          } else {
            if (existingPensionAcount.financialDetails[i].showOnStatement == 'Yes')
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toBeChecked();
            else
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).not.toBeChecked();
          }
        }
      }
    });

    if (existingPensionAcount.newMemberBalance.postBalance) {
      test(`Add TBAR cap adjustment for existing pension account${index + 1}`, async () => {
        await memberUtil.addTBARCapAdjustmentInternal(existingPensionAcount.adjustmentInputsTBARCap);
        await page.waitForTimeout(waitTime.medium);
      });
    }
  }

  // create entries
  test('create entries', async () => {
    await complianceUtil.createEntries(entity.financialYearToStart);
  });

  // edit all types of accounts (accumulaton, existing pension, new pension)
  for (const [index, accumulationAcount] of allAccumulationAccounts.entries()) {
    if (Object.hasOwn(accumulationAcount, "edit")) {
      test(`edit and check the accumulation accout${index + 1} (Mobile, ServicePeriodStartDate, BalanceComponents, Beneficiaries, Documents&Notes, FinancialDetails)`, async () => {
        newMemberPage = new NewMemberPage(page);
        await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);

        let button_EditMemberAccount = newMemberPage.button_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
        if (!await button_EditMemberAccount.isVisible()) {
          const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
          await buttonArea_EditMemberAccount.hover();
          await page.waitForTimeout(waitTime.medium);
        }
        await expect(button_EditMemberAccount).toBeEnabled();
        await button_EditMemberAccount.click();

        await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
        await newMemberPage.button_ViewAndEdit_ViewEdit.click();
        await page.waitForTimeout(waitTime.medium);

        // Edit Mobile
        await expect(newMemberPage.input_Mobile_ViewEdit).toBeEnabled();
        await newMemberPage.input_Mobile_AddNewMember.fill(accumulationAcount.edit.newMobile);

        // Edit Service Period Start Date
        await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toBeEnabled();
        await newMemberPage.input_ServicePeriodStartDate_ViewEdit.fill(accumulationAcount.edit.newServicePeriodStartDate);

        // check point -> after create entries, if the member is over 65, the preservation compoment will go to UNP, the rounding of 1cent is possible even if don't have any income or expense
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.taxFree);

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.taxed);

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.untaxed);

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.totalTaxComponents)

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.unrestrictedNonPreserved);

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(accumulationAcount.newMemberBalance.expectedBalanceComponentsAfterCE.totalPreservationComponents);

        // Edit Balance Components
        await expect(newMemberPage.button_UpdateBalanceComponents).toBeEnabled();
        await newMemberPage.button_UpdateBalanceComponents.click();

        await expect(newMemberPage.input_TransactionDate_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.input_TransactionDate_UpdateBalanceComponents).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedTransactionDate);

        await expect(newMemberPage.text_Balance_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.text_Balance_UpdateBalanceComponents).toHaveText(accumulationAcount.edit.newBalanceComponents.expectedBalance);

        await expect(newMemberPage.text_LastCreateEntriesDate_Accumulation_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.text_LastCreateEntriesDate_Accumulation_UpdateBalanceComponents).toHaveText(accumulationAcount.edit.newBalanceComponents.expectedLastCreateEntriesDate);

        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeEnabled();
        await newMemberPage.input_TaxFree_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.taxFree);

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeEnabled();
        await newMemberPage.input_Taxed_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.taxed);

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeEnabled();
        await newMemberPage.input_Untaxed_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.untaxed);

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeEnabled();
        await newMemberPage.input_Preserved_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeEnabled();
        await newMemberPage.input_RNP_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeEnabled();
        await newMemberPage.input_UNP_ViewEdit.fill(accumulationAcount.edit.newBalanceComponents.balanceComponents.unrestrictedNonPreserved);
        await newMemberPage.input_UNP_ViewEdit.press('Tab');

        // Edit Beneficiaries
        if (accumulationAcount.memberBeneficiaries.beneficiaries.length > 0) {
          const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
          for (let i = 0; i < accumulationAcount.memberBeneficiaries.beneficiaries.length; i++) {
            await expect(deathBeneficiaryRows.nth(0).locator('td:nth-child(5)>div>div:nth-child(2) button')).toBeEnabled();
            await deathBeneficiaryRows.nth(0).locator('td:nth-child(5)>div>div:nth-child(2) button').click();
          }
        }
        if (accumulationAcount.edit.newMemberBeneficiaries.length > 0) {
          for (const [index, beneficiary] of accumulationAcount.edit.newMemberBeneficiaries.entries()) {
            await expect(newMemberPage.button_AddDeathBeneficiary_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddDeathBeneficiary_AddNewMember.click();

            // name
            const input_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_SearchContact_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.name);

            const option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(beneficiary.name);
            await expect(option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember.click();

            // Relationship
            const dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            const option_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberDeathBeneficiaries_AddNewMember(beneficiary.relationship);
            await expect(option_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            // Proportion
            const input_Proportion_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_Proportion_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_Proportion_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.proportion);

            // Tier Direction
            if (beneficiary.tier == 'Second') {
              const button_Tier_Second_MemberDeathBeneficiaries_AddNewMember = newMemberPage.button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index);
              await expect(button_Tier_Second_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
              await button_Tier_Second_MemberDeathBeneficiaries_AddNewMember.click();
            }
            await page.waitForTimeout(waitTime.medium);
          }
        }

        // Upload Documents
        await page.setInputFiles('input[type="file"]', path.resolve(__dirname, `documents/${accumulationAcount.edit.documentName}`),);

        await expect(newMemberPage.button_Upload_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Upload_DocumentsNotes.click();
        await page.waitForTimeout(waitTime.long);

        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button')).toHaveCount(1);
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button .SFU_name')).toHaveText(accumulationAcount.edit.documentName);

        // Add Notes
        await expect(newMemberPage.button_Notes_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Notes_DocumentsNotes.click();

        await expect(newMemberPage.button_AddNote_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_AddNote_DocumentsNotes.click();

        await expect(newMemberPage.textbox_WriteSomething_DocumentsNotes).toBeEnabled();
        await newMemberPage.textbox_WriteSomething_DocumentsNotes.fill(accumulationAcount.edit.notes);

        await expect(newMemberPage.button_Save_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Save_DocumentsNotes.click();

        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveCount(1);
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveText(accumulationAcount.edit.notes);

        // Edit Financial Details
        if (accumulationAcount.financialDetails.length > 0) {
          const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
          for (let i = 0; i < accumulationAcount.financialDetails.length; i++) {
            await expect(financialDetailRows.nth(0).locator('button').nth(0)).toBeEnabled();
            await financialDetailRows.nth(0).locator('button').nth(0).click();
            await page.waitForTimeout(waitTime.short);
          }
        }

        for (const [index, financialDetail] of accumulationAcount.edit.newFinancialDetails.entries()) {
          if (index != 0) {
            await expect(newMemberPage.button_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddNewFinancialItem_AddNewMember.click();
          }

          // Name
          if (!financialDetail.custom) {
            const dropDownButton_Name_FinancialDetails_AddNewMember = newMemberPage.dropDownButton_Name_FinancialDetails_AddNewMember(index);
            await expect(dropDownButton_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await dropDownButton_Name_FinancialDetails_AddNewMember.click();

            const option_Name_FinancialDetails_AddNewMember = newMemberPage.option_Name_FinancialDetails_AddNewMember(financialDetail.name);
            await expect(option_Name_FinancialDetails_AddNewMember).toBeVisible();
            await option_Name_FinancialDetails_AddNewMember.click();
          } else {
            const input_Name_FinancialDetails_AddNewMember = newMemberPage.input_Name_FinancialDetails_AddNewMember(index);
            await expect(input_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Name_FinancialDetails_AddNewMember.fill(financialDetail.name);
          }
          await page.waitForTimeout(waitTime.medium);

          // Value
          if (financialDetail.name != 'Death Benefit Pension') {
            const input_Value_FinancialDetails_AddNewMember = newMemberPage.input_Value_FinancialDetails_AddNewMember(index);
            await expect(input_Value_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Value_FinancialDetails_AddNewMember.fill(financialDetail.value);
          } else {
            await expect(newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            if (financialDetail.value == 'Yes') {
              await expect(newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            } else {
              await expect(newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            }
          }

          // Show On Statement
          if (financialDetail.showOnStatementDefault != financialDetail.showOnStatement) {
            const sliderButton_ShowOnStatement_FinancialDetails_AddNewMember = newMemberPage.sliderButton_ShowOnStatement_FinancialDetails_AddNewMember(index);
            await expect(sliderButton_ShowOnStatement_FinancialDetails_AddNewMember).toBeEnabled();
            await sliderButton_ShowOnStatement_FinancialDetails_AddNewMember.click();
          }
        }

        await expect(newMemberPage.button_Save_AddNewMember).toBeEnabled();
        await newMemberPage.button_Save_AddNewMember.click();

        const text_AccountCode_MemberList = newMemberPage.text_AccountCode_MemberList(accumulationAcount.accountDetails.memberCode);
        await expect(text_AccountCode_MemberList).toBeVisible();

        button_EditMemberAccount = newMemberPage.button_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
        if (!await button_EditMemberAccount.isVisible()) {
          const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(accumulationAcount.accountDetails.memberCode);
          await buttonArea_EditMemberAccount.hover();
          await page.waitForTimeout(waitTime.medium);
        }
        await expect(button_EditMemberAccount).toBeEnabled();
        await button_EditMemberAccount.click();

        await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
        await newMemberPage.button_ViewAndEdit_ViewEdit.click();
        await page.waitForTimeout(waitTime.medium);

        // Check the new vaules:
        // Mobile
        await expect(newMemberPage.input_Mobile_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Mobile_ViewEdit).toHaveValue(accumulationAcount.edit.newMobile);
        // ServicePeriodStartDate
        await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_ServicePeriodStartDate_ViewEdit).toHaveValue(accumulationAcount.edit.newServicePeriodStartDate);
        // BalanceComponents
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.taxFree);
        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.taxed);
        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.untaxed);
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.totalTaxComponents)

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.preserved);
        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.restrictedNonPreserved);
        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.unrestrictedNonPreserved);
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(accumulationAcount.edit.newBalanceComponents.expectedBalanceComponents.totalPreservationComponents);
        // Beneficiaries
        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(accumulationAcount.edit.newMemberBeneficiaries.length);
        const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
        for (let i = 0; i < accumulationAcount.edit.newMemberBeneficiaries.length; i++) {
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(accumulationAcount.edit.newMemberBeneficiaries[i].name);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(accumulationAcount.edit.newMemberBeneficiaries[i].relationship);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(accumulationAcount.edit.newMemberBeneficiaries[i].proportion);
          await expect(deathBeneficiaryRows.nth(i).locator('button._button-checked_phmar_45')).toHaveText(accumulationAcount.edit.newMemberBeneficiaries[i].tier);
        }
        // Documents
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button')).toHaveCount(1);
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button .SFU_name')).toHaveText(accumulationAcount.edit.documentName);
        // Notes
        await expect(newMemberPage.button_Notes_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Notes_DocumentsNotes.click();
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveCount(1);
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveText(accumulationAcount.edit.notes);
        // FinancialDetails
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(accumulationAcount.edit.newFinancialDetails.length);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        for (let i = 0; i < accumulationAcount.edit.newFinancialDetails.length; i++) {
          await expect(financialDetailRows.nth(i).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue(accumulationAcount.edit.newFinancialDetails[i].name);

          if (accumulationAcount.edit.newFinancialDetails[i].name == 'Death Benefit Pension') {
            await expect(financialDetailRows.nth(i).locator('div.custom-scrollbar__value-container')).toHaveText(accumulationAcount.edit.newFinancialDetails[i].value);
          } else {
            await expect(financialDetailRows.nth(i).locator('input#member-tfn-input')).toHaveValue(accumulationAcount.edit.newFinancialDetails[i].value);
          }

          if (accumulationAcount.edit.newFinancialDetails[i].name == 'Centrelink Original Purchase Price') {
            await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toHaveCount(0);
          } else {
            if (accumulationAcount.edit.newFinancialDetails[i].showOnStatement == 'Yes')
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toBeChecked();
            else
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).not.toBeChecked();
          }
        }
      });
    }
  }

  for (const [index, existingPensionAcount] of allExistingPensionAcounts.entries()) {
    if (Object.hasOwn(existingPensionAcount, "edit")) {
      test(`edit and check the existing pension accout${index + 1} (Email, AccountStartDate, BalanceComponents, Beneficiaries, Documents&Notes, FinancialDetails)`, async () => {
        newMemberPage = new NewMemberPage(page);
        await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);

        let button_EditMemberAccount = newMemberPage.button_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
        if (!await button_EditMemberAccount.isVisible()) {
          const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
          await buttonArea_EditMemberAccount.hover();
          await page.waitForTimeout(waitTime.medium);
        }
        await expect(button_EditMemberAccount).toBeEnabled();
        await button_EditMemberAccount.click();

        await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
        await newMemberPage.button_ViewAndEdit_ViewEdit.click();
        await page.waitForTimeout(waitTime.medium);

        // Edit Email
        await expect(newMemberPage.input_Email_ViewEdit).toBeEnabled();
        await newMemberPage.input_Email_ViewEdit.fill(existingPensionAcount.edit.newEmail);

        // Edit Account Description
        await expect(newMemberPage.input_AccountDescription_ViewEdit).toBeEnabled();
        await newMemberPage.input_AccountDescription_ViewEdit.fill(existingPensionAcount.edit.newAccountDescription);

        // Check Balance Components in update modal
        await expect(newMemberPage.button_UpdateBalanceComponents).toBeEnabled();
        await newMemberPage.button_UpdateBalanceComponents.click();

        await expect(newMemberPage.input_TransactionDate_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.input_TransactionDate_UpdateBalanceComponents).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedTransactionDate);

        await expect(newMemberPage.text_Balance_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.text_Balance_UpdateBalanceComponents).toHaveText(existingPensionAcount.edit.newBalanceComponents.expectedBalance);

        await expect(newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedTaxFreeProportion);

        await expect(newMemberPage.text_LastCreateEntriesDate_Pension_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.text_LastCreateEntriesDate_Pension_UpdateBalanceComponents).toHaveText(existingPensionAcount.edit.newBalanceComponents.expectedLastCreateEntriesDate);

        // check point -> after create entries, if the member is over 65, the preservation compoment will go to UNP, the rounding of 1cent is possible even if don't have any income or expense
        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.taxFree);

        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.taxed);

        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.untaxed);

        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.totalTaxComponents);

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.unrestrictedNonPreserved);

        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(existingPensionAcount.newMemberBalance.expectedBalanceComponentsAfterCE.totalPreservationComponents);

        // Edit Balance Components
        await expect(newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents).toBeEnabled();
        await newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents.fill(existingPensionAcount.edit.newBalanceComponents.balanceComponents.taxFreeProportion);
        await expect(newMemberPage.button_RecalculateTaxCpmponents_UpdateBalanceComponents).toBeEnabled();
        await newMemberPage.button_RecalculateTaxCpmponents_UpdateBalanceComponents.click();
        await page.waitForTimeout(waitTime.medium);

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeEnabled();
        await newMemberPage.input_Preserved_ViewEdit.fill(existingPensionAcount.edit.newBalanceComponents.balanceComponents.preserved);

        await expect(newMemberPage.input_RNP_ViewEdit).toBeEnabled();
        await newMemberPage.input_RNP_ViewEdit.fill(existingPensionAcount.edit.newBalanceComponents.balanceComponents.restrictedNonPreserved);

        await expect(newMemberPage.input_UNP_ViewEdit).toBeEnabled();
        await newMemberPage.input_UNP_ViewEdit.fill(existingPensionAcount.edit.newBalanceComponents.balanceComponents.unrestrictedNonPreserved);
        await newMemberPage.input_UNP_ViewEdit.press('Tab');

        // Edit Death Beneficiaries - Nomination Type & Expiry Date, Beneficiaries
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeEnabled();
        await newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit.fill(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.effectiveDate);

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeEnabled();
        await newMemberPage.input_NominationType_Beneficiary_ViewEdit.click();
        const option_NominationType_Beneficiary_ViewEdit = newMemberPage.option_NominationType_MemberDeathBeneficiaries_AddNewMember(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.nominationType);
        await expect(option_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await option_NominationType_Beneficiary_ViewEdit.click();
        await expect(newMemberPage.input_ExpiryDate_Beneficiary_ViewEdit).toBeEnabled();
        await newMemberPage.input_ExpiryDate_Beneficiary_ViewEdit.fill(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.expiryDate);

        if (existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length > 0) {
          const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
          for (let i = 0; i < existingPensionAcount.memberBeneficiaries.deathBenefitNomination.beneficiaries.length; i++) {
            await expect(deathBeneficiaryRows.nth(0).locator('td:nth-child(5)>div>div:nth-child(2) button')).toBeEnabled();
            await deathBeneficiaryRows.nth(0).locator('td:nth-child(5)>div>div:nth-child(2) button').click();
          }
        }
        if (existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries.length > 0) {
          for (const [index, beneficiary] of existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries.entries()) {
            await expect(newMemberPage.button_AddDeathBeneficiary_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddDeathBeneficiary_AddNewMember.click();

            // name
            const input_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_SearchContact_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.name);

            const option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(beneficiary.name);
            await expect(option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember.click();

            // Relationship
            const dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            const option_Relationship_MemberDeathBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberDeathBeneficiaries_AddNewMember(beneficiary.relationship);
            await expect(option_Relationship_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
            await option_Relationship_MemberDeathBeneficiaries_AddNewMember.click();

            // Proportion
            const input_Proportion_MemberDeathBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberDeathBeneficiaries_AddNewMember(index);
            await expect(input_Proportion_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
            await input_Proportion_MemberDeathBeneficiaries_AddNewMember.fill(beneficiary.proportion);

            // Tier Direction
            if (beneficiary.tier == 'Second') {
              const button_Tier_Second_MemberDeathBeneficiaries_AddNewMember = newMemberPage.button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index);
              await expect(button_Tier_Second_MemberDeathBeneficiaries_AddNewMember).toBeEnabled();
              await button_Tier_Second_MemberDeathBeneficiaries_AddNewMember.click();
            }
            await page.waitForTimeout(waitTime.medium);
          }
        }

        // Edit Reversionary Beneficiaries
        if (existingPensionAcount.memberBeneficiaries.reversionaryNomination.length > 0) {
          const reversionaryBeneficiaryRows = newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit;
          for (let i = 0; i < existingPensionAcount.memberBeneficiaries.reversionaryNomination.length; i++) {
            await expect(reversionaryBeneficiaryRows.nth(0).locator('td:nth-child(4)>div>div:nth-child(2) button')).toBeEnabled();
            await reversionaryBeneficiaryRows.nth(0).locator('td:nth-child(4)>div>div:nth-child(2) button').click();
          }
        }

        if (existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination.length > 0) {
          for (const [index, beneficiary] of existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination.entries()) {
            await expect(newMemberPage.button_AddReversionaryBeneficiary_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddReversionaryBeneficiary_AddNewMember.click();

            // name
            const input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.name);

            const option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.name);
            await expect(option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
            await option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember.click();

            // Relationship
            const dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

            const option_Relationship_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.option_Relationship_MemberReversionaryBeneficiaries_AddNewMember(beneficiary.relationship);
            await expect(option_Relationship_MemberReversionaryBeneficiaries_AddNewMember).toBeVisible();
            await option_Relationship_MemberReversionaryBeneficiaries_AddNewMember.click();

            // Proportion
            const input_Proportion_MemberReversionaryBeneficiaries_AddNewMember = newMemberPage.input_Proportion_MemberReversionaryBeneficiaries_AddNewMember(index);
            await expect(input_Proportion_MemberReversionaryBeneficiaries_AddNewMember).toBeEnabled();
            await input_Proportion_MemberReversionaryBeneficiaries_AddNewMember.fill(beneficiary.proportion);
          }

        }

        // Upload Documents
        await page.setInputFiles('input[type="file"]', path.resolve(__dirname, `documents/${existingPensionAcount.edit.documentName}`),);

        await expect(newMemberPage.button_Upload_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Upload_DocumentsNotes.click();
        await page.waitForTimeout(waitTime.long);

        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button')).toHaveCount(1);
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button .SFU_name')).toHaveText(existingPensionAcount.edit.documentName);

        // Add Notes
        await expect(newMemberPage.button_Notes_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Notes_DocumentsNotes.click();

        await expect(newMemberPage.button_AddNote_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_AddNote_DocumentsNotes.click();

        await expect(newMemberPage.textbox_WriteSomething_DocumentsNotes).toBeEnabled();
        await newMemberPage.textbox_WriteSomething_DocumentsNotes.fill(existingPensionAcount.edit.notes);

        await expect(newMemberPage.button_Save_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Save_DocumentsNotes.click();

        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveCount(1);
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveText(existingPensionAcount.edit.notes);

        // Edit Financial Details
        if (existingPensionAcount.financialDetails.length > 0) {
          const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
          for (let i = 0; i < existingPensionAcount.financialDetails.length; i++) {
            await expect(financialDetailRows.nth(0).locator('button').nth(0)).toBeEnabled();
            await financialDetailRows.nth(0).locator('button').nth(0).click();
            await page.waitForTimeout(waitTime.short);
          }
        }

        for (const [index, financialDetail] of existingPensionAcount.edit.newFinancialDetails.entries()) {
          if (index != 0) {
            await expect(newMemberPage.button_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.button_AddNewFinancialItem_AddNewMember.click();
          }

          // Name
          if (!financialDetail.custom) {
            const dropDownButton_Name_FinancialDetails_AddNewMember = newMemberPage.dropDownButton_Name_FinancialDetails_AddNewMember(index);
            await expect(dropDownButton_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await dropDownButton_Name_FinancialDetails_AddNewMember.click();

            const option_Name_FinancialDetails_AddNewMember = newMemberPage.option_Name_FinancialDetails_AddNewMember(financialDetail.name);
            await expect(option_Name_FinancialDetails_AddNewMember).toBeVisible();
            await option_Name_FinancialDetails_AddNewMember.click();
          } else {
            const input_Name_FinancialDetails_AddNewMember = newMemberPage.input_Name_FinancialDetails_AddNewMember(index);
            await expect(input_Name_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Name_FinancialDetails_AddNewMember.fill(financialDetail.name);
          }
          await page.waitForTimeout(waitTime.medium);

          // Value
          if (financialDetail.name != 'Death Benefit Pension') {
            const input_Value_FinancialDetails_AddNewMember = newMemberPage.input_Value_FinancialDetails_AddNewMember(index);
            await expect(input_Value_FinancialDetails_AddNewMember).toBeEnabled();
            await input_Value_FinancialDetails_AddNewMember.fill(financialDetail.value);
          } else {
            await expect(newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeEnabled();
            await newMemberPage.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            if (financialDetail.value == 'Yes') {
              await expect(newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            } else {
              await expect(newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember).toBeVisible();
              await newMemberPage.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember.click();
            }
          }

          // Show On Statement
          if (financialDetail.showOnStatementDefault != financialDetail.showOnStatement) {
            const sliderButton_ShowOnStatement_FinancialDetails_AddNewMember = newMemberPage.sliderButton_ShowOnStatement_FinancialDetails_AddNewMember(index);
            await expect(sliderButton_ShowOnStatement_FinancialDetails_AddNewMember).toBeEnabled();
            await sliderButton_ShowOnStatement_FinancialDetails_AddNewMember.click();
          }
        }

        await expect(newMemberPage.button_Save_AddNewMember).toBeEnabled();
        await newMemberPage.button_Save_AddNewMember.click();

        // Verify the edited pension account in member list

        const text_AccountCode_MemberList = newMemberPage.text_AccountCode_MemberList(existingPensionAcount.accountDetails.memberCode);
        await expect(text_AccountCode_MemberList).toBeVisible();

        button_EditMemberAccount = newMemberPage.button_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
        if (!await button_EditMemberAccount.isVisible()) {
          const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(existingPensionAcount.accountDetails.memberCode);
          await buttonArea_EditMemberAccount.hover();
          await page.waitForTimeout(waitTime.medium);
        }
        await expect(button_EditMemberAccount).toBeEnabled();
        await button_EditMemberAccount.click();

        await expect(newMemberPage.button_ViewAndEdit_ViewEdit).toBeEnabled();
        await newMemberPage.button_ViewAndEdit_ViewEdit.click();
        await page.waitForTimeout(waitTime.medium);

        // Check the new vaules:
        // Email
        await expect(newMemberPage.input_Email_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Email_ViewEdit).toHaveValue(existingPensionAcount.edit.newEmail);
        // Account Description & Tax Free Proportion
        await expect(newMemberPage.input_AccountDescription_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_AccountDescription_ViewEdit).toHaveValue(existingPensionAcount.edit.newAccountDescription);
        await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFreeProportion_AccountDetails_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.balanceComponents.taxFreeProportion);
        // BalanceComponents
        await expect(newMemberPage.button_UpdateBalanceComponents).toBeEnabled();
        await newMemberPage.button_UpdateBalanceComponents.click();
        await expect(newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents).toBeVisible();
        await expect(newMemberPage.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.taxFreeProportion);

        await expect(newMemberPage.input_TaxFree_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_TaxFree_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.taxFree);
        await expect(newMemberPage.input_Taxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Taxed_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.taxed);
        await expect(newMemberPage.input_Untaxed_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Untaxed_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.untaxed);
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalTaxComponents_ViewEdit).toHaveText(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.totalTaxComponents)

        await expect(newMemberPage.input_Preserved_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_Preserved_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.preserved);
        await expect(newMemberPage.input_RNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_RNP_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.restrictedNonPreserved);
        await expect(newMemberPage.input_UNP_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_UNP_ViewEdit).toHaveValue(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.unrestrictedNonPreserved);
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toBeVisible();
        await expect(newMemberPage.text_TotalPreservationComponents_ViewEdit).toHaveText(existingPensionAcount.edit.newBalanceComponents.expectedBalanceComponents.totalPreservationComponents);

        // Death Beneficiaries
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_EffectiveDate_Beneficiary_ViewEdit).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.effectiveDate);

        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toBeVisible();
        await expect(newMemberPage.input_NominationType_Beneficiary_ViewEdit).toHaveText(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.nominationType);

        if (existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.nominationType == 'Binding Death Benefit - Lapsing'
          || existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.nominationType == 'Non-Binding Death Benefit - Lapsing') {
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toBeVisible();
          await expect(newMemberPage.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.expiryDate);
        }

        await expect(newMemberPage.rows_DeathBeneficiaries_ViewEdit).toHaveCount(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries.length);

        const deathBeneficiaryRows = newMemberPage.rows_DeathBeneficiaries_ViewEdit;
        for (let i = 0; i < existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries.length; i++) {
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries[i].name);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries[i].relationship);
          await expect(deathBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries[i].proportion);
          await expect(deathBeneficiaryRows.nth(i).locator('button._button-checked_phmar_45')).toHaveText(existingPensionAcount.edit.newMemberBeneficiaries.deathBenefitNomination.beneficiaries[i].tier);
        }
        // reversionary Nomination
        await expect(newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit).toHaveCount(existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination.length);
        const reversionaryBeneficiaryRows = await newMemberPage.rows_ReversionaryBeneficiaries_ViewEdit;
        for (let i = 0; i < existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination.length; i++) {
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(1) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination[i].name);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(2) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination[i].relationship);
          await expect(reversionaryBeneficiaryRows.nth(i).locator('td:nth-child(3) input')).toHaveValue(existingPensionAcount.edit.newMemberBeneficiaries.reversionaryNomination[i].proportion);
        }

        // Documents
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button')).toHaveCount(1);
        await expect(newMemberPage.addedDocuments_DocumentsNotes.locator('button .SFU_name')).toHaveText(existingPensionAcount.edit.documentName);
        // Notes
        await expect(newMemberPage.button_Notes_DocumentsNotes).toBeEnabled();
        await newMemberPage.button_Notes_DocumentsNotes.click();
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveCount(1);
        await expect(newMemberPage.addedNotesContents_DocumentsNotes).toHaveText(existingPensionAcount.edit.notes);
        // FinancialDetails
        await expect(newMemberPage.rows_FinancialDetails_ViewEdit).toHaveCount(existingPensionAcount.edit.newFinancialDetails.length);
        const financialDetailRows = newMemberPage.rows_FinancialDetails_ViewEdit;
        for (let i = 0; i < existingPensionAcount.edit.newFinancialDetails.length; i++) {
          // Name
          await expect(financialDetailRows.nth(i).locator('input[placeholder="Select from the list or type a value"]')).toHaveValue(existingPensionAcount.edit.newFinancialDetails[i].name);

          // Value
          if (existingPensionAcount.edit.newFinancialDetails[i].name == 'Death Benefit Pension') {
            await expect(financialDetailRows.nth(i).locator('div.custom-scrollbar__value-container')).toHaveText(existingPensionAcount.edit.newFinancialDetails[i].value);
          } else {
            await expect(financialDetailRows.nth(i).locator('input#member-tfn-input')).toHaveValue(existingPensionAcount.edit.newFinancialDetails[i].value);
          }
          // Show On Statement
          if (existingPensionAcount.edit.newFinancialDetails[i].name == 'Centrelink Original Purchase Price') {
            await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toHaveCount(0);
          } else {
            if (existingPensionAcount.edit.newFinancialDetails[i].showOnStatement == 'Yes')
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).toBeChecked();
            else
              await expect(financialDetailRows.nth(i).locator('input[type="checkbox"]')).not.toBeChecked();
          }
        }
      });
    }
  }

  // close entries
  test('close entries', async () => {
    await complianceUtil.closeEntries();
  });

  test('Revert to Reversionary Beneficiaries for member2 (ABP)', async () => {
    const testDateForReversion = {
      memberCode: allExistingPensionAcounts[0].accountDetails.memberCode,
      memberName: 'newMemberTest, member2',
      dateOfDeath: '01/07/2025',
      expectedReversionaryPensionAccountDetails: {
        pensionType: "Account Based Pension",
        accountCode: allExistingPensionAcounts[0].accountDetails.memberCode,
        pensionStartDate: "31/07/2024",
        reversionDate: "01/07/2025",
        currentAccountBalance: "$ 1,965,325.02"
      },
      expectedReversionaryBeneficiaries: [
        {
          name: "newMemberTest, member1",
          gender: "Male",
          proportion: "60",
          paymentAmount: "$ 1,179,195.01",
          dateOfBirth: "30/06/1965"
        },
        {
          name: "newMemberTest, member3",
          gender: "Select...",
          proportion: "40",
          paymentAmount: "$ 786,130.01",
          dateOfBirth: "30/10/1985"
        }
      ],
      expectedBalanceCmponent: [
        {
          name: "newMemberTest, member1",
          taxFree: "589,597.51",
          taxed: "141,264.96",
          untaxed: "448,332.54",
          totalTaxComponents: "Total Tax Components: $ 1,179,195.01",
          preserved: "120,000.00",
          rnp: "480,000.00",
          unp: "579,195.01",
          totalPreservationComponents: "Total Preservation Components: $ 1,179,195.01"
        },
        {
          name: "newMemberTest, member3",
          taxFree: "393,065.00",
          taxed: "94,176.65",
          untaxed: "298,888.36",
          totalTaxComponents: "Total Tax Components: $ 786,130.01",
          preserved: "80,000.00",
          rnp: "320,000.00",
          unp: "386,130.01",
          totalPreservationComponents: "Total Preservation Components: $ 786,130.01"
        }
      ],
      expectedTransferBalanceCap: [
        {
          member: `member2, newMemberTest (${allExistingPensionAcounts[0].accountDetails.memberCode})`,
          effectiveDate: '01/07/2025',
          event: 'NA - N/A: Non reportable event',
          currentAccountBalance: '$ 1,965,325.02',
          capLimit: '$ 1,900,000.00',
          capRemainingPriorToReversion: '$ -65,325.02',
          capRemainingAfterReversion: '$ 1,900,000.00'
        },
        {
          member: 'newMemberTest, member3 (new pension account)',
          effectiveDate: '01/07/2025',
          event: 'IRS - Reversionary Income Stream',
          currentAccountBalance: '$ 0.00',
          capLimit: '$ 2,000,000.00',
          capRemainingPriorToReversion: '$ 2,000,000.00',
          capRemainingAfterReversion: '$ 1,213,869.99'
        },
        {
          member: 'newMemberTest, member1 (new pension account)',
          effectiveDate: '01/07/2025',
          event: 'IRS - Reversionary Income Stream',
          currentAccountBalance: '$ 66,811.42',
          capLimit: '$ 1,997,000.00',
          capRemainingPriorToReversion: '$ 1,930,188.58',
          capRemainingAfterReversion: '$ 750,993.57'
        }
      ],
      expectedMemberListAfterReversion: [
        {
          name: "newMemberTest, member1",
          pensiontype: "Account Based Pension (Reversionary Beneficiary)",
          startDate: "31/07/2024",
          taxFree: " 50.00 % ",
          estimatedBalance: "$ 1,179,195.01",
        },
        {
          name: "newMemberTest, member3",
          pensiontype: "Account Based Pension (Reversionary Beneficiary)",
          startDate: "31/07/2024",
          taxFree: " 50.00 % ",
          estimatedBalance: "$ 786,130.01",
        }
      ]
    };

    newMemberPage = new NewMemberPage(page);
    await newMemberPage.page.goto(`${context.TestConfig.serverURL}/${context.AllURLs.urls.Member_NewMemberDashboard_Members}firm=${testFirm.shortFirmName}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`);
    await expect(newMemberPage.allAccountCodes_MemberList.first()).toBeVisible();
    const accountCodesBefore = await newMemberPage.allAccountCodes_MemberList.allTextContents();
    // console.log('All Account Codes before Reversion ---> ', accountCodesBefore);
    assert.equal(accountCodesBefore.length, 6);

    const pensionAccountCode = allExistingPensionAcounts[0].accountDetails.memberCode;
    console.log('Reverting to reversionary beneficiary for pension account ---> ', pensionAccountCode);

    const button_EditMemberAccount = newMemberPage.button_EditMemberAccount(pensionAccountCode);
    if (!await button_EditMemberAccount.isVisible()) {
      const buttonArea_EditMemberAccount = newMemberPage.buttonArea_EditMemberAccount(pensionAccountCode);
      await buttonArea_EditMemberAccount.hover();
      await page.waitForTimeout(waitTime.medium);
    }
    await expect(button_EditMemberAccount).toBeEnabled();
    await button_EditMemberAccount.click();

    // Click "Revert to Reversionary Beneficiary" button
    await expect(newMemberPage.button_RevertToRevisionaryBeneficiary_ViewEdit).toBeEnabled();
    await newMemberPage.button_RevertToRevisionaryBeneficiary_ViewEdit.click();

    // Reversionary Pension Wizard - Enter Date of Death
    await expect(newMemberPage.input_DateOfDeath_ReversionaryPensionWizard).toBeEnabled();
    await newMemberPage.input_DateOfDeath_ReversionaryPensionWizard.fill(testDateForReversion.dateOfDeath);
    await expect(newMemberPage.text_MemberName_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.text_MemberName_ReversionaryPensionWizard).toHaveText(testDateForReversion.memberName);
    await page.waitForTimeout(waitTime.medium);

    // Check Reversionary Pension Account Details
    await expect(newMemberPage.text_PensionType_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.text_PensionType_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedReversionaryPensionAccountDetails.pensionType);

    await expect(newMemberPage.text_AccountCode_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.text_AccountCode_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedReversionaryPensionAccountDetails.accountCode);

    await expect(newMemberPage.text_PensionStartDate_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.text_PensionStartDate_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedReversionaryPensionAccountDetails.pensionStartDate);

    await expect(newMemberPage.input_ReversionDate_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.input_ReversionDate_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedReversionaryPensionAccountDetails.reversionDate);

    await expect(newMemberPage.text_CurrentAccountBalance_ReversionaryPensionWizard).toBeVisible();
    await expect(newMemberPage.text_CurrentAccountBalance_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedReversionaryPensionAccountDetails.currentAccountBalance);

    // Check Reversionary Beneficiaries
    await expect(newMemberPage.rows_Beneficiary_ReversionaryPensionWizard).toHaveCount(testDateForReversion.expectedReversionaryBeneficiaries.length);
    const beneficiaryRows = newMemberPage.rows_Beneficiary_ReversionaryPensionWizard;
    for (let i = 0; i < testDateForReversion.expectedReversionaryBeneficiaries.length; i++) {
      await expect(beneficiaryRows.nth(i).locator('div:nth-child(1)>div:nth-child(1) label')).toHaveText(testDateForReversion.expectedReversionaryBeneficiaries[i].name);
      await expect(beneficiaryRows.nth(i).locator('div:nth-child(2) .custom-scrollbar__value-container>div:nth-child(1)')).toHaveText(testDateForReversion.expectedReversionaryBeneficiaries[i].gender);
      await expect(beneficiaryRows.nth(i).locator('div:nth-child(3) input#proportion')).toHaveValue(testDateForReversion.expectedReversionaryBeneficiaries[i].proportion);
      await expect(beneficiaryRows.nth(i).locator('div:nth-child(4) label')).toHaveText(testDateForReversion.expectedReversionaryBeneficiaries[i].paymentAmount);
      await expect(beneficiaryRows.nth(i).locator('div:nth-child(5) label')).toHaveText(testDateForReversion.expectedReversionaryBeneficiaries[i].dateOfBirth);
    }

    // Check Components After Reversion for all beneficiaries
    await expect(newMemberPage.tabs_Account_ComponentsAfterReversion_ReversionaryPensionWizard).toHaveCount(testDateForReversion.expectedBalanceCmponent.length);
    const tabs_Account_ComponentsAfterReversion = newMemberPage.tabs_Account_ComponentsAfterReversion_ReversionaryPensionWizard;
    for (let i = 0; i < testDateForReversion.expectedBalanceCmponent.length; i++) {
      await expect(tabs_Account_ComponentsAfterReversion.nth(i)).toHaveText(testDateForReversion.expectedBalanceCmponent[i].name);
      await expect(tabs_Account_ComponentsAfterReversion.nth(i)).toBeEnabled();
      await tabs_Account_ComponentsAfterReversion.nth(i).click();
      await page.waitForTimeout(waitTime.medium);

      await expect(newMemberPage.input_TaxFree_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_TaxFree_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].taxFree);

      await expect(newMemberPage.input_Taxed_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_Taxed_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].taxed);

      await expect(newMemberPage.input_Untaxed_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_Untaxed_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].untaxed);

      await expect(newMemberPage.text_TotalTaxComponents_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.text_TotalTaxComponents_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedBalanceCmponent[i].totalTaxComponents);

      await expect(newMemberPage.input_Preserved_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_Preserved_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].preserved);

      await expect(newMemberPage.input_RestrictedNonPreserved_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_RestrictedNonPreserved_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].rnp);

      await expect(newMemberPage.input_UnrestrictedNonPreserved_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.input_UnrestrictedNonPreserved_ReversionaryPensionWizard).toHaveValue(testDateForReversion.expectedBalanceCmponent[i].unp);

      await expect(newMemberPage.text_TotalPreservationComponents_ReversionaryPensionWizard).toBeVisible();
      await expect(newMemberPage.text_TotalPreservationComponents_ReversionaryPensionWizard).toHaveText(testDateForReversion.expectedBalanceCmponent[i].totalPreservationComponents);
    }

    // Check Transfer Balance Cap
    await expect(newMemberPage.rows_TransferBalanceCap_ReversionaryPensionWizard).toHaveCount(testDateForReversion.expectedTransferBalanceCap.length);
    const transferBalanceCapRows = newMemberPage.rows_TransferBalanceCap_ReversionaryPensionWizard;
    await transferBalanceCapRows.nth(0).scrollIntoViewIfNeeded();
    for (let i = 0; i < testDateForReversion.expectedTransferBalanceCap.length; i++) {
      await expect(transferBalanceCapRows.nth(i).locator('.tba-member')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].member);
      await expect(transferBalanceCapRows.nth(i).locator('#tba-date')).toHaveValue(testDateForReversion.expectedTransferBalanceCap[i].effectiveDate);
      await expect(transferBalanceCapRows.nth(i).locator('.custom-scrollbar__single-value')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].event);
      await expect(transferBalanceCapRows.nth(i).locator('.tba-current-balance')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].currentAccountBalance);
      await expect(transferBalanceCapRows.nth(i).locator('.tba-cap-limit')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].capLimit);
      await expect(transferBalanceCapRows.nth(i).locator('.tba-cap-prior')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].capRemainingPriorToReversion);
      await expect(transferBalanceCapRows.nth(i).locator('.tba-cap-after')).toHaveText(testDateForReversion.expectedTransferBalanceCap[i].capRemainingAfterReversion);
    }

    // Click Save Only to revert to reversionary beneficiaries
    await expect(newMemberPage.button_Save_ReversionaryPensionWizard).toBeEnabled();
    await newMemberPage.button_Save_ReversionaryPensionWizard.click();
    await expect(newMemberPage.button_SaveOnly_ReversionaryPensionWizard).toBeEnabled();
    await newMemberPage.button_SaveOnly_ReversionaryPensionWizard.click();
    await newMemberPage.text_Title_ReversionaryPensionWizard.waitFor({ state: 'hidden' });
    await page.waitForTimeout(waitTime.long);

    // Verify the pension account is reverted to reversionary beneficiary
    await expect(newMemberPage.allAccountCodes_MemberList.first()).toBeVisible();
    const accountCodesAfter = await newMemberPage.allAccountCodes_MemberList.allTextContents();
    // console.log('All Account Codes after Reversion ---> ', accountCodesAfter);
    assert.equal(accountCodesAfter.length, 7);

    const allRows_MemberList = newMemberPage.allRows_MemberList;
    const count = await allRows_MemberList.count();
    let memberName = '';
    let memberNameAndIndex = [];
    for (let i = 0; i < count; i++) {
      if (await allRows_MemberList.nth(i).locator('td:nth-child(3)').innerText() == '') {
        memberName = await allRows_MemberList.nth(i).locator('td:nth-child(2)>div>div>span').innerText();
      } else {
        const pensionType = await allRows_MemberList.nth(i).locator('td:nth-child(2)>button>div:nth-child(2)').innerText();
        if (pensionType.includes('Reversionary Beneficiary')) {
          memberNameAndIndex.push({
            name: memberName,
            index: i
          });
        }
      }
    }

    // console.log('memberNameAndIndex ---> ', memberNameAndIndex);
    assert.equal(memberNameAndIndex.length, testDateForReversion.expectedMemberListAfterReversion.length);

    for (let j = 0; j < testDateForReversion.expectedMemberListAfterReversion.length; j++) {
      const reversionaryPensionCode = await allRows_MemberList.nth(memberNameAndIndex[j].index).locator('td:nth-child(2)>button>div:nth-child(1)>div:nth-child(1)').innerText();
      console.log('reversionaryPensionCode ---> ', reversionaryPensionCode);
      assert.equal(accountCodesBefore.includes(reversionaryPensionCode), false);
      assert.equal(memberNameAndIndex[j].name, testDateForReversion.expectedMemberListAfterReversion[j].name);
      await expect(allRows_MemberList.nth(memberNameAndIndex[j].index).locator('td:nth-child(2)>button>div:nth-child(2)')).toHaveText(testDateForReversion.expectedMemberListAfterReversion[j].pensiontype);
      await expect(allRows_MemberList.nth(memberNameAndIndex[j].index).locator('td:nth-child(3)')).toHaveText(testDateForReversion.expectedMemberListAfterReversion[j].startDate);
      await expect(allRows_MemberList.nth(memberNameAndIndex[j].index).locator('td:nth-child(5)')).toHaveText(testDateForReversion.expectedMemberListAfterReversion[j].taxFree);
      await expect(allRows_MemberList.nth(memberNameAndIndex[j].index).locator('td:nth-child(7)')).toHaveText(testDateForReversion.expectedMemberListAfterReversion[j].estimatedBalance);
    }

    console.log('Successfully reverted to reversionary beneficiary for pension account ---> ', pensionAccountCode);
  });
});