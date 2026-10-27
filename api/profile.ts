import { getUserId, unauthorized, json } from './_auth.js';
import { getDb } from './_db.js';

export default async function handler(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const sql = getDb();

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
    if (rows.length === 0) {
      // Auto-create profile on first GET
      await sql`INSERT INTO profiles (id, display_name, tickets) VALUES (${userId}, '', 0) ON CONFLICT (id) DO NOTHING`;
      return json({ id: userId, display_name: '', tickets: 0 });
    }
    return json(rows[0]);
  }

  if (req.method === 'PATCH') {
    const body = await req.json();
    const { display_name } = body;
    await sql`UPDATE profiles SET display_name = ${display_name}, updated_at = now() WHERE id = ${userId}`;
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}
