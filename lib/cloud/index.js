'use strict';

const SuccessFactorsClient = require('./successfactors-client');
const AribaClient = require('./ariba-client');
const ConcurClient = require('./concur-client');
const SACClient = require('./sac-client');
const { CloudModuleError, SuccessFactorsError, AribaError, ConcurError, SACError } = require('../errors');

module.exports = {
  SuccessFactorsClient,
  AribaClient,
  ConcurClient,
  SACClient,
  CloudModuleError,
  SuccessFactorsError,
  AribaError,
  ConcurError,
  SACError,
};
