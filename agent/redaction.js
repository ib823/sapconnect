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
 * LLM Data Redaction Pipeline
 *
 * Strips sensitive patterns from content before sending to external LLM providers.
 * Provides per-call audit logging with data classification level.
 */

'use strict';

const Logger = require('../lib/logger');

const logger = new Logger('redaction', { level: 'info', format: 'json' });

/**
 * Sensitive patterns to redact before sending to LLM providers.
 * Each entry: { name, pattern, replacement }
 */
const REDACTION_PATTERNS = [
  // Passwords and secrets in config/connection strings
  { name: 'password-field', pattern: /(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[^\s'"}{,\]]+/gi, replacement: '$&'.replace(/[:=]\s*['"]?[^\s'"}{,\]]+/, '=[REDACTED]') },
  { name: 'password-kv', pattern: /((?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?)[^\s'"}{,\]]+/gi, replacement: '$1[REDACTED]' },

  // Bearer tokens and Authorization headers
  { name: 'bearer-token', pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer [REDACTED]' },
  { name: 'basic-auth', pattern: /Basic\s+[A-Za-z0-9+/]+=*/gi, replacement: 'Basic [REDACTED]' },

  // SAP-specific credentials
  { name: 'sap-password', pattern: /(SAP_PASSWORD|SAP_CLIENT_SECRET|XSUAA_CLIENT_SECRET|SAP_RFC_PASSWORD)\s*=\s*\S+/gi, replacement: '$1=[REDACTED]' },

  // Connection strings with embedded credentials
  { name: 'connection-string', pattern: /:\/\/[^:]+:[^@]+@/g, replacement: '://[USER]:[REDACTED]@' },

  // JWT tokens (three base64 segments separated by dots)
  { name: 'jwt-token', pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[REDACTED_JWT]' },

  // Email addresses
  { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED_EMAIL]' },

  // IPv4 addresses (private ranges kept, public ranges redacted)
  { name: 'public-ip', pattern: /(?<![\d.])(?!10\.)(?!172\.(?:1[6-9]|2\d|3[01])\.)(?!192\.168\.)(?!127\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?![\d.])/g, replacement: '[REDACTED_IP]' },

  // VCAP_SERVICES JSON blocks (contains bound service credentials)
  { name: 'vcap-services', pattern: /VCAP_SERVICES\s*=\s*\{[^}]*\}/gi, replacement: 'VCAP_SERVICES=[REDACTED]' },
];

/**
 * Classify data sensitivity level based on content analysis.
 * @param {string} text - Content to classify
 * @returns {{ level: string, flags: string[] }} Classification result
 */
function classifyContent(text) {
  if (!text || typeof text !== 'string') return { level: 'none', flags: [] };

  const flags = [];

  if (/(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]/i.test(text)) {
    flags.push('credentials');
  }
  if (/eyJ[A-Za-z0-9_-]+\.eyJ/i.test(text)) {
    flags.push('jwt');
  }
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    flags.push('email');
  }
  if (/VCAP_SERVICES/i.test(text)) {
    flags.push('service-bindings');
  }
  if (/Bearer\s+[A-Za-z0-9]/i.test(text)) {
    flags.push('bearer-token');
  }
  if (/:\/\/[^:]+:[^@]+@/.test(text)) {
    flags.push('connection-string');
  }

  let level = 'low';
  if (flags.length > 0) level = 'high';
  else if (text.length > 5000) level = 'medium';

  return { level, flags };
}

/**
 * Redact sensitive patterns from a string.
 * @param {string} text - Text to redact
 * @returns {{ redacted: string, redactionCount: number }} Redacted text and count
 */
function redactText(text) {
  if (!text || typeof text !== 'string') return { redacted: text, redactionCount: 0 };

  let redacted = text;
  let redactionCount = 0;

  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    const before = redacted;
    redacted = redacted.replace(pattern, replacement);
    if (redacted !== before) redactionCount++;
  }

  return { redacted, redactionCount };
}

/**
 * Redact sensitive data from LLM conversation messages.
 * Processes each message's content and logs classification per call.
 * @param {object[]} messages - Array of {role, content} messages
 * @param {object} [auditContext] - Optional context for audit logging
 * @returns {object[]} Messages with sensitive data redacted
 */
function redactMessages(messages, auditContext = {}) {
  if (!messages || !Array.isArray(messages)) return messages;

  let totalRedactions = 0;
  const allFlags = new Set();

  const redactedMessages = messages.map((msg) => {
    if (typeof msg.content === 'string') {
      const classification = classifyContent(msg.content);
      classification.flags.forEach((f) => allFlags.add(f));
      const { redacted, redactionCount } = redactText(msg.content);
      totalRedactions += redactionCount;
      return { ...msg, content: redacted };
    }

    if (Array.isArray(msg.content)) {
      const redactedContent = msg.content.map((block) => {
        if (block.text) {
          const classification = classifyContent(block.text);
          classification.flags.forEach((f) => allFlags.add(f));
          const { redacted, redactionCount } = redactText(block.text);
          totalRedactions += redactionCount;
          return { ...block, text: redacted };
        }
        if (block.content && typeof block.content === 'string') {
          const classification = classifyContent(block.content);
          classification.flags.forEach((f) => allFlags.add(f));
          const { redacted, redactionCount } = redactText(block.content);
          totalRedactions += redactionCount;
          return { ...block, content: redacted };
        }
        return block;
      });
      return { ...msg, content: redactedContent };
    }

    return msg;
  });

  // Audit log the redaction event
  const flags = [...allFlags];
  const classification = flags.length > 0 ? 'high' : 'low';

  logger.info('LLM_CALL_AUDIT', {
    agent: auditContext.agent || 'unknown',
    provider: auditContext.provider || 'unknown',
    messageCount: messages.length,
    dataClassification: classification,
    sensitiveFlags: flags,
    redactionsApplied: totalRedactions,
    timestamp: new Date().toISOString(),
  });

  return redactedMessages;
}

module.exports = {
  redactText,
  redactMessages,
  classifyContent,
  REDACTION_PATTERNS,
};
