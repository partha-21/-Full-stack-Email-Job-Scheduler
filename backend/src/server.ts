import path from 'path';
import dotenv from 'dotenv';
import net from 'net';
import { RedisMemoryServer } from 'redis-memory-server';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function startServer() {
  const redisPort = 6379;
  
  const isRedisRunning = await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(redisPort, '127.0.0.1');
  });

  if (!isRedisRunning) {
    try {
      console.log('📦 Starting auto-configured Redis Memory Server on port 6379...');
      const rms = new RedisMemoryServer({ instance: { port: redisPort } });
      await rms.getHost();
      await rms.getPort();
      console.log(`✅ In-Memory Redis server successfully online at 127.0.0.1:${redisPort}`);
    } catch (err: any) {
      console.warn('⚠️ RedisMemoryServer start warning:', err.message);
    }
  }

  const { default: app } = await import('./app');
  await import('./workers/email.worker');

  const PORT = Number(process.env.PORT) || 5000;

  const server = app.listen(PORT, () => {
    console.log(`
 🚀 ReachInbox Backend API running on http://localhost:${PORT}
 📊 BullMQ Dashboard available at http://localhost:${PORT}/admin/queues
    `);
  });

  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
