export class SuperStreamDashboardPage {
  constructor(page) {
    this.page = page;
    this.button_EmailNotification = page.getByRole('button', { name: 'Email Notification' });
    this.listItem_FirmNotification = page.getByRole('listitem').filter({ hasText: 'Firm Notification' }).locator('a');
    this.alertMessage = page.locator('#registrationStep1Modal .modal-body .alert>div');
    this.input_SearchContact = page.locator('.name-selector input');
    this.listItem_FirstResult_Searchcontact = page.locator('.name-selector>div>div>div:nth-child(3)>div>div:nth-child(1)');
    this.input_email = page.getByPlaceholder('example@domain.com');
    this.button_Save = page.getByText('Save');
    this.systemInfo_SaveSucess = page.locator('#msgtext>div');
    this.button_OK_systemInfo = page.locator('#InfoModal').getByText('OK');

    this.name_FirmEmail = page.locator('.relationship-title');
    this.nameEmail_FirmEmail = page.locator('table.relationship-line-table td:nth-child(1) span'); // two elements
    this.button_EditRemove = page.locator('div').filter({ hasText: /^EditRemove$/ }).locator('button');
    this.button_Remove = page.getByText('Remove', { exact: true });
    this.button_edit = page.getByText('Edit', { exact: true });
    this.systemInfo_RemoveFirmEmail = page.getByText('Warning: This will remove');
    this.button_Yes = page.getByText('Yes', { exact: true });


  }
}