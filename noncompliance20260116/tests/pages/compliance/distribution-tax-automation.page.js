import Page from '../page.js';
import { context } from '../../data/context.js';

import * as firmUtil from '../../lib/firm-util.js';
import * as chartUtil from '../../lib/chart-util.js';
import * as transUtil from '../../lib/transaction-util.js';
import * as invTransUtil from '../../lib/investment-transaction-util.js';
import * as securityUtil from '../../lib/security-util.js';
import { assert, axios } from '../../lib/util.js';

class DistributionTaxAutomationPage extends Page {
  get tab_Incomplete() { return $('.tabs>ul>li:nth-child(1)'); }
  get tab_Reviewed() { return $('.tabs>ul>li:nth-child(2)'); }
  get line1_DistributionTaxData() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(1)'); }
  get line2_DistributionTaxData() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(2)'); }
  get line3_DistributionTaxData() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(3)'); }
  get allLines_DistributionTaxDate() { return $$('.rt-table>.rt-tbody>div.investmentRow:not(.totalRow)'); }
  // clear components
  get button_ClearComponents_Line1() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(1) .clearComps'); }
  get button_ClearComponents_Line2() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(2) .clearComps'); }
  get button_Proceed_ConfirmClearAllTaxComponents() { return $('button=Proceed'); }
  get circleLoader_ClearComponents() { return $('.circle-loader.load-complete'); }
  // Edit Tax Data 
  get button_Expand_Line2() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(2) button.btnExpand'); }
  get firstTaxCompRow_Line2() { return $('.rt-table>.rt-tbody>div.taxCompRow'); }
  get button_EditTaxEntry_firstTaxCompRow_Line2() { return $('.rt-table>.rt-tbody>div.taxCompRow .editTaxEntry'); }
  get input_OtherIncome_CashDistribution() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(5) input'); }
  get button_Save() { return $('.distSaveBtn'); }
  get circleLoader_SaveTaxData() { return $('.circle-loader.load-complete'); }

  // Generate Tax Data
  get button_GenerateTaxData_Line2() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(2) .genTaxData'); }
  get button_GenerateTaxData_Line3() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(3) .genTaxData'); }
  get circleLoader_LoadGenerateTaxDataPage() { return $('.circle-loader'); }
  get buttons_ExpandSection() { return $$('.TaxDataTable.left.solo>.distTableSectionHeader button>.fa-caret-down'); }
  get text_NetCashDistribution() { return $('.bottomTotals>div:nth-child(1)>span:nth-child(2)'); }
  get text_Variance() { return $('.bottomTotals>div:nth-child(2)>span:nth-child(2)'); }
  get text_CashDistributionA() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(9)>div:nth-child(1) .staticValue'); }
  get text_CashDistributionB() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(14)>div:nth-child(1) .staticValue'); }
  get text_CashDistributionC() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(30)>div:nth-child(1) .staticValue'); }
  get text_CashDistributionCCredits() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(30)>div:nth-child(2) .staticValue'); }
  get text_CashDistributionCTaxable() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(30)>div:nth-child(3) .staticValue'); }
  get text_NetCapitalGain50Discount() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(31)>div:nth-child(3) .staticValue'); }
  get text_NetCapitalGain13Discount() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(32)>div:nth-child(3) .staticValue'); }
  get text_CashDistributionD() { return $('.TaxDataTable.left.solo>div.distRowFooter:nth-child(38)>div:nth-child(1) .staticValue'); }
  get input_AMITShortfall() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(46)>div:nth-child(1) input'); }
  get input_AMITExcess() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(47)>div:nth-child(1) input'); }
  get button_GenerateAndMarkAsReviewed() { return $('button=Generate & Mark as Reviewed'); }
  get circleLoader_GererateAndMarkAsReviewed() { return $('.circle-loader.load-complete'); }
  get buttons_ExpandSection_sys() { return $$('.TaxDataTable.left.solo>.distTableSectionHeader button>.fa-caret-down'); }

  get input_OtherIncomeNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(6)>div:nth-child(1) input'); } // new
  get input_OtherIncomeExcNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(7)>div:nth-child(1) input'); } // new

  get input_PrimaryProductionIncomeExcNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(11)>div:nth-child(1) input'); } // new
  get input_PrimaryProductionIncomeNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(12)>div:nth-child(1) input'); } // new
  get input_OtherPrimaryProductionIncome_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(13)>div:nth-child(1) input'); } // new

  get input_DiscountedGainNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(23)>div:nth-child(1) input'); } // new
  get input_DiscountedGainExcNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(24)>div:nth-child(1) input'); } // new
  get input_OtherGainNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(25)>div:nth-child(1) input'); } // new
  get input_OtherGainExcNCMI_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(26)>div:nth-child(1) input'); } // new

  get input_CFCIncome_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(37)>div:nth-child(1) input'); } // new

  get input_LessABNNotQuotedTaxWithheld_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(50)>div:nth-child(1) input'); } // new
  get input_ForeignResidentCapitalGainsWithholding_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(51)>div:nth-child(1) input'); } // new
  get input_ShareOfCreditsFromTFNWithheld_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(52)>div:nth-child(1) input'); } // new

