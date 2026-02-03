export class ContactsPage {
  constructor(page) {
    this.page = page;

    this.input_FirstName = page.getByRole('textbox', { name: 'First Name(s)*' });
    this.input_Surname = page.getByRole('textbox', { name: 'Surname*' });
    this.input_DateOfBirth = page.locator('input#birthday');
    this.button_CreatePerson = page.getByRole('button', { name: 'Create Person' })
  }
}