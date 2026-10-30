import { db } from './db';
import { distanceKm, type Point } from '@ride/shared';
export async function closestDriver(pickup: Point, radiusKm = Number(process.env.MAX_SEARCH_RADIUS_KM ?? 8)) {
  const drivers = await db.driverProfile.findMany({
    where: { online: true, verified: true, lat: { not: null }, lng: { not: null }, locationUpdatedAt: { gte: new Date(Date.now() - 60000) },
      user: { driverRides: { none: { status: { in: ['ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS'] } } } } },
    take: 200
  });
  return drivers.map(d => ({ profile: d, distance: distanceKm(pickup, { lat: d.lat!, lng: d.lng! }) }))
    .filter(d => d.distance <= radiusKm).sort((a,b) => a.distance - b.distance)[0]?.profile ?? null;
}
