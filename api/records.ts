import { getUserId, unauthorized, json } from './_auth';
import { getDb } from './_db';

export const config = { runtime: 'edge' };

// Ticket earning rules
function ticketsForScore(score: number): number {
  if (score <= -2) return 5;  // Eagle or better
  if (score === -1) return 3; // Birdie
  if (score === 0) return 1;  // Par
  return 0;                   // Bogey+
}

export default async function handler(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM game_records WHERE user_id = ${userId} ORDER BY seed DESC`;
    return json(rows);
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const { seed, moves, par, score, path, powerups_used } = body;

    const tickets = ticketsForScore(score);

    // Upsert game record
    await sql`
      INSERT INTO game_records (user_id, seed, moves, par, score, path, powerups_used, tickets_earned, completed, completed_at)
      VALUES (${userId}, ${seed}, ${moves}, ${par}, ${score}, ${JSON.stringify(path)}, ${JSON.stringify(powerups_used || {})}, ${tickets}, true, now())
      ON CONFLICT (user_id, seed) DO UPDATE SET
        moves = EXCLUDED.moves,
        par = EXCLUDED.par,
        score = EXCLUDED.score,
        path = EXCLUDED.path,
        powerups_used = EXCLUDED.powerups_used,
        tickets_earned = EXCLUDED.tickets_earned,
        completed = true,
        completed_at = now()
    `;

    // Award tickets
    if (tickets > 0) {
      // Ensure profile exists
      await sql`INSERT INTO profiles (id, tickets) VALUES (${userId}, 0) ON CONFLICT (id) DO NOTHING`;

      // Check if we already awarded for this seed (idempotency)
      const existing = await sql`
        SELECT id FROM powerup_ledger WHERE user_id = ${userId} AND seed = ${seed} AND type = 'earn'
      `;
      if (existing.length === 0) {
        await sql`INSERT INTO powerup_ledger (user_id, type, amount, reason, seed) VALUES (${userId}, 'earn', ${tickets}, ${score <= -2 ? 'eagle' : score === -1 ? 'birdie' : 'par'}, ${seed})`;
        await sql`UPDATE profiles SET tickets = tickets + ${tickets}, updated_at = now() WHERE id = ${userId}`;
      }
    }

    return json({ ok: true, tickets_earned: tickets });
  }

  return json({ error: 'Method not allowed' }, 405);
}
