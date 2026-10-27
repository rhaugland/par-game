import { getUserId, unauthorized, json } from './_auth.js';
import { getDb } from './_db.js';

export default async function handler(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const sql = getDb();

  const rows = await sql`
    SELECT score FROM game_records WHERE user_id = ${userId} AND completed = true
  `;

  const scores = rows.map(r => r.score as number);
  const played = scores.length;

  if (played === 0) {
    return json({ played: 0, avgScore: 0, bestScore: 0, streak: 0, parOrBetter: 0, birdies: 0, bogeys: 0, pars: 0 });
  }

  // Calculate streak from game_records by seed (date strings)
  const seedRows = await sql`
    SELECT seed FROM game_records WHERE user_id = ${userId} AND completed = true ORDER BY seed DESC
  `;

  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const seedSet = new Set(seedRows.map(r => r.seed as string));

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (seedSet.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return json({
    played,
    avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / played) * 10) / 10,
    bestScore: Math.min(...scores),
    streak,
    parOrBetter: scores.filter(s => s <= 0).length,
    birdies: scores.filter(s => s < 0).length,
    bogeys: scores.filter(s => s > 0).length,
    pars: scores.filter(s => s === 0).length,
  });
}
