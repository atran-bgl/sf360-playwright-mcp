import * as chai from 'chai';
import chaiSubset from 'chai-subset';

import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { HttpsCookieAgent } from 'http-cookie-agent';

const jar = new CookieJar();

axios.defaults.httpsAgent = new HttpsCookieAgent({
  jar,
  keepAlive: true,
  rejectUnauthorized: false, // disable CA checks
});

chai.use(chaiSubset);
chai.config.truncateThreshold = 0;

const { expect } = chai;
const { assert } = chai;
import _ from 'lodash';

export { axios, jar as cookieJar, expect, assert, _ };
