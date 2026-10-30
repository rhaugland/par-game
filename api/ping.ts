import { getDb } from './_db.js';
import { getUserId, json } from './_auth.js';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const sql = getDb();

  // Ensure visits table exists
  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      user_id TEXT,
      visited_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits (visited_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits (visitor_id)`;

  const body = await req.json().catch(() => ({}));
  const visitorId = body.visitorId;
  if (!visitorId || typeof visitorId !== 'string') {
    return json({ error: 'visitorId required' }, 400);
  }

  // Check if authenticated
  const userId = await getUserId(req);

  // Deduplicate: only one visit per visitor per day
  const today = new Date().toISOString().slice(0, 10);
  const existing = await sql`
    SELECT id FROM visits
    WHERE visitor_id = ${visitorId}
      AND visited_at::date = ${today}::date
    LIMIT 1
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO visits (visitor_id, user_id)
      VALUES (${visitorId}, ${userId})
    `;
  } else if (userId) {
    // Update with user_id if they signed in after initial visit
    await sql`
      UPDATE visits SET user_id = ${userId}
      WHERE visitor_id = ${visitorId}
        AND visited_at::date = ${today}::date
        AND user_id IS NULL
    `;
  }

  return json({ ok: true });
}