  get input_NCMICapitalGain_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(56)>div:nth-child(1) input'); } // new
  get input_excludedFromNCMICapitalGain_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(57)>div:nth-child(1) input'); } // new
  get input_grossGain_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(58)>div:nth-child(1) input'); } // new
  get input_CGTDiscountApplied_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(59)>div:nth-child(1) input'); } // new
  get input_capitalLossApplied_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(60)>div:nth-child(1) input'); } // new
  get input_smallBusinsessCGTConcession_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(61)>div:nth-child(1) input'); } // new

  get input_earlyStageVentureCapitalLimitedPartnershipTaxOffset_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(63)>div:nth-child(1) input'); } // new
  get input_earlyStageInvestorTaxOffset_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(64)>div:nth-child(1) input'); } // new
  get input_explorationCreditsDistributed_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(65)>div:nth-child(1) input'); } // new
  get input_shareOfNationalRentalAffordabilitySchemeTaxOffset_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(66)>div:nth-child(1) input'); } // new

  get input_NonResidentBeneficiaryAdditionalInformations983J_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(68)>div:nth-child(1) input'); } // new
  get input_NonResidentBeneficiaryAdditionalInformations984K_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(69)>div:nth-child(1) input'); } // new
  get input_ShareOfNetSmallBusinessIncome_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(70)>div:nth-child(1) input'); } // new
  get input_Div6AAEligibleIncome_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(71)>div:nth-child(1) input'); } // new
  get input_TotalTFNAmountsWithheldFromAnnualTrusteePayments_sys() { return $('.TaxDataTable.left.solo>div.distDataRow:nth-child(72)>div:nth-child(1) input'); } // new

  // Custom Tax Data
  get button_CustomTaxData_Line1() { return $('.rt-table>.rt-tbody>div.investmentRow:nth-child(1) .cusCpuDist'); }
  get circleLoader_LoadCustomTaxDataPage() { return $('.circle-loader'); }
  get button_ShowHideDPU() { return $('.distTable button.showCPUBtn'); }
  get buttons_ExpandSection_CoustomTaxData() { return $$('.TaxDataTable.right>.distTableSectionHeader button>.fa-caret-down'); }

  get input_DividendsUnfranked() { return $('.TaxDataTable.right>div.distDataRow:nth-child(3)>div:nth-child(1) input'); }
  get input_GrossInterest() { return $('.TaxDataTable.right>div.distDataRow:nth-child(4)>div:nth-child(1) input'); }
  get input_OtherIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(5)>div:nth-child(1) input'); }
  get input_OtherIncomeNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(6)>div:nth-child(1) input'); } // new
  get input_OtherIncomeNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(6)>div:nth-child(1) input'); } //new
  get input_OtherIncomeExcNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(7)>div:nth-child(1) input'); } // new
  get input_OtherIncomeExcNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(7)>div:nth-child(1) input'); } // new
  get input_LessOtherAllowableTrustDeductions() { return $('.TaxDataTable.right>div.distDataRow:nth-child(8)>div:nth-child(1) input'); }
  get text_CashDistributionA_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(9)>div:nth-child(1)'); }

  get input_PrimaryProductionIncomeExcNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(11)>div:nth-child(1) input'); } // new
  get input_PrimaryProductionIncomeExcNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(11)>div:nth-child(1) input'); } // new
  get input_PrimaryProductionIncomeNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(12)>div:nth-child(1) input'); } // new
  get input_PrimaryProductionIncomeNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(12)>div:nth-child(1) input'); } // new
  get input_OtherPrimaryProductionIncome_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(13)>div:nth-child(1) input'); } // new
  get input_OtherPrimaryProductionIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(13)>div:nth-child(1) input'); } // new
  get text_CashDistributionB_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(14)>div:nth-child(1)'); }

  get input_DividendsFranked() { return $('.TaxDataTable.right>div.distDataRow:nth-child(16)>div:nth-child(1) input'); }
  get input_DividendsFrankedCredits() { return $('.TaxDataTable.right>div.distDataRow:nth-child(16)>div:nth-child(2) input'); }

  get input_DiscountedCapitalGain() { return $('.TaxDataTable.right>div.distDataRow:nth-child(19)>div:nth-child(1) input'); }
  get input_CGTConcessionAmount() { return $('.TaxDataTable.right>div.distDataRow:nth-child(20)>div:nth-child(1) input'); }
  get input_CapitalGainIndexationMethod() { return $('.TaxDataTable.right>div.distDataRow:nth-child(21)>div:nth-child(1) input'); }
  get input_CapitalGainOtherMethod() { return $('.TaxDataTable.right>div.distDataRow:nth-child(22)>div:nth-child(1) input'); }

