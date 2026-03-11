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
'use strict';

const path = require('path');
const { spawn } = require('child_process');

const CAP_PORT = process.env.PORT || '4004';
const API_PORT = process.env.API_PORT || (CAP_PORT === '4004' ? '4005' : String(Number(CAP_PORT) + 1));
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

let shuttingDown = false;
let exitTimer = null;

function spawnService(name, command, args, env) {
  const child = spawn(command, args, {
    env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`${name} exited unexpectedly`, { code, signal });
    shutdown(code || 1);
  });

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`${name} failed to start`, { error: error.message });
    shutdown(1);
  });

  return child;
}

const capProcess = spawnService('cap-server', NPX, ['cds-serve'], {
  ...process.env,
  PORT: CAP_PORT,
});

const apiProcess = spawnService('migration-api', process.execPath, [path.join(__dirname, '..', 'server.js')], {
  ...process.env,
  PORT: CAP_PORT,
  API_PORT,
});

function shutdown(exitCode = 0) {
  const children = [capProcess, apiProcess].filter(Boolean);

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  if (exitTimer) {
    clearTimeout(exitTimer);
  }
  exitTimer = setTimeout(() => process.exit(exitCode), 1000);
  exitTimer.unref();
}

process.on('SIGINT', () => {
  shuttingDown = true;
  shutdown(0);
});

process.on('SIGTERM', () => {
  shuttingDown = true;
  shutdown(0);
});