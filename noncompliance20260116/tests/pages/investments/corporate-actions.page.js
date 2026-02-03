import Page from '../page.js';
import { browser, $, $$ } from '@wdio/globals';
class CorporateActionsPage extends Page {
  get items_Actions() { return $$('table.sf360Table>tbody>tr'); }
  get firstItem_Action() { return $('table.sf360Table>tbody>tr:nth-child(1)'); }
  get button_ProcessCorporateAction() { return $('button=Process Corporate Action'); }
  get title_NewCorporateAction() { return $('.section-heading'); }

  get link_ActionRequired() { return $('li[ng-class="navClass(\'actionRequired\')"]'); }
  get link_Optional() { return $('li[ng-class="navClass(\'optional\')"]'); }
  get link_Processed() { return $('li[ng-class="navClass(\'processed\')"]'); }
  get link_Ignored() { return $('li[ng-class="navClass(\'omitted\')"]'); }
  get link_TotalCorporateActions() { return $('li[ng-class="navClass(\'total\')"]'); }

  get input_SelectCorporateAction() { return $('div[title="Select Corporate Action"] span:nth-child(2)'); }
  get input_CorporateActionDate() { return $('#corp_action_date'); }
  get text_StepOne() { return $('span=Step One'); }
  get text_StepTwo() { return $('span=Step Two'); }
  get text_StepThree() { return $('span=Step Three'); }

  // Bonus Issue
  get input_BonusIssueUnits_Bn() { return $('input[ng-model="bonus_issue_units"]'); }

  get text_UnitsAfterCorpActionInSum_Bn() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(8)'); }

  // Code/Class Change
  get button_NewInvestmentAccount_Cc() { return $('.new-invest-btn'); }
  get text_SelectedNewAccount_Cc() { return $(' form[name="corp_action_details_form"] > div.step2 div.panel-body div[ng-show*=CodeChange] div[title="Select the account to Process"]'); }

  get text_NewInvestmentCodeInSum_Cc() { return $('table[ng-show*=CodeChange]>tbody>tr>td:nth-child(4)'); }

  // Demerger
  get button_NewInvestmentAccount_Dm() { return $('.new-invest-btn'); }
  get text_SelectedNewAccount_Dm() { return $('form[name="corp_action_details_form"] > div.step2 div.panel-body div[ng-show*=CodeChange] div[title="Select the account to Process"]'); }
  // get input_unitsDemergedSecurity_Dm() { return $('input[ng-model="demerged_units_after"]'); }
  get input_UnitsInHeadSecurityAfterDemerger_Dm() { return $('div[ng-show*=Demerger] input[ng-model="bonus_issue_units"]'); }
  get input_PercentageOfCostBaseHeadSecurity_Dm() { return $('input[ng-model="head_security"]'); }

  get text_HeadCostBaseEffectInSum_Dm() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(6)'); }
  get text_HeadUnitsAfterCorpActionInSum_Dm() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(8)'); }
  get text_DemergedCostBaseEffectInSum_Dm() { return $('table[ng-show*=Demerger]>tbody>tr>td:nth-child(6)'); }
  get text_DemergedUnitsAfterCorpActionInSum_Dm() { return $('table[ng-show*=Demerger]>tbody>tr>td:nth-child(8)'); }

  // Takeover / Merger
  get button_NewInvestmentAccount_Mg() { return $('.new-invest-btn'); }
  get text_SelectedNewAccount_Mg() { return $('form[name="corp_action_details_form"] > div.step2 div.panel-body div[ng-show*=CodeChange] div[title="Select the account to Process"]'); }
  get input_TotalMarketValueOfSharesReceived_Mg() { return $('input[ng-model="$parent.total_market_shares_received"]'); }

  get text_NewInvestmentCodeInSum_Mg() { return $('table[ng-show*=Merger]>tbody>tr>td:nth-child(4)'); }
  get text_NewUnitsAfterCorpActionInSum_Mg() { return $('table[ng-show*=Merger]>tbody>tr>td:nth-child(8)'); }
  get text_DiscountedGainInSum_Mg() { return $('div[ng-show="corp_action.selected.key === \'Merger\'"] td:nth-child(5)'); }
  get text_OtherGainInSum_Mg() { return $('div[ng-show="corp_action.selected.key === \'Merger\'"] td:nth-child(6)'); }


