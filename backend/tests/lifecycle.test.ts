import { describe,it,expect } from 'vitest';
import { assertTransition } from '../src/lifecycle';
describe('ride state machine', () => {
  it('accepts the happy path', () => {
    const states = ['REQUESTED','SEARCHING','ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS','COMPLETED'] as const;
    for (let i = 1; i < states.length; i++) expect(() => assertTransition(states[i-1],states[i])).not.toThrow();
  });
  it('rejects skipping pickup', () => expect(() => assertTransition('ACCEPTED','COMPLETED')).toThrow());
  it('rejects completion of cancelled rides', () => expect(() => assertTransition('CANCELLED','COMPLETED')).toThrow());
});
