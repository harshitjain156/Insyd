import { pool } from './db.js';

async function createFollowNotification(event) {
  const actorResult = await pool.query('SELECT username FROM users WHERE id = $1', [event.actor_id]);
  const actor = actorResult.rows[0];
  const typeResult = await pool.query('SELECT id FROM notification_types WHERE name = $1', ['follow']);
  const typeId = typeResult.rows[0].id;
  const result = await pool.query(`
    INSERT INTO notifications (recipient_id, type_id, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    event.target_id,
    typeId,
    'New Follower',
    `${actor.username} started following you`,
    JSON.stringify({ actor_id: event.actor_id, actor_username: actor.username })
  ]);
  return result.rows[0];
}

async function createLikeNotification(event) {
  const actorResult = await pool.query('SELECT username FROM users WHERE id = $1', [event.actor_id]);
  const actor = actorResult.rows[0];
  const typeResult = await pool.query('SELECT id FROM notification_types WHERE name = $1', ['like']);
  const typeId = typeResult.rows[0].id;
  const recipientId = event.data?.post_owner_id || event.target_id;
  const result = await pool.query(`
    INSERT INTO notifications (recipient_id, type_id, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    recipientId,
    typeId,
    'Post Liked',
    `${actor.username} liked your post`,
    JSON.stringify({ 
      actor_id: event.actor_id, 
      actor_username: actor.username,
      post_id: event.target_id 
    })
  ]);
  return result.rows[0];
}

async function createCommentNotification(event) {
  const actorResult = await pool.query('SELECT username FROM users WHERE id = $1', [event.actor_id]);
  const actor = actorResult.rows[0];
  const typeResult = await pool.query('SELECT id FROM notification_types WHERE name = $1', ['comment']);
  const typeId = typeResult.rows[0].id;
  const recipientId = event.data?.post_owner_id || event.target_id;
  const result = await pool.query(`
    INSERT INTO notifications (recipient_id, type_id, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    recipientId,
    typeId,
    'New Comment',
    `${actor.username} commented on your post`,
    JSON.stringify({ 
      actor_id: event.actor_id, 
      actor_username: actor.username,
      post_id: event.target_id,
      comment: event.data?.comment || 'New comment'
    })
  ]);
  return result.rows[0];
}

async function createMentionNotification(event) {
  const actorResult = await pool.query('SELECT username FROM users WHERE id = $1', [event.actor_id]);
  const actor = actorResult.rows[0];
  const typeResult = await pool.query('SELECT id FROM notification_types WHERE name = $1', ['mention']);
  const typeId = typeResult.rows[0].id;
  const result = await pool.query(`
    INSERT INTO notifications (recipient_id, type_id, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    event.target_id,
    typeId,
    'You were mentioned',
    `${actor.username} mentioned you in a post`,
    JSON.stringify({ 
      actor_id: event.actor_id, 
      actor_username: actor.username,
      context: event.data?.context || 'mentioned you'
    })
  ]);
  return result.rows[0];
}

async function processEvent(event, io) {
  try {
    let notification = null;
    switch (event.type) {
      case 'follow':
        notification = await createFollowNotification(event);
        break;
      case 'like':
        notification = await createLikeNotification(event);
        break;
      case 'comment':
        notification = await createCommentNotification(event);
        break;
      case 'mention':
        notification = await createMentionNotification(event);
        break;
      default:
        console.log('Unknown event type:', event.type);
        return;
    }
    if (notification && io) {
      io.to(`user_${notification.recipient_id}`).emit('newNotification', notification);
    }
    await pool.query('UPDATE events SET processed = true WHERE id = $1', [event.id]);
  } catch (error) {
    console.error('Error processing event:', error);
  }
}

export {
  createFollowNotification,
  createLikeNotification,
  createCommentNotification,
  createMentionNotification,
  processEvent
}; 