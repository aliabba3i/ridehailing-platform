import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { db } from './db';
import { HttpError } from './errors';
import { env } from './config';
import type { Role } from '@ride/shared';
export interface Identity { id: string; role: Role }
declare global { namespace Express { interface Request { identity?: Identity } } }
export const hashToken = (v: string) => createHash('sha256').update(v).digest('hex');
export async function credentials(user: { id: string; name: string; phone: string; role: Role }) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m', issuer: 'ridehailing' });
  const refreshToken = randomBytes(48).toString('base64url');
  await db.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000) } });
  return { user: { id: user.id, name: user.name, phone: user.phone, role: user.role }, accessToken, refreshToken };
}
export function verifyAccess(token: string): Identity {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'ridehailing' });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !['RIDER','DRIVER','ADMIN'].includes(String(payload.role))) throw Error();
    return { id: payload.sub, role: payload.role as Role };
  } catch { throw new HttpError(401, 'Unauthorized') }
}
export function requireAuth(roles: Role[] = []) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const value = req.headers.authorization;
      if (!value?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');
      req.identity = verifyAccess(value.slice(7));
      if (roles.length && !roles.includes(req.identity.role)) throw new HttpError(403, 'Forbidden');
      next();
    } catch (error) { next(error) }
  };
}
export async function register(name: string, phone: string, password: string, role: Role) {
  if (role === 'ADMIN') throw new HttpError(403, 'Admin self-registration disabled');
  const passwordHash = await argon2.hash(password);
  try {
    const user = await db.user.create({ data: { name, phone, passwordHash, role, ...(role === 'DRIVER' ? { driver: { create: {} } } : {}) } });
    return credentials(user);
  } catch (e: any) { if (e.code === 'P2002') throw new HttpError(409, 'Account already exists'); throw e }
}
export async function login(phone: string, password: string) {
  const user = await db.user.findUnique({ where: { phone } });
  if (!user || !(await argon2.verify(user.passwordHash, password))) throw new HttpError(401, 'Invalid credentials');
  return credentials(user);
}
export async function rotate(refreshToken: string) {
  const hash = hashToken(refreshToken);
  return db.$transaction(async tx => {
    const existing = await tx.refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) throw new HttpError(401, 'Invalid refresh token');
    const updated = await tx.refreshToken.updateMany({ where: { id: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (updated.count !== 1) throw new HttpError(401, 'Refresh token already used');
    const token = randomBytes(48).toString('base64url');
    await tx.refreshToken.create({ data: { userId: existing.userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 86400000) } });
    const accessToken = jwt.sign({ sub: existing.userId, role: existing.user.role }, env.JWT_ACCESS_SECRET, { issuer: 'ridehailing', expiresIn: '15m' });
    return { accessToken, refreshToken: token };
  });
}
