export type Role = 'RIDER' | 'DRIVER' | 'ADMIN';
export type RideStatus = 'REQUESTED' | 'SEARCHING' | 'ACCEPTED' | 'ARRIVING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export interface Point { lat: number; lng: number }
export interface RideQuote { currency: 'IRR'; distanceKm: number; durationMin: number; surge: number; total: number }
export interface LoginResult { accessToken: string; refreshToken: string; user: { id: string; name: string; phone: string; role: Role } }
export interface Ride { id: string; riderId: string; driverId: string | null; status: RideStatus; pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; fare: number; createdAt: string }
