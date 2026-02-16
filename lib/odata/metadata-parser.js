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
 * OData $metadata XML Parser
 *
 * Parses OData EDMX/CSDL $metadata XML into a structured JavaScript
 * representation of entity types, entity sets, navigation properties,
 * associations, and function imports.
 *
 * Works with both V2 (EDMX) and V4 (CSDL) metadata formats.
 */

'use strict';

const Logger = require('../logger');

class MetadataParser {
  constructor(options = {}) {
    this.log = options.logger || new Logger('metadata-parser');
  }

  /**
   * Parse $metadata XML string into structured model.
   * @param {string} xmlString — Raw $metadata XML
   * @returns {MetadataModel}
   */
  parse(xmlString) {
    if (!xmlString || typeof xmlString !== 'string') {
      throw new Error('$metadata XML string is required');
    }

    const isV4 = xmlString.includes('edmx:Edmx Version="4.0"') ||
                 xmlString.includes('Version="4.0"');

    const model = {
      version: isV4 ? 'v4' : 'v2',
      schemas: [],
      entityTypes: [],
      entitySets: [],
      complexTypes: [],
      associations: [],
      functionImports: [],
      actions: [],
      navigationProperties: [],
    };

    this._parseSchemas(xmlString, model);
    this._parseEntityTypes(xmlString, model);
    this._parseEntitySets(xmlString, model);
    this._parseComplexTypes(xmlString, model);
    this._parseFunctionImports(xmlString, model);

    if (isV4) {
      this._parseActions(xmlString, model);
    } else {
      this._parseAssociations(xmlString, model);
    }

    return model;
  }

  /**
   * Extract entity type names and their key fields for quick lookup.
   * @param {string} xmlString
   * @returns {Array<{name, namespace, keys, properties}>}
   */
  getEntityTypes(xmlString) {
    const model = this.parse(xmlString);
    return model.entityTypes;
  }

  /**
   * Find an entity type by name.
   * @param {MetadataModel} model
   * @param {string} entityTypeName
   * @returns {object|null}
   */
  findEntityType(model, entityTypeName) {
    return model.entityTypes.find(
      et => et.name === entityTypeName || et.qualifiedName === entityTypeName
    ) || null;
  }

  /**
   * Get navigation properties for an entity type.
   * @param {MetadataModel} model
   * @param {string} entityTypeName
   * @returns {Array<{name, target, multiplicity}>}
   */
  getNavigations(model, entityTypeName) {
    const et = this.findEntityType(model, entityTypeName);
    if (!et) return [];
    return et.navigationProperties || [];
  }

  // ── XML Parsing (regex-based, no dependencies) ──────────────────────

