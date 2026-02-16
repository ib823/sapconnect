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
 * Approval Gate
 *
 * Manages the approval workflow for tier 3 (Staging) and tier 4 (Production)
 * operations. Tracks approval requests, approvals, and rejections with an
 * in-memory store for mock/test usage.
 */

'use strict';

const Logger = require('../logger');
const { TierManager } = require('./tier-manager');

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

class ApprovalGate {
  /**
   * @param {object} [options]
   * @param {number} [options.expirationMs=86400000] - Approval request TTL (default: 24h)
   * @param {object} [options.tierManager] - TierManager instance
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.expirationMs = options.expirationMs ?? 86400000; // 24 hours
    this.tierManager = options.tierManager || new TierManager();
    this.logger = options.logger || new Logger('approval-gate');
    this._requests = new Map();
  }

  /**
   * Create an approval request for a gated operation.
   * @param {string} operation - Operation identifier
   * @param {string} requestedBy - User requesting the operation
   * @param {object} [details] - Additional context about the operation
   * @returns {object} Approval request record
   */
  requestApproval(operation, requestedBy, details = {}) {
    const tier = this.tierManager.getTier(operation);
    const requiredApprovers = this.tierManager.getRequiredApprovers(operation);

    if (!this.tierManager.requiresApproval(operation)) {
      return {
        requestId: null,
        operation,
        tier,
        status: APPROVAL_STATUS.APPROVED,
        reason: 'Operation does not require approval',
        autoApproved: true,
      };
    }

    const requestId = this._generateId();
    const request = {
      requestId,
      operation,
      tier,
      requestedBy,
      details,
      requiredApprovers,
      approvals: [],
      rejections: [],
      status: APPROVAL_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.expirationMs).toISOString(),
      resolvedAt: null,
    };

    this._requests.set(requestId, request);
    this.logger.info(`Approval requested: ${requestId} for "${operation}" by ${requestedBy}`, {
      tier,
      requiredApprovers,
    });

    return { ...request };
  }

  /**
   * Approve an approval request.
   * @param {string} requestId - Approval request ID
   * @param {string} approvedBy - Approving user
   * @param {string} [comment] - Optional comment
   * @returns {object} Updated approval request
   */
  approve(requestId, approvedBy, comment) {
    const request = this._getRequest(requestId);

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(`Cannot approve request ${requestId}: status is "${request.status}"`);
    }

    if (request.requestedBy === approvedBy) {
      throw new Error(`Cannot self-approve: requester "${approvedBy}" cannot approve own request`);
    }

    // Check for duplicate approval by same user
    if (request.approvals.some(a => a.approvedBy === approvedBy)) {
      throw new Error(`User "${approvedBy}" has already approved request ${requestId}`);
    }

    request.approvals.push({
      approvedBy,
      comment: comment || null,
      timestamp: new Date().toISOString(),
    });

    // Check if sufficient approvals reached
    if (request.approvals.length >= request.requiredApprovers) {
      request.status = APPROVAL_STATUS.APPROVED;
      request.resolvedAt = new Date().toISOString();
      this.logger.info(`Approval granted: ${requestId} (${request.approvals.length}/${request.requiredApprovers} approvals)`);
    } else {
      this.logger.info(`Approval recorded: ${requestId} (${request.approvals.length}/${request.requiredApprovers} approvals)`);
    }

    return { ...request };
  }

  /**
   * Reject an approval request.
   * @param {string} requestId - Approval request ID
   * @param {string} rejectedBy - Rejecting user
   * @param {string} [reason] - Rejection reason
   * @returns {object} Updated approval request
   */
  reject(requestId, rejectedBy, reason) {
    const request = this._getRequest(requestId);

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(`Cannot reject request ${requestId}: status is "${request.status}"`);
    }

    request.rejections.push({
      rejectedBy,
      reason: reason || null,
      timestamp: new Date().toISOString(),
    });

    request.status = APPROVAL_STATUS.REJECTED;
    request.resolvedAt = new Date().toISOString();

    this.logger.info(`Approval rejected: ${requestId} by ${rejectedBy}`, { reason });
    return { ...request };
  }

  /**
   * Cancel a pending approval request.
   * @param {string} requestId - Approval request ID
   * @param {string} cancelledBy - User cancelling (must be the requester)
   * @returns {object} Updated approval request
   */
  cancel(requestId, cancelledBy) {
    const request = this._getRequest(requestId);

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(`Cannot cancel request ${requestId}: status is "${request.status}"`);
    }

    if (request.requestedBy !== cancelledBy) {
      throw new Error(`Only the requester can cancel: expected "${request.requestedBy}" got "${cancelledBy}"`);
    }

    request.status = APPROVAL_STATUS.CANCELLED;
    request.resolvedAt = new Date().toISOString();

    this.logger.info(`Approval cancelled: ${requestId} by ${cancelledBy}`);
    return { ...request };
  }

  /**
   * Check the current status of an approval request.
   * @param {string} requestId
   * @returns {object} Current approval status
   */
  checkApprovalStatus(requestId) {
    const request = this._getRequest(requestId);

    // Check expiration for pending requests
    if (request.status === APPROVAL_STATUS.PENDING) {
      if (new Date() > new Date(request.expiresAt)) {
        request.status = APPROVAL_STATUS.EXPIRED;
        request.resolvedAt = new Date().toISOString();
      }
    }

    return {
      requestId: request.requestId,
      operation: request.operation,
      tier: request.tier,
      status: request.status,
      requestedBy: request.requestedBy,
      approvalsReceived: request.approvals.length,
      approvalsRequired: request.requiredApprovers,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
      resolvedAt: request.resolvedAt,
    };
  }

  /**
   * List all pending approval requests.
   * @param {object} [filters]
   * @param {string} [filters.operation] - Filter by operation
   * @param {string} [filters.requestedBy] - Filter by requester
   * @param {number} [filters.tier] - Filter by tier
   * @returns {object[]} Array of pending requests
   */
  listPendingApprovals(filters = {}) {
    const now = new Date();
    const pending = [];

    for (const request of this._requests.values()) {
      // Auto-expire
      if (request.status === APPROVAL_STATUS.PENDING && now > new Date(request.expiresAt)) {
        request.status = APPROVAL_STATUS.EXPIRED;
        request.resolvedAt = now.toISOString();
      }

      if (request.status !== APPROVAL_STATUS.PENDING) continue;

      if (filters.operation && request.operation !== filters.operation) continue;
      if (filters.requestedBy && request.requestedBy !== filters.requestedBy) continue;
      if (filters.tier && request.tier !== filters.tier) continue;

      pending.push({ ...request });
    }

    return pending;
  }

  /**
   * Get all requests (any status).
   * @param {object} [filters]
   * @param {string} [filters.status] - Filter by status
   * @param {number} [filters.limit] - Max results
   * @returns {object[]}
   */
  listAllRequests(filters = {}) {
    let results = Array.from(this._requests.values());

    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }

    const limit = filters.limit || 100;
    return results.slice(0, limit).map(r => ({ ...r }));
  }

  /**
   * Clear all stored requests (for testing).
   */
  clear() {
    this._requests.clear();
  }

  /** @private */
  _getRequest(requestId) {
    const request = this._requests.get(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }
    return request;
  }

  /** @private */
  _generateId() {
    return `apr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = { ApprovalGate, APPROVAL_STATUS };
