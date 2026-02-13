/**
 * Interface Scanner
 *
 * Discovers all system interfaces: RFC destinations, IDoc flows,
 * web services, HTTP destinations, and batch jobs.
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');

class InterfaceScanner {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.log = new Logger('interface-scanner', { level: this.verbose ? 'debug' : 'info' });
  }

  async scan() {
    this.log.debug('Starting interface scan...');

    if (this.gateway.mode === 'live') {
      try {
        return await this._scanLive();
      } catch (err) {
        this.log.warn('Live interface scan failed, falling back to mock', { error: err.message });
      }
    }

    return this._scanMock();
  }

  _scanMock() {
    this.log.debug('Loading mock interface data');
    const mockPath = path.join(__dirname, 'mock-interfaces.json');
    const data = JSON.parse(fs.readFileSync(mockPath, 'utf8'));

    return {
      rfcDestinations: data.rfcDestinations,
      idocTypes: data.idocTypes,
      webServices: data.webServices,
      batchJobs: data.batchJobs,
      summary: data.summary,
    };
  }

  async _scanLive() {
    const client = await this.gateway._getLiveClient();

    const [rfcDestinations, idocTypes, webServices, batchJobs] = await Promise.all([
      this._scanRfcDestinations(client),
      this._scanIdocTypes(client),
      this._scanWebServices(client),
      this._scanBatchJobs(client),
    ]);

    const activeRfc = rfcDestinations.filter((r) => r.status === 'active');
    const dailyVolume = idocTypes.reduce((sum, i) => sum + (i.volume || 0), 0);

    const summary = {
      totalRfcDestinations: rfcDestinations.length,
      activeRfcDestinations: activeRfc.length,
      totalIdocFlows: idocTypes.length,
      totalWebServices: webServices.length,
      totalBatchJobs: batchJobs.length,
      estimatedDailyIdocVolume: dailyVolume,
      interfaceComplexity: this._classifyComplexity(rfcDestinations.length, idocTypes.length, webServices.length),
    };

    return { rfcDestinations, idocTypes, webServices, batchJobs, summary };
  }

  async _scanRfcDestinations(client) {
    try {
      const data = await client.getAll('/sap/opu/odata/sap/RFCDES_SRV/RFCDestinations');
      return data.map((r) => ({
        destination: r.Destination || r.RFCDEST,
        type: r.RfcType || r.RFCTYPE,
        description: r.Description || r.RFCOPTIONS,
        host: r.Host || r.RFCHOST,
        status: 'active',
      }));
    } catch {
      return [];
    }
  }

  async _scanIdocTypes(client) {
    try {
      const data = await client.getAll('/sap/opu/odata/sap/IDOC_SRV/IdocTypes');
      return data.map((i) => ({
        messageType: i.MessageType || i.MESTYP,
        idocType: i.IdocType || i.IDOCTP,
        direction: i.Direction === '1' ? 'outbound' : 'inbound',
        partner: i.Partner || i.RCVPRN,
        description: i.Description || '',
        volume: parseInt(i.Volume, 10) || 0,
      }));
    } catch {
      return [];
    }
  }

  async _scanWebServices(client) {
    try {
      const data = await client.getAll('/sap/opu/odata/sap/WS_SRV/WebServices');
      return data.map((w) => ({
        name: w.ServiceName || w.NAME,
        type: w.ServiceType || 'SOAP',
        direction: w.Direction || 'provider',
        binding: w.Binding || '',
        status: 'active',
      }));
    } catch {
      return [];
    }
  }

  async _scanBatchJobs(client) {
    try {
      const data = await client.getAll('/sap/opu/odata/sap/BATCHJOB_SRV/BatchJobs');
      return data.map((j) => ({
        jobName: j.JobName || j.JOBNAME,
        frequency: j.Frequency || 'unknown',
        program: j.Program || j.PROGNAME,
        status: j.Status === 'S' ? 'active' : 'inactive',
        avgRuntime: parseInt(j.AvgRuntime, 10) || 0,
      }));
    } catch {
      return [];
    }
  }

  _classifyComplexity(rfcCount, idocCount, wsCount) {
    const total = rfcCount + idocCount + wsCount;
    if (total > 50) return 'Very High';
    if (total > 30) return 'High';
    if (total > 15) return 'Medium';
    return 'Low';
  }
}

module.exports = InterfaceScanner;
