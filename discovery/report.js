/**
 * Report - Formats discovery results as terminal output or markdown
 */
class Report {
  constructor(results) {
    this.results = results;
  }

  toTerminal() {
    const r = this.results;
    const lines = [];

    lines.push('');
    lines.push(
      `${'='.repeat(60)}`
    );
    lines.push('  SAP API Discovery Report');
    lines.push(
      `${'='.repeat(60)}`
    );
    lines.push('');

    // System info
    lines.push(`  Mode:    ${r.mode.toUpperCase()}`);
    lines.push(`  System:  ${r.system.type} ${r.system.version}`);
    lines.push(`  Tenant:  ${r.system.tenant}`);
    lines.push(`  Scanned: ${r.system.scannedAt}`);
    lines.push('');

    // Summary
    lines.push(`${'-'.repeat(60)}`);
    lines.push('  SUMMARY');
    lines.push(`${'-'.repeat(60)}`);
    lines.push(`  Communication Scenarios:  ${r.summary.totalScenarios}`);
    lines.push(`  Released APIs:            ${r.summary.totalAPIs}`);
    lines.push(`  Business Events:          ${r.summary.totalEvents}`);
    lines.push(`  Extension Points:         ${r.summary.totalExtensionPoints}`);
    lines.push(`  Categories:               ${r.summary.categories.join(', ')}`);
    lines.push('');

    // Communication Scenarios
    lines.push(`${'-'.repeat(60)}`);
    lines.push('  COMMUNICATION SCENARIOS');
    lines.push(`${'-'.repeat(60)}`);
    for (const s of r.communicationScenarios) {
      lines.push(`  ${s.id} - ${s.name}`);
      lines.push(`    ${s.description}`);
      lines.push(`    APIs: ${s.apis.join(', ')} | Direction: ${s.direction}`);
      lines.push('');
    }

    // Released APIs
    lines.push(`${'-'.repeat(60)}`);
    lines.push('  RELEASED APIs');
    lines.push(`${'-'.repeat(60)}`);
    for (const api of r.releasedAPIs) {
      lines.push(`  ${api.name}`);
      lines.push(`    ${api.title} (${api.protocol})`);
      lines.push(`    Status: ${api.releaseStatus} | Category: ${api.category}`);
      lines.push(`    Entities: ${api.entities.join(', ') || 'N/A'}`);
      lines.push(`    Operations: ${api.operations.join(', ')}`);
      lines.push('');
    }

    // Events
    lines.push(`${'-'.repeat(60)}`);
    lines.push('  BUSINESS EVENTS');
    lines.push(`${'-'.repeat(60)}`);
    for (const e of r.events) {
      lines.push(`  ${e.topic}`);
      lines.push(`    ${e.description}`);
      lines.push('');
    }

    // Extension Points
    lines.push(`${'-'.repeat(60)}`);
    lines.push('  EXTENSION POINTS');
    lines.push(`${'-'.repeat(60)}`);
    for (const ext of r.extensionPoints) {
      lines.push(`  ${ext.type} (${ext.method})`);
      lines.push(`    ${ext.description}`);
      lines.push(`    Objects: ${ext.objects.join(', ')}`);
      lines.push('');
    }

    lines.push('='.repeat(60));
    return lines.join('\n');
  }

  toMarkdown() {
    const r = this.results;
    const lines = [];

    lines.push('# SAP API Discovery Report');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Mode | ${r.mode} |`);
    lines.push(`| System | ${r.system.type} ${r.system.version} |`);
    lines.push(`| Tenant | ${r.system.tenant} |`);
    lines.push(`| Scanned | ${r.system.scannedAt} |`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    lines.push(`- **${r.summary.totalScenarios}** Communication Scenarios`);
    lines.push(`- **${r.summary.totalAPIs}** Released APIs`);
    lines.push(`- **${r.summary.totalEvents}** Business Events`);
    lines.push(`- **${r.summary.totalExtensionPoints}** Extension Points`);
    lines.push('');

    lines.push('## Communication Scenarios');
    lines.push('');
    lines.push('| ID | Name | Category | Direction |');
    lines.push('|----|------|----------|-----------|');
    for (const s of r.communicationScenarios) {
      lines.push(`| ${s.id} | ${s.name} | ${s.category} | ${s.direction} |`);
    }
    lines.push('');

    lines.push('## Released APIs');
    lines.push('');
    lines.push('| API | Title | Protocol | Category | Entities |');
    lines.push('|-----|-------|----------|----------|----------|');
    for (const api of r.releasedAPIs) {
      lines.push(
        `| ${api.name} | ${api.title} | ${api.protocol} | ${api.category} | ${api.entities.length} |`
      );
    }
    lines.push('');

    lines.push('## Business Events');
    lines.push('');
    for (const e of r.events) {
      lines.push(`- \`${e.topic}\` - ${e.description}`);
    }
    lines.push('');

    lines.push('## Extension Points');
    lines.push('');
    for (const ext of r.extensionPoints) {
      lines.push(`### ${ext.type}`);
      lines.push(`- **Method:** ${ext.method}`);
      lines.push(`- ${ext.description}`);
      lines.push(`- Objects: ${ext.objects.join(', ')}`);
      lines.push('');
    }

    return lines.join('\n');
  }
}

module.exports = Report;
