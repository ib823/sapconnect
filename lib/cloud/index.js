/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
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