  get input_DiscountedGainNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(23)>div:nth-child(1) input'); } // new
  get input_DiscountedGainNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(23)>div:nth-child(1) input'); } // new
  get input_DiscountedGainExcNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(24)>div:nth-child(1) input'); } // new
  get input_DiscountedGainExcNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(24)>div:nth-child(1) input'); } // new
  get input_OtherGainNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(25)>div:nth-child(1) input'); } // new
  get input_OtherGainNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(25)>div:nth-child(1) input'); } // new
  get input_OtherGainExcNCMI_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(26)>div:nth-child(1) input'); } // new
  get input_OtherGainExcNCMI() { return $('.TaxDataTable.right>div.distDataRow:nth-child(26)>div:nth-child(1) input'); } // new

  get input_ForeignDiscountedCapitalGains() { return $('.TaxDataTable.right>div.distDataRow:nth-child(27)>div:nth-child(1) input'); }
  get input_ForeignDiscountedCapitalGainsCredits() { return $('.TaxDataTable.right>div.distDataRow:nth-child(27)>div:nth-child(2) input'); }
  get input_ForeignCapitalGainsIndexationMethod() { return $('.TaxDataTable.right>div.distDataRow:nth-child(28)>div:nth-child(1) input'); }
  get input_ForeignCapitalGainsIndexationMethodCredits() { return $('.TaxDataTable.right>div.distDataRow:nth-child(28)>div:nth-child(2) input'); }
  get input_ForeignCapitalGainsOtherMethod() { return $('.TaxDataTable.right>div.distDataRow:nth-child(29)>div:nth-child(1) input'); }
  get input_ForeignCapitalGainsOtherMethodCredits() { return $('.TaxDataTable.right>div.distDataRow:nth-child(29)>div:nth-child(2) input'); }

  get text_CashDistributionC_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(30)>div:nth-child(1)>span'); }
  get text_CashDistributionCCredits_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(30)>div:nth-child(2)>span'); }
  get text_CashDistributionCTaxable_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(30)>div:nth-child(3)>span'); }
  get text_NetCapitalGain50Discount_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(31)>div:nth-child(3)>span'); }
  get text_NetCapitalGain13Discount_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(32)>div:nth-child(3)>span'); }

  get input_AssessableForeignSourceIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(34)>div:nth-child(1) input'); }
  get input_AssessableForeignSourceIncomeCredits() { return $('.TaxDataTable.right>div.distDataRow:nth-child(34)>div:nth-child(2) input'); }
  get input_AustralianFrankingCreditsfromNZ() { return $('.TaxDataTable.right>div.distDataRow:nth-child(35)>div:nth-child(2) input'); }
  get input_OtherNetForeignSourceIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(36)>div:nth-child(1) input'); }

  get input_CFCIncome_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(37)>div:nth-child(1) input'); } // new
  get input_CFCIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(37)>div:nth-child(1) input'); } // new
  get text_CashDistributionD_CoustomTaxData() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(38)>div:nth-child(1)>span>span'); }

  get input_TaxExemptedAmounts() { return $('.TaxDataTable.right>div.distDataRow:nth-child(41)>div:nth-child(1) input'); }
  get input_TaxFreeAmounts() { return $('.TaxDataTable.right>div.distDataRow:nth-child(42)>div:nth-child(1) input'); }
  get input_TaxDeferredAmounts() { return $('.TaxDataTable.right>div.distDataRow:nth-child(43)>div:nth-child(1) input'); }
  get text_GrossCashDistribution() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(44)>div:nth-child(1)>span>span'); }

  get input_AMITShortfall_CoustomTaxData() { return $('.TaxDataTable.right>div.distDataRow:nth-child(46)>div:nth-child(1) input'); }
  get input_AMITExcess_CoustomTaxData() { return $('.TaxDataTable.right>div.distDataRow:nth-child(47)>div:nth-child(1) input'); }

  get input_LessTFNAmountsWithheld() { return $('.TaxDataTable.right>div.distDataRow:nth-child(49)>div:nth-child(1) input'); }
  get input_LessABNNotQuotedTaxWithheld_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(50)>div:nth-child(1) input'); } // new
  get input_LessABNNotQuotedTaxWithheld() { return $('.TaxDataTable.right>div.distDataRow:nth-child(50)>div:nth-child(1) input'); } // new
  get input_ForeignResidentCapitalGainsWithholding_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(51)>div:nth-child(1) input'); } // new
  get input_ForeignResidentCapitalGainsWithholding() { return $('.TaxDataTable.right>div.distDataRow:nth-child(51)>div:nth-child(1) input'); } // new
  get input_ShareOfCreditsFromTFNWithheld_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(52)>div:nth-child(1) input'); } // new
  get input_ShareOfCreditsFromTFNWithheld() { return $('.TaxDataTable.right>div.distDataRow:nth-child(52)>div:nth-child(1) input'); } // new
  get input_LessOtherExpenses() { return $('.TaxDataTable.right>div.distDataRow:nth-child(53)>div:nth-child(1) input'); }

  get text_netCashDistribution() { return $('.TaxDataTable.right>div.distRowFooter:nth-child(54)>div:nth-child(1)>span>span'); }

