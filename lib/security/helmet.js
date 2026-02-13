/**
 * Security Headers Middleware
 *
 * Sets security-related HTTP headers without requiring the helmet package.
 * Implements OWASP recommended headers.
 */

function securityHeaders(options = {}) {
  const config = {
    contentSecurityPolicy: options.contentSecurityPolicy !== false,
    xContentTypeOptions: options.xContentTypeOptions !== false,
    xFrameOptions: options.xFrameOptions !== false,
    xXssProtection: options.xXssProtection !== false,
    strictTransportSecurity: options.strictTransportSecurity !== false,
    referrerPolicy: options.referrerPolicy || 'strict-origin-when-cross-origin',
    permissionsPolicy: options.permissionsPolicy !== false,
  };

  return (_req, res, next) => {
    if (config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    if (config.xFrameOptions) {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    if (config.xXssProtection) {
      res.setHeader('X-XSS-Protection', '0');
    }
    if (config.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy);
    }
    if (config.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'");
    }
    if (config.permissionsPolicy) {
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
    // Remove server header
    res.removeHeader('X-Powered-By');

    next();
  };
}

/**
 * CORS middleware
 */
function cors(options = {}) {
  const allowedOrigins = options.origins || ['*'];
  const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const allowedHeaders = options.headers || ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'];
  const maxAge = options.maxAge || 86400;

  return (req, res, next) => {
    const origin = req.get('Origin');

    if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', String(maxAge));
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

module.exports = { securityHeaders, cors };
