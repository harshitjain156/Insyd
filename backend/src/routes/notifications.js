import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        n.*,
        nt.name as type_name,
        u.username as actor_username
      FROM notifications n
      JOIN notification_types nt ON n.type_id = nt.id
      LEFT JOIN users u ON (n.data->>'actor_id')::int = u.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  try {
    const result = await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 RETURNING *',
      [notificationId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router; 