  get input_NCMICapitalGain_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(56)>div:nth-child(1) input'); } // new
  get input_NCMICapitalGain() { return $('.TaxDataTable.right>div.distDataRow:nth-child(56)>div:nth-child(1) input'); } // new
  get input_excludedFromNCMICapitalGain_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(57)>div:nth-child(1) input'); } // new
  get input_excludedFromNCMICapitalGain() { return $('.TaxDataTable.right>div.distDataRow:nth-child(57)>div:nth-child(1) input'); } // new
  get input_grossGain_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(58)>div:nth-child(1) input'); } // new
  get input_grossGain() { return $('.TaxDataTable.right>div.distDataRow:nth-child(58)>div:nth-child(1) input'); } // new
  get input_CGTDiscountApplied_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(59)>div:nth-child(1) input'); } // new
  get input_CGTDiscountApplied() { return $('.TaxDataTable.right>div.distDataRow:nth-child(59)>div:nth-child(1) input'); } // new
  get input_capitalLossApplied_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(60)>div:nth-child(1) input'); } // new
  get input_capitalLossApplied() { return $('.TaxDataTable.right>div.distDataRow:nth-child(60)>div:nth-child(1) input'); } // new
  get input_smallBusinsessCGTConcession_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(61)>div:nth-child(1) input'); } // new
  get input_smallBusinsessCGTConcession() { return $('.TaxDataTable.right>div.distDataRow:nth-child(61)>div:nth-child(1) input'); } // new

  get input_earlyStageVentureCapitalLimitedPartnershipTaxOffset_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(63)>div:nth-child(1) input'); } // new
  get input_earlyStageVentureCapitalLimitedPartnershipTaxOffset() { return $('.TaxDataTable.right>div.distDataRow:nth-child(63)>div:nth-child(1) input'); } // new
  get input_earlyStageInvestorTaxOffset_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(64)>div:nth-child(1) input'); } // new
  get input_earlyStageInvestorTaxOffset() { return $('.TaxDataTable.right>div.distDataRow:nth-child(64)>div:nth-child(1) input'); } // new
  get input_explorationCreditsDistributed_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(65)>div:nth-child(1) input'); } // new
  get input_explorationCreditsDistributed() { return $('.TaxDataTable.right>div.distDataRow:nth-child(65)>div:nth-child(1) input'); } // new
  get input_shareOfNationalRentalAffordabilitySchemeTaxOffset_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(66)>div:nth-child(1) input'); } // new
  get input_shareOfNationalRentalAffordabilitySchemeTaxOffset() { return $('.TaxDataTable.right>div.distDataRow:nth-child(66)>div:nth-child(1) input'); } // new

  get input_NonResidentBeneficiaryAdditionalInformations983J_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(68)>div:nth-child(1) input'); } // new
  get input_NonResidentBeneficiaryAdditionalInformations983J() { return $('.TaxDataTable.right>div.distDataRow:nth-child(68)>div:nth-child(1) input'); } // new
  get input_NonResidentBeneficiaryAdditionalInformations984K_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(69)>div:nth-child(1) input'); } // new
  get input_NonResidentBeneficiaryAdditionalInformations984K() { return $('.TaxDataTable.right>div.distDataRow:nth-child(69)>div:nth-child(1) input'); } // new
  get input_ShareOfNetSmallBusinessIncome_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(70)>div:nth-child(1) input'); } // new
  get input_ShareOfNetSmallBusinessIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(70)>div:nth-child(1) input'); } // new
  get input_Div6AAEligibleIncome_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(71)>div:nth-child(1) input'); } // new
  get input_Div6AAEligibleIncome() { return $('.TaxDataTable.right>div.distDataRow:nth-child(71)>div:nth-child(1) input'); } // new
  get input_TotalTFNAmountsWithheldFromAnnualTrusteePayments_DPU() { return $('.TaxDataTable.left>div.distDataRow:nth-child(72)>div:nth-child(1) input'); } // new
  get input_TotalTFNAmountsWithheldFromAnnualTrusteePayments() { return $('.TaxDataTable.right>div.distDataRow:nth-child(72)>div:nth-child(1) input'); } // new

  get button_GenerateFromDistributionComponents() { return $('.distToolBar>div:nth-child(2)>div>div:nth-child(1) button'); }
  get button_UpdateCustomData() { return $('.distCustomUpdateBtn'); }
  get circleLoader_UpdateCustomData() { return $('.circle-loader.load-complete'); }
  get button_Cancel_CustomTaxDataPage() { return $('button=Cancel'); }

