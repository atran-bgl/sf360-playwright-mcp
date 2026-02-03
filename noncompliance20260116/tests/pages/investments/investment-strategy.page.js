import Page from '../page.js';

class InvestmentStrategyPage extends Page {
  get input_InvestmentStrategyDate() { return $('.tableInputList>tbody>tr:nth-child(1)>td:nth-child(2) input:nth-child(2)'); }

  get input_AustralianSharesMin() { return $('.tableInputList>tbody>tr:nth-child(3)>td:nth-child(2) input'); }
  get input_AustralianSharesMax() { return $('.tableInputList>tbody>tr:nth-child(3)>td:nth-child(3) input'); }
  get input_AustralianSharesTarget() { return $('.tableInputList>tbody>tr:nth-child(3)>td:nth-child(4) input'); }

  get input_InternationalSharesMin() { return $('.tableInputList>tbody>tr:nth-child(4)>td:nth-child(2) input'); }
  get input_InternationalSharesMax() { return $('.tableInputList>tbody>tr:nth-child(4)>td:nth-child(3) input'); }
  get input_InternationalSharesTarget() { return $('.tableInputList>tbody>tr:nth-child(4)>td:nth-child(4) input'); }

  get input_CashMin() { return $('.tableInputList>tbody>tr:nth-child(5)>td:nth-child(2) input'); }
  get input_CashMax() { return $('.tableInputList>tbody>tr:nth-child(5)>td:nth-child(3) input'); }
  get input_CashTarget() { return $('.tableInputList>tbody>tr:nth-child(5)>td:nth-child(4) input'); }

  get input_AustralianFixedInterestMin() { return $('.tableInputList>tbody>tr:nth-child(6)>td:nth-child(2) input'); }
  get input_AustralianFixedInterestMax() { return $('.tableInputList>tbody>tr:nth-child(6)>td:nth-child(3) input'); }
  get input_AustralianFixedInterestTarget() { return $('.tableInputList>tbody>tr:nth-child(6)>td:nth-child(4) input'); }

  get input_InternationalFixedInterestMin() { return $('.tableInputList>tbody>tr:nth-child(7)>td:nth-child(2) input'); }
  get input_InternationalFixedInterestMax() { return $('.tableInputList>tbody>tr:nth-child(7)>td:nth-child(3) input'); }
  get input_InternationalFixedInterestTarget() { return $('.tableInputList>tbody>tr:nth-child(7)>td:nth-child(4) input'); }

  get input_MortgagesMin() { return $('.tableInputList>tbody>tr:nth-child(8)>td:nth-child(2) input'); }
  get input_MortgagesMax() { return $('.tableInputList>tbody>tr:nth-child(8)>td:nth-child(3) input'); }
  get input_MortgagesTarget() { return $('.tableInputList>tbody>tr:nth-child(8)>td:nth-child(4) input'); }

  get input_DirectPropertyMin() { return $('.tableInputList>tbody>tr:nth-child(9)>td:nth-child(2) input'); }
  get input_DirectPropertyMax() { return $('.tableInputList>tbody>tr:nth-child(9)>td:nth-child(3) input'); }
  get input_DirectPropertyTarget() { return $('.tableInputList>tbody>tr:nth-child(9)>td:nth-child(4) input'); }

  get input_ListedPropertyMin() { return $('.tableInputList>tbody>tr:nth-child(10)>td:nth-child(2) input'); }
  get input_ListedPropertyMax() { return $('.tableInputList>tbody>tr:nth-child(10)>td:nth-child(3) input'); }
  get input_ListedPropertyTarget() { return $('.tableInputList>tbody>tr:nth-child(10)>td:nth-child(4) input'); }

  get input_OtherMin() { return $('.tableInputList>tbody>tr:nth-child(11)>td:nth-child(2) input'); }
  get input_OtherMax() { return $('.tableInputList>tbody>tr:nth-child(11)>td:nth-child(3) input'); }
  get input_OtherTarget() { return $('.tableInputList>tbody>tr:nth-child(11)>td:nth-child(4) input'); }

  get button_Save() { return $('.btnLocation .base-button-middle'); }
  get text_SystemInfo() { return $('div.dialog_white_upper_bar_title'); }

  get text_ChartPercentage_AustralianShares() { return $('.chartLocation tbody>tr:nth-child(1)>td:nth-child(3)'); }
  get text_ChartPercentage_InternationalShares() { return $('.chartLocation tbody>tr:nth-child(2)>td:nth-child(3)'); }
  get text_ChartPercentage_Cash() { return $('.chartLocation tbody>tr:nth-child(3)>td:nth-child(3)'); }
  get text_ChartPercentage_AustralianFixedInterest() { return $('.chartLocation tbody>tr:nth-child(4)>td:nth-child(3)'); }
  get text_ChartPercentage_InternationalFixedInterest() { return $('.chartLocation tbody>tr:nth-child(5)>td:nth-child(3)'); }
  get text_ChartPercentage_Mortgages() { return $('.chartLocation tbody>tr:nth-child(6)>td:nth-child(3)'); }
  get text_ChartPercentage_DirectProperty() { return $('.chartLocation tbody>tr:nth-child(7)>td:nth-child(3)'); }
  get text_ChartPercentage_ListedProperty() { return $('.chartLocation tbody>tr:nth-child(8)>td:nth-child(3)'); }
  get text_ChartPercentage_Other() { return $('.chartLocation tbody>tr:nth-child(9)>td:nth-child(3)'); }
}

export const investmentStrategyPage = new InvestmentStrategyPage();
