import express from 'express';
import { pool } from '../db.js';
import { redis } from '../queue.js';
import { processEvent } from '../notifications.js';

function createEventsRouter(io) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { type, actor_id, target_id, data } = req.body;
    try {
      const eventResult = await pool.query(
        'INSERT INTO events (type, actor_id, target_id, data) VALUES ($1, $2, $3, $4) RETURNING *',
        [type, actor_id, target_id, JSON.stringify(data || {})]
      );
      const event = eventResult.rows[0];
      await redis.lPush('notification_queue', JSON.stringify(event));
      res.status(201).json(event);
      processEvent(event, io);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  return router;
}

export default createEventsRouter; 