import Page from '../page.js';

class BadgePage extends Page {
  get text_pageName() { return $('.top-panel-header'); }
}

export const badgePage = new BadgePage();

