import type { LoginResult, Ride, RideQuote, Point } from './types';
export class ApiClient {
  constructor(public readonly baseUrl: string, private token?: string) {}
  setToken(token?: string): void { this.token = token }
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.baseUrl.replace(/\/$/, '') + path, {
      ...options, headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as { error?: string }).error || 'Request failed');
    return data as T;
  }
  login(phone: string, password: string) { return this.request<LoginResult>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }) }
  register(name: string, phone: string, password: string, role: 'RIDER' | 'DRIVER') { return this.request<LoginResult>('/auth/register', { method: 'POST', body: JSON.stringify({ name, phone, password, role }) }) }
  quote(pickup: Point, dropoff: Point) { return this.request<RideQuote>('/rides/quote', { method: 'POST', body: JSON.stringify({ pickup, dropoff }) }) }
  requestRide(pickup: Point, dropoff: Point) { return this.request<Ride>('/rides', { method: 'POST', body: JSON.stringify({ pickup, dropoff }) }) }
  myRides() { return this.request<Ride[]>('/rides') }
}
