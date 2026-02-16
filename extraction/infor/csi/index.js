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
 * Infor CSI (SyteLine/CloudSuite Industrial) Extractors
 *
 * Registers all CSI forensic extractors for competitive displacement analysis.
 * CSI uses IDO (Intelligent Data Objects) for REST/SOAP access and SQL Server
 * for direct DB queries. Field names follow .NET/PascalCase conventions.
 */

require('./config-extractor');
require('./item-extractor');
require('./customer-extractor');
require('./order-extractor');
require('./purchasing-extractor');
require('./manufacturing-extractor');
require('./inventory-extractor');
require('./fi-extractor');
require('./customization-extractor');
require('./security-extractor');
require('./interface-extractor');
require('./data-quality-extractor');
