#!/usr/bin/env node
/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adds Apache 2.0 license headers to all source files that lack them.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const JS_HEADER = `/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
`;

const YAML_HEADER = `# Copyright 2024-2026 SEN Contributors
# SPDX-License-Identifier: Apache-2.0
`;

const XML_HEADER = `<!-- Copyright 2024-2026 SEN Contributors. SPDX-License-Identifier: Apache-2.0 -->
`;

const CDS_HEADER = `// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0
`;

const SOURCE_DIRS = [
  'srv', 'db', 'app', 'lib', 'extraction', 'migration',
  'agent', 'discovery', 'bin', 'scripts'
];

const SKIP_DIRS = new Set(['node_modules', '.next', 'gen', 'dist', 'resources', 'coverage', 'out', 'mock-data']);

function hasLicenseHeader(content) {
  const top = content.slice(0, 500);
  return top.includes('SPDX-License-Identifier') || top.includes('Apache License');
}

function getHeader(ext) {
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.ts':
    case '.tsx':
      return JS_HEADER;
    case '.yaml':
    case '.yml':
      return YAML_HEADER;
    case '.xml':
      return XML_HEADER;
    case '.cds':
      return CDS_HEADER;
    default:
      return null;
  }
}

function walkDir(dir, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
let modified = 0;
let skipped = 0;
let noHeader = 0;

for (const srcDir of SOURCE_DIRS) {
  const absDir = path.join(rootDir, srcDir);
  if (!fs.existsSync(absDir)) continue;

  const files = [];
  walkDir(absDir, files);

  for (const filePath of files) {
    const ext = path.extname(filePath);
    const header = getHeader(ext);
    if (!header) {
      noHeader++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (hasLicenseHeader(content)) {
      skipped++;
      continue;
    }

    // For JS files, preserve shebang
    let newContent;
    if ((ext === '.js' || ext === '.mjs') && content.startsWith('#!')) {
      const newlineIdx = content.indexOf('\n');
      const shebang = content.slice(0, newlineIdx + 1);
      const rest = content.slice(newlineIdx + 1);
      newContent = shebang + header + rest;
    } else if (ext === '.xml' && content.startsWith('<?xml')) {
      const newlineIdx = content.indexOf('\n');
      const xmlDecl = content.slice(0, newlineIdx + 1);
      const rest = content.slice(newlineIdx + 1);
      newContent = xmlDecl + header + rest;
    } else if ((ext === '.yaml' || ext === '.yml') && content.startsWith('openapi:')) {
      // Don't add to openapi.yaml at root level — already handled
      skipped++;
      continue;
    } else {
      newContent = header + content;
    }

    fs.writeFileSync(filePath, newContent);
    modified++;
  }
}

// Also handle root-level server.js
const serverJs = path.join(rootDir, 'server.js');
if (fs.existsSync(serverJs)) {
  const content = fs.readFileSync(serverJs, 'utf8');
  if (!hasLicenseHeader(content)) {
    fs.writeFileSync(serverJs, JS_HEADER + content);
    modified++;
  } else {
    skipped++;
  }
}

console.log(`License header results:`);
console.log(`  Modified: ${modified}`);
console.log(`  Already had header: ${skipped}`);
console.log(`  Unsupported extension: ${noHeader}`);
