import { Prisma, type RideStatus } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../errors';
import { assertTransition } from '../lifecycle';
import { closestDriver } from '../matching';
import { price, pricingConfig } from '../pricing';
import { emitRide, emitUser } from '../realtime';
import { distanceKm, type Point } from '@ride/shared';
const active = ['ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS'] as const;
export async function createRide(riderId: string, pickup: Point, dropoff: Point) {
  const quote = price(pickup, dropoff, pricingConfig());
  const existing = await db.ride.findFirst({ where: { riderId, status: { in: ['REQUESTED','SEARCHING',...active] } } });
  if (existing) throw new HttpError(409, 'An active ride already exists');
  const ride = await db.ride.create({ data: { riderId, pickupLat: pickup.lat, pickupLng: pickup.lng, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, distanceKm: quote.distanceKm, durationMin: quote.durationMin, surge: quote.surge, fare: quote.total, status: 'SEARCHING', events: { create: [{ toStatus: 'REQUESTED', actorId: riderId }, { fromStatus: 'REQUESTED', toStatus: 'SEARCHING', actorId: riderId }] } } });
  const driver = await closestDriver(pickup);
  if (driver) emitUser(driver.userId, 'ride:offer', ride);
  emitUser(riderId, 'ride:created', ride);
  return ride;
}
export async function acceptRide(rideId: string, driverId: string) {
  const profile = await db.driverProfile.findUnique({ where: { userId: driverId } });
  if (!profile?.online || !profile.verified || !profile.locationUpdatedAt || Date.now() - profile.locationUpdatedAt.getTime() > 60000) throw new HttpError(403, 'Driver is unavailable or not verified');
  const target = await db.ride.findUnique({ where: { id: rideId }, select: { pickupLat: true, pickupLng: true, status: true } });
  if (!target || target.status !== 'SEARCHING') throw new HttpError(409, 'Ride is not available');
  if (profile.lat == null || profile.lng == null || distanceKm({ lat: profile.lat, lng: profile.lng }, { lat: target.pickupLat, lng: target.pickupLng }) > Number(process.env.MAX_SEARCH_RADIUS_KM ?? 8)) throw new HttpError(403, 'Pickup is outside driver service radius');
  const ride = await db.$transaction(async tx => {
    const busy = await tx.ride.findFirst({ where: { driverId, status: { in: [...active] } } });
    if (busy) throw new HttpError(409, 'Driver is already assigned');
    const updated = await tx.ride.updateMany({ where: { id: rideId, status: 'SEARCHING', driverId: null }, data: { driverId, status: 'ACCEPTED' } });
    if (updated.count !== 1) throw new HttpError(409, 'Ride no longer available');
    await tx.rideEvent.create({ data: { rideId, actorId: driverId, fromStatus: 'SEARCHING', toStatus: 'ACCEPTED' } });
    return tx.ride.findUniqueOrThrow({ where: { id: rideId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  emitRide(rideId, 'ride:updated', ride); emitUser(ride.riderId, 'ride:updated', ride);
  return ride;
}
export async function transitionRide(rideId: string, driverId: string, next: RideStatus) {
  const ride = await db.$transaction(async tx => {
    const current = await tx.ride.findUnique({ where: { id: rideId } });
    if (!current) throw new HttpError(404, 'Ride not found');
    if (current.driverId !== driverId) throw new HttpError(403, 'Not assigned driver');
    assertTransition(current.status, next);
    const changed = await tx.ride.updateMany({ where: { id: rideId, status: current.status, driverId }, data: { status: next, ...(next === 'COMPLETED' ? { completedAt: new Date() } : {}) } });
    if (!changed.count) throw new HttpError(409, 'Ride changed during update');
    await tx.rideEvent.create({ data: { rideId, actorId: driverId, fromStatus: current.status, toStatus: next } });
    return tx.ride.findUniqueOrThrow({ where: { id: rideId } });
  });
  emitRide(ride.id, 'ride:updated', ride); emitUser(ride.riderId, 'ride:updated', ride);
  return ride;
}
export async function cancelRide(rideId: string, actorId: string) {
  const ride = await db.$transaction(async tx => {
    const current = await tx.ride.findUnique({ where: { id: rideId } });
    if (!current) throw new HttpError(404, 'Ride not found');
    if (current.riderId !== actorId && current.driverId !== actorId) throw new HttpError(403, 'Forbidden');
    assertTransition(current.status, 'CANCELLED');
    const changed = await tx.ride.updateMany({ where: { id: rideId, status: current.status }, data: { status: 'CANCELLED' } });
    if (!changed.count) throw new HttpError(409, 'Ride changed during cancellation');
    await tx.rideEvent.create({ data: { rideId, actorId, fromStatus: current.status, toStatus: 'CANCELLED' } });
    return tx.ride.findUniqueOrThrow({ where: { id: rideId } });
  });
  emitRide(ride.id, 'ride:updated', ride); emitUser(ride.riderId, 'ride:updated', ride);
  return ride;
}