  // SmartDocs
  get circleLoader_LoadAttachedDocuments() { return $('.circle-loader'); }
  get input__UploadFiles() { return $('section.dropzoneContainer input'); }
  get button_Close_AttachedDocuments() { return $('div[role="document"] button.close'); }
  get button_ExtractFromPDF() { return $('.topButtons>.buttonGroup>button'); }
  get button_Review() { return $('button.reviewBtn'); }
  get table_TaxDataSmartDoc() { return $('.TaxDataSmartDocEditor table'); }
  get firstItem_Review() { return $('.distSFTable .rt-table>.rt-tbody>div:nth-child(1)'); }
  get button_Close_Review() { return $('.distModalHeader button.close'); }
  get firstItem_Document_Review() { return $('.distSFTable .rt-table>.rt-tbody>div:nth-child(1)>div>div:nth-child(2)>div'); }
  get firstItem_NetCash_Review() { return $('.distSFTable .rt-table>.rt-tbody>div:nth-child(1)>div>div:nth-child(6)'); }
  /****** components start ******/
  /* Australian Income */
  get component_UnfrankedDividend() { return $('input#unfrankedDividend'); }
  get component_UnfrankedDividendTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(2) .SmartDocDisplayField div.content_div'); }
  get component_GrossInterest() { return $('input#grossInterest'); }
  get component_GrossInterestTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(3) .SmartDocDisplayField div.content_div'); }
  get component_OtherIncome() { return $('input#otherIncome'); }
  get component_OtherIncomeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(4) .SmartDocDisplayField div.content_div'); }

  get component_OtherIncomeNCMI() { return $('input#nppNCMI'); } // new
  get component_OtherIncomeNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(5) .SmartDocDisplayField div.content_div'); } // new 
  get component_OtherIncomeExcNCMI() { return $('input#nppExcNCMI'); } // new
  get component_OtherIncomeExcNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(6) .SmartDocDisplayField div.content_div'); } // new

  get component_TrustDeduction() { return $('input#trustDeduction'); }
  get component_TrustDeductionTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(7) .SmartDocDisplayField div.content_div'); }
  get component_NonPrimaryProductionIncomeA() { return $('.TaxDataSmartDocEditor tr:nth-child(8) td:nth-child(2) .SmartDocDisplayField div.content_div'); }
  get component_NonPrimaryProductionIncomeATaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(8) td:nth-child(4) .SmartDocDisplayField div.content_div'); }

  get component_PrimaryProductionIncomeExcNCMI() { return $('input#ppExcNCMI'); } // new
  get component_PrimaryProductionIncomeExcNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(10) .SmartDocDisplayField div.content_div'); } // new
  get component_PrimaryProductionIncomeNCMI() { return $('input#ppNCMI'); } // new
  get component_PrimaryProductionIncomeNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(11) .SmartDocDisplayField div.content_div'); } // new
  get component_OtherPrimaryProductionIncome() { return $('input#otherPPIncome'); } // new
  get component_OtherPrimaryProductionIncomeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(12) .SmartDocDisplayField div.content_div'); } // new

  /* Franked Dividend */
  get component_FrankedDividend() { return $('input#frankedDividend'); }
  get component_FrankingCredits() { return $('input#frankingCredits'); }
  get component_FrankedDividendTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(15) .SmartDocDisplayField div.content_div'); }
  /* Capital Gains */
  get component_GrossDiscountedCG() { return $('input#grossDiscountedCG'); }
  get component_DiscountedCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(17) .SmartDocDisplayField div.content_div'); }
  get component_cgtConcession() { return $('input#cgtConcession'); }
  get component_cgtConcessionTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(18) .SmartDocDisplayField div.content_div'); }
  get component_indexedCG() { return $('input#indexedCG'); }
  get component_indexedCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(19) .SmartDocDisplayField div.content_div'); }
  get component_otherCG() { return $('input#otherCG'); }
  get component_otherCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(20) .SmartDocDisplayField div.content_div'); }

  get component_DiscountedGainNCMI() { return $('input#discountGainNCMI'); } // new
  get component_DiscountedGainNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(21) .SmartDocDisplayField div.content_div'); } // new
  get component_DiscountedGainExcNCMI() { return $('input#discountGainExcNCMI'); } // new
  get component_DiscountedGainExcNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(22) .SmartDocDisplayField div.content_div'); } // new
  get component_OtherGainNCMI() { return $('input#otherGainNCMI'); } // new
  get component_OtherGainNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(23) .SmartDocDisplayField div.content_div'); } // new
  get component_OtherGainExcNCMI() { return $('input#otherGainExcNCMI'); } // new
  get component_OtherGainExcNCMITaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(24) .SmartDocDisplayField div.content_div'); } // new

