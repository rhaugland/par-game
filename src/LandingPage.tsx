interface Props {
  dark: boolean;
  onPlay: () => void;
}

export default function LandingPage({ dark, onPlay }: Props) {
  const bg = dark ? '#121212' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#888' : '#666';
  const muted = dark ? '#555' : '#bdbdbd';
  const cardBg = dark ? '#1e1e1e' : '#f8f9fa';
  const cardBorder = dark ? '#2a2a2a' : '#eee';

  return (
    <div style={{ background: bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginTop: '12dvh', marginBottom: 48 }}>
        <div style={{
          fontSize: 56, fontWeight: 200, color: text, letterSpacing: 16,
          lineHeight: 1,
        }}>
          par
        </div>
        <div style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: muted, marginTop: 8,
        }}>
          daily maze challenge
        </div>
        <div style={{
          fontSize: 16, color: sub, marginTop: 24, lineHeight: 1.6,
          maxWidth: 320,
        }}>
          One puzzle. Six obstacles. Sixty seconds.
        </div>
      </div>

      {/* Feature grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        maxWidth: 360, width: '100%', marginBottom: 40,
      }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: 14, padding: '16px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: text, letterSpacing: 1 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 9, color: muted, marginTop: 3, lineHeight: 1.3 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onPlay}
        style={{
          background: '#1a1a2e', color: '#fff', border: 'none',
          padding: '16px 48px', borderRadius: 100, fontSize: 16,
          fontWeight: 500, cursor: 'pointer', letterSpacing: 1,
          marginBottom: 24,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Play Today's Puzzle
      </button>

      {/* How it works */}
      <div style={{ maxWidth: 340, width: '100%', marginBottom: 48 }}>
        <div style={{
          fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
          color: muted, textAlign: 'center', marginBottom: 16,
        }}>
          How it works
        </div>
        {STEPS.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12, flexShrink: 0,
              background: cardBg, border: `1px solid ${cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: sub,
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{step.title}</div>
              <div style={{ fontSize: 11, color: sub, marginTop: 2, lineHeight: 1.4 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Scoring */}
      <div style={{
        maxWidth: 340, width: '100%', marginBottom: 48,
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 16, padding: '20px 16px',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
          color: muted, textAlign: 'center', marginBottom: 14,
        }}>
          Golf scoring
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {SCORES.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: muted, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: muted, marginBottom: 32, textAlign: 'center', letterSpacing: 1 }}>
        A new puzzle every day at midnight
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: '\u2744\uFE0F', label: 'ICE', desc: "Can't change direction" },
  { icon: '\u23F1\uFE0F', label: 'TIMER', desc: '60 sec or penalty' },
  { icon: '\u26A0\uFE0F', label: 'TRAPS', desc: 'Back to start +2' },
  { icon: '\u2753', label: 'TRIVIA', desc: 'Answer to pass' },
  { icon: '\u{1F3DD}\uFE0F', label: 'SAND', desc: '2x move cost' },
  { icon: '\u{1F6A9}', label: 'CHECKPTS', desc: 'Visit all first' },
];

const STEPS = [
  { title: 'Draw your path', desc: 'Swipe from start to end through the maze grid' },
  { title: 'Dodge obstacles', desc: 'Navigate ice, sand, traps, trivia walls, and checkpoints' },
  { title: 'Beat the par', desc: 'Finish under par to earn tokens for the shop' },
];

const SCORES = [
  { val: '-2', label: 'EAGLE', color: '#2e7d32' },
  { val: '-1', label: 'BIRDIE', color: '#4caf50' },
  { val: '0', label: 'PAR', color: '#ff9800' },
  { val: '+1', label: 'BOGEY', color: '#f44336' },
];
