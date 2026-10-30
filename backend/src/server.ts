import { createServer } from 'node:http';
import app from './app';
import { env } from './config';
import { db } from './db';
import { startRealtime } from './realtime';
const server = createServer(app);
startRealtime(server);
server.listen(env.PORT, '0.0.0.0', () => console.log('RideHailing API listening on ' + env.PORT));
async function shutdown() {
  server.close(async () => { await db.$disconnect(); process.exit(0) });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
