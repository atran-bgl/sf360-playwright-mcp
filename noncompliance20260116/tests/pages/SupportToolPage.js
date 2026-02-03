export class SupportToolPage {
  constructor(page) {
    this.page = page;

    // login
    this.input_Email = page.getByRole('textbox', { name: 'Email or phone' });

    //Delisted Data Import
    this.button_Menu_SupportTools = page.getByRole('button', { name: 'menu' });
    this.button_DelistedDataImport = page.getByText('Delisted Data Import');
    this.input_PasteDataArea = page.locator('.MuiInputBase-root');
    this.button_Submit = page.getByRole('button', { name: 'Submit' });
    this.text_XXXImported = page.locator('.MuiAlert-message');
  }


}