#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const entry = join(__dirname, 'src', 'cli.ts');
const result = spawnSync(process.execPath, ['--import', 'tsx', entry, '--strict', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
