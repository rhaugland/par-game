import { getDb } from './_db.js';
import { json } from './_auth.js';

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const sql = getDb();

  // Ensure tables exist
  await sql`
    CREATE TABLE IF NOT EXISTS game_records (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      seed TEXT NOT NULL,
      moves INT NOT NULL,
      par INT NOT NULL,
      score INT NOT NULL,
      path JSONB,
      powerups_used JSONB DEFAULT '{}',
      tickets_earned INT DEFAULT 0,
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, seed)
    )
  `;

  // Aggregate lifetime stats per user, join with profiles for display name
  const rows = await sql`
    SELECT
      g.user_id,
      COALESCE(p.display_name, '') as display_name,
      SUM(g.score) as total_score,
      COUNT(*) as holes_played,
      SUM(g.par) as total_par,
      MIN(g.score) as best_hole,
      COUNT(DISTINCT g.seed) as days_played
    FROM game_records g
    LEFT JOIN profiles p ON p.id = g.user_id
    WHERE g.completed = true
    GROUP BY g.user_id, p.display_name
    HAVING COUNT(*) >= 9
    ORDER BY SUM(g.score) ASC
    LIMIT 50
  `;

  return json(rows.map((r, i) => ({
    rank: i + 1,
    displayName: r.display_name || `Player ${r.user_id.slice(-4)}`,
    totalScore: Number(r.total_score),
    holesPlayed: Number(r.holes_played),
    totalPar: Number(r.total_par),
    bestHole: Number(r.best_hole),
    daysPlayed: Number(r.days_played),
  })));
}
