import { DailyRecord } from './engine/types';

const RECORDS_KEY = 'par_records';

export function saveRecord(record: DailyRecord): void {
  const records = getRecords();
  records[record.date] = record;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getRecords(): Record<string, DailyRecord> {
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : {};
}

export function getTodayRecord(date: string): DailyRecord | null {
  const records = getRecords();
  return records[date] || null;
}

export function getStreak(): number {
  const records = getRecords();
  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (records[key]?.completed) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function getStats() {
  const records = getRecords();
  const completed = Object.values(records).filter(r => r.completed);
  const streak = getStreak();

  if (completed.length === 0) {
    return { played: 0, avgScore: 0, bestScore: 0, streak: 0, parOrBetter: 0, birdies: 0, bogeys: 0, pars: 0 };
  }

  const scores = completed.map(r => r.score);
  return {
    played: completed.length,
    avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    bestScore: Math.min(...scores),
    streak,
    parOrBetter: scores.filter(s => s <= 0).length,
    birdies: scores.filter(s => s < 0).length,
    bogeys: scores.filter(s => s > 0).length,
    pars: scores.filter(s => s === 0).length,
  };
}