  get component_foreignDiscountedCG() { return $('input#foreignGrossDiscountedCG'); }
  get component_foreignDiscountCGCredits() { return $('input#foreignDiscountCGCredits'); }
  get component_foreignDiscountedCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(25) .SmartDocDisplayField div.content_div'); }
  get component_foreignIndexedCG() { return $('input#foreignIndexedCG'); }
  get component_foreignIndexedCGCredits() { return $('input#foreignIndexedCGCredits'); }
  get component_foreignIndexedCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(26) .SmartDocDisplayField div.content_div'); }
  get component_foreignOtherCG() { return $('input#foreignOtherCG'); }
  get component_foreignOtherCGCredits() { return $('input#foreignOtherCGCredits'); }
  get component_foreignOtherCGTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(27) .SmartDocDisplayField div.content_div'); }
  get component_DistributedCapitalGainsC() { return $('.TaxDataSmartDocEditor tr:nth-child(28) td:nth-child(2) .SmartDocDisplayField div.content_div'); }
  get component_DistributedCapitalGainsCCredits() { return $('.TaxDataSmartDocEditor tr:nth-child(28) td:nth-child(3) .SmartDocDisplayField div.content_div'); }
  get component_DistributedCapitalGainsCTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(28) td:nth-child(4) .SmartDocDisplayField div.content_div'); }
  get component_NetCapitalGainOneHalfTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(29) .SmartDocDisplayField div.content_div'); }
  get component_NetCapitalGainOneThirdTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(30) .SmartDocDisplayField div.content_div'); }
  /* Foreign Income */
  get component_foreignIncome() { return $('input#foreignIncome'); }
  get component_foreignIncomeCredits() { return $('input#foreignIncomeCredits'); }
  get component_foreignIncomeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(32) .SmartDocDisplayField div.content_div'); }
  get component_ausNZFrankingCredits() { return $('input#ausNZFrankingCredits'); }
  get component_ausNZFrankingTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(33) .SmartDocDisplayField div.content_div'); }
  get component_otherNetForeignIncome() { return $('input#otherNetForeignIncome'); }
  get component_otherNetForeignIncomeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(34) .SmartDocDisplayField div.content_div'); }

  get component_CFCIncome() { return $('input#cfcIncome'); } // new
  get component_CFCIncomeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(35) .SmartDocDisplayField div.content_div'); } // new

  get component_CashDistributionD() { return $('.TaxDataSmartDocEditor tr:nth-child(36) .SmartDocDisplayField div.content_div'); }
  get component_taxExempt() { return $('input#taxExempt'); }
  get component_taxExemptTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(38) .SmartDocDisplayField div.content_div'); }
  get component_taxFree() { return $('input#taxFree'); }
  get component_taxFreeTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(39) .SmartDocDisplayField div.content_div'); }
  get component_taxDeferred() { return $('input#taxDeferred'); }
  get component_taxDeferredTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(40) .SmartDocDisplayField div.content_div'); }
  get component_GrossCashDistribution() { return $('.TaxDataSmartDocEditor tr:nth-child(41) .SmartDocDisplayField div.content_div'); }
  /* Attribution Managed Investment Trust (“AMIT”) Cost Base Adjustments */
  get component_amitShortfall() { return $('input#amitShortfall'); }
  get component_amitShortfallTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(43) .SmartDocDisplayField div.content_div'); }
  get component_amitExcess() { return $('input#amitExcess'); }
  get component_amitExcessTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(44) .SmartDocDisplayField div.content_div'); }
  /* Other Deduction From Distribution */
  get component_tfnAmountWithheld() { return $('input#tfnAmountWithheld'); }
  get component_tfnAmountWithheldTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(46) .SmartDocDisplayField div.content_div'); }

  get component_LessABNNotQuotedTaxWithheld() { return $('input#abnWithheldTax'); } // new
  get component_LessABNNotQuotedTaxWithheldTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(47) .SmartDocDisplayField div.content_div'); } // new
  get component_ForeignResidentCapitalGainsWithholding() { return $('input#foreignResidentCGWithheldTax'); } // new
  get component_ForeignResidentCapitalGainsWithholdingTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(48) .SmartDocDisplayField div.content_div'); } // new
  get component_ShareOfCreditsFromTFNWithheld() { return $('input#tfnWithheldCloselyHeldTrust'); } // new
  get component_ShareOfCreditsFromTFNWithheldTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(49) .SmartDocDisplayField div.content_div'); } // new

  get component_otherExpenses() { return $('input#otherExpenses'); }
  get component_otherExpensesTaxable() { return $('.TaxDataSmartDocEditor tr:nth-child(50) .SmartDocDisplayField div.content_div'); }

  /* Capital Gain - Trust Income Schedule */
  get component_NCMICapitalGain() { return $('input#ncmiCapitalGain'); } // new
  get component_excludedFromNCMICapitalGain() { return $('input#excNCMICapitalGain'); } // new
  get component_grossGain() { return $('.TaxDataSmartDocEditor tr:nth-child(54) .SmartDocDisplayField div.content_div'); } // new
  get component_CGTDiscountApplied() { return $('.TaxDataSmartDocEditor tr:nth-child(55) .SmartDocDisplayField div.content_div'); } // new
  get component_capitalLossApplied() { return $('input#capitalLossApplied'); } // new
  get component_smallBusinsessCGTConcession() { return $('input#smallBusinessConcession'); } // new

  /* Other Tax Offsets */
  get component_earlyStageVentureCapitalLimitedPartnershipTaxOffset() { return $('input#earlyStageVentureCapitalOffset'); } // new
  get component_earlyStageInvestorTaxOffset() { return $('input#earlyStageInvestorOffset'); } // new
  get component_explorationCreditsDistributed() { return $('input#explorationCredits'); } // new
  get component_shareOfNationalRentalAffordabilitySchemeTaxOffset() { return $('input#nationalRentalOffset'); } // new

