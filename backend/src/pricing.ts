import { distanceKm, type Point } from '@ride/shared';
export interface PricingConfig { base: number; perKm: number; perMinute: number; minimum: number; surge: number }
export function price(pickup: Point, dropoff: Point, config: PricingConfig) {
  const distance = distanceKm(pickup, dropoff);
  const duration = Math.ceil(distance / 0.4); // Assumes an average urban speed of 24 km/h
  if (!Number.isFinite(config.surge) || config.surge < 1 || config.surge > 3) throw new Error('Surge must be between 1 and 3');
  if ([config.base, config.perKm, config.perMinute, config.minimum].some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid tariff');
  const fare = Math.max(config.minimum, Math.round((config.base + distance * config.perKm + duration * config.perMinute) * config.surge));
  if (!Number.isSafeInteger(fare)) throw new Error('Fare outside safe integer range');
  return { currency: 'IRR' as const, total: fare, distanceKm: Number(distance.toFixed(3)), durationMin: duration, surge: config.surge };
}
export function pricingConfig(): PricingConfig {
  return { base: Number(process.env.BASE_FARE ?? 50000), perKm: Number(process.env.PRICE_PER_KM ?? 12000), perMinute: Number(process.env.PRICE_PER_MINUTE ?? 3000), minimum: Number(process.env.MIN_FARE ?? 80000), surge: Number(process.env.SURGE_MULTIPLIER ?? 1) };
}
