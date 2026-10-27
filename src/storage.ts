import { DailyRecord } from './engine/types';
import { fetchRecords, saveGameRecord, fetchProfile, fetchStats as apiFetchStats } from './lib/api';

const RECORDS_KEY = 'par_records';
const TICKETS_KEY = 'par_tickets';
const INVENTORY_KEY = 'par_inventory';

// --- Local storage (guest mode) ---

function getLocalRecords(): Record<string, DailyRecord> {
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveLocalRecord(record: DailyRecord): void {
  const records = getLocalRecords();
  records[record.date] = record;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getLocalTodayRecord(date: string): DailyRecord | null {
  return getLocalRecords()[date] || null;
}

export function getLocalTickets(): number {
  return parseInt(localStorage.getItem(TICKETS_KEY) || '0', 10);
}

export function setLocalTickets(n: number): void {
  localStorage.setItem(TICKETS_KEY, String(n));
}

export function getLocalInventory(): Record<string, number> {
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : {};
}

export function setLocalInventory(inv: Record<string, number>): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}

export function getLocalStreak(): number {
  const records = getLocalRecords();
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

export function getLocalStats() {
  const records = getLocalRecords();
  const completed = Object.values(records).filter(r => r.completed);
  const streak = getLocalStreak();

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

// Ticket earning rules (mirrored from API)
function ticketsForScore(score: number): number {
  if (score <= -2) return 5;
  if (score === -1) return 3;
  if (score === 0) return 1;
  return 0;
}

// --- Unified interface ---
// Uses API when authenticated, localStorage when guest

export async function saveRecord(record: DailyRecord, isAuthenticated: boolean): Promise<{ ticketsEarned: number }> {
  // Always save locally as cache
  saveLocalRecord(record);

  if (isAuthenticated) {
    try {
      const result = await saveGameRecord({
        seed: record.date,
        moves: record.moves,
        par: record.par,
        score: record.score,
        path: record.path || [],
        powerups_used: record.powerups_used,
      });
      return { ticketsEarned: result.tickets_earned || 0 };
    } catch (e) {
      console.error('Failed to save to API, using local:', e);
    }
  }

  // Guest mode: track tickets locally
  const earned = ticketsForScore(record.score);
  if (earned > 0) {
    setLocalTickets(getLocalTickets() + earned);
  }
  return { ticketsEarned: earned };
}

export function getTodayRecord(date: string): DailyRecord | null {
  return getLocalTodayRecord(date);
}

export function getRecords(): Record<string, DailyRecord> {
  return getLocalRecords();
}

export async function syncRecordsFromApi(): Promise<Record<string, DailyRecord>> {
  try {
    const rows = await fetchRecords();
    const records: Record<string, DailyRecord> = getLocalRecords();

    for (const row of rows) {
      records[row.seed] = {
        date: row.seed,
        moves: row.moves,
        par: row.par,
        score: row.score,
        completed: row.completed,
        path: row.path,
        powerups_used: row.powerups_used,
      };
    }

    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    return records;
  } catch (e) {
    console.error('Failed to sync records:', e);
    return getLocalRecords();
  }
}

export async function getTickets(isAuthenticated: boolean): Promise<number> {
  if (isAuthenticated) {
    try {
      const profile = await fetchProfile();
      return profile.tickets;
    } catch {
      return getLocalTickets();
    }
  }
  return getLocalTickets();
}

export async function getStats(isAuthenticated: boolean) {
  if (isAuthenticated) {
    try {
      return await apiFetchStats();
    } catch {
      return getLocalStats();
    }
  }
  return getLocalStats();
}