  /* Other Trust Income Schedule Items */
  get component_NonResidentBeneficiaryAdditionalInformations983J() { return $('input#s98J'); } // new
  get component_NonResidentBeneficiaryAdditionalInformations984K() { return $('input#s98K'); } // new
  get component_ShareOfNetSmallBusinessIncome() { return $('input#smallBusinessIncome'); } // new
  get component_Div6AAEligibleIncome() { return $('input#div6AA'); } // new
  get component_TotalTFNAmountsWithheldFromAnnualTrusteePayments() { return $('input#tfnWithheldTrusteePayment'); } // new

  /* Net Cash Distribution */
  get component_NetCashDistribution() { return $('.TaxDataSmartDocEditor tr:nth-child(70) .SmartDocDisplayField div.content_div'); }
  /* Alert */
  get component_Alert() { return $('.MuiAlert-root .MuiAlert-message'); }
  /****** components end ******/
  get button_ShowAll_TaxDataSmartDoc() { return $('.TaxDataSmartDocEditor thead button'); }
  get button_GenerateMarkAsReviewed_TaxDataSmartDoc() { return $('button=Generate & Mark as Reviewed'); }
  get circleLoader_GenerateMarkAsReviewed_TaxDataSmartDoc() { return $('.circle-loader.load-complete'); }
  get button_History() { return $('button.distEventHistory'); }
  get firstItem_History() { return $('table.distSFTable>tbody>tr:nth-child(1)'); }
  get firstItem_Code_History() { return $('table.distSFTable>tbody>tr:nth-child(1)>td:nth-child(1)'); }
  get firstItem_FinancialYear_History() { return $('table.distSFTable>tbody>tr:nth-child(1)>td:nth-child(3)'); }
  get firstItem_Description_History() { return $('table.distSFTable>tbody>tr:nth-child(1)>td:nth-child(6)'); }

  //Post Year-End Accruals
  get button_PostAccruals() { return $('button.distPostAccruals'); }
  get allLines_PostYearEndAccruals() { return $$('.rt-table>.rt-tbody>div.rt-tr-group:not(.investmentRow)'); }
  get firstLine_PostYearEndAccruals() { return $('.rt-table>.rt-tbody>div.rt-tr-group:not(.investmentRow):nth-child(1)'); }
  get button_PostTransaction() { return $('button=Post Transaction'); }
  get text_ConfirmationMessage_PostTransaction() { return $('.table-responsive>.distSFTable>tbody>tr>td>span'); }
  get text_AccrualAccount_PostTransaction() { return $('.table-responsive>.distSFTable>tbody>tr>td:nth-child(4)'); }
  get text_AccrualAmount_PostTransaction() { return $('.table-responsive>.distSFTable>tbody>tr>td:nth-child(5)'); }
  get button_Confirm_PostTransaction() { return $('.modal-dialog').$('button.btn-danger=Confirm'); }
  get button_Cancel_PostTransaction() { return $('.modal-dialog').$('button.btn-default=Cancel'); }
  get button_GenerateTaxData() { return $('#root .buttonArea>div:nth-child(2) .topButtons button.genTaxData'); }
  get button_GenerateTaxDataAndPostAccrual() { return $('button=Generate Tax Data & Post Accrual'); }
  get circleLoader_GenerateTaxDataAndPostAccrual() { return $('.circle-loader.load-complete'); }
  get button_MarkAsIncomplete() { return $('#root .buttonArea>div:nth-child(2) .topButtons button.markIncomplete'); }

