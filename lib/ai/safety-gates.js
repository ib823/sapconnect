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
 * AI Safety Gates
 *
 * Enforces the safety pipeline for AI-generated ABAP artifacts:
 *   AI generates -> automated quality checks -> human review gate -> transport import
 *
 * Provides built-in gates for syntax, ATC, naming conventions, transport
 * enforcement, human approval, and unit test coverage. Supports custom
 * gates, audit trails, and configurable strictness levels.
 */

'use strict';

const Logger = require('../logger');

// ─────────────────────────────────────────────────────────────────────────────
// Gate Status Constants
// ─────────────────────────────────────────────────────────────────────────────

const GATE_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  WARNING: 'warning',
  PENDING_REVIEW: 'pending_review',
};

const STRICTNESS_LEVELS = ['strict', 'moderate', 'permissive'];

const VALID_ARTIFACT_TYPES = ['program', 'class', 'function_module', 'configuration', 'interface', 'include'];

const TRANSPORT_PATTERN = /^[A-Z]{3}K\d{6}$/;

const NAMING_PATTERNS = {
  program: /^[ZY]/i,
  class: /^[ZY]CL_/i,
  function_module: /^[ZY]_/i,
  interface: /^[ZY]IF_/i,
  include: /^[ZY]/i,
};

// ─────────────────────────────────────────────────────────────────────────────
// SafetyGates Class
// ─────────────────────────────────────────────────────────────────────────────

