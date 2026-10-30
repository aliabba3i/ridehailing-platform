'use strict';

const { spawnSync } = require('node:child_process');
const { dirname, join, resolve } = require('node:path');
const { config } = require('dotenv');

// npm workspace commands execute in backend/, while the project .env lives at root.
config({ path: resolve(__dirname, '../../.env') });

const prismaPackagePath = require.resolve('prisma/package.json');
const prismaCli = join(dirname(prismaPackagePath), 'build', 'index.js');
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error('Failed to launch Prisma CLI:', result.error);
  process.exit(1);
}

if (result.signal) {
  console.error('Prisma CLI terminated by signal:', result.signal);
  process.exit(1);
}

process.exit(result.status ?? 1);
