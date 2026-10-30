import { describe,it,expect } from 'vitest';
import { distanceKm, validPoint } from '@ride/shared';
describe('geolocation', () => {
  it('returns zero for identical coordinates', () => expect(distanceKm({lat:0,lng:0},{lat:0,lng:0})).toBe(0));
  it('rejects coordinates beyond bounds', () => expect(validPoint({lat:91,lng:0})).toBe(false));
});
