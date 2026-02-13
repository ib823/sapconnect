/**
 * Process Catalog
 *
 * The output model for process mining results. Contains all
 * discovered processes with their variants, steps, and evidence.
 */

class ProcessCatalog {
  constructor() {
    this.processes = [];
  }

  addProcess(process) {
    this.processes.push(process);
  }

  getProcess(processId) {
    return this.processes.find(p => p.processId === processId) || null;
  }

  toJSON() {
    return {
      generatedAt: new Date().toISOString(),
      totalProcesses: this.processes.length,
      totalVariants: this.processes.reduce((s, p) => s + (p.variants?.length || 0), 0),
      processes: this.processes,
    };
  }

  toMarkdown() {
    const lines = [
      '# Process Catalog',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Total Processes: ${this.processes.length}`,
      '',
    ];

    for (const proc of this.processes) {
      lines.push(`## ${proc.name}`);
      lines.push(`- Category: ${proc.category}`);
      lines.push(`- Variants: ${proc.variants?.length || 0}`);
      lines.push(`- Total Volume: ${proc.variants?.reduce((s, v) => s + (v.volume || 0), 0) || 0}`);
      lines.push('');

      if (proc.variants) {
        for (const variant of proc.variants) {
          lines.push(`### Variant: ${variant.description}`);
          lines.push(`- Volume: ${variant.volume}`);
          lines.push(`- Steps: ${variant.steps?.map(s => s.activity).join(' → ')}`);
          lines.push(`- Users: ${variant.users?.join(', ') || 'N/A'}`);
          lines.push('');
        }
      }

      if (proc.gaps && proc.gaps.length > 0) {
        lines.push('### Gaps');
        for (const gap of proc.gaps) {
          lines.push(`- ${gap}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  getSummary() {
    return {
      totalProcesses: this.processes.length,
      byCategory: this.processes.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}),
      topByVolume: [...this.processes]
        .sort((a, b) => {
          const volA = a.variants?.reduce((s, v) => s + (v.volume || 0), 0) || 0;
          const volB = b.variants?.reduce((s, v) => s + (v.volume || 0), 0) || 0;
          return volB - volA;
        })
        .slice(0, 5)
        .map(p => ({ name: p.name, volume: p.variants?.reduce((s, v) => s + (v.volume || 0), 0) || 0 })),
    };
  }
}

module.exports = ProcessCatalog;
