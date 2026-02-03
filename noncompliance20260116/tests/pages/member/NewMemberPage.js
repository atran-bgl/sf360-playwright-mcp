export class NewMemberPage {
  constructor(page) {
    this.page = page;

    // Add New Member
    this.button_ShowAllMembers = page.getByRole('button', { name: 'All members' });
    this.button_AddNewMember = page.getByRole('button', { name: 'Add New Member', exact: true });

    this.heading_PersonalDetails_AddNewMember = page.getByRole('heading', { name: 'Personal Details' })
    this.input_SearchContact_AddNewMember = page.getByRole('searchbox', { name: 'Type to search for a contact' });
    this.button_CreateNewContact_AddNewMember = page.locator('.new-contact');

    this.option_FirstResult_SelectContact_AddNewMember = page.locator('.overflow-auto>div:nth-child(1)');
    this.input_FirstName_AddNewMember = page.locator('div').filter({ hasText: /^First Name\*$/ }).locator('#member-name-input');
    this.input_Surname_AddNewMember = page.locator('div').filter({ hasText: /^Surname\*$/ }).locator('#member-name-input');
    this.input_Mobile_AddNewMember = page.locator('#member-ph-input');
    this.input_Email_AddNewMember = page.locator('#member-em-input');
    this.input_DOB_AddNewMember = page.locator('#member-dob-input');
    this.input_TFN_AddNewMember = page.locator('#member-tfn-input')

    this.dropDownButton_SelectAccountType_AddNewMember = page.locator('div#accountDetails>div:nth-child(2)>div>div>div>div:nth-child(2) svg');
    this.option_Accumulation_SelectAccountType_AddNewMember = page.getByRole('option', { name: 'Accumulation' });
    this.option_Pension_SelectAccountType_AddNewMember = page.getByRole('option', { name: 'Pension' });
    this.dropDownButton_SelectPensionType_AddNewMember = page.locator('div#accountDetails>div:nth-child(3)>div>div>div>div:nth-child(2) svg');

    this.dropDownButton_Sex_MLPension_AddNewMember = page.locator('div#accountDetails>div:nth-child(4)>div>div>div>div:nth-child(2) svg');
    this.option_Male_Sex_MLPension_AddNewMember = page.getByRole('option', { name: 'Male' });
    this.option_Female_Sex_MLPension_AddNewMember = page.getByRole('option', { name: 'Female' });
    this.input_OriginalTerm_MLPension_AddNewMember = page.locator('#original-term-input');

    this.input_AccountDescription_AddNewMember = page.locator('#account-description-input');
    this.input_MemberCode_AddNewMember = page.locator('#member-code-input');
    this.input_AccountStartDate_AddNewMember = page.locator('#member-start-input');
    this.input_ServicePeriodStartDate_AddNewMember = page.locator('#member-service-input');

    this.dropDownButton_ConditionOfRelease_AddNewMember = page.locator('div#conditionReleases>div>div>div svg');

    this.sliderButton_PostMemberBalance_AddNewMember = page.locator('#newBalance .question span');
    this.input_Amount_Accumulation_AddNewMember = page.locator('div#newBalance>div:nth-child(3) input');
    this.input_Amount_Pension_AddNewMember = page.locator('div#newBalance>div:nth-child(4) input');
    this.input_BalanceDate_AddNewMember = page.locator('#new-balance-date');

    this.input_TaxFree_AddNewMember = page.locator('input#taxFreeComponent');
    this.input_Taxed_AddNewMember = page.locator('input#elementTaxed');
    this.input_Untaxed_AddNewMember = page.locator('input#elementUntaxed');
    this.input_Preserved_AddNewMember = page.locator('input#preservedAmount');
    this.input_RestrictedNonPreserved_AddNewMember = page.locator('input#restrictedNonPreserved');
    this.input_UnrestrictedNonPreserved_AddNewMember = page.locator('input#unrestrictedNonPreserved');

    this.button_AddMemberBeneficiaries_AddNewMember = page.getByRole('link', { name: '+ Add Member Beneficiaries' });

    this.input_EffectiveDate_MemberDeathBeneficiaries_AddNewMember = page.locator('#effective-date');
    this.dropDownButton_NominationType_MemberDeathBeneficiaries_AddNewMember = page.locator('#beneficiaryDetails svg');
    this.input_ExpiryDate_MemberDeathBeneficiaries_AddNewMember = page.locator('#expiry-date');
    this.button_AddDeathBeneficiary_AddNewMember = page.locator('#death-benefit tfoot button');

    this.button_ReversionaryNominationn_AddNewMember = page.getByRole('button', { name: 'Reversionary nomination' });
    this.button_AddReversionaryBeneficiary_AddNewMember = page.locator('.reversionary-table tfoot button');

    this.button_AddMemberFinancialDetails_AddNewMember = page.getByRole('link', { name: '+ Add Member Financial Details' });
    this.button_AddNewFinancialItem_AddNewMember = page.getByRole('button', { name: '+ Add New Financial Item' });

    this.dropDownButton_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember = page.locator('#financialDetails svg');
    this.option_Yes_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember = page.getByRole('option', { name: 'Yes' });
    this.option_No_Value_DeathBenefitPension_AddNewFinancialItem_AddNewMember = page.getByRole('option', { name: 'No' });

    this.button_Save_AddNewMember = page.getByRole('button', { name: 'Save' });

    // Commmence Pension
    this.button_CommencePension = page.getByRole('button', { name: 'Commence Pension' });
    this.dropDownButton_SelectAccumulationAccount_CommencePension = page.locator('#selectAccountDetails>div:nth-child(2) svg');
    this.input_CommencementDate_CommencePension = page.locator('input#pension-start-date');
    this.dropDownButton_PensionType_CommencePension = page.locator('#selectAccountDetails>div:nth-child(4) svg');
    this.input_AccountDescription_CommencePension = page.locator('input#account-description-input');
    this.dropDownButton_ConditionOfRelease_CommencePension = page.locator('#conditionReleases svg');
    this.input_ConditionOfRelease_CommencePension = page.locator('#conditionReleases .custom-scrollbar__value-container>.custom-scrollbar__single-value');

    this.sliderButton_FullBalance_CommencePension = page.locator('#commenceBalances>div:nth-child(2) span');
    this.sliderButton_CeaseAccumulationAccount_CommencePension = page.locator('#commenceBalances>div:nth-child(3) span');
    this.input_PercentageOfBalance_CommencePension = page.locator('#commenceBalances>div:nth-child(3)>div:nth-child(1) input');
    this.input_SpecificAmount_CommencePension = page.locator('#commenceBalances>div:nth-child(3)>div:nth-child(2) input');
    this.radioButton_MaintainCurrentPreservationComponents_CommencePension = page.getByRole('radio', { name: 'Maintain Current Preservation' });
    this.radioButton_UnrestrictedNonPreserved_CommencePension = page.getByRole('radio', { name: 'Unrestricted Non Preserved' });
    this.input_TaxFree_CommencePension = page.locator('#taxFreeComponent');
    this.input_Taxed_CommencePension = page.locator('#elementTaxed');
    this.input_Untaxed_CommencePension = page.locator('#elementUntaxed');
    this.text_TotalTaxComponents_CommencePension = page.locator('div.account-balances-content>div:nth-child(1) .member-comp-totals');
    this.input_Preserved_CommencePension = page.locator('#preservedAmount');
    this.input_RestrictedNonPreserved_CommencePension = page.locator('#restrictedNonPreserved');
    this.input_UnrestrictedNonPreserved_CommencePension = page.locator('#balanceComponents #unrestrictedNonPreserved');
    this.text_TotalPreservationComponents_CommencePension = page.locator('div.account-balances-content>div:nth-child(2) .member-comp-totals');

    this.input_Event_TBA_CommencePension = page.locator('#tbaDetails .custom-scrollbar__single-value');
    this.input_EffectiveDate_TBA_CommencePension = page.locator('#tbaDetails #effectiveDate');
    this.text_ValueOfCurrentBalance_TBA_CommencePension = page.locator('.form-group-inline', { hasText: 'Current balance' }).locator('.input-col');
    this.text_ValueOfCapLimit_TBA_CommencePension = page.locator('.form-group-inline', { hasText: 'Cap Limit' }).locator('.input-col');
    this.text_ValueOfCapRemainingBefore_TBA_CommencePension = page.locator('.form-group-inline', { hasText: 'Cap Remaining (before pension commencement)' }).locator('.input-col');
    this.text_ValueOfCapRemainingAfter_TBA_CommencePension = page.locator('.form-group-inline', { hasText: 'Cap Remaining (after pension commencement)' }).locator('.input-col');

    this.sliderButton_WithBeneficiaries_CommencePension = page.locator('div').filter({ hasText: /^Is the pension set up with a death benefit or reversionary nomination\?$/ }).locator('span');
    this.input_EffectiveDate_DeathBenefitNomination_CommencePension = page.locator('#beneficiaryDetails #effective-date');
    this.dropDownButton_NominationType_MemberDeathBeneficiaries_CommencePension = page.locator('.nomination-details>div:nth-child(2) svg');
    this.input_ExpiryDate_MemberDeathBeneficiaries_CommencePension = page.locator('#beneficiaryDetails input#expiry-date');

    this.button_Save_CommencePension = page.getByRole('button', { name: 'Save' });
    this.button_SaveOnly_CommencePension = page.getByRole('button', { name: 'Save Only' });
    this.button_Yes_SystemInformationDialog_CommencePension = page.getByRole('button', { name: 'Yes' });

    this.allAccountCodes_MemberList = page.locator('button.member-cell>div>div:nth-child(1)');
    this.allRows_MemberList = page.locator('#members tbody>tr:not(.nested-table-row)');

    // View & Edit Personal Details  
    this.button_ViewAndEdit_ViewEdit = page.getByRole('button', { name: 'View & edit' });
    this.input_FirstName_ViewEdit = page.locator('#personalDetails .name-input:nth-child(1) input#member-name-input');
    this.input_Surname_ViewEdit = page.locator('#personalDetails .name-input:nth-child(2) input#member-name-input');
    this.input_Mobile_ViewEdit = page.locator('#personalDetails input#member-ph-input');
    this.input_Email_ViewEdit = page.locator('#personalDetails input#member-em-input');
    this.input_DOB_ViewEdit = page.locator('#personalDetails input#memberDob');
    this.input_TFN_ViewEdit = page.locator('#personalDetails input#memberTFN');

    // View & Edit Account Details
    this.input_SelectAccountType_ViewEdit = page.locator('#accountDetails>div:nth-child(2)>div>div>div>div:nth-child(1)');
    this.input_SelectPensionType_ViewEdit = page.locator('#accountDetails>div:nth-child(3)>div>div>div>div:nth-child(1)');
    this.input_OriginalTerm_ViewEdit = page.locator('input#original-term-input');
    this.input_AccountDescription_ViewEdit = page.locator('#accountDetails input#account-description-input');
    this.input_MemberCode_ViewEdit = page.locator('#accountDetails input#member-code-input');
    this.input_AccountStartDate_ViewEdit = page.locator('#accountDetails input#member-start-input');
    this.input_AccountEndDate_ViewEdit = page.locator('#accountDetails input#member-end-input');
    this.input_ServicePeriodStartDate_ViewEdit = page.locator('#accountDetails input#member-service-input');
    this.input_TaxFreeProportion_AccountDetails_ViewEdit = page.locator('#accountDetails input#member-tax-input');
    this.input_ConditionOfRelease_ViewEdit = page.locator('#conditionReleases>div>div>div>div>div:nth-child(1)>div:nth-child(1)');

    // View & Edit Balance Components
    this.button_UpdateBalanceComponents = page.getByRole('button', { name: 'Update Balance Components' });

    this.input_TransactionDate_UpdateBalanceComponents = page.locator('#balance-date-input');
    this.text_Balance_UpdateBalanceComponents = page.locator('#balanceComponents>div:nth-child(2)>div:nth-child(2)>div>div:nth-child(2)');
    this.input_TaxFreeProportion_BalanceComponents_UpdateBalanceComponents = page.locator('#balanceComponents>div:nth-child(2)>div:nth-child(3) input');
    this.button_RecalculateTaxCpmponents_UpdateBalanceComponents = page.getByText('Recalculate tax components', { exact: true });
    this.text_LastCreateEntriesDate_Accumulation_UpdateBalanceComponents = page.locator('#balanceComponents>div:nth-child(2)>div:nth-child(3)>div>label');
    this.text_LastCreateEntriesDate_Pension_UpdateBalanceComponents = page.locator('#balanceComponents>div:nth-child(2)>div:nth-child(4)>div>label');

    this.input_TaxFree_ViewEdit = page.locator('#balanceComponents input#taxFreeComponent');
    this.input_Taxed_ViewEdit = page.locator('#balanceComponents input#elementTaxed');
    this.input_Untaxed_ViewEdit = page.locator('#balanceComponents input#elementUntaxed');
    this.text_TotalTaxComponents_ViewEdit = page.locator('.account-balances-content>div:nth-child(1) .member-comp-totals');
    this.input_Preserved_ViewEdit = page.locator('#balanceComponents input#preservedAmount');
    this.input_RNP_ViewEdit = page.locator('#balanceComponents input#restrictedNonPreserved');
    this.input_UNP_ViewEdit = page.locator('#balanceComponents input#unrestrictedNonPreserved');
    this.text_TotalPreservationComponents_ViewEdit = page.locator('.account-balances-content>div:nth-child(2) .member-comp-totals');

    // View & Edit Member Beneficiaries
    this.input_EffectiveDate_Beneficiary_ViewEdit = page.locator('#beneficiaryDetails input#effective-date');
    this.input_NominationType_Beneficiary_ViewEdit = page.locator('section.nomination-details>div:nth-child(2)>div>div>div>div:nth-child(1)');
    this.input_ExpiryDate_Beneficiary_ViewEdit = page.locator('#beneficiaryDetails input#expiry-date');
    this.rows_DeathBeneficiaries_ViewEdit = page.locator('#death-benefit tbody tr');
    this.rows_ReversionaryBeneficiaries_ViewEdit = page.locator('#reversionary-table tbody tr');

    // Documents & Notes
    this.addedDocuments_DocumentsNotes = page.locator('#documents>div:nth-child(3)>div:nth-child(2)');
    this.documentsTab_DocumentsNotes = page.locator('#documents>div:nth-child(2)>div:nth-child(1)');
    this.notesTab_DocumentsNotes = page.locator('#documents>div:nth-child(2)>div:nth-child(2)');
    this.button_Upload_DocumentsNotes = page.getByRole('button', { name: 'Upload' });

    this.button_Notes_DocumentsNotes = page.locator('#documents>div:nth-child(2)>div:nth-child(2)');
    this.button_AddNote_DocumentsNotes = page.getByRole('button', { name: '+ Add note' });
    this.textbox_WriteSomething_DocumentsNotes = page.getByRole('textbox', { name: 'Write something' });
    this.button_Save_DocumentsNotes = page.locator('#note-container').getByRole('button', { name: 'Save' });
    this.addedNotesContents_DocumentsNotes = page.locator('#note-container>div:nth-child(1)>div>p');

    // View & Edit Financial Details
    this.rows_FinancialDetails_ViewEdit = page.locator('#financialDetails>div:not(:nth-child(2))');

    // Revert to Reversionary Beneficiary / Reversionary Pension Wizard
    this.text_Title_ReversionaryPensionWizard = page.getByText('Reversionary Pension Wizard');
    this.button_RevertToRevisionaryBeneficiary_ViewEdit = page.getByRole('button', { name: /Revert to Reversionary Beneficiary/i });
    this.text_MemberName_ReversionaryPensionWizard = page.locator('#memberName .name-input>label');
    this.input_DateOfDeath_ReversionaryPensionWizard = page.locator('input#member-dod-input');

    this.text_PensionType_ReversionaryPensionWizard = page.locator('.pension-type-input>label');
    this.text_AccountCode_ReversionaryPensionWizard = page.locator('.accountcode-input>label');
    this.text_PensionStartDate_ReversionaryPensionWizard = page.locator('.pension-start-date-input>label');
    this.input_ReversionDate_ReversionaryPensionWizard = page.locator('input#reversionary-date-input');
    this.text_CurrentAccountBalance_ReversionaryPensionWizard = page.locator('.current-balance-input>label');

    this.rows_Beneficiary_ReversionaryPensionWizard = page.locator('#beneficiaryDetails .form-group-inline:not(:first-child):not(:nth-child(2)):not(:last-child)');
    this.text_TotalPaymentAmount_ReversionaryPensionWizard = page.locator('#beneficiaryDetails .form-group-inline h2');

    this.tabs_Account_ComponentsAfterReversion_ReversionaryPensionWizard = page.locator('#internalTransferDetails .inline-flex');
    this.input_TaxFree_ReversionaryPensionWizard = page.locator('#taxFreeComponent');
    this.input_Taxed_ReversionaryPensionWizard = page.locator('#elementTaxed');
    this.input_Untaxed_ReversionaryPensionWizard = page.locator('#elementUntaxed');
    this.text_TotalTaxComponents_ReversionaryPensionWizard = page.locator('.account-balance-components:nth-child(1) .member-comp-totals');
    this.input_Preserved_ReversionaryPensionWizard = page.locator('#preservedAmount');
    this.input_RestrictedNonPreserved_ReversionaryPensionWizard = page.locator('#restrictedNonPreserved');
    this.input_UnrestrictedNonPreserved_ReversionaryPensionWizard = page.locator('#unrestrictedNonPreserved');
    this.text_TotalPreservationComponents_ReversionaryPensionWizard = page.locator('.account-balance-components:nth-child(2) .member-comp-totals');

    this.rows_TransferBalanceCap_ReversionaryPensionWizard = page.locator('#tbaDetails>.form-group-inline:not(.header-title)');

    this.button_Save_ReversionaryPensionWizard = page.getByRole('button', { name: 'Save', exact: true });
    this.button_SaveOnly_ReversionaryPensionWizard = page.getByRole('button', { name: 'Save Only' });
  }

  option_NominationType_MemberDeathBeneficiaries_AddNewMember(nominationType) {
    return this.page.getByRole('option', { name: nominationType, exact: true });
  }

  input_SearchContact_MemberDeathBeneficiaries_AddNewMember(index) {
    return this.page.locator('#death-benefit tbody input[placeholder="Type to search for a contact"]').nth(index);
  }

  option_FirstContact_SearchContact_MemberDeathBeneficiaries_AddNewMember(fullName) {
    return this.page.locator('div.inline-flex.items-baseline', { hasText: `${fullName}` });
  }

  dropDownButton_Relationship_MemberDeathBeneficiaries_AddNewMember(index) {
    return this.page.locator('#death-benefit tbody td:nth-child(2) button').nth(index);
  }

  option_Relationship_MemberDeathBeneficiaries_AddNewMember(relationship) {
    return this.page.getByRole('button', { name: `${relationship}` });
  }

  input_Proportion_MemberDeathBeneficiaries_AddNewMember(index) {
    return this.page.locator('#death-benefit tbody td:nth-child(3) input').nth(index);
  }

  button_Tier_Second_MemberDeathBeneficiaries_AddNewMember(index) {
    return this.page.locator('#death-benefit tbody td:nth-child(4) button:nth-child(2)').nth(index);
  }

  input_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(index) {
    return this.page.locator('#reversionary-table tbody input[placeholder="Type to search for a contact"]').nth(index);
  }

  option_FirstContact_SearchContact_MemberReversionaryBeneficiaries_AddNewMember(fullName) {
    return this.page.locator('div.inline-flex.items-baseline', { hasText: `${fullName}` });
  }

  dropDownButton_Relationship_MemberReversionaryBeneficiaries_AddNewMember(index) {
    return this.page.locator('#reversionary-table tbody td:nth-child(2) button').nth(index);
  }

  option_Relationship_MemberReversionaryBeneficiaries_AddNewMember(relationship) {
    return this.page.getByRole('button', { name: `${relationship}` });
  }

  input_Proportion_MemberReversionaryBeneficiaries_AddNewMember(index) {
    return this.page.locator('#reversionary-table tbody td:nth-child(3) input').nth(index);
  }

  dropDownButton_Name_FinancialDetails_AddNewMember(index) {
    return this.page.locator('div#financialDetails>div>div:nth-child(1)>div:nth-child(2) button').nth(index);
  }

  option_Name_FinancialDetails_AddNewMember(financialDetailsName) {
    return this.page.getByText(financialDetailsName, { exact: true });
  }

  input_Name_FinancialDetails_AddNewMember(index) {
    return this.page.locator('div#financialDetails>div>div:nth-child(1) input').nth(index);
  }

  input_Value_FinancialDetails_AddNewMember(index) {
    return this.page.locator('div#financialDetails>div>div:nth-child(2) input').nth(index);
  }

  sliderButton_ShowOnStatement_FinancialDetails_AddNewMember(index) {
    return this.page.locator('div#financialDetails>div').nth(index + 1).locator('div:nth-child(3)>div>label>span');
  }

  buttonArea_EditMemberAccount(accountCode) {
    return this.page.locator('#members tbody tr:not(.nested-table-row)')
      .filter({ hasText: accountCode })
      .locator('td:nth-child(1)>div');
  }

  button_EditMemberAccount(accountCode) {
    return this.page.locator('#members tbody tr:not(.nested-table-row)')
      .filter({ hasText: accountCode })
      .locator('td:nth-child(1) button');
  }

  text_AccountCode_MemberList(accountCode) {
    return this.page.locator('button.member-cell>div>div:nth-child(1)')
      .filter({ hasText: accountCode })
  }

  option_PensionType_AddNewMember(pensionType) {
    return this.page.getByRole('option', { name: pensionType });
  }

  option_ConditionOfRelease_AddNewMember(conditionOfRelease) {
    return this.page.getByRole('option', { name: conditionOfRelease });
  }

  option_AccumulationAccount_CommencePension(accumulationAccountCode) {
    return this.page.locator('.custom-scrollbar__option', { hasText: accumulationAccountCode });
  }

  option_PensionType_CommencePension(pensionType) {
    return this.page.locator('.custom-scrollbar__option', { hasText: pensionType });
  }

  option_ConditionOfRelease_CommencePension(conditionOfRelease) {
    return this.page.locator('.custom-scrollbar__option', { hasText: conditionOfRelease });
  }

  option_NominationType_MemberDeathBeneficiaries_CommencePension(nominationType) {
    return this.page.getByRole('option', { name: nominationType, exact: true });
  }

  input_Gender_ReversionaryBeneficiary(index) {
    return this.page.locator(`#beneficiaryDetails .form-group-inline>div:nth-child(2) .custom-scrollbar__single-value`).nth(index);
  }

  dropdownButton_Gender_ReversionaryBeneficiary(index) {
    return this.page.locator(`#beneficiaryDetails svg`).nth(index);
  }

  option_Male_Gender_ReversionaryBeneficiary() {
    return this.page.getByRole('option', { name: /Male/i });
  }
}