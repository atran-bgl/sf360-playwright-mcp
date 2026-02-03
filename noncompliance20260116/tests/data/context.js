import testUtil from '../lib/test-util.js';
const { TestConfig, ShareData } = testUtil;
import AllURLs from './all-urls.json' assert { type: 'json' };
import TestFirmFundNames from './test-firm-fund-names.json' assert { type: 'json' };
import TestSettings from '../../test-settings.json' assert { type: 'json' };
import Constants from '../lib/constants.js';

export const context = {
  TestConfig,
  ShareData,
  AllURLs,
  TestFirmFundNames,
  TestSettings,
  Constants
};