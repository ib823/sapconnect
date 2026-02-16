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
/**
 * RFC Module Exports
 */

const RfcClient = require('./client');
const RfcPool = require('./pool');
const { TableReader, TableReadError } = require('./table-reader');
const { FunctionCaller, FunctionCallError } = require('./function-caller');

module.exports = {
  RfcClient,
  RfcPool,
  TableReader,
  TableReadError,
  FunctionCaller,
  FunctionCallError,
};
