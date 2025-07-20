// server.js - Main server file
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import { pool, initDatabase } from './db.js';
import { redis, processQueuedEvents } from './queue.js';
import { processEvent } from './notifications.js';
import { initWebSocket } from './websocket.js';
import usersRouter from './routes/users.js';
import createEventsRouter from './routes/events.js';
import notificationsRouter from './routes/notifications.js';

const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// WebSocket setup
initWebSocket(io);

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/events', createEventsRouter(io));
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
  });
  processQueuedEvents(io);
}

startServer().catch(console.error);

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await redis.quit();
  await pool.end();
  server.close();
  process.exit(0);
}); 