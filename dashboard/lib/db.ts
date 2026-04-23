import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'nebulaguard',
});

// 1. ดึง Log ทั้งหมด (เหมือนเดิม)
export const getLogs = async () => {
  const result = await pool.query('SELECT * FROM intruder_logs ORDER BY created_at DESC LIMIT 50');
  return result.rows;
};

// 2. สรุปประเภท Event สำหรับ Donut Chart
export const getEventTypeStats = async () => {
  const result = await pool.query(`
    SELECT event_type as name, COUNT(*)::int as count 
    FROM intruder_logs 
    GROUP BY event_type
  `);
  return result.rows;
};

// 3. สรุปจำนวนการโจมตีตามเวลา (ย้อนหลัง 24 ชม.) สำหรับ Area Chart
export const getTimelineStats = async () => {
  const result = await pool.query(`
    SELECT to_char(created_at, 'HH24:00') as time, COUNT(*)::int as "Attacks"
    FROM intruder_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY time
    ORDER BY time ASC
  `);
  return result.rows;
};