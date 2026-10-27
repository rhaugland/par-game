import { getUserId, unauthorized, json } from './_auth';
import { getDb } from './_db';

export const config = { runtime: 'edge' };

const POWERUP_COSTS: Record<string, number> = {
  backspace: 1,
  trivia_retry: 2,
  bomb: 3,
  puzzle_retry: 5,
  par_path: 8,
};

export default async function handler(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const sql = getDb();
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'buy';

  if (req.method === 'POST' && action === 'buy') {
    const body = await req.json();
    const { powerup } = body;

    const cost = POWERUP_COSTS[powerup];
    if (!cost) return json({ error: 'Invalid powerup' }, 400);

    const rows = await sql`SELECT tickets, inventory FROM profiles WHERE id = ${userId}`;
    if (rows.length === 0) return json({ error: 'Profile not found' }, 404);

    const balance = rows[0].tickets as number;
    const inventory = (rows[0].inventory || {}) as Record<string, number>;

    if (balance < cost) return json({ error: 'Not enough tickets', balance }, 400);

    inventory[powerup] = (inventory[powerup] || 0) + 1;

    await sql`UPDATE profiles SET tickets = tickets - ${cost}, inventory = ${JSON.stringify(inventory)}, updated_at = now() WHERE id = ${userId}`;
    await sql`INSERT INTO powerup_ledger (user_id, type, amount, reason, seed) VALUES (${userId}, 'spend', ${cost}, ${'buy_' + powerup}, ${null})`;

    return json({ ok: true, balance: balance - cost, inventory });
  }

  if (req.method === 'POST' && action === 'use') {
    const body = await req.json();
    const { powerup, seed } = body;

    if (!POWERUP_COSTS[powerup]) return json({ error: 'Invalid powerup' }, 400);

    const rows = await sql`SELECT inventory FROM profiles WHERE id = ${userId}`;
    if (rows.length === 0) return json({ error: 'Profile not found' }, 404);

    const inventory = (rows[0].inventory || {}) as Record<string, number>;
    if ((inventory[powerup] || 0) <= 0) return json({ error: 'Not in inventory' }, 400);

    inventory[powerup] = inventory[powerup] - 1;

    await sql`UPDATE profiles SET inventory = ${JSON.stringify(inventory)}, updated_at = now() WHERE id = ${userId}`;
    await sql`INSERT INTO powerup_ledger (user_id, type, amount, reason, seed) VALUES (${userId}, 'spend', 0, ${'use_' + powerup}, ${seed})`;

    return json({ ok: true, inventory });
  }

  return json({ error: 'Method not allowed' }, 405);
}
