const { BatchBuilder, parseV2BatchResponse, parseV4BatchResponse } = require('../../../lib/odata/batch');

describe('BatchBuilder', () => {
  describe('V2 (multipart/mixed)', () => {
    it('should build multipart body with correct boundary', () => {
      const builder = new BatchBuilder('v2');
      builder.addGet('/sap/opu/odata/sap/API/EntitySet');

      const { headers, body, boundary } = builder.build();

      expect(headers['Content-Type']).toContain('multipart/mixed');
      expect(headers['Content-Type']).toContain(boundary);
      expect(body).toContain(`--${boundary}`);
      expect(body).toContain('GET /sap/opu/odata/sap/API/EntitySet HTTP/1.1');
      expect(body).toContain(`--${boundary}--`);
    });

    it('should include POST body with Content-Type and Content-Length', () => {
      const builder = new BatchBuilder('v2');
      builder.addPost('/sap/opu/odata/sap/API/Orders', { OrderId: '100' });

      const { body } = builder.build();

      expect(body).toContain('POST /sap/opu/odata/sap/API/Orders HTTP/1.1');
      expect(body).toContain('Content-Type: application/json');
      expect(body).toContain('"OrderId":"100"');
    });

    it('should support multiple operations', () => {
      const builder = new BatchBuilder('v2');
      builder
        .addGet('/path/a')
        .addPost('/path/b', { x: 1 })
        .addPatch('/path/c', { y: 2 })
        .addDelete('/path/d');

      expect(builder.count).toBe(4);

      const { body } = builder.build();
      expect(body).toContain('GET /path/a');
      expect(body).toContain('POST /path/b');
      expect(body).toContain('PATCH /path/c');
      expect(body).toContain('DELETE /path/d');
    });

    it('should include custom headers on operations', () => {
      const builder = new BatchBuilder('v2');
      builder.addGet('/path', { 'sap-client': '100' });

      const { body } = builder.build();
      expect(body).toContain('sap-client: 100');
    });
  });

  describe('V4 (JSON)', () => {
    it('should build JSON body with requests array', () => {
      const builder = new BatchBuilder('v4');
      builder.addGet('/api/Orders');
      builder.addPost('/api/Orders', { id: '1' });

      const { headers, body } = builder.build();

      expect(headers['Content-Type']).toBe('application/json');

      const parsed = JSON.parse(body);
      expect(parsed.requests).toHaveLength(2);
      expect(parsed.requests[0].method).toBe('GET');
      expect(parsed.requests[0].url).toBe('/api/Orders');
      expect(parsed.requests[0].id).toBe('1');
      expect(parsed.requests[1].method).toBe('POST');
      expect(parsed.requests[1].body).toEqual({ id: '1' });
    });
  });

  describe('count', () => {
    it('should return 0 for empty builder', () => {
      expect(new BatchBuilder().count).toBe(0);
    });
  });
});

describe('parseV2BatchResponse', () => {
  it('should parse multipart response into results', () => {
    const boundary = 'batch_abc123';
    const responseText = [
      `--${boundary}`,
      'Content-Type: application/http',
      '',
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      '',
      '{"d":{"OrderId":"100"}}',
      `--${boundary}`,
      'Content-Type: application/http',
      '',
      'HTTP/1.1 201 Created',
      'Content-Type: application/json',
      '',
      '{"d":{"OrderId":"101"}}',
      `--${boundary}--`,
    ].join('\r\n');

    const results = parseV2BatchResponse(responseText, boundary);

    expect(results).toHaveLength(2);
    expect(results[0].statusCode).toBe(200);
    expect(results[0].body).toEqual({ d: { OrderId: '100' } });
    expect(results[1].statusCode).toBe(201);
    expect(results[1].body).toEqual({ d: { OrderId: '101' } });
  });

  it('should handle 404 responses', () => {
    const boundary = 'batch_err';
    const responseText = [
      `--${boundary}`,
      'Content-Type: application/http',
      '',
      'HTTP/1.1 404 Not Found',
      'Content-Type: application/json',
      '',
      '{"error":{"message":"Not found"}}',
      `--${boundary}--`,
    ].join('\r\n');

    const results = parseV2BatchResponse(responseText, boundary);
    expect(results[0].statusCode).toBe(404);
  });
});

describe('parseV4BatchResponse', () => {
  it('should parse JSON response into results', () => {
    const responseBody = {
      responses: [
        { id: '1', status: 200, headers: {}, body: { value: [{ id: 'A' }] } },
        { id: '2', status: 204, headers: {} },
      ],
    };

    const results = parseV4BatchResponse(responseBody);

    expect(results).toHaveLength(2);
    expect(results[0].statusCode).toBe(200);
    expect(results[0].body.value[0].id).toBe('A');
    expect(results[1].statusCode).toBe(204);
    expect(results[1].body).toBeNull();
  });

  it('should parse from string', () => {
    const str = JSON.stringify({ responses: [{ id: '1', status: 200, body: {} }] });
    const results = parseV4BatchResponse(str);
    expect(results).toHaveLength(1);
  });
});
