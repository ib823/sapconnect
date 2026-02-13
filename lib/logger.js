/**
 * Structured Logger
 *
 * Replaces ad-hoc `_log(msg) { if (this.verbose) console.log(...) }` patterns
 * with a structured logger supporting levels, formats, and child loggers.
 *
 * Levels: debug < info < warn < error
 * Formats: text (default, for CLI) and json (for machine consumption)
 * Controlled by LOG_LEVEL env var (default: info)
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  constructor(name, options = {}) {
    this.name = name;
    this.level = LEVELS[options.level || process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;
    this.format = options.format || process.env.LOG_FORMAT || 'text';
    this._output = options.output || console;
  }

  debug(msg, details) { this._write('debug', msg, details); }
  info(msg, details) { this._write('info', msg, details); }
  warn(msg, details) { this._write('warn', msg, details); }
  error(msg, details) { this._write('error', msg, details); }

  child(name) {
    return new Logger(`${this.name}:${name}`, {
      level: Object.keys(LEVELS).find((k) => LEVELS[k] === this.level),
      format: this.format,
      output: this._output,
    });
  }

  _write(level, msg, details) {
    if (LEVELS[level] < this.level) return;

    if (this.format === 'json') {
      const entry = { timestamp: new Date().toISOString(), level, name: this.name, msg };
      if (details) entry.details = details;
      this._output.log(JSON.stringify(entry));
    } else {
      const prefix = `[${this.name}]`;
      const tag = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : '';
      const line = tag ? `  ${prefix} ${tag}: ${msg}` : `  ${prefix} ${msg}`;
      if (details) {
        this._output.log(line, details);
      } else {
        this._output.log(line);
      }
    }
  }
}

module.exports = Logger;
