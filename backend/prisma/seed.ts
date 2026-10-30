import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Keep local workspace commands consistent with the repository-root .env file.
loadEnv({ path: resolve(__dirname, '../../.env') });
import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password === 'change-this-before-seeding') throw new Error('Set ADMIN_EMAIL and a strong ADMIN_PASSWORD before seeding');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must have at least 12 characters');
  await prisma.user.upsert({ where: { phone: email }, update: {}, create: { name: 'Administrator', phone: email, passwordHash: await argon2.hash(password), role: Role.ADMIN } });
  console.log('Admin account initialized');
}
main().finally(() => prisma.$disconnect()).catch(e => { console.error(e); process.exitCode = 1 });
