import { describe,it,expect,vi } from 'vitest';
import request from 'supertest';
vi.mock('../src/db', () => ({ db: {} }));
vi.mock('../src/realtime', () => ({ emitRide: vi.fn(),emitUser: vi.fn() }));
describe('health endpoint', () => {
  it('responds with healthy status', async () => {
    process.env.JWT_ACCESS_SECRET ||= 'test_access_secret_that_is_more_than_thirty_two_chars';
    process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_that_is_more_than_thirty_two_chars';
    process.env.DATABASE_URL ||= 'postgresql://local:local@localhost:5432/local';
    const {default:app} = await import('../src/app');
    const response = await request(app).get('/health');
    expect(response.status).toBe(200); expect(response.body).toEqual({status:'ok'});
  });
});