  // Dividend / Distribution Reinvestment Plan
  get text_UnitsAfterDRPInSum_Drp() { return $('div[ng-show*="DividendReinvestmentPlan"]>table>tbody>tr>td:nth-child(11)'); }

  // Non-Renounceable Rights Issue
  get button_NewInvestmentAccount_Nr() { return $('a[ng-click*=AddNewInvestAccount]:not(.new-invest-btn)'); }
  get text_SelectedRightsIssueAccount_Nr() { return $('div[ng-show*=NonRenounceableIssue] div[title="Select the account to Process"]'); }
  get input_AmountPaidForRights_Nr() { return $('#rr_rights1 input'); }
  get text_RrightsIssueSecurityCodeInSum_Nr() { return $('table[ng-show*=NonRenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(3)'); }
  get text_RightsIssuedInSum_Nr() { return $('table[ng-show*=NonRenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(4)'); }
  get text_CostBaseEffectInSum_Nr() { return $('table[ng-show*=NonRenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(5)'); }

  get checkbox_Exercised_Nr() { return $('div[ng-show*=RenounceableIssueExercised]:not(.ng-hide) input[ng-model="isExercised"]'); }
  get checkbox_Lapsed_Nr() { return $('div[ng-show*=RenounceableIssueExercised]:not(.ng-hide) input[ng-model="isLapsed"]'); }
  get input_NewSharesAcquired_Nr() { return $('input[ng-model="rr_new_shares"]'); }
  get text_UnitsAfterRightsIssueInSum_Nr() { return $('table[ng-show*=NonRenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(5)'); }

  // Renounceable Rights Issue
  get button_NewInvestmentAccount_Rr() { return $('a[ng-click*=AddNewInvestAccount]:not(.new-invest-btn)'); }
  get text_SelectedRightsIssueAccount_Rr() { return $('div[ng-show*=NonRenounceableIssue] div[title="Select the account to Process"]'); }
  get input_AmountPaidForRights_Rr() { return $('#rr_rights1 input'); }
  get text_RrightsIssueSecurityCodeInSum_Rr() { return $('table[ng-show*=RenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(3)'); }
  get text_RightsIssuedInSum_Rr() { return $('table[ng-show*=RenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(4)'); }
  get text_CostBaseEffectInSum_Rr() { return $('table[ng-show*=RenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(5)'); }

  get checkbox_Exercised_Rr() { return $('div[ng-show*=RenounceableIssueExercised]:not(.ng-hide) input[ng-model="isExercised"]'); }
  get checkbox_Sold_Rr() { return $('div[ng-show*=RenounceableIssueExercised]:not(.ng-hide) input[ng-model="isSold"]'); }
  get checkbox_Lapsed_Rr() { return $('div[ng-show*=RenounceableIssueExercised]:not(.ng-hide) input[ng-model="isLapsed"]'); }
  get input_RightsSold_Rr() { return $('input[ng-model="rr_rights_sold"]'); }
  get input_NetSaleProceeds_Rr() { return $('input[ng-model="rr_sale_proceeds"]'); }
  get input_RightsLapsed_Rr() { return $('input[ng-model="rr_rights_lapsed"]'); }
  get input_PremiumReceivedPerEntitlement_Rr() { return $('input[ng-model="rr_premium_received"]'); }
  get text_UnitsAfterRightsIssueInSum_Rr() { return $('table[ng-show*=RenounceableIssue]:not(.ng-hide)>tbody>tr>td:nth-child(5)'); }

  // Share Consolidation
  get text_UnitsAfterCorpActionInSum_Rc() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(8)'); }

  // Share Split
  get text_UnitsAfterCorpActionInSum_Ss() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(8)'); }

  // Return Of Capital
  get text_CostBaseEffectInSum_Roc() { return $('td[ng-show*=ReturnOfCapital]'); }

  // Share Purchase Plan
  get input_UnitsToPurchase_Sp() { return $('input[ng-model="sp_units_to_purchase"]'); }

  get text_UnitsAfterCorpActionInSum_Sp() { return $('table[ng-show*=Issue]>tbody>tr>td:nth-child(8)'); }

}

export const corporateActionsPage = new CorporateActionsPage();
