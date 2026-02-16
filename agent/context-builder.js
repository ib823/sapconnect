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
 * Agent Context Builder
 *
 * Manages conversation context for multi-agent LLM workflows.
 * Builds structured messages from requirements and previous agent outputs,
 * compresses long conversations to stay within token budgets, and formats
 * tool results for token-efficient LLM consumption.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Message Building
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the user message for an agent, combining requirement text with
 * optional context from a previous agent's output.
 *
 * @param {string} requirement — The user's original requirement
 * @param {object} [previousResult] — AgentResult from the previous stage
 * @returns {string} Formatted user message
 */
function buildUserMessage(requirement, previousResult) {
  const parts = [];

  parts.push('## Requirement');
  parts.push(requirement);

  if (previousResult) {
    parts.push('');
    parts.push('## Context from Previous Agent');
    parts.push(`**Agent:** ${previousResult.role}`);
    parts.push(`**Title:** ${previousResult.title}`);

    if (previousResult.sections) {
      for (const section of previousResult.sections) {
        parts.push('');
        parts.push(`### ${section.heading}`);
        if (section.content) {
          parts.push(section.content);
        }
        if (section.table) {
          parts.push(_formatTableAsText(section.table));
        }
      }
    }
  }

  return parts.join('\n');
}

/**
 * Format a table object as compact text for the LLM.
 */
function _formatTableAsText(table) {
  if (!table || !table.headers || !table.rows) return '';
  const lines = [];
  lines.push(table.headers.join(' | '));
  lines.push(table.headers.map(() => '---').join(' | '));
  for (const row of table.rows) {
    lines.push(row.join(' | '));
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Compression
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate token count for a string (rough approximation: ~4 chars per token).
 * Avoids requiring tiktoken as a hard dependency.
 *
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens across a messages array.
 * @param {object[]} messages — [{role, content}]
 * @returns {number}
 */
function estimateMessagesTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.text) total += estimateTokens(block.text);
        if (block.input) total += estimateTokens(JSON.stringify(block.input));
        if (block.content) total += estimateTokens(typeof block.content === 'string' ? block.content : JSON.stringify(block.content));
      }
    }
    // ~4 tokens overhead per message for role/formatting
    total += 4;
  }
  return total;
}

/**
 * Compress conversation messages to fit within a token budget.
 * Keeps the system prompt and first user message, plus as many recent
 * tool exchanges as will fit. Drops middle messages first.
 *
 * @param {object[]} messages — Full conversation messages
 * @param {number} maxTokens — Maximum token budget (default: 100000)
 * @returns {object[]} Compressed messages array
 */
