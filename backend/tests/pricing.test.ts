import { describe,it,expect } from 'vitest';
import { price } from '../src/pricing';
const a = {lat:35.68,lng:51.38};
describe('pricing', () => {
  it('enforces minimum and uses IRR', () => {
    expect(price(a,a,{base:1000,perKm:0,perMinute:0,minimum:5000,surge:1})).toMatchObject({total:5000,currency:'IRR'});
  });
  it('applies surge to fare', () => {
    const config = {base:1000,perKm:100,perMinute:100,minimum:0,surge:1};
    const base = price(a,{lat:35.69,lng:51.38},config);
    const doubled = price(a,{lat:35.69,lng:51.38},{...config,surge:2});
    expect(doubled.total).toBe(base.total*2);
  });
  it('rejects an excessive surge', () => expect(() => price(a,a,{base:0,perKm:0,perMinute:0,minimum:0,surge:4})).toThrow());
});
