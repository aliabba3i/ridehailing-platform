import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { env } from './config';
import { HttpError } from './errors';
import { credentials, hashToken, login, register, requireAuth, rotate } from './auth';
import { pricingConfig, price } from './pricing';
import { acceptRide, cancelRide, createRide, transitionRide } from './services/rides';
import { emitRide } from './realtime';
import { validPoint } from '@ride/shared';
const app = express();
app.disable('x-powered-by');
app.use(helmet()); app.use(cors({ origin: env.CORS_ORIGIN.split(',') })); app.use(express.json({ limit: '32kb' }));
app.use(rateLimit({ windowMs: 15 * 60_000, limit: 150, standardHeaders: 'draft-7', legacyHeaders: false }));
const asyncRoute = (fn: (req: express.Request, res: express.Response) => Promise<unknown>): express.RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req,res)).catch(next) };
const credentialsSchema = z.object({ phone: z.string().trim().min(5).max(40), password: z.string().min(12).max(128) });
const point = z.object({ lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180) });
const routePoints = z.object({ pickup: point, dropoff: point });
const idParam = z.object({ id: z.string().uuid() });
app.get('/health', (_req,res) => res.json({ status: 'ok' }));
app.get('/ready', asyncRoute(async (_req,res) => { await db.$queryRaw`SELECT 1`; res.json({ status: 'ready' }) }));
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
app.post('/auth/register', authLimit, asyncRoute(async (req,res) => {
  const data = credentialsSchema.extend({ name: z.string().trim().min(2).max(100), role: z.enum(['RIDER','DRIVER']) }).parse(req.body);
  res.status(201).json(await register(data.name, data.phone, data.password, data.role));
}));
app.post('/auth/login', authLimit, asyncRoute(async (req,res) => {
  const data = credentialsSchema.parse(req.body); res.json(await login(data.phone,data.password));
}));
app.post('/auth/refresh', authLimit, asyncRoute(async (req,res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(req.body);
  res.json(await rotate(refreshToken));
}));
app.post('/auth/logout', requireAuth(), asyncRoute(async (req,res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(32) }).parse(req.body);
  await db.refreshToken.updateMany({ where: { userId: req.identity!.id, tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  res.status(204).end();
}));
app.get('/users/me', requireAuth(), asyncRoute(async (req,res) => {
  const user = await db.user.findUniqueOrThrow({ where: { id: req.identity!.id }, select: { id:true, name:true, phone:true, role:true, createdAt:true, driver:true } }); res.json(user);
}));
app.post('/rides/quote', requireAuth(['RIDER']), (req,res) => {
  const data = routePoints.parse(req.body);
  if (!validPoint(data.pickup) || !validPoint(data.dropoff)) throw new HttpError(400,'Invalid coordinates');
  res.json(price(data.pickup,data.dropoff,pricingConfig()));
});
app.post('/rides', requireAuth(['RIDER']), asyncRoute(async (req,res) => {
  const data = routePoints.parse(req.body); res.status(201).json(await createRide(req.identity!.id,data.pickup,data.dropoff));
}));
app.get('/rides', requireAuth(), asyncRoute(async (req,res) => {
  const identity = req.identity!;
  res.json(await db.ride.findMany({ where: identity.role === 'ADMIN' ? {} : identity.role === 'RIDER' ? { riderId: identity.id } : { driverId: identity.id }, orderBy: { createdAt: 'desc' }, take: 100 }));
}));
app.get('/rides/:id', requireAuth(), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params);
  const ride = await db.ride.findUnique({ where: { id }, include: { rating: true, payment: true, events: { orderBy: { createdAt: 'asc' } } } });
  if (!ride) throw new HttpError(404,'Ride not found');
  if (req.identity!.role !== 'ADMIN' && ride.riderId !== req.identity!.id && ride.driverId !== req.identity!.id) throw new HttpError(403,'Forbidden');
  res.json(ride);
}));
app.post('/rides/:id/accept', requireAuth(['DRIVER']), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params); res.json(await acceptRide(id,req.identity!.id));
}));
app.post('/rides/:id/status', requireAuth(['DRIVER']), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params);
  const { status } = z.object({ status: z.enum(['ARRIVING','ARRIVED','IN_PROGRESS','COMPLETED']) }).parse(req.body);
  res.json(await transitionRide(id,req.identity!.id,status));
}));
app.post('/rides/:id/cancel', requireAuth(['RIDER','DRIVER']), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params); res.json(await cancelRide(id,req.identity!.id));
}));
app.post('/rides/:id/rating', requireAuth(['RIDER']), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params);
  const { score, comment } = z.object({ score: z.number().int().min(1).max(5), comment: z.string().max(500).optional() }).parse(req.body);
  const ride = await db.ride.findUnique({ where: { id } });
  if (!ride) throw new HttpError(404,'Ride not found');
  if (ride.riderId !== req.identity!.id || ride.status !== 'COMPLETED' || !ride.driverId) throw new HttpError(403,'Ride not eligible for rating');
  try {
    res.status(201).json(await db.rating.create({ data: { rideId: id, fromUserId: req.identity!.id, toUserId: ride.driverId, score, comment } }));
  } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new HttpError(409,'Already rated'); throw error }
}));
app.post('/drivers/availability', requireAuth(['DRIVER']), asyncRoute(async (req,res) => {
  const { online } = z.object({ online: z.boolean() }).parse(req.body);
  const driver = await db.driverProfile.update({ where: { userId: req.identity!.id }, data: { online } });
  res.json(driver);
}));
app.post('/drivers/location', requireAuth(['DRIVER']), asyncRoute(async (req,res) => {
  const { lat,lng } = point.parse(req.body);
  const driver = await db.driverProfile.update({ where: { userId: req.identity!.id }, data: { lat,lng,locationUpdatedAt: new Date() } });
  const rides = await db.ride.findMany({ where: { driverId: req.identity!.id, status: { in: ['ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS'] } }, select: { id:true } });
  for (const ride of rides) emitRide(ride.id,'driver:location',{ lat,lng, driverId: req.identity!.id, timestamp: new Date().toISOString() });
  res.json({ lat: driver.lat, lng: driver.lng, updatedAt: driver.locationUpdatedAt });
}));
app.get('/drivers/offers', requireAuth(['DRIVER']), asyncRoute(async (req,res) => {
  const driver = await db.driverProfile.findUnique({ where: { userId: req.identity!.id } });
  if (!driver?.online || !driver.verified || driver.lat === null || driver.lng === null || !driver.locationUpdatedAt || Date.now() - driver.locationUpdatedAt.getTime() > 60000) { res.json([]); return }
  const rides = await db.ride.findMany({ where: { status: 'SEARCHING' }, orderBy: { createdAt: 'desc' }, take: 50 });
  const { distanceKm } = await import('@ride/shared');
  res.json(rides.filter(r => distanceKm({lat:driver.lat!,lng:driver.lng!},{lat:r.pickupLat,lng:r.pickupLng}) <= 8));
}));
app.post('/payments/:rideId/pay', requireAuth(['RIDER']), asyncRoute(async (req,res) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);
  const ride = await db.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new HttpError(404,'Ride not found');
  if (ride.riderId !== req.identity!.id || ride.status !== 'COMPLETED') throw new HttpError(403,'Payment is only available to rider after completion');
  const payment = await db.payment.upsert({ where: { rideId }, create: { rideId, amount: ride.fare, currency: ride.currency, status: 'SUCCEEDED', provider: 'mock', providerReference: 'mock-' + rideId }, update: {} });
  res.json(payment);
}));
app.get('/payments/:rideId', requireAuth(), asyncRoute(async (req,res) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);
  const ride = await db.ride.findUnique({ where: { id: rideId }, include: { payment: true } });
  if (!ride) throw new HttpError(404,'Ride not found');
  if (req.identity!.role !== 'ADMIN' && ride.riderId !== req.identity!.id && ride.driverId !== req.identity!.id) throw new HttpError(403,'Forbidden');
  res.json(ride.payment);
}));
app.get('/admin/summary', requireAuth(['ADMIN']), asyncRoute(async (_req,res) => {
  const [users, drivers, rides, completed] = await Promise.all([db.user.count(), db.user.count({ where: { role: 'DRIVER' } }),db.ride.count(),db.ride.count({ where: { status: 'COMPLETED' } })]);
  res.json({ users,drivers,rides,completed });
}));
app.get('/admin/users', requireAuth(['ADMIN']), asyncRoute(async (_req,res) => {
  res.json(await db.user.findMany({ select: { id:true,name:true,phone:true,role:true,createdAt:true,driver:true }, orderBy: { createdAt:'desc' },take:100 }));
}));
app.get('/admin/rides', requireAuth(['ADMIN']), asyncRoute(async (_req,res) => {
  res.json(await db.ride.findMany({ orderBy: { createdAt:'desc' },take:100 }));
}));
app.post('/admin/drivers/:id/verify', requireAuth(['ADMIN']), asyncRoute(async (req,res) => {
  const { id } = idParam.parse(req.params);
  const { verified } = z.object({ verified: z.boolean() }).parse(req.body);
  res.json(await db.driverProfile.update({ where: { userId:id }, data: { verified, ...(!verified ? { online:false } : {}) } }));
}));
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) { res.status(400).json({ error:'Validation failed',details:error.flatten() }); return }
  if (error instanceof HttpError) { res.status(error.status).json({ error:error.message }); return }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { res.status(404).json({ error:'Record not found' }); return }
  console.error(error); res.status(500).json({ error:'Internal server error' });
};
app.use(errors);
export default app;
