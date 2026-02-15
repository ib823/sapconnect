/**
 * XSUAA Authentication Middleware
 *
 * JWT-based authentication for SAP BTP deployments using @sap/xssec.
 * Mirrors the ApiKeyAuth interface for drop-in replacement via AUTH_STRATEGY.
 *
 * Scopes are mapped from XSUAA format ($XSAPPNAME.Read) to internal
 * format (read, write, admin) for consistent authorization checks.
 *
 * Environment Variables:
 *   VCAP_SERVICES — BTP service bindings (auto-set by CF/Kyma)
 *   XSUAA_CREDENTIALS — Manual JSON credentials (dev/test fallback)
 */

'use strict';

const Logger = require('../logger');

const EXEMPT_PATHS = new Set(['/health', '/ready', '/metrics']);

/** Map XSUAA scope suffixes to internal scope names */
const SCOPE_MAP = {
  Read: 'read',
  Write: 'write',
  Admin: 'admin',
};

class XsuaaAuth {
  /**
   * @param {object} [options]
   * @param {object} [options.credentials] — XSUAA service credentials (override auto-detection)
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this._credentials = options.credentials || null;
    this._passport = null;
    this._initialized = false;
    this.log = options.logger || new Logger('xsuaa-auth');
  }

  /**
   * Always enabled when instantiated (XSUAA is always active in BTP).
   */
  isEnabled() {
    return true;
  }

  /**
   * Lazily initialize passport with XSUAA strategy.
   * Deferred to avoid requiring @sap/xssec at module load time.
   */
  _ensureInitialized() {
    if (this._initialized) return;

    const credentials = this._getCredentials();
    const passport = XsuaaAuth._loadPassport();
    const xssec = XsuaaAuth._loadXssec();

    passport.use('JWT', new xssec.JWTStrategy(credentials));
    this._passport = passport;
    this._initialized = true;
    this.log.info('XSUAA authentication initialized');
  }

  /**
   * Get XSUAA credentials from environment or explicit config.
   */
  _getCredentials() {
    if (this._credentials) return this._credentials;

    // Try @sap/xsenv for VCAP_SERVICES parsing
    try {
      const xsenv = XsuaaAuth._loadXsenv();
      const services = xsenv.getServices({ uaa: { tag: 'xsuaa' } });
      if (services.uaa) {
        this._credentials = services.uaa;
        return this._credentials;
      }
    } catch {
      // xsenv not available or no XSUAA binding
    }

    // Fallback: manual credentials from env
    if (process.env.XSUAA_CREDENTIALS) {
      this._credentials = JSON.parse(process.env.XSUAA_CREDENTIALS);
      return this._credentials;
    }

    throw new Error(
      'XSUAA credentials not found. Ensure VCAP_SERVICES is set (BTP) ' +
      'or provide XSUAA_CREDENTIALS env var with JSON credentials.'
    );
  }

  /**
   * Express middleware for JWT authentication.
   * Drop-in replacement for ApiKeyAuth.middleware().
   */
  middleware() {
    return (req, res, next) => {
      // Exempt health/ready/metrics
      if (EXEMPT_PATHS.has(req.path)) return next();
      // Only protect /api/* routes
      if (!req.path.startsWith('/api/')) return next();

      this._ensureInitialized();

      this._passport.authenticate('JWT', { session: false }, (err, user, info) => {
        if (err) {
          this.log.error('XSUAA authentication error', { error: err.message });
          return res.status(500).json({ error: 'Authentication error' });
        }

        if (!user) {
          return res.status(401).json({
            error: 'Unauthorized',
            details: info?.message || 'Valid JWT token required',
          });
        }

        // Map XSUAA security context to req.user
        req.user = {
          type: 'xsuaa',
          authenticated: true,
          id: user.id || user.userInfo?.logonName || 'unknown',
          email: user.email || user.userInfo?.email || null,
          scopes: this._mapScopes(user),
        };

        // Store security context for downstream scope checks
        req.authInfo = user;

        next();
      })(req, res, next);
    };
  }

  /**
   * Express middleware factory for scope-based authorization.
   *
   * @param {string} scope — Internal scope name: 'read', 'write', or 'admin'
   * @returns {Function} Express middleware
   */
  requireScope(scope) {
    return (req, res, next) => {
      if (!req.user || !req.user.authenticated) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.user.scopes || !req.user.scopes.includes(scope)) {
        return res.status(403).json({
          error: 'Forbidden',
          details: `Missing required scope: ${scope}`,
        });
      }

      next();
    };
  }

  /**
   * Extract and map XSUAA scopes to internal scope names.
   * @param {object} securityContext — XSUAA security context
   * @returns {string[]} Internal scope names
   */
  _mapScopes(securityContext) {
    const internalScopes = [];

    for (const [suffix, internalName] of Object.entries(SCOPE_MAP)) {
      try {
        if (securityContext.checkScope && securityContext.checkScope(`$XSAPPNAME.${suffix}`)) {
          internalScopes.push(internalName);
        }
      } catch {
        // Scope check failed — scope not granted
      }
    }

    return internalScopes;
  }

  // ── Overridable SDK loaders (for test mocking) ──────────────────

  static _loadPassport() {
    return require('passport');
  }

  static _loadXssec() {
    return require('@sap/xssec');
  }

  static _loadXsenv() {
    return require('@sap/xsenv');
  }
}

module.exports = { XsuaaAuth, SCOPE_MAP };
