import { Pool } from 'pg';

const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'insyd',
  password: '12345',
  port: 5432,
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        default_enabled BOOLEAN DEFAULT true
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id INTEGER REFERENCES users(id),
        type_id INTEGER REFERENCES notification_types(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        actor_id INTEGER REFERENCES users(id),
        target_id INTEGER,
        data JSONB,
        processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO notification_types (name, description) 
      VALUES 
        ('follow', 'User follow notifications'),
        ('like', 'Content like notifications'),
        ('comment', 'Comment notifications'),
        ('mention', 'Mention notifications')
      ON CONFLICT (name) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO users (username, email) 
      VALUES 
        ('john_architect', 'john@example.com'),
        ('sarah_designer', 'sarah@example.com'),
        ('mike_planner', 'mike@example.com')
      ON CONFLICT (username) DO NOTHING
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export { pool, initDatabase }; 