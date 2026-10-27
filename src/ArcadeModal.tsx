import { PowerupType, POWERUP_COSTS, POWERUP_LIMITS } from './engine/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  tickets: number;
  inventory: Record<string, number>;
  powerupsUsed: Record<string, number>;
  completed: boolean;
  hasFailed: boolean;
  onBuy: (type: PowerupType) => void;
  onUse: (type: PowerupType) => void;
  dark: boolean;
}

// SVG icon components — no emojis
function UndoIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RetryIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function BombIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="13" r="8" />
      <line x1="16" y1="4" x2="19" y2="1" />
      <line x1="15" y1="5" x2="18" y2="5" />
      <line x1="16" y1="4" x2="16" y2="7" />
    </svg>
  );
}

function RestartIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function EyeIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TokenIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

const POWERUPS: { type: PowerupType; label: string; icon: (color: string) => React.ReactNode; desc: string }[] = [
  { type: 'backspace', label: 'Undo', icon: (c) => <UndoIcon color={c} />, desc: 'Undo your last move' },
  { type: 'trivia_retry', label: 'Retry Q', icon: (c) => <RetryIcon color={c} />, desc: 'Retry a failed trivia question' },
  { type: 'bomb', label: 'Bomb', icon: (c) => <BombIcon color={c} />, desc: 'Destroy any wall cell' },
  { type: 'puzzle_retry', label: 'Restart', icon: (c) => <RestartIcon color={c} />, desc: 'Restart the puzzle fresh' },
  { type: 'par_path', label: 'Par Path', icon: (c) => <EyeIcon color={c} />, desc: 'Reveal the optimal route' },
];

export default function ArcadeModal({ visible, onClose, tickets, inventory, powerupsUsed, completed, hasFailed, onBuy, onUse, dark }: Props) {
  if (!visible) return null;

  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const cardBg = dark ? '#242424' : '#f8f8fa';
  const border = dark ? '#333' : '#e8e8e8';
  const iconColor = dark ? '#aaa' : '#555';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, background: bg }} onClick={e => e.stopPropagation()}>
        <button style={{ ...styles.x, color: dark ? '#666' : '#bdbdbd' }} onClick={onClose}>&times;</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: text, letterSpacing: 3, textTransform: 'uppercase' }}>
            Shop
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 10, padding: '8px 20px', borderRadius: 100,
            background: dark ? '#2a2a2a' : '#f0f0f0',
            fontSize: 16, fontWeight: 700, color: text,
          }}>
            <TokenIcon size={14} color={text} />
            {tickets}
          </div>
          <div style={{ fontSize: 10, color: sub, marginTop: 4, letterSpacing: 1 }}>TOKENS</div>
        </div>

        {/* Powerups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {POWERUPS.map(({ type, label, icon, desc }) => {
            const cost = POWERUP_COSTS[type];
            const owned = inventory[type] || 0;
            const usedThisPuzzle = powerupsUsed[type] || 0;
            const limit = POWERUP_LIMITS[type];
            const canUse = owned > 0 && usedThisPuzzle < limit && !completed
              && (type !== 'trivia_retry' || hasFailed);
            const canBuy = tickets >= cost;

            return (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: cardBg, border: `1.5px solid ${border}`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: dark ? '#333' : '#eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {icon(iconColor)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{label}</div>
                  <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>{desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {owned > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: sub, letterSpacing: 0.5 }}>
                      x{owned}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => canBuy && onBuy(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '6px 10px', borderRadius: 8, border: 'none',
                        fontSize: 11, fontWeight: 700, cursor: canBuy ? 'pointer' : 'default',
                        background: canBuy ? (dark ? '#2e7d32' : '#e8f5e9') : (dark ? '#2a2a2a' : '#f5f5f5'),
                        color: canBuy ? (dark ? '#fff' : '#2e7d32') : (dark ? '#444' : '#ccc'),
                        opacity: canBuy ? 1 : 0.5,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {cost}<TokenIcon size={10} color={canBuy ? (dark ? '#fff' : '#2e7d32') : (dark ? '#444' : '#ccc')} />
                    </button>
                    <button
                      onClick={() => canUse && onUse(type)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: 'none',
                        fontSize: 11, fontWeight: 700, cursor: canUse ? 'pointer' : 'default',
                        background: canUse ? '#1a1a2e' : (dark ? '#2a2a2a' : '#f5f5f5'),
                        color: canUse ? '#fff' : (dark ? '#444' : '#ccc'),
                        opacity: canUse ? 1 : 0.5,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Use
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: sub }}>
          Earn tokens by scoring Par or better
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 150,
  },
  modal: {
    borderRadius: 24, padding: '24px 16px 24px',
    width: '92%', maxWidth: 380, position: 'relative',
    maxHeight: '85dvh', overflowY: 'auto',
  },
  x: {
    position: 'absolute', top: 8, right: 8,
    background: 'none', border: 'none', fontSize: 28,
    cursor: 'pointer', zIndex: 10, width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
