import Page from '../page.js';

class LiveReportsPage extends Page {
  get text_Title() { return $('h4.section-heading>strong>span'); }
}

export const liveReportsPage = new LiveReportsPage();
