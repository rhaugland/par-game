let getTokenFn: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

async function authFetch(url: string, opts: RequestInit = {}) {
  const token = await getTokenFn?.();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchProfile(): Promise<{ id: string; display_name: string; tickets: number; inventory: Record<string, number> }> {
  return authFetch('/api/profile');
}

export async function fetchRecords() {
  return authFetch('/api/records');
}

export async function saveGameRecord(data: {
  seed: string;
  moves: number;
  par: number;
  score: number;
  path: [number, number][];
  powerups_used?: Record<string, number>;
}) {
  return authFetch('/api/records', { method: 'POST', body: JSON.stringify(data) });
}

export async function buyPowerup(powerup: string): Promise<{ balance: number; inventory: Record<string, number> }> {
  return authFetch('/api/powerups?action=buy', {
    method: 'POST',
    body: JSON.stringify({ powerup }),
  });
}

export async function usePowerupApi(powerup: string, seed: string): Promise<{ inventory: Record<string, number> }> {
  return authFetch('/api/powerups?action=use', {
    method: 'POST',
    body: JSON.stringify({ powerup, seed }),
  });
}

export async function fetchStats() {
  return authFetch('/api/stats');
}
