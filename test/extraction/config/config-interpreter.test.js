const ConfigInterpreter = require('../../../extraction/config/config-interpreter');

describe('ConfigInterpreter', () => {
  const mockResults = {
    FI_CONFIG: {
      companyCodes: [{ BUKRS: '1000', BUTXT: 'Company A' }],
      documentTypes: [
        { BLART: 'SA', BLTEXT: 'GL Account Document' },
        { BLART: 'ZA', BLTEXT: 'Custom GL Document' },
      ],
      paymentConfig: [{ BUKRS: '1000' }],
      assetClasses: [{ ANLKL: '1000' }],
      depreciationAreas: [{ AFESSION: '01' }],
    },
    CO_CONFIG: {
      controllingAreas: [{ KOKRS: '1000' }],
      costElements: [
        { KSTAR: '400000', KATYP: '1' },
        { KSTAR: '600000', KATYP: '41' },
      ],
      costCenters: [{ KOSTL: 'CC001' }, { KOSTL: 'CC002' }],
    },
    MM_CONFIG: {
      movementTypes: [
        { BWART: '101' },
        { BWART: '901' },
      ],
      plants: [{ WERKS: '1000' }],
    },
    SD_CONFIG: {
      salesOrgs: [{ VKORG: '1000' }],
      conditionTypes: [
        { KSCHL: 'PR00' },
        { KSCHL: 'ZPR1' },
      ],
    },
    PP_CONFIG: {
      orderTypes: [{ AUART: 'PP01' }, { AUART: 'PP02' }],
    },
  };

  it('should interpret configuration and return interpretations', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    const interpretations = await interpreter.interpret();
    expect(interpretations.length).toBeGreaterThan(0);
  });

  it('should detect custom FI document types', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const docType = interps.find(i => i.ruleId === 'FI-DOCTYPE');
    expect(docType).toBeDefined();
    expect(docType.interpretation).toContain('ZA');
  });

  it('should detect payment configuration', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const payment = interps.find(i => i.ruleId === 'FI-PAYMENT');
    expect(payment).toBeDefined();
    expect(payment.interpretation).toContain('1');
  });

  it('should detect asset accounting configuration', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const aa = interps.find(i => i.ruleId === 'FI-AA');
    expect(aa).toBeDefined();
    expect(aa.s4hanaRelevance).toContain('asset');
  });

  it('should detect CO cost element structure', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const coElems = interps.find(i => i.ruleId === 'CO-ELEMENTS');
    expect(coElems).toBeDefined();
    expect(coElems.s4hanaRelevance).toContain('S/4HANA');
  });

  it('should detect custom SD condition types', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const cond = interps.find(i => i.ruleId === 'SD-COND');
    expect(cond).toBeDefined();
    expect(cond.interpretation).toContain('custom');
  });

  it('should detect PP order types', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const ppOrd = interps.find(i => i.ruleId === 'PP-ORDTYPE');
    expect(ppOrd).toBeDefined();
  });

  it('should detect integration points', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const interps = interpreter.getInterpretations();
    const intPts = interps.find(i => i.ruleId === 'INT-POINTS');
    expect(intPts).toBeDefined();
    expect(intPts.interpretation).toContain('integration');
  });

  it('should export to JSON with metadata', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const json = interpreter.toJSON();
    expect(json.generatedAt).toBeDefined();
    expect(json.totalInterpretations).toBeGreaterThan(0);
    expect(json.interpretations.length).toBe(json.totalInterpretations);
  });

  it('should export to Markdown', async () => {
    const interpreter = new ConfigInterpreter(mockResults);
    await interpreter.interpret();
    const md = interpreter.toMarkdown();
    expect(md).toContain('# Configuration Interpretation Report');
    expect(md).toContain('S/4HANA');
  });

  it('should handle empty results gracefully', async () => {
    const interpreter = new ConfigInterpreter({});
    const interpretations = await interpreter.interpret();
    expect(Array.isArray(interpretations)).toBe(true);
  });
});
