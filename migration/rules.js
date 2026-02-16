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
 * S/4HANA Simplification Rules Database
 *
 * Thin wrapper that re-exports from the rules/ directory.
 * All rule definitions are now in migration/rules/*.js modules.
 */

module.exports = require('./rules/index');