  _parseSchemas(xml, model) {
    const schemaRe = /<Schema\s+[^>]*Namespace="([^"]+)"[^>]*>/g;
    let match;
    while ((match = schemaRe.exec(xml)) !== null) {
      model.schemas.push({ namespace: match[1] });
    }
  }

  _parseEntityTypes(xml, model) {
    const etRe = /<EntityType\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/EntityType>/g;
    let match;
    while ((match = etRe.exec(xml)) !== null) {
      const name = match[1];
      const body = match[2];

      // Parse keys
      const keys = [];
      const keyRe = /<PropertyRef\s+Name="([^"]+)"/g;
      let km;
      while ((km = keyRe.exec(body)) !== null) {
        keys.push(km[1]);
      }

      // Parse properties
      const properties = [];
      const propRe = /<Property\s+([^>]+)\/?\s*>/g;
      let pm;
      while ((pm = propRe.exec(body)) !== null) {
        const attrs = this._parseAttributes(pm[1]);
        properties.push({
          name: attrs.Name,
          type: attrs.Type,
          nullable: attrs.Nullable !== 'false',
          maxLength: attrs.MaxLength ? parseInt(attrs.MaxLength, 10) : null,
          precision: attrs.Precision ? parseInt(attrs.Precision, 10) : null,
          scale: attrs.Scale ? parseInt(attrs.Scale, 10) : null,
          sapLabel: attrs['sap:label'] || null,
          sapFilterable: attrs['sap:filterable'] !== 'false',
          sapSortable: attrs['sap:sortable'] !== 'false',
        });
      }

      // Parse navigation properties
      const navProps = [];
      const navRe = /<NavigationProperty\s+([^>]+)\/?\s*>/g;
      let nm;
      while ((nm = navRe.exec(body)) !== null) {
        const attrs = this._parseAttributes(nm[1]);
        navProps.push({
          name: attrs.Name,
          relationship: attrs.Relationship || null,
          target: attrs.Type || attrs.ToRole || null,
          multiplicity: attrs.Multiplicity || null,
          fromRole: attrs.FromRole || null,
          toRole: attrs.ToRole || null,
        });
      }

      // Find namespace for qualified name
      const namespace = model.schemas.length > 0 ? model.schemas[0].namespace : '';
      model.entityTypes.push({
        name,
        namespace,
        qualifiedName: namespace ? `${namespace}.${name}` : name,
        keys,
        properties,
        navigationProperties: navProps,
      });
    }
  }

  _parseEntitySets(xml, model) {
    const esRe = /<EntitySet\s+([^>]+)\/?\s*>/g;
    let match;
    while ((match = esRe.exec(xml)) !== null) {
      const attrs = this._parseAttributes(match[1]);
      model.entitySets.push({
        name: attrs.Name,
        entityType: attrs.EntityType,
        creatable: attrs['sap:creatable'] !== 'false',
        updatable: attrs['sap:updatable'] !== 'false',
        deletable: attrs['sap:deletable'] !== 'false',
        pageable: attrs['sap:pageable'] !== 'false',
        addressable: attrs['sap:addressable'] !== 'false',
      });
    }
  }

  _parseComplexTypes(xml, model) {
    const ctRe = /<ComplexType\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/ComplexType>/g;
    let match;
    while ((match = ctRe.exec(xml)) !== null) {
      const properties = [];
      const propRe = /<Property\s+([^>]+)\/?\s*>/g;
      let pm;
      while ((pm = propRe.exec(match[2])) !== null) {
        const attrs = this._parseAttributes(pm[1]);
        properties.push({
          name: attrs.Name,
          type: attrs.Type,
          nullable: attrs.Nullable !== 'false',
        });
      }
      model.complexTypes.push({ name: match[1], properties });
    }
  }

  _parseAssociations(xml, model) {
    const assocRe = /<Association\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/Association>/g;
    let match;
    while ((match = assocRe.exec(xml)) !== null) {
      const ends = [];
      const endRe = /<End\s+([^>]+)\/?\s*>/g;
      let em;
      while ((em = endRe.exec(match[2])) !== null) {
        const attrs = this._parseAttributes(em[1]);
        ends.push({
          type: attrs.Type,
          multiplicity: attrs.Multiplicity,
          role: attrs.Role,
        });
      }
      model.associations.push({ name: match[1], ends });
    }
  }

  _parseFunctionImports(xml, model) {
    const fiRe = /<FunctionImport\s+([^>]+)\/?\s*>([\s\S]*?)<\/FunctionImport>|<FunctionImport\s+([^>]+)\/?\s*>/g;
    let match;
    while ((match = fiRe.exec(xml)) !== null) {
      const attrStr = match[1] || match[3];
      const body = match[2] || '';
      const attrs = this._parseAttributes(attrStr);

      const parameters = [];
      const paramRe = /<Parameter\s+([^>]+)\/?\s*>/g;
      let pm;
      while ((pm = paramRe.exec(body)) !== null) {
        const pAttrs = this._parseAttributes(pm[1]);
        parameters.push({
          name: pAttrs.Name,
          type: pAttrs.Type,
          mode: pAttrs.Mode || 'In',
          nullable: pAttrs.Nullable !== 'false',
        });
      }

      model.functionImports.push({
        name: attrs.Name,
        returnType: attrs.ReturnType || null,
        httpMethod: attrs['m:HttpMethod'] || attrs.HttpMethod || 'GET',
        entitySet: attrs.EntitySet || null,
        parameters,
      });
    }
  }

  _parseActions(xml, model) {
    const actionRe = /<Action\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/Action>/g;
    let match;
    while ((match = actionRe.exec(xml)) !== null) {
      const parameters = [];
      const paramRe = /<Parameter\s+([^>]+)\/?\s*>/g;
      let pm;
      while ((pm = paramRe.exec(match[2])) !== null) {
        const attrs = this._parseAttributes(pm[1]);
        parameters.push({ name: attrs.Name, type: attrs.Type });
      }

      const retMatch = /<ReturnType\s+([^>]+)\/?\s*>/.exec(match[2]);
      const returnType = retMatch ? this._parseAttributes(retMatch[1]).Type : null;

      model.actions.push({ name: match[1], parameters, returnType });
    }
  }

  /**
   * Parse XML attributes string into key-value object.
   */
  _parseAttributes(attrStr) {
    const attrs = {};
    const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(attrStr)) !== null) {
      attrs[m[1]] = m[2];
    }
    return attrs;
  }
}

module.exports = MetadataParser;