function compressContext(messages, maxTokens = 100000) {
  if (!messages || messages.length === 0) return [];

  const currentTokens = estimateMessagesTokens(messages);
  if (currentTokens <= maxTokens) {
    return messages;
  }

  // Always keep: system prompt (index 0), first user message (index 1)
  const keepStart = [];
  const keepEnd = [];

  // Identify system and first user messages
  for (let i = 0; i < Math.min(2, messages.length); i++) {
    keepStart.push(messages[i]);
  }

  // Build from the end, keeping recent messages
  for (let i = messages.length - 1; i >= 2; i--) {
    const candidate = [...keepStart, ...keepEnd];
    candidate.splice(keepStart.length, 0, messages[i]);
    if (estimateMessagesTokens(candidate) <= maxTokens) {
      keepEnd.unshift(messages[i]);
    } else {
      break;
    }
  }

  // If we dropped messages, insert a summary marker
  const result = [...keepStart];
  if (keepEnd.length < messages.length - 2) {
    const dropped = messages.length - 2 - keepEnd.length;
    result.push({
      role: 'user',
      content: `[${dropped} earlier message(s) omitted for context budget]`,
    });
  }
  result.push(...keepEnd);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Result Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a raw tool execution result into a concise, token-efficient string
 * for feeding back to the LLM as a tool_result.
 *
 * @param {string} toolName — Name of the tool that was called
 * @param {object} result — Raw result from executeTool/gateway
 * @returns {string} Formatted result text
 */
function formatToolResult(toolName, result) {
  if (!result) return 'No result returned.';

  if (result.error) {
    return `Error: ${result.error}`;
  }

  switch (toolName) {
    case 'read_abap_source':
      return _formatSourceResult(result);
    case 'write_abap_source':
      return `Written: ${result.object_name || 'unknown'} (${result.status || 'ok'})`;
    case 'list_objects':
      return _formatListResult(result);
    case 'search_repository':
      return _formatSearchResult(result);
    case 'get_data_dictionary':
      return _formatDDICResult(result);
    case 'activate_object':
      return `Activated: ${result.object_name || 'unknown'} — ${result.status || 'ok'}`;
    case 'run_unit_tests':
      return _formatTestResult(result);
    case 'run_syntax_check':
      return _formatSyntaxResult(result);
    default:
      return _truncateJSON(result);
  }
}

function _formatSourceResult(result) {
  const header = `${result.object_type || 'ABAP'}: ${result.object_name}`;
  const pkg = result.package ? ` (package: ${result.package})` : '';
  const desc = result.description ? `\n${result.description}` : '';
  const source = result.source || '(empty)';
  // Truncate very long source to save tokens
  const maxLen = 8000;
  const truncatedSource = source.length > maxLen
    ? source.substring(0, maxLen) + `\n... [truncated, ${source.length} chars total]`
    : source;
  return `${header}${pkg}${desc}\n\n${truncatedSource}`;
}

function _formatListResult(result) {
  if (Array.isArray(result.objects)) {
    const lines = result.objects.map((o) => `  ${o.type || ''} ${o.name || o}`);
    return `Package: ${result.package || 'unknown'}\nObjects (${result.objects.length}):\n${lines.join('\n')}`;
  }
  return _truncateJSON(result);
}

function _formatSearchResult(result) {
  if (Array.isArray(result.results)) {
    const lines = result.results.map((r) => `  ${r.type || ''} ${r.name || r} — ${r.description || ''}`);
    return `Search results (${result.results.length}):\n${lines.join('\n')}`;
  }
  return _truncateJSON(result);
}

function _formatDDICResult(result) {
  const header = `${result.type || 'DDIC'}: ${result.name || result.object_name || 'unknown'}`;
  if (Array.isArray(result.fields)) {
    const lines = result.fields.map((f) => `  ${f.name} ${f.type || ''} ${f.length || ''} — ${f.description || ''}`);
    return `${header}\nFields (${result.fields.length}):\n${lines.join('\n')}`;
  }
  return `${header}\n${_truncateJSON(result)}`;
}

function _formatTestResult(result) {
  const summary = result.summary
    ? `Passed: ${result.summary.passed || 0}, Failed: ${result.summary.failed || 0}, Skipped: ${result.summary.skipped || 0}`
    : '';
  const coverage = result.coverage
    ? `\nCoverage: ${result.coverage.statement || result.coverage.line || 'N/A'}%`
    : '';
  return `Unit Tests: ${summary}${coverage}`;
}

function _formatSyntaxResult(result) {
  if (result.status === 'clean' || (Array.isArray(result.errors) && result.errors.length === 0)) {
    return `Syntax check: CLEAN — no errors found`;
  }
  if (Array.isArray(result.errors)) {
    const lines = result.errors.map((e) => `  Line ${e.line || '?'}: ${e.message || e}`);
    return `Syntax check: ${result.errors.length} error(s)\n${lines.join('\n')}`;
  }
  return `Syntax check: ${result.status || 'unknown'}`;
}

function _truncateJSON(obj, maxLen = 2000) {
  const str = JSON.stringify(obj, null, 2);
  if (str.length > maxLen) {
    return str.substring(0, maxLen) + '\n... [truncated]';
  }
  return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Message Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an Anthropic-format tool_result message.
 * @param {string} toolUseId — The tool_use block ID from the assistant message
 * @param {string} content — Formatted result text
 * @returns {object} Message in Anthropic tool_result format
 */
function buildToolResultMessage(toolUseId, content) {
  return {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolUseId,
        content,
      },
    ],
  };
}

/**
 * Build an assistant message containing tool_use blocks.
 * Used for reconstructing conversation history.
 * @param {object[]} toolCalls — [{id, name, input}]
 * @param {string} [text] — Optional text before tool calls
 * @returns {object} Message in assistant format
 */
function buildAssistantToolUseMessage(toolCalls, text) {
  const content = [];
  if (text) {
    content.push({ type: 'text', text });
  }
  for (const tc of toolCalls) {
    content.push({
      type: 'tool_use',
      id: tc.id,
      name: tc.name,
      input: tc.input,
    });
  }
  return { role: 'assistant', content };
}

module.exports = {
  buildUserMessage,
  compressContext,
  formatToolResult,
  buildToolResultMessage,
  buildAssistantToolUseMessage,
  estimateTokens,
  estimateMessagesTokens,
};
