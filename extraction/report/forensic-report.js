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
 * Forensic Report Generator
 *
 * Generates the complete system blueprint in multiple formats:
 * JSON (machine-readable), Markdown (human-readable), executive summary.
 */

class ForensicReport {
  /**
   * @param {Map|object} extractionResults
   * @param {import('../process/process-catalog')} processModel
   * @param {Array} configInterpretation
   * @param {object} gapAnalysis
   */
  constructor(extractionResults, processModel, configInterpretation, gapAnalysis) {
    this.results = extractionResults instanceof Map
      ? Object.fromEntries(extractionResults)
      : (extractionResults || {});
    this.processModel = processModel;
    this.configInterpretation = configInterpretation || [];
    this.gapAnalysis = gapAnalysis || {};
  }

  toJSON() {
    return {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      systemOverview: this._renderSystemOverview(),
      moduleInventory: this._renderModuleInventory(),
      processCatalog: this.processModel?.toJSON() || {},
      configurationBlueprint: this.configInterpretation,
      customCodeInventory: this._renderCustomCodeInventory(),
      securityModel: this._renderSecurityModel(),
      interfaceLandscape: this._renderInterfaceLandscape(),
      transportHistory: this._renderTransportHistory(),
      dataVolumeProfile: this._renderDataVolumeProfile(),
      gapAnalysis: this.gapAnalysis,
      confidenceAssessment: this.gapAnalysis.confidence || {},
    };
  }

  toMarkdown() {
    const sections = [
      '# SAP Forensic Extraction Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      this._mdSystemOverview(),
      this._mdModuleInventory(),
      this._mdProcessCatalog(),
      this._mdConfigBlueprint(),
      this._mdCustomCode(),
      this._mdSecurity(),
      this._mdInterfaces(),
      this._mdGapAnalysis(),
      this._mdConfidence(),
      this._mdValidationChecklist(),
    ];
    return sections.join('\n');
  }

  toExecutiveSummary() {
    const sys = this.results.SYSTEM_INFO || {};
    const coverage = this.gapAnalysis.confidence || {};

    return [
      '# Executive Summary — SAP System Extraction',
      '',
      `**System**: ${sys.sid || 'Unknown'} (${sys.release || 'Unknown'})`,
      `**Database**: ${sys.database || 'Unknown'}`,
      `**Extraction Date**: ${new Date().toISOString().split('T')[0]}`,
      `**Confidence Score**: ${coverage.overall || 'N/A'}% (${coverage.grade || 'N/A'})`,
      '',
      '## Key Findings',
      '',
      ...this._getKeyFindings(),
      '',
      '## Recommended Actions',
      '',
      ...(this.gapAnalysis.humanValidation || []).map((v, i) => `${i + 1}. ${v}`),
    ].join('\n');
  }

  toModuleReport(module) {
    const moduleData = {};
    for (const [key, value] of Object.entries(this.results)) {
      if (key.startsWith(module + '_') || key === module) {
        moduleData[key] = value;
      }
    }
    return {
      module,
      extractors: Object.keys(moduleData),
      data: moduleData,
      interpretation: this.configInterpretation.filter(i =>
        i.ruleId?.startsWith(module) || i.description?.includes(module)),
    };
  }

  toProcessMap() {
    return this.processModel?.toJSON() || { processes: [] };
  }

  toDependencyGraph() {
    const customCode = this.results.CUSTOM_CODE || {};
    return {
      nodes: Object.keys(customCode.customObjects || {}).map(name => ({ id: name, type: 'custom' })),
      edges: (customCode.tableUsage || []).map(u => ({ from: u.PROG, to: u.TABNAME, type: 'table_usage' })),
    };
  }

  toGapReport() {
    return this.gapAnalysis;
  }

  // ── Render helpers ──

  _renderSystemOverview() {
    const sys = this.results.SYSTEM_INFO || {};
    return {
      sid: sys.sid,
      release: sys.release,
      database: sys.database,
      os: sys.os,
      clients: sys.clients || [],
      components: sys.components || [],
    };
  }

  _renderModuleInventory() {
    const modules = {};
    for (const [key, value] of Object.entries(this.results)) {
      if (value && !value.error) {
        const mod = key.split('_')[0];
        if (!modules[mod]) modules[mod] = { extractors: [], tables: 0 };
        modules[mod].extractors.push(key);
      }
    }
    return modules;
  }

  _renderCustomCodeInventory() {
    return this.results.CUSTOM_CODE || { stats: { totalCustom: 0 } };
  }

  _renderSecurityModel() {
    return this.results.SECURITY || {};
  }

  _renderInterfaceLandscape() {
    return this.results.INTERFACES || {};
  }

  _renderTransportHistory() {
    return this.results.TRANSPORTS || {};
  }

  _renderDataVolumeProfile() {
    const dd = this.results.DATA_DICTIONARY || {};
    return { tableCount: Object.keys(dd.tables || {}).length, stats: dd.stats || {} };
  }

