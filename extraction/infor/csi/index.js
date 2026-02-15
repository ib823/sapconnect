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
