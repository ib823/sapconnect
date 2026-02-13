/**
 * OData $batch Request Builder
 *
 * Supports both V2 (multipart/mixed) and V4 (JSON) batch formats.
 */

const crypto = require('crypto');

class BatchBuilder {
  constructor(version = 'v2') {
    this.version = version;
    this._operations = [];
  }

  addGet(path, headers = {}) {
    this._operations.push({ method: 'GET', path, headers, body: null });
    return this;
  }

  addPost(path, body, headers = {}) {
    this._operations.push({ method: 'POST', path, headers, body });
    return this;
  }

  addPatch(path, body, headers = {}) {
    this._operations.push({ method: 'PATCH', path, headers, body });
    return this;
  }

  addDelete(path, headers = {}) {
    this._operations.push({ method: 'DELETE', path, headers, body: null });
    return this;
  }

  get count() {
    return this._operations.length;
  }

  build() {
    if (this.version === 'v4') {
      return this._buildV4();
    }
    return this._buildV2();
  }

  _buildV2() {
    const batchId = crypto.randomUUID().replace(/-/g, '');
    const boundary = `batch_${batchId}`;
    const parts = [];

    for (const op of this._operations) {
      const lines = [`--${boundary}`];
      lines.push('Content-Type: application/http');
      lines.push('Content-Transfer-Encoding: binary');
      lines.push('');
      lines.push(`${op.method} ${op.path} HTTP/1.1`);

      for (const [key, value] of Object.entries(op.headers)) {
        lines.push(`${key}: ${value}`);
      }

      if (op.body) {
        const bodyStr = typeof op.body === 'string' ? op.body : JSON.stringify(op.body);
        lines.push('Content-Type: application/json');
        lines.push(`Content-Length: ${Buffer.byteLength(bodyStr)}`);
        lines.push('');
        lines.push(bodyStr);
      } else {
        lines.push('');
      }

      parts.push(lines.join('\r\n'));
    }

    parts.push(`--${boundary}--`);
    const body = parts.join('\r\n');

    return {
      headers: { 'Content-Type': `multipart/mixed; boundary=${boundary}` },
      body,
      boundary,
    };
  }

  _buildV4() {
    const requests = this._operations.map((op, idx) => {
      const req = {
        id: String(idx + 1),
        method: op.method,
        url: op.path,
        headers: { ...op.headers },
      };
      if (op.body) {
        req.body = op.body;
        req.headers['Content-Type'] = 'application/json';
      }
      return req;
    });

    return {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    };
  }
}

/**
 * Parse a V2 multipart/mixed batch response into individual results
 */
function parseV2BatchResponse(responseText, boundary) {
  const results = [];
  const parts = responseText.split(`--${boundary}`);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === '--') continue;

    // Find the HTTP status line within the part
    const httpMatch = trimmed.match(/HTTP\/1\.\d\s+(\d{3})\s+(.*)/);
    if (!httpMatch) continue;

    const statusCode = parseInt(httpMatch[1], 10);
    const statusText = httpMatch[2];

    // Extract body — everything after the double newline in the HTTP response section
    const httpStart = trimmed.indexOf('HTTP/');
    const httpSection = trimmed.substring(httpStart);
    const bodyStart = httpSection.indexOf('\r\n\r\n');
    let body = null;
    if (bodyStart !== -1) {
      const rawBody = httpSection.substring(bodyStart + 4).trim();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      }
    }

    results.push({ statusCode, statusText, body });
  }

  return results;
}

/**
 * Parse a V4 JSON batch response
 */
function parseV4BatchResponse(responseBody) {
  const data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
  return (data.responses || []).map((r) => ({
    id: r.id,
    statusCode: r.status,
    headers: r.headers || {},
    body: r.body || null,
  }));
}

module.exports = { BatchBuilder, parseV2BatchResponse, parseV4BatchResponse };
