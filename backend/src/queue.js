import Redis from 'redis';
import { processEvent } from './notifications.js';

const redis = Redis.createClient({
  username: 'default',
  password:process.env.REDIS_KEY,
  socket: {
    host: 'redis-17694.c73.us-east-1-2.ec2.redns.redis-cloud.com',
    port: 17694
  }
});
redis.connect();

async function processQueuedEvents(io) {
  try {
    const eventData = await redis.brPop('notification_queue', 5);
    if (eventData) {
      const event = JSON.parse(eventData.element);
      await processEvent(event, io);
    }
  } catch (error) {
    console.error('Error processing queued event:', error);
  }
  setImmediate(() => processQueuedEvents(io));
}

export { redis, processQueuedEvents }; 