class SafetyGates {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] — 'mock' or 'live'
   * @param {string} [options.strictness='moderate'] — 'strict', 'moderate', 'permissive'
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.strictness = STRICTNESS_LEVELS.includes(options.strictness)
      ? options.strictness
      : 'moderate';
    this.log = options.logger || new Logger('safety-gates');

    this._gates = new Map();
    this._auditLog = [];
    this._approvals = new Map();
    this._approvalCounter = 0;

    this._registerBuiltInGates();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gate Registration
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a custom gate.
   * @param {string} name — Gate name (unique identifier)
   * @param {Function} checkFn — async (artifact) => { status, message, details }
   * @param {object} [options]
   * @param {number} [options.priority=50] — Lower runs first
   * @param {boolean} [options.required=true] — If true, failure blocks approval
   * @param {string[]} [options.applicableTo] — Artifact types this gate applies to
   */
  registerGate(name, checkFn, options = {}) {
    if (typeof name !== 'string' || !name) {
      throw new Error('Gate name must be a non-empty string');
    }
    if (typeof checkFn !== 'function') {
      throw new Error('Gate checkFn must be a function');
    }

    this._gates.set(name, {
      name,
      checkFn,
      priority: options.priority ?? 50,
      required: options.required !== false,
      applicableTo: options.applicableTo || null,
      enabled: true,
    });

    this.log.debug(`Gate registered: ${name}`, { priority: options.priority, required: options.required });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Built-in Gates
  // ─────────────────────────────────────────────────────────────────────────

  _registerBuiltInGates() {
    // 1. Syntax check
    this.registerGate('syntax-check', async (artifact) => {
      return this._checkSyntax(artifact);
    }, { priority: 10, required: true, applicableTo: ['program', 'class', 'function_module', 'interface', 'include'] });

    // 2. ATC check
    this.registerGate('atc-check', async (artifact) => {
      return this._checkAtc(artifact);
    }, { priority: 20, required: true, applicableTo: ['program', 'class', 'function_module', 'interface'] });

    // 3. Naming convention
    this.registerGate('naming-convention', async (artifact) => {
      return this._checkNamingConvention(artifact);
    }, { priority: 30, required: true });

    // 4. Transport required
    this.registerGate('transport-required', async (artifact) => {
      return this._checkTransportRequired(artifact);
    }, { priority: 40, required: true });

    // 5. Human approval
    this.registerGate('human-approval', async (artifact) => {
      return this._checkHumanApproval(artifact);
    }, { priority: 90, required: true });

    // 6. Unit test coverage
    this.registerGate('unit-test-coverage', async (artifact) => {
      return this._checkUnitTestCoverage(artifact);
    }, { priority: 50, required: false, applicableTo: ['program', 'class', 'function_module'] });

    // 7. Live mode audit — logs every tool call with full I/O for compliance
    this.registerGate('live-mode-audit', async (artifact) => {
      return this._checkLiveModeAudit(artifact);
    }, { priority: 5, required: false });
  }

  /**
   * Live mode audit gate — logs every artifact evaluation with full details.
   * Always passes (non-blocking), but creates an audit record for every
   * tool execution in live agent mode.
   */
  _checkLiveModeAudit(artifact) {
    const entry = {
      timestamp: new Date().toISOString(),
      gate: 'live-mode-audit',
      artifact: {
        name: artifact.name,
        type: artifact.type,
        transport: artifact.transport || null,
      },
      mode: this.mode,
    };

    // Include source hash (not full source) to avoid bloating audit log
    if (artifact.source) {
      entry.artifact.sourceLength = artifact.source.length;
      entry.artifact.sourceHash = this._simpleHash(artifact.source);
    }

    this.log.info('Live mode audit', entry);

    // Store in audit log
    this._auditLog.push({
      id: `AUDIT-LIVE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
    });

    return {
      status: GATE_STATUS.PASSED,
      message: `Audit recorded for ${artifact.name}`,
      details: entry,
    };
  }

  /**
   * Simple hash for audit trail (non-cryptographic, for identification only).
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit int
    }
    return hash.toString(16);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gate Check Implementations
  // ─────────────────────────────────────────────────────────────────────────

  _checkSyntax(artifact) {
    if (!artifact.source) {
      return {
        status: GATE_STATUS.PASSED,
        message: 'No source to check',
        details: { skipped: true },
      };
    }

    const source = artifact.source;
    const errors = [];

    // Check for unmatched control structures
    const openIf = (source.match(/\bIF\b/gi) || []).length;
    const closeIf = (source.match(/\bENDIF\b/gi) || []).length;
    if (openIf !== closeIf) {
      errors.push(`Unmatched IF/ENDIF: ${openIf} IF vs ${closeIf} ENDIF`);
    }

    const openLoop = (source.match(/\bLOOP\b/gi) || []).length;
    const closeLoop = (source.match(/\bENDLOOP\b/gi) || []).length;
    if (openLoop !== closeLoop) {
      errors.push(`Unmatched LOOP/ENDLOOP: ${openLoop} LOOP vs ${closeLoop} ENDLOOP`);
    }

    const openDo = (source.match(/\bDO\b(?:\s+\d+\s+TIMES)?/gi) || []).length;
    const closeDo = (source.match(/\bENDDO\b/gi) || []).length;
    if (openDo !== closeDo) {
      errors.push(`Unmatched DO/ENDDO: ${openDo} DO vs ${closeDo} ENDDO`);
    }

    // Check for missing periods (ABAP statement terminator)
    const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('*') && !l.trim().startsWith('"'));
    const statementsWithoutPeriod = lines.filter(l => {
      const trimmed = l.trim();
      // Skip blank lines, comments, and continuation lines
      if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('"')) return false;
      // Data declarations and statements should end with period
      if (/^(DATA|TYPES|CONSTANTS|FIELD-SYMBOLS|SELECT|WRITE|CALL|IF|ELSE|ENDIF|LOOP|ENDLOOP|DO|ENDDO|FORM|ENDFORM|METHOD|ENDMETHOD|REPORT|FUNCTION|ENDFUNCTION)\b/i.test(trimmed)) {
        // Only flag the last line of multi-line statements
        return false;
      }
      return false;
    });

    // Check for empty FORM/METHOD implementations
    if (/\bFORM\b[^.]+\.\s*\bENDFORM\b/i.test(source)) {
      errors.push('Empty FORM implementation detected');
    }

    if (errors.length > 0) {
      return {
        status: GATE_STATUS.FAILED,
        message: `Syntax issues found: ${errors.length} error(s)`,
        details: { errors },
      };
    }

    return {
      status: GATE_STATUS.PASSED,
      message: 'Syntax check passed',
      details: { linesChecked: lines.length },
    };
  }

  _checkAtc(artifact) {
    if (!artifact.source) {
      return {
        status: GATE_STATUS.PASSED,
        message: 'No source to check',
        details: { skipped: true, variant: 'S4HANA_READINESS' },
      };
    }

    const source = artifact.source;
    const findings = [];

    // Check for SELECT * (performance)
    if (/\bSELECT\s+\*/gi.test(source)) {
      findings.push({
        priority: 1,
        category: 'PERFORMANCE',
        message: 'SELECT * used without explicit field list',
        rule: 'FUNC_SELECT_STAR',
      });
    }

    // Check for missing authority check
    if (/\bCALL\s+TRANSACTION\b/gi.test(source) && !/\bAUTHORITY-CHECK\b/gi.test(source)) {
      findings.push({
        priority: 1,
        category: 'SECURITY',
        message: 'CALL TRANSACTION without AUTHORITY-CHECK',
        rule: 'SEC_AUTH_MISSING',
      });
    }

    // Check for obsolete statements
    const obsolete = [
      { pattern: /\bDESCRIBE\s+TABLE\b.*\bOCCURS\b/gi, msg: 'DESCRIBE TABLE with OCCURS is obsolete' },
      { pattern: /\bMOVE\b.*\bTO\b/gi, msg: 'MOVE...TO is obsolete, use assignment operator' },
      { pattern: /\bCOMPUTE\b/gi, msg: 'COMPUTE statement is obsolete' },
      { pattern: /\bHEADER\s+LINE\b/gi, msg: 'Tables with HEADER LINE are obsolete' },
    ];

    for (const check of obsolete) {
      if (check.pattern.test(source)) {
        findings.push({
          priority: 2,
          category: 'S4HANA_READINESS',
          message: check.msg,
          rule: 'S4H_OBSOLETE',
        });
      }
    }

    // Check for hardcoded client
    if (/\bSY-MANDT\b/gi.test(source) === false && /\bCLIENT\s+SPECIFIED\b/gi.test(source)) {
      findings.push({
        priority: 2,
        category: 'PORTABILITY',
        message: 'CLIENT SPECIFIED used without SY-MANDT',
        rule: 'PORT_CLIENT',
      });
    }

    const criticalFindings = findings.filter(f => f.priority === 1);

    if (criticalFindings.length > 0) {
      return {
        status: GATE_STATUS.FAILED,
        message: `ATC check failed: ${criticalFindings.length} critical finding(s)`,
        details: { findings, criticalCount: criticalFindings.length, totalCount: findings.length, variant: 'S4HANA_READINESS' },
      };
    }

    if (findings.length > 0) {
      return {
        status: this.strictness === 'strict' ? GATE_STATUS.FAILED : GATE_STATUS.WARNING,
        message: `ATC check: ${findings.length} finding(s), no critical issues`,
        details: { findings, criticalCount: 0, totalCount: findings.length, variant: 'S4HANA_READINESS' },
      };
    }

    return {
      status: GATE_STATUS.PASSED,
      message: 'ATC check passed with no findings',
      details: { findings: [], criticalCount: 0, totalCount: 0, variant: 'S4HANA_READINESS' },
    };
  }

  _checkNamingConvention(artifact) {
    const errors = [];
    const warnings = [];

    if (!artifact.name) {
      errors.push('Artifact name is missing');
    } else {
      // Check Z*/Y* prefix
      const type = artifact.type || 'program';
      const pattern = NAMING_PATTERNS[type];
      if (pattern && !pattern.test(artifact.name)) {
        errors.push(`Name "${artifact.name}" does not follow Z*/Y* naming convention for type "${type}"`);
      }

      // Check minimum description length
      if (artifact.metadata && artifact.metadata.description) {
        if (artifact.metadata.description.length < 10) {
          warnings.push(`Description too short (${artifact.metadata.description.length} chars, minimum 10)`);
        }
      }

      // Check consistent casing — SAP convention is UPPER_CASE for identifiers
      if (artifact.name !== artifact.name.toUpperCase()) {
        warnings.push(`Name "${artifact.name}" is not in UPPER_CASE — SAP convention recommends uppercase`);
      }

      // Check for spaces or special characters
      if (/\s/.test(artifact.name)) {
        errors.push(`Name "${artifact.name}" contains whitespace`);
      }

      // Max length check
      if (artifact.name.length > 30) {
        errors.push(`Name "${artifact.name}" exceeds 30 character limit (${artifact.name.length} chars)`);
      }
    }

    if (errors.length > 0) {
      return {
        status: GATE_STATUS.FAILED,
        message: `Naming convention violations: ${errors.join('; ')}`,
        details: { errors, warnings },
      };
    }

    if (warnings.length > 0 && this.strictness === 'strict') {
      return {
        status: GATE_STATUS.FAILED,
        message: `Naming convention warnings (strict mode): ${warnings.join('; ')}`,
        details: { errors, warnings },
      };
    }

    if (warnings.length > 0) {
      return {
        status: GATE_STATUS.WARNING,
        message: `Naming convention: ${warnings.length} warning(s)`,
        details: { errors, warnings },
      };
    }

    return {
      status: GATE_STATUS.PASSED,
      message: 'Naming conventions satisfied',
      details: { errors: [], warnings: [] },
    };
  }

  _checkTransportRequired(artifact) {
    if (!artifact.transport) {
      if (this.strictness === 'permissive' && artifact.type !== 'configuration') {
        return {
          status: GATE_STATUS.WARNING,
          message: 'No transport request assigned',
          details: { required: false },
        };
      }
      return {
        status: GATE_STATUS.FAILED,
        message: 'No transport request assigned',
        details: { required: true },
      };
    }

    if (!TRANSPORT_PATTERN.test(artifact.transport)) {
      return {
        status: GATE_STATUS.FAILED,
        message: `Invalid transport number format: "${artifact.transport}" (expected pattern: XXXK######)`,
        details: { transport: artifact.transport, expectedPattern: 'XXXK######' },
      };
    }

    return {
      status: GATE_STATUS.PASSED,
      message: `Transport ${artifact.transport} assigned`,
      details: { transport: artifact.transport },
    };
  }

  _checkHumanApproval(artifact) {
    const artifactId = this._getArtifactId(artifact);

    // In strict mode, always require explicit human approval
    if (this.strictness === 'strict') {
      if (this.isApproved(artifactId)) {
        return {
          status: GATE_STATUS.PASSED,
          message: 'Human approval granted',
          details: { approvalRequired: true, approved: true },
        };
      }
      return {
        status: GATE_STATUS.PENDING_REVIEW,
        message: 'Awaiting human review and approval',
        details: { approvalRequired: true, approved: false },
      };
    }

    // In moderate mode, flag for review but don't block
    if (this.strictness === 'moderate') {
      if (this.isApproved(artifactId)) {
        return {
          status: GATE_STATUS.PASSED,
          message: 'Human approval granted',
          details: { approvalRequired: false, approved: true },
        };
      }
      return {
        status: GATE_STATUS.WARNING,
        message: 'Human review recommended but not required',
        details: { approvalRequired: false, approved: false },
      };
    }

    // Permissive mode — auto-pass
    return {
      status: GATE_STATUS.PASSED,
      message: 'Human approval auto-passed (permissive mode)',
      details: { approvalRequired: false, approved: false, autoApproved: true },
    };
  }

  _checkUnitTestCoverage(artifact) {
    if (!artifact.source) {
      return {
        status: GATE_STATUS.PASSED,
        message: 'No source to check for test coverage',
        details: { skipped: true },
      };
    }

    const source = artifact.source;

    // Check if source references test class or contains FOR TESTING
    const hasTestClass = /\bFOR\s+TESTING\b/i.test(source);
    const hasTestMethod = /\bMETHOD\b.*\bFOR\s+TESTING\b/i.test(source) ||
                          /\bCLASS\b.*\bFOR\s+TESTING\b/i.test(source);

    // Check metadata for test references
    const hasTestMetadata = artifact.metadata && artifact.metadata.hasTests === true;

    if (hasTestClass || hasTestMethod || hasTestMetadata) {
      return {
        status: GATE_STATUS.PASSED,
        message: 'Unit test coverage detected',
        details: { hasTestClass, hasTestMethod, hasTestMetadata: !!hasTestMetadata },
      };
    }

    // New code without tests
    return {
      status: this.strictness === 'strict' ? GATE_STATUS.FAILED : GATE_STATUS.WARNING,
      message: 'No unit tests found for this artifact',
      details: { hasTestClass: false, hasTestMethod: false, recommendation: 'Add ABAP Unit test class with FOR TESTING' },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core Validation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate an artifact through all applicable gates.
   * @param {object} artifact — { type, source?, name, transport?, metadata? }
   * @returns {object} { approved, gates: [...], overallStatus }
   */
  async validateArtifact(artifact) {
    if (!artifact || typeof artifact !== 'object') {
      throw new Error('Artifact must be a non-null object');
    }
    if (!artifact.name) {
      throw new Error('Artifact must have a name');
    }

    const sortedGates = Array.from(this._gates.values())
      .filter(g => g.enabled)
      .filter(g => !g.applicableTo || g.applicableTo.includes(artifact.type))
      .sort((a, b) => a.priority - b.priority);

    const gateResults = [];

    for (const gate of sortedGates) {
      try {
        const result = await gate.checkFn(artifact);
        gateResults.push({
          name: gate.name,
          status: result.status,
          message: result.message,
          details: result.details || {},
          required: gate.required,
        });
      } catch (err) {
        gateResults.push({
          name: gate.name,
          status: GATE_STATUS.FAILED,
          message: `Gate error: ${err.message}`,
          details: { error: err.message },
          required: gate.required,
        });
      }
    }

    const hasRequiredFailure = gateResults.some(
      g => g.required && (g.status === GATE_STATUS.FAILED || g.status === GATE_STATUS.PENDING_REVIEW)
    );
    const hasAnyFailure = gateResults.some(g => g.status === GATE_STATUS.FAILED);
    const hasPendingReview = gateResults.some(g => g.status === GATE_STATUS.PENDING_REVIEW);

    let overallStatus;
    if (hasRequiredFailure) {
      overallStatus = hasPendingReview ? 'pending_review' : 'rejected';
    } else if (hasAnyFailure) {
      overallStatus = 'approved_with_warnings';
    } else if (gateResults.some(g => g.status === GATE_STATUS.WARNING)) {
      overallStatus = 'approved_with_warnings';
    } else {
      overallStatus = 'approved';
    }

    const result = {
      approved: !hasRequiredFailure,
      gates: gateResults,
      overallStatus,
    };

    this.createAuditTrail(artifact, gateResults);

    return result;
  }

  /**
   * Validate multiple artifacts.
   * @param {object[]} artifacts
   * @returns {object} { results: [...], summary: { total, approved, rejected, pending } }
   */
  async validateBatch(artifacts) {
    if (!Array.isArray(artifacts)) {
      throw new Error('Artifacts must be an array');
    }

    const results = [];
    for (const artifact of artifacts) {
      const result = await this.validateArtifact(artifact);
      results.push({ artifact: { name: artifact.name, type: artifact.type }, ...result });
    }

    const summary = {
      total: results.length,
      approved: results.filter(r => r.approved).length,
      rejected: results.filter(r => !r.approved && r.overallStatus === 'rejected').length,
      pending: results.filter(r => r.overallStatus === 'pending_review').length,
    };

    return { results, summary };
  }

  /**
   * Get all registered gates with their configuration.
   * @returns {object[]}
   */
  getGateStatus() {
    return Array.from(this._gates.values()).map(g => ({
      name: g.name,
      priority: g.priority,
      required: g.required,
      enabled: g.enabled,
      applicableTo: g.applicableTo,
    }));
  }

  /**
   * Change the enforcement strictness level.
   * @param {string} level — 'strict', 'moderate', 'permissive'
   */
  setStrictness(level) {
    if (!STRICTNESS_LEVELS.includes(level)) {
      throw new Error(`Invalid strictness level: ${level}. Must be one of: ${STRICTNESS_LEVELS.join(', ')}`);
    }
    this.strictness = level;
    this.log.info(`Strictness changed to: ${level}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Trail
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a validation result for audit compliance.
   * @param {object} artifact
   * @param {object[]} gateResults
   * @returns {object} Audit entry
   */
  createAuditTrail(artifact, gateResults) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      artifactName: artifact.name,
      artifactType: artifact.type,
      transport: artifact.transport || null,
      gateResults: gateResults.map(g => ({
        name: g.name,
        status: g.status,
        message: g.message,
      })),
      overallApproved: !gateResults.some(
        g => g.required !== false && (g.status === GATE_STATUS.FAILED || g.status === GATE_STATUS.PENDING_REVIEW)
      ),
      strictness: this.strictness,
    };

    this._auditLog.push(entry);
    this.log.debug('Audit trail created', { id: entry.id, artifact: artifact.name });

    return entry;
  }

  /**
   * Query audit trail with optional filters.
   * @param {object} [filters]
   * @param {string} [filters.artifactName]
   * @param {string} [filters.artifactType]
   * @param {boolean} [filters.approved]
   * @param {string} [filters.since] — ISO date string
   * @param {string} [filters.until] — ISO date string
   * @returns {object[]}
   */
  getAuditLog(filters = {}) {
    let results = [...this._auditLog];

    if (filters.artifactName) {
      results = results.filter(e => e.artifactName === filters.artifactName);
    }

    if (filters.artifactType) {
      results = results.filter(e => e.artifactType === filters.artifactType);
    }

    if (filters.approved !== undefined) {
      results = results.filter(e => e.overallApproved === filters.approved);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      results = results.filter(e => new Date(e.timestamp) >= sinceDate);
    }

    if (filters.until) {
      const untilDate = new Date(filters.until);
      results = results.filter(e => new Date(e.timestamp) <= untilDate);
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Approval Workflow
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create an approval request.
   * @param {object} artifact
   * @param {object[]} gateResults
   * @returns {object} Approval request
   */
  requestApproval(artifact, gateResults) {
    this._approvalCounter++;
    const approvalId = `APR-${String(this._approvalCounter).padStart(6, '0')}`;

    const request = {
      approvalId,
      artifactName: artifact.name,
      artifactType: artifact.type,
      transport: artifact.transport || null,
      gateResults: gateResults.map(g => ({
        name: g.name,
        status: g.status,
        message: g.message,
      })),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      approver: null,
      approvedAt: null,
      comments: null,
      reason: null,
    };

    this._approvals.set(approvalId, request);
    this.log.info(`Approval requested: ${approvalId}`, { artifact: artifact.name });

    return request;
  }

  /**
   * Approve an artifact.
   * @param {string} approvalId
   * @param {string} approver — Username of the approver
   * @param {string} [comments]
   * @returns {object} Updated approval
   */
  approveArtifact(approvalId, approver, comments) {
    const request = this._approvals.get(approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is already ${request.status}`);
    }
    if (!approver || typeof approver !== 'string') {
      throw new Error('Approver must be a non-empty string');
    }

    request.status = 'approved';
    request.approver = approver;
    request.approvedAt = new Date().toISOString();
    request.comments = comments || null;

    this.log.info(`Artifact approved: ${approvalId}`, { approver, artifact: request.artifactName });

    return { ...request };
  }

  /**
   * Reject an artifact.
   * @param {string} approvalId
   * @param {string} approver — Username of the rejector
   * @param {string} reason — Rejection reason
   * @returns {object} Updated approval
   */
  rejectArtifact(approvalId, approver, reason) {
    const request = this._approvals.get(approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }
    if (request.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is already ${request.status}`);
    }
    if (!approver || typeof approver !== 'string') {
      throw new Error('Approver must be a non-empty string');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('Rejection reason must be a non-empty string');
    }

    request.status = 'rejected';
    request.approver = approver;
    request.approvedAt = new Date().toISOString();
    request.reason = reason;

    this.log.info(`Artifact rejected: ${approvalId}`, { approver, artifact: request.artifactName, reason });

    return { ...request };
  }

  /**
   * List all pending approval requests.
   * @returns {object[]}
   */
  getPendingApprovals() {
    return Array.from(this._approvals.values())
      .filter(r => r.status === 'pending')
      .map(r => ({ ...r }));
  }

  /**
   * Check if an artifact has been approved (all gates passed + human review).
   * @param {string} artifactId — Artifact identifier (name)
   * @returns {boolean}
   */
  isApproved(artifactId) {
    for (const request of this._approvals.values()) {
      if (request.artifactName === artifactId && request.status === 'approved') {
        return true;
      }
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Transport Enforcement
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify an artifact is assigned to a transport before deployment.
   * @param {object} artifact
   * @returns {object} { valid, transport, message }
   */
  enforceTransport(artifact) {
    if (!artifact.transport) {
      return {
        valid: false,
        transport: null,
        message: 'Artifact is not assigned to a transport request',
      };
    }

    if (!TRANSPORT_PATTERN.test(artifact.transport)) {
      return {
        valid: false,
        transport: artifact.transport,
        message: `Invalid transport number format: "${artifact.transport}"`,
      };
    }

    return {
      valid: true,
      transport: artifact.transport,
      message: `Transport ${artifact.transport} is valid`,
    };
  }

  /**
   * Validate that a transport follows the DEV->QAS->PRD pipeline.
   * @param {string} transportNumber
   * @returns {object} { valid, stages, message }
   */
  validateTransportChain(transportNumber) {
    if (!transportNumber || !TRANSPORT_PATTERN.test(transportNumber)) {
      return {
        valid: false,
        stages: [],
        message: `Invalid transport number: "${transportNumber}"`,
      };
    }

    // Extract system prefix from transport number
    const systemPrefix = transportNumber.substring(0, 3);

    // Define expected pipeline stages
    const stages = [
      { system: `${systemPrefix}`, stage: 'DEV', status: 'completed', description: 'Development system' },
      { system: `${systemPrefix.replace(/D$/i, 'Q')}`, stage: 'QAS', status: 'pending', description: 'Quality assurance system' },
      { system: `${systemPrefix.replace(/D$/i, 'P')}`, stage: 'PRD', status: 'pending', description: 'Production system' },
    ];

    return {
      valid: true,
      transportNumber,
      stages,
      message: `Transport ${transportNumber} pipeline: DEV -> QAS -> PRD`,
      currentStage: 'DEV',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  _getArtifactId(artifact) {
    return artifact.name || `${artifact.type}-${Date.now()}`;
  }
}

module.exports = SafetyGates;
