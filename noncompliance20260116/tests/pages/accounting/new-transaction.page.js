import { assert } from '../../lib/util.js';
import Page from '../page.js';
import { context } from '../../data/context.js';
import { browser, $, $$ } from '@wdio/globals';

const { waitTime } = context.TestSettings;
class NewTransactionPage extends Page {
  // Common Start
  // get button_CloseTip() { return $('.CSVLinkHeader>i.closeButton'); }

  get input_Date() { return $('.sixui_datebox'); }
  get input_Reference() { return $('.field_reference_number'); }
  get checkbox_DDReinvestment() { return $('.field_divdend_checkbox>.checkbox'); }
  get input_Description() { return $('.field_reference_message'); }

  get selectButton_SelectAccount_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .select2-selection'); }
  get text_SelectedAccountCode_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .newAccountContainer .subAccountCode'); }
  get input_AccountSearch_1() { return $('#ui-id-1~div:not(.tip-twitter) input'); }
  get firstItem_AccountSearchList_1() { return $('#ui-id-1~div:not(.tip-twitter) span.select2-results>ul>li:nth-child(1) div:first-of-type'); }
  get input_Units_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) input[class*=field_reference_unit]'); }
  get input_Debit_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) input[class*=field_reference_debit]'); }
  get input_Credit_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) input[class*=field_reference_credit]'); }
  get button_MoreDetailsCredit_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .more_details_link_credit_wrapper2>div'); }
  get button_MoreDetailsDebit_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .more_details_link_debit_wrapper2>div'); }
  get button_MoreDetailsDebitUp_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .more_details_link_debit_wrapper2>div.more_details_up'); }
  get input_GSTRate_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstrate'); }
  get option_GSTNotAppliable_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstrate>option:nth-child(2)'); }
  get option_GST100_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstrate>option:nth-child(3)'); }
  get option_GST75_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstrate>option:nth-child(4)'); }
  get option_GSTFree_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstrate>option:nth-child(5)'); }
  get input_GSTAmount_1() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(1) .field_reference_gstamount'); }

  get selectButton_SelectAccount_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .select2-selection'); }
  get text_SelectedAccountCode_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .newAccountContainer .subAccountCode'); }
  get input_AccountSearch_2() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter) input'); }
  get firstItem_AccountSearchList_2() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter) span.select2-results>ul>li:nth-child(1) div:first-of-type'); }
  get input_Units_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) input[class*=field_reference_unit]'); }
  get input_Debit_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) input[class*=field_reference_debit]'); }
  get input_Credit_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) input[class*=field_reference_credit]'); }
  get button_MoreDetailsCredit_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .more_details_link_credit_wrapper2>div'); }
  get button_MoreDetailsDebit_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .more_details_link_debit_wrapper2>div'); }
  get button_MoreDetailsDebitUp_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .more_details_link_debit_wrapper2>div.more_details_up'); }
  get input_GSTRate_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstrate'); }
  get option_GSTNotAppliable_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstrate>option:nth-child(2)'); }
  get option_GST100_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstrate>option:nth-child(3)'); }
  get option_GST75_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstrate>option:nth-child(4)'); }
  get option_GSTFree_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstrate>option:nth-child(5)'); }
  get input_GSTAmount_2() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(2) .field_reference_gstamount'); }

  get text_SelectAccount() { return $('span=Select an account'); }

  get selectButton_SelectAccount_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .select2-selection'); }
  get text_SelectedAccountCode_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .newAccountContainer .subAccountCode'); }
  get input_AccountSearch_3() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) input'); }
  get firstItem_AccountSearchList_3() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) span.select2-results>ul>li:nth-child(1) div:first-of-type'); }
  get input_Units_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) input[class*=field_reference_unit]'); }
  get input_Debit_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) input[class*=field_reference_debit]'); }
  get input_Credit_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) input[class*=field_reference_credit]'); }
  get button_MoreDetailsCredit_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .more_details_link_credit_wrapper2>div'); }
  get button_MoreDetailsDebit_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .more_details_link_debit_wrapper2>div'); }
  get input_GSTRate_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstrate'); }
  get option_GSTNotAppliable_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstrate>option:nth-child(2)'); }
  get option_GST100_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstrate>option:nth-child(3)'); }
  get option_GST75_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstrate>option:nth-child(4)'); }
  get option_GSTFree_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstrate>option:nth-child(5)'); }
  get input_GSTAmount_3() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(3) .field_reference_gstamount'); }

  get selectButton_SelectAccount_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .select2-selection'); }
  get text_SelectedAccountCode_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .newAccountContainer .subAccountCode'); }
  get input_AccountSearch_4() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) input'); }
  get firstItem_AccountSearchList_4() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) span.select2-results>ul>li:nth-child(1) div:first-of-type'); }
  get input_Units_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) input[class*=field_reference_unit]'); }
  get input_Debit_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) input[class*=field_reference_debit]'); }
  get input_Credit_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) input[class*=field_reference_credit]'); }
  get button_MoreDetailsCredit_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .more_details_link_credit_wrapper2>div'); }
  get button_MoreDetailsDebit_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .more_details_link_debit_wrapper2>div'); }
  get input_GSTRate_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstrate'); }
  get option_GSTNotAppliable_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstrate>option:nth-child(2)'); }
  get option_GST100_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstrate>option:nth-child(3)'); }
  get option_GST75_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstrate>option:nth-child(4)'); }
  get option_GSTFree_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstrate>option:nth-child(5)'); }
  get input_GSTAmount_4() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(4) .field_reference_gstamount'); }

  get selectButton_SelectAccount_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .select2-selection'); }
  get text_SelectedAccountCode_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .newAccountContainer .subAccountCode'); }
  get input_AccountSearch_5() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) input'); }
  get firstItem_AccountSearchList_5() { return $('#ui-id-1~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter)~div:not(.tip-twitter) span.select2-results>ul>li:nth-child(1)>ul'); }
  get input_Units_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) input[class*=field_reference_unit]'); }
  get input_Debit_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) input[class*=field_reference_debit]'); }
  get input_Credit_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) input[class*=field_reference_credit]'); }
  get button_MoreDetailsCredit_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .more_details_link_credit_wrapper2>div'); }
  get button_MoreDetailsDebit_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .more_details_link_debit_wrapper2>div'); }
  get input_GSTRate_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstrate'); }
  get option_GSTNotAppliable_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstrate>option:nth-child(2)'); }
  get option_GST100_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstrate>option:nth-child(3)'); }
  get option_GST75_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstrate>option:nth-child(4)'); }
  get option_GSTFree_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstrate>option:nth-child(5)'); }
  get input_GSTAmount_5() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(5) .field_reference_gstamount'); }

  get button_DeleteLine_6() { return $('.body_bg_transactions_list_bg_window_upper4>div:nth-child(2)>div:nth-child(6)>.del_button'); }

  get button_AddLine() { return $('.addline_button'); }
  get text_Account() { return $('.wrap_entry_list_window div.wrap_date_message_window_spacer>div:nth-child(2)'); }

  get button_Post() { return $('.postbtn_panel>button:nth-child(2)'); }
  get button_Post1() { return $('.postbtn_panel>.post_button>button'); } //2025-06-01 for 24200 Contribution only
  get button_Post2() { return $('.postbtn_panel>.post_button .select-button-popup-item:nth-child(2)'); } //2025-06-01 for 24200 Contribution only


  get selectButton_Post() { return $('.postbtn_panel>.post_button>button.post_save_button'); }
  get button_PostOnly() { return $('.postbtn_panel>.post_button>div>div:nth-child(2)'); }
  get button_PostAddAnother() { return $('.postbtn_panel .sixui_button.postAndAdd_button'); }
  get button_PostCopy() { return $('.postbtn_panel .sixui_button.postAndCopy_button'); }
  get button_Cancel() { return $('.postbtn_panel .sixui_button.cancel_button'); }


  // Edit Transaction
  get button_Save() { return $('div.postbtn_panel>button.post_button'); }
  // Common End

  // Distribution/Interest Details Start 23800
  get link_Hint_Dis() { return $('.dist_title_area a'); }
  get link_DistributionTaxAuto_Dis() { return $('.dist_statement_cta a:nth-child(1)'); }
  get button_LearnMore_Dis() { return $('.dist_statement_cta a:nth-child(2)'); }
  get input_RecordDate_Dis() { return $('.dist_record_date_area input[name="record_date_picker_i"]'); }

  get input_DividendsUnfranked_Dis() { return $('.dist_income_area>input[name="d_unfranked_ca_i"]'); }
  get input_GrossInterest_Dis() { return $('.dist_income_area>input[name="interest_ca_i"]'); }
  get input_OtherIncome_Dis() { return $('.dist_income_area>input[name="other_income_i"]'); }
  get input_OtherIncomeNonPrimaryProduction_NCMI_Dis() { return $('input[name="nppNCMI_i"]'); }
  get input_OtherIncomeNonPrimaryProduction_ExcludedFromNCMI_Dis() { return $('input[name="nppExcNCMI_i"]'); }
  get input_LessOtherAllowableTrustDeductions_Dis() { return $('.dist_income_area>input[name="loatd_i"]'); }
  get text_CashDistributionA() { return $('.bg_dist_production_income>div:nth-child(2)'); }

  get input_PrimaryProductionIncomeExcludedFromNCMI_Dis() { return $('input[name="d_ppExcNCMI_ca_i"]'); }
  get input_PrimaryProductionIncomeNCMI_Dis() { return $('input[name="ppNCMI_ca_i"]'); }
  get input_OtherPrimaryProductionIncome_Dis() { return $('input[name="otherPPIncome_ca_i"]'); }
  get text_CashDistributionB() { return $('.bg_dist_primaryProduction>div:nth-child(2)'); }

  get input_DividendsFranked_CashDistribution_Dis() { return $('.dist_frankDividend_area>input[name="d_franked_ca_i"]'); }
  get input_DividendsFranked_FrankingCredits_Dis() { return $('.dist_frankDividend_area>input[name="d_franked_tax_i"]'); }
  get input_DiscountedCapitalGain_Dis() { return $('.dist_capital_gains_area>.dist_panel_capital_fields>input[name="cg_dis_ca_i"]'); }
  get input_CGTConcessionAmount_Dis() { return $('.dist_capital_gains_area>.dist_panel_capital_fields>input[name="cg_cgt_ca_i"]'); }
  get input_CapitalGainIndexationMethod_Dis() { return $('.dist_capital_gains_area>.dist_panel_capital_fields>input[name="cg_im_ca_i"]'); }
  get input_CapitalGainOtherMethod_Dis() { return $('.dist_capital_gains_area>.dist_panel_capital_fields>input[name="cg_om_ca_i"]'); }
  get input_DiscountedGainNCMIBeforeDiscount_Dis() { return $('input[name="cg_discountGainNCMI_ca_i"]'); }
  get input_DiscountedGainExcludedFromNCMIBeforeDiscount_Dis() { return $('input[name="cg_discountGainExcNCMI_ca_i"]'); }
  get input_OtherGainNCMI_Dis() { return $('input[name="cg_otherGainNCMI_ca_i"]'); }
  get input_OtherGainExcludedFromNCMI_Dis() { return $('input[name="cg_otherGainExcNCMI_ca_i"]'); }
  get input_ForeignDiscountedCapitalGains_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fdcg_ca_i"]'); }
  get input_ForeignDiscountedCapitalGainsTaxCredits_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fdcg_tax_i"]'); }
  get input_ForeignCapitalGainsIndexationMethod_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fcg_im_ca_i"]'); }
  get input_ForeignCapitalGainsIndexationMethodTaxCredits_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fcg_im_tax_i"]'); }
  get input_ForeignCapitalGainsOtherMethod_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fcg_om_ca_i"]'); }
  get input_ForeignCapitalGainsOtherMethodTaxCredits_Dis() { return $('.dist_capital_gains_area>.dist_foreign_cg_area>input[name="cg_fcg_om_tax_i"]'); }
  get text_CashDistributionC() { return $('.bg_dist_capital_gains>div:nth-child(4)'); }
  get text_DistributedCapitalGainsC_TaxPaidOffsetCredits() { return $('.bg_dist_capital_gains>div:nth-child(5)'); }
  get text_DistributedCapitalGainsC_TaxableAmount() { return $('.bg_dist_capital_gains>div:nth-child(6)'); }
  get text_NetCapitalGain50Discount() { return $('div.panel_dist_cg_ncg_total'); }
  get text_NetCapitalGain13Discount() { return $('div.panel_dist_cg_ncg_13_total'); }

  get input_AssessableForeignSourceIncome_Dis() { return $('.dist_foreign_income_area>input[name="fi_afsi_ca_i"]'); }
  get input_ForeignIncomeTaxOffsetCredits_Dis() { return $('.dist_foreign_income_area>input[name="fi_afsi_tax_i"]'); }
  get input_AustralianFrankingCreditsFromNZ_Dis() { return $('.dist_foreign_income_area>input[name="fi_afsi_nztax_i"]'); }
  get input_OtherNetForeignSourceIncome_Dis() { return $('.dist_foreign_income_area>input[name="fi_onfsi_ca_i"]'); }
  get input_CFCIncome_Dis() { return $('input[name="cfcIncome_ca_i"]'); }
  get text_CashDistributionD() { return $('.field_dist_fi_cd_cash'); }

  get input_TaxExemptedAmounts_Dis() { return $('.dist_onaa_area>input[name="onaa_tea_ca_i"]'); }
  get input_TaxFreeAmounts_Dis() { return $('.dist_onaa_area>input[name="onaa_tfa_ca_i"]'); }
  get input_TaxDeferredAmounts_Dis() { return $('.dist_onaa_area>input[name="onaa_tda_ca_i"]'); }
  get text_GrossCashDistribution() { return $('.panel_dist_onaa_total'); }

  get input_AMITIncrease_Dis() { return $('.dist_amit_area>input[name="amit_shortfall_i"]'); }
  get input_AMITDecrease_Dis() { return $('.dist_amit_area>input[name="amit_excess_i"]'); }
  get input_LessTFNAmountsWithheld_Dis() { return $('.dist_odfd_area>input[name="odfd_ltfnaw_ca_i"]'); }
  get input_LessABNNotQuotedTaxWithheld_Dis() { return $('input[name="abnWithheldTax_ca_i"]'); }
  get input_ForeignResidentCapitalGainsWithholdingAmounts_Dis() { return $('input[name="foreignResidentCGWithheldTax_ca_i"]'); }
  get input_ShareOfCreditsFromTFNWithheldPaymentFromCloselyHeldTrust_Dis() { return $('input[name="tfnWithheldCloselyHeldTrust_ca_i"]'); }
  get input_LessOtherExpenses_Dis() { return $('.dist_odfd_area>input[name="odfd_loe_ca_i"]'); }

  get text_NetCashDistribution() { return $('.panel_dist_odfd_total'); }

  get button_CapitalGainTrustIncomeSchedule_Dis() { return $('.dist_cg_trust_income_schedule_area .btn_cg_trust_income_schedule'); }
  get input_NCMICapitalGain_Dis() { return $('input[name="ncmiCapitalGain_ca_i"]'); }
  get input_ExcludedFromNCMICapitalGain_Dis() { return $('input[name="excNCMICapitalGain_ca_i"]'); }
  get input_GrossGain_Dis() { return $('input[name="grossGain_ca_i"]'); }
  get input_CGTDiscountApplied_Dis() { return $('input[name="privateTrustCgtDiscountApplied_ca_i"]'); }
  get input_CapitalLossApplied_Dis() { return $('input[name="capitalLossApplied_ca_i"]'); }
  get input_SmallBusinsessCGTConcession_Dis() { return $('input[name="smallBusinessConcession_ca_i"]'); }

  get button_OtherTaxOffsets_Dis() { return $('.dist_other_tax_offset_area .btn_dist_other_tax_offset'); }
  get input_EarlyStageVentureCapitalLimitedPartnershipTaxOffset_Dis() { return $('input[name="earlyStageVentureCapitalOffset_i"]'); }
  get input_EarlyStageInvestorTaxOffset_Dis() { return $('input[name="earlyStageInvestorOffset_i"]'); }
  get input_ExplorationCreditsDistributed_Dis() { return $('input[name="explorationCredits_i"]'); }
  get input_ShareOfNationalRentalAffordabilitySchemeTaxOffset_Dis() { return $('input[name="nationalRentalOffset_i"]'); }

  get button_OtherTrustIncomeScheduleItems_Dis() { return $('.dist_other_income_schedule_area .btn_dist_other_income_schedule'); }
  get input_NonResidentBeneficiaryAdditionalInformationS983J_Dis() { return $('input[name="s98J_ca_i"]'); }
  get input_NonResidentBeneficiaryAdditionalInformationS984K_Dis() { return $('input[name="s98K_ca_i"]'); }
  get input_ShareOfNetSmallBusinessIncome_Dis() { return $('input[name="smallBusinessIncome_ca_i"]'); }
  get input_Div6AAEligibleIncome_Dis() { return $('input[name="div6AA_ca_i"]'); }
  get input_TotalTFNAmountsWithheldFromAnnualTrusteePayments_Dis() { return $('input[name="total_tfn_amount_wfatp_ca_i"]'); }

  get button_NonCashCapitalGainsLosses_Dis() { return $('.dist_nccgl_area>.bg_dist_nccgl>.btn_dist_nccgl'); }
  get input_NonCashDiscountedCapitalGain_Dis() { return $('.dist_nccgl_area>.panel_dist_nccgl_fields>input[name="nccgl_doc_ca_i"]'); }
  get input_NonCashCapitalGainsIndexationMethod_Dis() { return $('.dist_nccgl_area>.panel_dist_nccgl_fields>input[name="nccgl_im_ca_i"]'); }
  get input_NonCashCapitalGainsOtherMethod_Dis() { return $('.dist_nccgl_area>.panel_dist_nccgl_fields>input[name="nccgl_om_ca_i"]'); }
  get input_NonCashCapitalLosses_Dis() { return $('.dist_nccgl_area>.panel_dist_nccgl_fields>input[name="nccgl_cl_ca_i"]'); }
  // Distribution/Interest Details End

  // Dividend Details Start 23900
  get input_DividendsFranked_Div() { return $('.dividend_netpayment_area>input[name="franked_ca_i"]'); }
  get input_DividendsFrankingCredits_Div() { return $('.dividend_netpayment_area>input[name="franked_cr_i"]'); }
  get input_DividendsUnfranked_Div() { return $('.dividend_netpayment_area>input[name="unfranked_ca_i"]'); }
  get input_AssessableForeignSourceIncome_Div() { return $('.dividend_netpayment_area>input[name="as_forign_ca_i"]'); }
  get input_ForeignIncomeTaxOffset_Div() { return $('.dividend_netpayment_area>input[name="forign_income_i"]'); }
  get input_AustralianFrankingCreditsFromNZ_Div() { return $('.dividend_netpayment_area>input[name="as_for_s_income_i"]'); }
  get input_TFNAmountsWithheld_Div() { return $('.dividend_grosspayment_area>input[name="tfn_i"]'); }
  get input_ForeignResidentWithholding_Div() { return $('.dividend_grosspayment_area>input[name="non_resident_i"]'); }
  get input_LICDeduction_Div() { return $('.dividend_lic_area>input[name="lic_deduct_i"]'); }
  // Dividend Details End

  // Rental Details Start 28000
  get input_ForeignIncome_Rent() { return $('.rl_input_area >input[name="rl_foreigncome_i"]'); }
  get input_ForeignIncomeTaxCredits_Rent() { return $('.rl_input_area >input[name="rl_foreigncometax_i"]'); }
  // Rental Details End

  // Contribution Details Start 24200
  get input_Employer() { return $('.p4c_right_data_inner input[name="emp_cc_i"]'); }
  get input_PerConcessional() { return $('.p4c_right_data_inner input[name="per_cc_i"]'); }
  get input_PerNonConcessional() { return $('.p4c_right_data_inner input[name="per_noncc_i"]'); }
  get input_SpouseChild() { return $('.p4c_right_data_inner input[name="spouse_child_i"]'); }
  get input_GovernmentCoContributions() { return $('.p4c_right_data_inner input[name="gov_co_i"]'); }
  get input_AnyOther() { return $('.p4c_right_data_inner input[name="any_other_i"]'); }
  get input_DirectedTerminationTaxable() { return $('.p4c_right_data_inner input[name="dir_paytax_i"]'); }
  get input_DirectedTerminationTaxFree() { return $('.p4c_right_data_inner input[name="dir_paytaxfree_i"]'); }
  get input_CGT15YearExemption() { return $('.p4c_right_data_inner input[name="cgt_15_i"]'); }
  get input_CGTRetirementExemption() { return $('.p4c_right_data_inner input[name="cgt_retire_i"]'); }
  get input_PersonalInjuryElection() { return $('.p4c_right_data_inner input[name="per_injury_i"]'); }
  get input_OtherFamilyFriends() { return $('.p4c_right_data_inner input[name="oher_family_friends_i"]'); }
  get input_ForeignSuperAssessable() { return $('.p4c_right_data_inner input[name="foreign_as_i"]'); }
  get input_ForeignSuperNonAssessable() { return $('.p4c_right_data_inner input[name="foreign_nonas_i"]'); }
  get input_TransferredFromResAssessable() { return $('.p4c_right_data_inner input[name="trans_re_as_i"]'); }
  get input_TransferredFromResNonAssessable() { return $('.p4c_right_data_inner input[name="trans_re_nonas_i"]'); }
  get input_NonComplying() { return $('.p4c_right_data_inner input[name="non_comp_i"]'); }
  get input_NonMandated() { return $('.p4c_right_data_inner input[name="non_man_i"]'); }
  get input_ReservesEmployerConcessional() { return $('.p4c_right_data_inner input[name="re_emp_cc_i"]'); }
  get input_ReservesPersonalConcessional() { return $('.p4c_right_data_inner input[name="re_per_cc_i"]'); }
  get input_ReservesPersonalNonConcessional() { return $('.p4c_right_data_inner input[name="re_per_noncc_i"]'); }
  get input_Downsizer() { return $('.p4c_right_data_inner input[name="downsizer_i"]'); }
  // Contribution Details End

  // Member Rollin Details Start 28500
  get selectButton_SelectMember_In() { return $('.mr_member_area>select[name="mem_list_i"]'); }
  get input_ServicePeriodStartDate_In() { return $('.mr_member_area input[name="start_date_i"]'); }
  get input_TaxFree_In() { return $('.mr_rc_area input[name="rc_tax_free_i"]'); }
  get input_Taxed_In() { return $('.mr_rc_area input[name="rc_tc_titf_i"]'); }
  get input_Untaxed_In() { return $('.mr_rc_area input[name="rc_tc_utitf_i"]'); }
  get input_Preserved_In() { return $('.mr_pa_area input[name="pa_pa_i"]'); }
  get input_RNP_In() { return $('.mr_pa_area input[name="pa_rnpa_i"]'); }
  get input_UNP_In() { return $('.mr_pa_area input[name="pa_unpa_i"]'); }
  // Member Rollin Details End

  // Rollover Payment Details Start 46000
  get selectButton_SelectTypeOfPayment() { return $('select.rp_tp_field_tp'); }
  get selectButton_SelectTypeOfPayment1() { return $('#portalContentOuter > div > div > div.wrap_transaction_window > div > div.entry_panel > div > div.rp_tp_area > div.rp_tp_tp_block > select'); }
  get option_CashingOutBenefitsPaid() { return $('option[value="CashingOut"]'); }
  get option_ContributionsSplitForSpouse() { return $('option[value="ContributionsSplitForSpouse"]'); }
  get option_DeathBenefit() { return $('option[value="DeathBenefit"]'); }
  get option_FirstHomeSuperSaverScheme() { return $('option[value="FirstHomeSuperSaverScheme"]'); }
  get option_TransferToAnother() { return $('option[value="TransferToAnother"]'); }
  get option_EarlyAccessToSuper() { return $('option[value="EarlyAccessToSuper"]'); }
  get selectButton_SelectMember_Out() { return $('.rp_tp_area select[name="mem_list_i"]'); }
  get input_Spouse() { return $('.rp_tp_spouse_block>input[name="spouse_i"]'); }
  get input_Beneficiary() { return $('.rp_tp_bf_block> input[name="spouse_i"]'); }
  get input_RolloverFund() { return $('input[name="fund_list_i"]'); }
  get selectButton_TypeOfDeathBenefit() { return $('select[name="benefit_list_i"]'); }
  get selectButton_SpecialConditionOfRelease() { return $('select[name="special_list_i"]'); }
  get input_ServicePeriodStartDate_Out() { return $('.rp_tp_area input[name="start_date_i"]'); }
  get input_DateOfPayment() { return $('.rp_tp_area input[name="payment_date_i"]'); }
  get input_Percentage() { return $('.rp_tp_area input[name="percentage_i"]'); }
  get input_PaymentAmount() { return $('.rp_tp_area input[name="payment_amount_i"]'); }
  get input_TaxWithheld() { return $('.rp_tp_area input[name="tax_withheld_i"]'); }
  get input_TaxFree_Out() { return $('.rp_rc_area input[name="rc_taxfree_i"]'); }
  get input_Taxed_Out() { return $('.rp_rc_area input[name="rc_tctitf_i"]'); }
  get input_Untaxed_Out() { return $('.rp_rc_area input[name="rc_tcutitf_i"]'); }
  get input_Preserved_Out() { return $('.rp_pa_area input[name="pa_pa_i"]'); }
  get input_RNP_Out() { return $('.rp_pa_area input[name="pa_rnpa_i"]'); }
  get input_UNP_Out() { return $('.rp_pa_area input[name="ca_unpa_i"]'); }
  // Rollover Payment Details End

  // Pension Paid Details Start 41600
  get button_PensionMinus() { return $('.pension_payment_top_wrapper .pension_minus'); }
  get input_NetDrawdown() { return $('.pension_payment_top_wrapper input[name="net_drawdown_i"]'); }
  get input_PAYG() { return $('input[name="pension_payg_i"]:not([aria-hidden="true"])'); }
  get button_ShowAllMembers() { return $('div.base-button-caption'); }
  // Pension Paid Details End

  // Opening Balance Details Start 50010
  get input_TaxFree_OB() { return $('input[name=tax_free_i]'); }
  get input_Taxed_OB() { return $('input[name=tax_i]'); }
  get input_Untaxed_OB() { return $('input[name=untaxed_i]'); }
  get input_Preserved_OB() { return $('input[name=preserved_i]'); }
  get input_RNP_OB() { return $('input[name=r_non_preserved_i]'); }
  get input_UNP_OB() { return $('input[name=u_non_preserved_i]'); }
  // Opening Balance Details End

  // Investment Purchase Details Start
  get input_ContractDate_IP() { return $('input[name="con_date_i"]'); }
  get input_SettlementDate_IP() { return $('input[name="settle_date_i"]'); }
  get input_Brokerage_IP() { return $('input[name="brokerage_i"]'); }
  get input_Consideration_IP() { return $('input[name="consideration_i"]'); }
  get input_UnitPrice_IP() { return $('input[name="unit_price_i"]'); }
  get input_ContractNo_IP() { return $('input[name="cn_i"]'); }
  get input_AccountNo_IP() { return $('input[name="an_i"]'); }
  get input_HIN_IP() { return $('input[name="hin_i"]'); }
  // Investment Purchase Details End

  // Instalment / Brokerage Adjustment Details Start
  get input_SettlementDate_Instal() { return $('input[name="settle_date_i"]'); }
  get input_Brokerage_Instal() { return $('input[name="brokerage_i"]'); }
  get input_Consideration_Instal() { return $('input[name="consideration_i"]'); }
  get input_ContractNo_Instal() { return $('input[name="cn_i"]'); }
  get input_AccountNo_Instal() { return $('input[name="an_i"]'); }
  get input_HIN_Instal() { return $('input[name="hin_i"]'); }
  get selectButton_SelectParcel_Instal() { return $('div=Select Parcel'); }
  get items_Parcels_Instal() { return $$('.popupContent table.dataTable>tbody:nth-child(2)>tr'); }
  get firstItem_Parcel_Instal() { return $('.popupContent table.dataTable>tbody:nth-child(2)>tr:nth-child(1)'); }
  // Instalment / Brokerage Adjustment Details End

  // Rental Details Start
  get input_ForeignIncome_Rental() { return $('input[name="rl_foreigncome_i"]'); }
  get input_ForeignIncomeTaxCredits_Rental() { return $('input[name="rl_foreigncometax_i"]'); }
  // Rental Details End

  // Return of Capital Details Start
  get input_SettlementDate_ROC() { return $('input[name="settle_date_i"]'); }
  get input_Brokerage_ROC() { return $('input[name="brokerage_i"]'); }
  get input_Consideration_ROC() { return $('input[name="consideration_i"]'); }
  get input_ContractNo_ROC() { return $('input[name="cn_i"]'); }
  get input_AccountNo_ROC() { return $('input[name="an_i"]'); }
  get input_HIN_ROC() { return $('input[name="hin_i"]'); }
  get selectButton_SelectParcel_ROC() { return $('div=Select Parcel'); }
  get items_Parcels_ROC() { return $$('.popupContent table.dataTable>tbody:nth-child(2)>tr'); }
  get firstItem_Parcel_ROC() { return $('.popupContent table.dataTable>tbody:nth-child(2)>tr:nth-child(1)'); }
  // Return of Capital Details End

  // Disposal Details Start
  get input_ContractDate_ID() { return $('input[name="con_date_picker_i"]'); }
  get input_SettlementDate_ID() { return $('input[name="settle_date_picker_i"]'); }
  get input_Brokerage_ID() { return $('input[name="brokerage_i"]'); }
  get input_Consideration_ID() { return $('input[name="consideration_i"]'); }
  get input_UnitPrice_ID() { return $('input[name="unit_price_i"]'); }
  get input_ContractNo_ID() { return $('input[name="cn_i"]'); }
  get input_AccountNo_ID() { return $('input[name="an_i"]'); }
  get input_HIN_ID() { return $('input[name="hin_i"]'); }

  get selectButton_DisposalMethod_ID() { return $('select[name="dm_i"]'); }
  get option_MostTaxEffective_DM_ID() { return $('option[value="Most Tax Effective"]'); }
  get option_LeastTaxEffective_DM_ID() { return $('option[value="Least Tax Effective"]'); }
  get option_FirstInFirstOut_DM_ID() { return $('option[value="First In First Out"]'); }
  get option_LastInFirstOut_DM_ID() { return $('option[value="Last In First Out"]'); }
  get option_Manual_DM_ID() { return $('option[value="Manual"]'); }

  get selectButton_SelectParcel_ID() { return $('div=Select Parcel'); }
  get items_Parcels_ID() { return $$('.popupContent table.dataTable>tbody:nth-child(2)>tr'); }
  get firstItem_Parcel_ID() { return $('.popupContent table.dataTable>tbody:nth-child(2)>tr:nth-child(1)'); }

  get text_OtherCapitalGain_ID() { return $('div.ivd_cal_ocg_panel'); }
  // Disposal Details End

  async tabVerify(eleName, keys) {
    await browser.keys(keys);
    if (eleName.includes('input_AccountSearch')) await browser.pause(waitTime.medium);
    else await browser.pause(waitTime.medium);
    const cmd = `this.${eleName}`;
    const ele = await eval(cmd);
    assert.equal(await ele.isFocused(), true, `${eleName} is not focused!`);
  }

  async tabsVerify(eleNames, keys) {
    for (let i = 0; i < eleNames.length; i += 1) {
      await this.tabVerify(eleNames[i], keys);
    }
  }

  async inputDateRefDes_Transaction(date, reference, description) {
    await this.input_Date.waitForEnabled();
    await browser.pause(waitTime.medium);
    await this.input_Date.setValue(date);
    await browser.pause(waitTime.medium);
    let inputDate = await this.input_Date.getValue();
    while (inputDate != date) {
      await this.input_Date.setValue((await '\uE003'.repeat(inputDate.length)) + date);
      await browser.pause(waitTime.medium);
      inputDate = await this.input_Date.getValue();
    }
    await browser.pause(waitTime.medium);
    if (reference !== '') {
      await this.input_Reference.waitForEnabled();
      await this.input_Reference.setValue(reference);
      await browser.pause(waitTime.medium);
    }
    if (description !== '') {
      await this.input_Description.waitForEnabled();
      await this.input_Description.setValue(description);
      await browser.pause(waitTime.medium);
    }

  }

  async inputLineData_Transaction_withGST(
    line,
    account,
    units = '',
    debit = '',
    credit = '',
    GSTRate = '',
    GSTAmount = ''
  ) {
    const cmd_selectButton_SelectAccount = `this.selectButton_SelectAccount_${line}`;
    const cmd_input_AccountSearch = `this.input_AccountSearch_${line}`;
    const cmd_firstItem_AccountSearchList = `this.firstItem_AccountSearchList_${line}`;
    const cmd_input_Units = `this.input_Units_${line}`;
    const cmd_input_Debit = `this.input_Debit_${line}`;
    const cmd_input_Credit = `this.input_Credit_${line}`;
    const cmd_input_GSTRate = `this.input_GSTRate_${line}`;
    const cmd_option_GSTNotAppliable = `this.option_GSTNotAppliable_${line}`;
    const cmd_option_GST100 = `this.option_GST100_${line}`;
    const cmd_option_GST75 = `this.option_GST75_${line}`;
    const cmd_option_GSTFree = `this.option_GSTFree_${line}`;
    const cmd_input_GSTAmount = `this.input_GSTAmount_${line}`;

    await (await eval(cmd_selectButton_SelectAccount)).waitForEnabled();
    await (await eval(cmd_selectButton_SelectAccount)).click();

    await (await eval(cmd_input_AccountSearch)).waitForEnabled();
    await (await eval(cmd_input_AccountSearch)).setValue(account);
    await browser.waitUntil(async () => (await (await eval(cmd_firstItem_AccountSearchList)).getText()).search(account) !== -1, waitTime.superLong, `Can not find the specified Account: ${account}`);
    await (await eval(cmd_firstItem_AccountSearchList)).click();

    if (units !== '') {
      await (await eval(cmd_input_Units)).waitForEnabled();
      await (await eval(cmd_input_Units)).setValue(units);
    }
    if (debit !== '') {
      await (await eval(cmd_input_Debit)).waitForEnabled();
      await (await eval(cmd_input_Debit)).setValue(debit);
    }
    if (credit !== '') {
      await (await eval(cmd_input_Credit)).waitForEnabled();
      await (await eval(cmd_input_Credit)).setValue(credit);
    }
    switch (GSTRate) {
      case 'Not Applicable':
        await (await eval(cmd_input_GSTRate)).waitForEnabled();
        await (await eval(cmd_input_GSTRate)).click();
        await (await eval(cmd_option_GSTNotAppliable)).waitForDisplayed();
        await (await eval(cmd_option_GSTNotAppliable)).click();
        break;
      case '100':
        await (await eval(cmd_input_GSTRate)).waitForEnabled();
        await (await eval(cmd_input_GSTRate)).click();
        await (await eval(cmd_option_GST100)).waitForDisplayed();
        await (await eval(cmd_option_GST100)).click();
        break;
      case '75':
        await (await eval(cmd_input_GSTRate)).waitForEnabled();
        await (await eval(cmd_input_GSTRate)).click();
        await (await eval(cmd_option_GST75)).waitForDisplayed();
        await (await eval(cmd_option_GST75)).click();
        break;
      case 'GST Free':
        await (await eval(cmd_input_GSTRate)).waitForEnabled();
        await (await eval(cmd_input_GSTRate)).click();
        await (await eval(cmd_option_GSTFree)).waitForDisplayed();
        await (await eval(cmd_option_GSTFree)).click();
        break;
      default:
        break;
    }
    if (GSTAmount !== '') {
      await (await eval(cmd_input_GSTAmount)).waitForEnabled();
      await (await eval(cmd_input_GSTAmount)).setValue(GSTAmount);
    }
  }

  async inputLineData_Transaction_withoutGST(line, account, units = '', debit = '', credit = '') {
    const cmd_selectButton_SelectAccount = `this.selectButton_SelectAccount_${line}`;
    const cmd_input_AccountSearch = `this.input_AccountSearch_${line}`;
    const cmd_firstItem_AccountSearchList = `this.firstItem_AccountSearchList_${line}`;
    const cmd_input_Units = `this.input_Units_${line}`;
    const cmd_input_Debit = `this.input_Debit_${line}`;
    const cmd_input_Credit = `this.input_Credit_${line}`;
    await (await this.text_Account).waitForDisplayed();
    await (await this.text_Account).scrollIntoView();
    await browser.pause(waitTime.medium);
    await (await eval(cmd_selectButton_SelectAccount)).waitForDisplayed();
    await (await eval(cmd_selectButton_SelectAccount)).waitForEnabled();
    await (await eval(cmd_selectButton_SelectAccount)).click();
    await browser.pause(waitTime.medium);
    await (await eval(cmd_input_AccountSearch)).waitForEnabled();
    await (await eval(cmd_input_AccountSearch)).setValue(account);
    await browser.waitUntil(async () => (await (await eval(cmd_firstItem_AccountSearchList)).getText()).search(account) !== -1,
      waitTime.superLong, `Can not find the specified Account: ${account}`, 10);
    await (await eval(cmd_firstItem_AccountSearchList)).click();

    if (units !== '') {
      await (await eval(cmd_input_Units)).waitForEnabled();
      await (await eval(cmd_input_Units)).setValue(units);
    }
    if (debit !== '') {
      await (await eval(cmd_input_Debit)).waitForEnabled();
      await (await eval(cmd_input_Debit)).setValue(debit);
    }
    if (credit !== '') {
      await (await eval(cmd_input_Credit)).waitForEnabled();
      await (await eval(cmd_input_Credit)).setValue(credit);
    }
    if (line >= 2) await browser.keys('Tab');
    await browser.pause(waitTime.medium);
  }

  async addNewLine_Transaction_withoutGST(line, account, units = '', debit = '', credit = '') {
    const cmd_selectButton_SelectAccount = `this.selectButton_SelectAccount_${line}`;
    const cmd_input_Debit = `this.input_Debit_${line}`;
    const cmd_input_Credit = `this.input_Credit_${line}`;

    await this.text_Account.waitForDisplayed();
    await this.text_Account.scrollIntoView();
    await browser.pause(waitTime.medium);

    await this.button_AddLine.waitForEnabled();
    await this.button_AddLine.click();
    // await browser.execute(async (ele) => { await ele.click(); }, await this.button_AddLine);
    await browser.pause(waitTime.medium);
    await this.text_SelectAccount.waitForDisplayed();
    await browser.pause(waitTime.medium);

    assert.equal(await (await eval(cmd_selectButton_SelectAccount)).isDisplayed(), true, `"Select an account" is not displayed in ${line} line!`);
    assert.equal(await (await eval(cmd_input_Debit)).isDisplayed(), true, `"Debit" is not displayed in ${line} line!`);
    assert.equal(await (await eval(cmd_input_Credit)).isDisplayed(), true, `"Credit" is not displayed in ${line} line!`);

    await this.inputLineData_Transaction_withoutGST(line, account, units, debit, credit);
  }
}

export const newTransactionPage = new NewTransactionPage();
