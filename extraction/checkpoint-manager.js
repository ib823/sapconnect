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
 * Checkpoint Manager
 *
 * File-based checkpointing for resumable extraction.
 * Enables resume after crash/timeout on large systems.
 */

const fs = require('fs');
const path = require('path');

class CheckpointManager {
  /**
   * @param {string} [storageDir='.sapconnect-checkpoints/']
   */
  constructor(storageDir = '.sapconnect-checkpoints/') {
    this.storageDir = path.resolve(storageDir);
  }

  async save(extractorId, key, data) {
    const dir = path.join(this.storageDir, extractorId);
    this._ensureDir(dir);
    const filePath = path.join(dir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async load(extractorId, key) {
    const filePath = path.join(this.storageDir, extractorId, `${key}.json`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  async exists(extractorId, key) {
    const filePath = path.join(this.storageDir, extractorId, `${key}.json`);
    return fs.existsSync(filePath);
  }

  async clear(extractorId) {
    const dir = path.join(this.storageDir, extractorId);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file));
      }
      fs.rmdirSync(dir);
    }
  }

  async clearAll() {
    if (fs.existsSync(this.storageDir)) {
      this._rmdir(this.storageDir);
    }
  }

  /**
   * Get progress overview — which extractors have checkpoints.
   */
  async getProgress() {
    if (!fs.existsSync(this.storageDir)) return {};
    const progress = {};
    const dirs = fs.readdirSync(this.storageDir);
    for (const dir of dirs) {
      const dirPath = path.join(this.storageDir, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        const keys = files.map(f => f.replace('.json', ''));
        const hasComplete = keys.includes('_complete');
        progress[dir] = { keys, complete: hasComplete, checkpointCount: files.length };
      }
    }
    return progress;
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _rmdir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const entryPath = path.join(dir, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        this._rmdir(entryPath);
      } else {
        fs.unlinkSync(entryPath);
      }
    }
    fs.rmdirSync(dir);
  }
}

module.exports = CheckpointManager;