  async prepareTestDataForDistTaxAuto(entityData, investmentTestData) {
    const transactionIdArray = [];
    console.log(`Logging in to firm ${context.TestConfig.firm}`);
    await browser.call(() => firmUtil.login(context.TestConfig.firm));

    console.log('Deleting existing entity for this test');
    await browser.call(() => firmUtil.deleteEntities(entityData.entityCode));

    console.log('Adding new entity for this test');
    await browser.call(() => firmUtil.addEntity(entityData));

    console.log('Adding bank account for the test entity');
    const bankData = await browser.call(() => chartUtil.addBankAccount());
    context.ShareData.push({ pcode: bankData.pcode, id: bankData.id });

    for (let i = 0; i < investmentTestData.length; i += 1) {
      console.log(`Adding ${investmentTestData[i].chartAccount} for the test entity`);
      let investData = await browser.call(() => chartUtil.addInvestmentSubAccount(investmentTestData[i].chartAccount));
      context.ShareData.push({ pcode: investData.pcode, id: investData.id });
    }

    if (entityData.bankBalanceToStart) {
      console.log('Adding balance to default bank');
      await browser.call(() => transUtil.addBankTransactionWithGeneralEntry(
        `${parseInt(entityData.financialYearToStart) - 1}-07-01`,
        'Default bank balance to start test',
        entityData.bankBalanceToStart));
    }
    // system FY2023 
    console.log(`Adding purchase of ${context.ShareData[1].pcode}`);
    await browser.call(() => invTransUtil.addInvestmentPurchase(investmentTestData[0].purchase.date, `Adding purchase of ${context.ShareData[1].pcode}`,
      context.ShareData[1].pcode, investmentTestData[0].purchase.unit, investmentTestData[0].purchase.amount));

    console.log(`Adding distribution of ${context.ShareData[1].pcode} - FY2023`);
    let transactionId = await browser.call(() => invTransUtil.addDistribution(investmentTestData[0].distribution[0].date, `Adding distribution of ${context.ShareData[1].pcode} - FY2023`,
      `23800/${context.ShareData[1].pcode.split('/')[1]}`, investmentTestData[0].distribution[0].amount, investmentTestData[0].distribution[0].components));
    transactionIdArray.push(transactionId);

    // custom FY2023 
    console.log(`Adding purchase of ${context.ShareData[2].pcode}`);
    await browser.call(() => invTransUtil.addInvestmentPurchase(investmentTestData[1].purchase.date, `Adding purchase of ${context.ShareData[2].pcode}`,
      context.ShareData[2].pcode, investmentTestData[1].purchase.unit, investmentTestData[1].purchase.amount));

    console.log(`Adding distribution of ${context.ShareData[2].pcode} - FY2023`);
    transactionId = await browser.call(() => invTransUtil.addDistribution(investmentTestData[1].distribution[0].date, `Adding distribution of ${context.ShareData[2].pcode} - FY2023`,
      `23800/${context.ShareData[2].pcode.split('/')[1]}`, investmentTestData[1].distribution[0].amount, investmentTestData[1].distribution[0].components));
    transactionIdArray.push(transactionId);

    // custom FY2024
    console.log(`Adding distribution of ${context.ShareData[2].pcode} - FY2024`);
    transactionId = await browser.call(() => invTransUtil.addDistribution(investmentTestData[1].distribution[1].date, `Adding distribution of ${context.ShareData[2].pcode} - FY2024`,
      `23800/${context.ShareData[2].pcode.split('/')[1]}`, investmentTestData[1].distribution[1].amount, investmentTestData[1].distribution[1].components));
    transactionIdArray.push(transactionId);

    // system FY2024
    console.log(`Adding purchase of ${context.ShareData[3].pcode}`);
    await browser.call(() => invTransUtil.addInvestmentPurchase(investmentTestData[2].purchase.date, `Adding purchase of ${context.ShareData[3].pcode}`,
      context.ShareData[3].pcode, investmentTestData[2].purchase.unit, investmentTestData[2].purchase.amount));

    console.log(`Adding distribution of ${context.ShareData[3].pcode} - FY2024`);
    transactionId = await browser.call(() => invTransUtil.addDistribution(investmentTestData[2].distribution[0].date, `Adding distribution of ${context.ShareData[3].pcode} - FY2024`,
      `23800/${context.ShareData[3].pcode.split('/')[1]}`, investmentTestData[2].distribution[0].amount, investmentTestData[2].distribution[0].components));
    transactionIdArray.push(transactionId);

    return transactionIdArray;
  }

  async clearCustomTaxData(financialYear, chartAccount, unitsOnHand, distributionDate, taccId) {
    const secList = await browser.call(() => securityUtil.getSecurityList(chartAccount.split('/')[1]));
    const payload = {
      "financialYear": financialYear,
      "isSystemTaxData": false,
      "paymentAmount": 0,
      "frankedDividend": 0,
      "unfrankedDividend": 0,
      "grossInterest": 0,
      "otherIncome": 0,
      "trustDeduction": 0,
      "frankingCredits": 0,
      "discountRate": "I",
      "grossDiscountedCG": 0,
      "unitsOnHand": unitsOnHand,
      "otherCG": 0,
      "foreignIncome": 0,
      "amitExcess": 0,
      "amitShortfall": 0,
      "cgtConcession": 0,
      "indexedCG": 0,
      "foreignGrossDiscountedCG": 0,
      "foreignDiscountCGCredits": 0,
      "foreignIndexedCG": 0,
      "foreignIndexedCGCredits": 0,
      "foreignOtherCG": 0,
      "foreignOtherCGCredits": 0,
      "foreignIncomeCredits": 0,
      "ausNZFrankingCredits": 0,
      "otherNetForeignIncome": 0,
      "taxExempt": 0,
      "taxFree": 0,
      "taxDeferred": 0,
      "tfnAmountWithheld": 0,
      "otherExpenses": 0,
      "distributedCapitalGainsTaxable": 0,
      "netCapitalGain13": 0,
      "grossGain": 0,
      "privateTrustCgtDiscountApplied": 0,
      "saveAsReviewed": false,
      "exRecordDate": `${distributionDate}${context.Constants.DATE_SUFFIX1}`,
      "paymentDate": `${distributionDate}${context.Constants.DATE_SUFFIX1}`,
      "taccId": taccId,
      "investCodeId": secList[0].id
    }
    const response = await browser.call(() => axios.post(
      `${context.TestConfig.serverURL}/chart/chartmvc/DistributionReviewController/saveCustomTaxComponents?firm=${context.TestConfig.firm}&uid=${context.TestConfig.uid}&mid=${context.TestConfig.entityId}`,
      payload));
    assert.strictEqual(response.status, 200, 'Can not clear(update) Custom Tax Data')
  }
}

export const distributionTaxAutomationPage = new DistributionTaxAutomationPage();