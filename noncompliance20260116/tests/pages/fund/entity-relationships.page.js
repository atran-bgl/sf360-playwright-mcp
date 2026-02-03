import Page from '../page.js';

class EntityRelationshipsPage extends Page {
  get first_Group() { return $('div.Group:not(.addGroup)'); }
  get groups() { return $$('div.Group:not(.addGroup)'); }
  get first_Contact_PopUpSearchBox() { return $('.modal-content>.ContactBar>div.contactList>div>div'); }
  get button_Close_PopUpSearchBox() { return $('button.close'); }
  get button_AddNewGroup() { return $('div.addGroup>button'); }
  get input_SelectNewGroup() { return $('div.addGroup>div.InputSelect'); }
  get button_GotIt() { return $('.introTourHint button'); }
}

export const entityRelationshipsPage = new EntityRelationshipsPage();
