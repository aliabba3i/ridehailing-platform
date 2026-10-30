import type { RideStatus } from '@ride/shared';
import { HttpError } from './errors';
const transitions: Record<RideStatus, readonly RideStatus[]> = {
  REQUESTED: ['SEARCHING','CANCELLED'],
  SEARCHING: ['ACCEPTED','CANCELLED','EXPIRED'],
  ACCEPTED: ['ARRIVING','CANCELLED'],
  ARRIVING: ['ARRIVED','CANCELLED'],
  ARRIVED: ['IN_PROGRESS','CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: []
};
export function assertTransition(from: RideStatus, to: RideStatus): void {
  if (!transitions[from]?.includes(to)) throw new HttpError(409, 'Illegal ride transition: ' + from + ' -> ' + to);
}
