import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyAccess } from './auth';
import { db } from './db';
import { env } from './config';
let io: Server | undefined;
export function startRealtime(server: HttpServer) {
  io = new Server(server, { cors: { origin: env.CORS_ORIGIN.split(',') } });
  io.use((socket, next) => {
    try { const token = socket.handshake.auth.token; if (typeof token !== 'string') throw Error(); socket.data.identity = verifyAccess(token); next() }
    catch { next(new Error('Unauthorized')) }
  });
  io.on('connection', socket => {
    const user = socket.data.identity as { id: string; role: string };
    socket.join('user:' + user.id);
    socket.on('ride:join', async (id: unknown, ack?: (value: { ok: boolean }) => void) => {
      if (typeof id !== 'string') { ack?.({ ok: false }); return }
      try {
        const ride = await db.ride.findUnique({ where: { id }, select: { riderId: true, driverId: true } });
        const ok = Boolean(ride && (ride.riderId === user.id || ride.driverId === user.id || user.role === 'ADMIN'));
        if (ok) socket.join('ride:' + id);
        ack?.({ ok });
      } catch { ack?.({ ok: false }) }
    });
  });
  return io;
}
export function emitRide(rideId: string, event: string, data: unknown) { io?.to('ride:' + rideId).emit(event, data) }
export function emitUser(userId: string, event: string, data: unknown) { io?.to('user:' + userId).emit(event, data) }
