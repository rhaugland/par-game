import { getDb } from './_db.js';
import { json } from './_auth.js';

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  // Protect with admin secret
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key || key !== process.env.ADMIN_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const sql = getDb();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Total unique visitors (all time)
  const [totalVisitors] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
  `;

  // Total registered users (visitors who have a user_id)
  const [totalAccounts] = await sql`
    SELECT COUNT(DISTINCT user_id) as count FROM visits WHERE user_id IS NOT NULL
  `;

  // DAU today
  const [dauToday] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date = ${today}::date
  `;

  // DAU yesterday (for comparison)
  const [dauYesterday] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date = ${yesterday}::date
  `;

  // MAU (last 30 days)
  const [mauCurrent] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date >= ${thirtyDaysAgo}::date
  `;

  // Previous MAU (30-60 days ago)
  const [mauPrevious] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date >= ${sixtyDaysAgo}::date
      AND visited_at::date < ${thirtyDaysAgo}::date
  `;

  // DAU today: accounts vs anonymous
  const [dauAccounts] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date = ${today}::date AND user_id IS NOT NULL
  `;

  // MAU: accounts vs anonymous
  const [mauAccounts] = await sql`
    SELECT COUNT(DISTINCT visitor_id) as count FROM visits
    WHERE visited_at::date >= ${thirtyDaysAgo}::date AND user_id IS NOT NULL
  `;

  // Daily visits for last 30 days (for chart)
  const dailyVisits = await sql`
    SELECT
      visited_at::date as date,
      COUNT(DISTINCT visitor_id) as visitors,
      COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN visitor_id END) as accounts
    FROM visits
    WHERE visited_at::date >= ${thirtyDaysAgo}::date
    GROUP BY visited_at::date
    ORDER BY date
  `;

  const mauGrowth = Number(mauPrevious.count) > 0
    ? Math.round(((Number(mauCurrent.count) - Number(mauPrevious.count)) / Number(mauPrevious.count)) * 100)
    : null;

  const dauGrowth = Number(dauYesterday.count) > 0
    ? Math.round(((Number(dauToday.count) - Number(dauYesterday.count)) / Number(dauYesterday.count)) * 100)
    : null;

  return json({
    totalVisitors: Number(totalVisitors.count),
    totalAccounts: Number(totalAccounts.count),
    dau: {
      today: Number(dauToday.count),
      yesterday: Number(dauYesterday.count),
      accounts: Number(dauAccounts.count),
      anonymous: Number(dauToday.count) - Number(dauAccounts.count),
      growth: dauGrowth,
    },
    mau: {
      current: Number(mauCurrent.count),
      previous: Number(mauPrevious.count),
      accounts: Number(mauAccounts.count),
      anonymous: Number(mauCurrent.count) - Number(mauAccounts.count),
      growth: mauGrowth,
    },
    dailyVisits: dailyVisits.map(r => ({
      date: r.date,
      visitors: Number(r.visitors),
      accounts: Number(r.accounts),
    })),
  });
}