  // ── Markdown sections ──

  _mdSystemOverview() {
    const sys = this.results.SYSTEM_INFO || {};
    return [
      '## System Overview',
      `| Property | Value |`,
      `|----------|-------|`,
      `| SID | ${sys.sid || 'N/A'} |`,
      `| Release | ${sys.release || 'N/A'} |`,
      `| Database | ${sys.database || 'N/A'} |`,
      `| OS | ${sys.os || 'N/A'} |`,
      `| Clients | ${(sys.clients || []).length} |`,
      `| Components | ${(sys.components || []).length} |`,
      '',
    ].join('\n');
  }

  _mdModuleInventory() {
    const inv = this._renderModuleInventory();
    const lines = ['## Module Inventory', ''];
    for (const [mod, data] of Object.entries(inv)) {
      lines.push(`- **${mod}**: ${data.extractors.length} extractor(s)`);
    }
    lines.push('');
    return lines.join('\n');
  }

  _mdProcessCatalog() {
    if (!this.processModel) return '## Process Catalog\nNo process data available.\n';
    return this.processModel.toMarkdown();
  }

  _mdConfigBlueprint() {
    const lines = ['## Configuration Blueprint', ''];
    for (const interp of this.configInterpretation) {
      lines.push(`### ${interp.description}`);
      lines.push(interp.interpretation);
      if (interp.s4hanaRelevance) lines.push(`> S/4HANA: ${interp.s4hanaRelevance}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  _mdCustomCode() {
    const cc = this.results.CUSTOM_CODE || {};
    return [
      '## Custom Code Inventory',
      `- Total custom objects: ${cc.stats?.totalCustom || 0}`,
      `- Programs: ${cc.stats?.byType?.PROG || 0}`,
      `- Classes: ${cc.stats?.byType?.CLAS || 0}`,
      `- Function modules: ${cc.stats?.byType?.FUNC || 0}`,
      '',
    ].join('\n');
  }

  _mdSecurity() {
    const sec = this.results.SECURITY || {};
    return [
      '## Security Model',
      `- Total users: ${(sec.users || []).length}`,
      `- Total roles: ${(sec.roleDefinitions || []).length}`,
      `- Users with SAP_ALL: ${(sec.usersWithSapAll || []).length}`,
      '',
    ].join('\n');
  }

  _mdInterfaces() {
    const intf = this.results.INTERFACES || {};
    return [
      '## Interface Landscape',
      `- RFC destinations: ${(intf.rfcDestinations || []).length}`,
      `- IDoc message types: ${(intf.messageTypes || []).length}`,
      `- Logical systems: ${(intf.logicalSystems || []).length}`,
      '',
    ].join('\n');
  }

  _mdGapAnalysis() {
    const lines = ['## Gap Analysis', ''];
    if (this.gapAnalysis.extraction) {
      lines.push(`- Tables in system: ${this.gapAnalysis.extraction.totalTablesInSystem || 'N/A'}`);
      lines.push(`- Tables extracted: ${this.gapAnalysis.extraction.totalTablesExtracted || 'N/A'}`);
      lines.push(`- Coverage: ${this.gapAnalysis.extraction.coveragePct || 0}%`);
    }
    if (this.gapAnalysis.authorization?.count > 0) {
      lines.push(`- Authorization gaps: ${this.gapAnalysis.authorization.count}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  _mdConfidence() {
    const conf = this.gapAnalysis.confidence || {};
    return [
      '## Confidence Assessment',
      `- Overall: ${conf.overall || 'N/A'}% (Grade: ${conf.grade || 'N/A'})`,
      `- ${conf.summary || ''}`,
      '',
    ].join('\n');
  }

  _mdValidationChecklist() {
    const items = this.gapAnalysis.humanValidation || [];
    if (items.length === 0) return '';
    const lines = ['## Human Validation Checklist', ''];
    for (const item of items) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  _getKeyFindings() {
    const findings = [];
    const sys = this.results.SYSTEM_INFO || {};
    if (sys.sid) findings.push(`- System ${sys.sid} running release ${sys.release} on ${sys.database}`);

    const cc = this.results.CUSTOM_CODE || {};
    if (cc.stats?.totalCustom) findings.push(`- ${cc.stats.totalCustom} custom objects requiring analysis`);

    const sec = this.results.SECURITY || {};
    if (sec.usersWithSapAll?.length > 0) {
      findings.push(`- **Risk**: ${sec.usersWithSapAll.length} user(s) with SAP_ALL profile`);
    }

    const proc = this.processModel?.getSummary();
    if (proc?.totalProcesses > 0) {
      findings.push(`- ${proc.totalProcesses} business process(es) identified`);
    }

    return findings.length > 0 ? findings : ['- No significant findings'];
  }
}

module.exports = ForensicReport;
