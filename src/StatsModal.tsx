import { useEffect, useState } from 'react';
import { getRecords } from './storage';
import { dayNumber, seedForDay } from './engine/seed';
import { DailyRecord } from './engine/types';

const HOLES_PER_PAGE = 50;
const TOTAL_HOLES = 365;

interface Props {
  visible: boolean;
  onClose: () => void;
  onViewHole: (day: number) => void;
}

export default function StatsModal({ visible, onClose, onViewHole }: Props) {
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [page, setPage] = useState(0);

  const currentDay = dayNumber();
  const totalPages = Math.ceil(TOTAL_HOLES / HOLES_PER_PAGE);

  useEffect(() => {
    if (visible) {
      setRecords(getRecords());
      setPage(0);
    }
  }, [visible]);

  if (!visible) return null;

  const startHole = page * HOLES_PER_PAGE + 1;
  const endHole = Math.min(startHole + HOLES_PER_PAGE - 1, TOTAL_HOLES);

  const holes: { day: number; seed: string; record: DailyRecord | null; future: boolean }[] = [];
  for (let d = startHole; d <= endHole; d++) {
    const seed = seedForDay(d);
    holes.push({
      day: d,
      seed,
      record: records[seed] || null,
      future: d > currentDay,
    });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <button style={styles.x} onClick={(e) => { e.stopPropagation(); onClose(); }}>&times;</button>
        <div style={styles.title}>Holes</div>
        <div style={styles.subtitle}>
          {startHole}&ndash;{endHole} of {TOTAL_HOLES}
        </div>

        <div style={styles.grid}>
          {holes.map(({ day, record, future }) => {
            const played = record?.completed;
            const score = record?.score ?? 0;

            let bg = '#f5f5f7';
            let color = '#ccc';
            let label = '';

            if (future) {
              bg = '#fafafa';
              color = '#e0e0e0';
            } else if (played) {
              if (score < 0) {
                bg = '#e8f5e9';
                color = '#2e7d32';
                label = `${score}`;
              } else if (score === 0) {
                bg = '#e8f5e9';
                color = '#4caf50';
                label = '0';
              } else {
                bg = '#ffebee';
                color = '#c62828';
                label = `+${score}`;
              }
            }

            return (
              <div
                key={day}
                onClick={played ? () => onViewHole(day) : undefined}
                style={{
                  width: 52, height: 52, borderRadius: 10,
                  backgroundColor: bg,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: played ? 'pointer' : 'default',
                  transition: 'transform 0.1s',
                  border: day === currentDay ? '2px solid #1a1a2e' : '2px solid transparent',
                }}
              >
                <div style={{
                  fontSize: 9, fontWeight: 600, color: future ? '#e0e0e0' : '#9e9e9e',
                  letterSpacing: 0.5,
                }}>
                  #{day}
                </div>
                {played ? (
                  <div style={{
                    fontSize: 15, fontWeight: 700, color,
                    marginTop: 1,
                  }}>
                    {label}
                  </div>
                ) : (
                  <div style={{
                    fontSize: 11, color: future ? '#e0e0e0' : '#ccc',
                    marginTop: 1,
                  }}>
                    {future ? '' : '--'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.pagination}>
          <button
            style={{ ...styles.pageBtn, opacity: page > 0 ? 1 : 0.3 }}
            onClick={() => page > 0 && setPage(page - 1)}
            disabled={page === 0}
          >
            &larr;
          </button>
          <span style={styles.pageLabel}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            style={{ ...styles.pageBtn, opacity: page < totalPages - 1 ? 1 : 0.3 }}
            onClick={() => page < totalPages - 1 && setPage(page + 1)}
            disabled={page === totalPages - 1}
          >
            &rarr;
          </button>
        </div>

        <button style={styles.done} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '36px 20px 28px',
    width: '92%', maxWidth: 400, textAlign: 'center', position: 'relative',
    maxHeight: '85dvh', overflowY: 'auto',
  },
  x: {
    position: 'absolute', top: 8, right: 8,
    background: 'none', border: 'none', fontSize: 28, color: '#bdbdbd',
    cursor: 'pointer', zIndex: 10, width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 18, fontWeight: 600, color: '#1a1a2e',
    textTransform: 'uppercase', letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12, color: '#9e9e9e', marginTop: 4, marginBottom: 20,
    letterSpacing: 1,
  },
  grid: {
    display: 'flex', flexWrap: 'wrap', gap: 6,
    justifyContent: 'center',
  },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginTop: 20,
  },
  pageBtn: {
    background: 'none', border: '1.5px solid #e0e0e0', borderRadius: 10,
    width: 40, height: 40, fontSize: 18, color: '#616161',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pageLabel: {
    fontSize: 13, color: '#9e9e9e', letterSpacing: 1,
  },
  done: {
    marginTop: 20, background: '#1a1a2e', color: '#fff', border: 'none',
    padding: '12px 48px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer',
  },
};
