import { useState } from 'react';
import { PowerupType, POWERUP_COSTS, POWERUP_LIMITS } from './engine/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  tickets: number;
  inventory: Record<string, number>;
  powerupsUsed: Record<string, number>;
  completed: boolean;
  hasFailed: boolean;
  onBuy: (type: PowerupType) => void | Promise<void>;
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

function IceIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SandIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16M6 16h12M8 12h8" />
      <circle cx="12" cy="6" r="2" />
    </svg>
  );
}

function SkipIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,4 15,12 5,20" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

function FlagIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function MulliganIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9C7 3 3 7.03 3 12" />
      <polyline points="21 3 21 12 12 12" />
      <path d="M3 12a9 9 0 0 0 9 9c5 0 9-4.03 9-9" />
    </svg>
  );
}

function EraserIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16l10-10 7 7-3 3" />
      <path d="M6 11l7 7" />
      <line x1="18" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 8 14" />
      <line x1="4" y1="4" x2="4.01" y2="4.01" />
      <line x1="20" y1="4" x2="20.01" y2="4.01" />
    </svg>
  );
}

function BinocularsIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="4" />
      <circle cx="17" cy="17" r="4" />
      <path d="M7 13V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4h2V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v8" />
    </svg>
  );
}

interface PowerupEntry { type: PowerupType; label: string; icon: (color: string) => React.ReactNode; desc: string }
interface PowerupSection { heading: string; items: PowerupEntry[] }

const POWERUP_SECTIONS: PowerupSection[] = [
  {
    heading: 'Movement',
    items: [
      { type: 'backspace', label: 'Undo', icon: (c) => <UndoIcon color={c} />, desc: 'Undo your last move' },
      { type: 'bomb', label: 'Bomb', icon: (c) => <BombIcon color={c} />, desc: 'Destroy any wall cell' },
      { type: 'melt_ice', label: 'Melt Ice', icon: (c) => <IceIcon color={c} />, desc: 'Remove an ice tile (loses free move)' },
      { type: 'pave_sand', label: 'Pave Sand', icon: (c) => <SandIcon color={c} />, desc: 'Tap a sand tile to remove the penalty' },
      { type: 'skip_checkpoint', label: 'Skip CP', icon: (c) => <FlagIcon color={c} />, desc: 'Skip one unvisited checkpoint' },
    ],
  },
  {
    heading: 'Trivia',
    items: [
      { type: 'trivia_retry', label: 'Retry Q', icon: (c) => <RetryIcon color={c} />, desc: 'Retry a failed trivia question' },
      { type: 'trivia_skip', label: 'Skip Q', icon: (c) => <SkipIcon color={c} />, desc: 'Dismiss a trivia question' },
    ],
  },
  {
    heading: 'Time & Vision',
    items: [
      { type: 'time_freeze', label: 'Freeze', icon: (c) => <ClockIcon color={c} />, desc: 'Add 30 seconds to the clock' },
      { type: 'scout', label: 'Scout', icon: (c) => <BinocularsIcon color={c} />, desc: 'Preview par path for 3 seconds' },
      { type: 'par_path', label: 'Par Path', icon: (c) => <EyeIcon color={c} />, desc: 'Reveal the optimal route' },
    ],
  },
  {
    heading: 'Round',
    items: [
      { type: 'puzzle_retry', label: 'Restart', icon: (c) => <RestartIcon color={c} />, desc: 'Restart the puzzle fresh' },
      { type: 'mulligan', label: 'Mulligan', icon: (c) => <MulliganIcon color={c} />, desc: 'Replay a completed hole, keep better score' },
      { type: 'stroke_eraser', label: 'Eraser', icon: (c) => <EraserIcon color={c} />, desc: 'Remove 1 stroke from your round total' },
    ],
  },
];

const ALL_POWERUPS = POWERUP_SECTIONS.flatMap(s => s.items);

export default function ArcadeModal({ visible, onClose, tickets, inventory, powerupsUsed, completed, hasFailed, onBuy, onUse, dark }: Props) {
  const [selected, setSelected] = useState<PowerupType | null>(null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  if (!visible) return null;

  const bg = dark ? '#1a1a1a' : '#fff';
  const text = dark ? '#e0e0e0' : '#1a1a2e';
  const sub = dark ? '#666' : '#9e9e9e';
  const cardBg = dark ? '#242424' : '#f8f8fa';
  const border = dark ? '#333' : '#e8e8e8';
  const iconColor = dark ? '#aaa' : '#555';

  const selectedItem = selected ? ALL_POWERUPS.find(p => p.type === selected) : null;
  const selectedCost = selected ? POWERUP_COSTS[selected] : 0;
  const totalCost = selectedCost * qty;
  const maxAffordable = selected ? Math.floor(tickets / selectedCost) : 0;

  const openPurchase = (type: PowerupType) => {
    setSelected(type);
    setQty(1);
  };

  const confirmPurchase = async () => {
    if (!selected || qty < 1 || totalCost > tickets) return;
    setBuying(true);
    for (let i = 0; i < qty; i++) {
      await onBuy(selected);
    }
    setBuying(false);
    setSelected(null);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, background: bg }} onClick={e => e.stopPropagation()}>
        <button style={{ ...styles.x, color: dark ? '#666' : '#bdbdbd' }} onClick={onClose}>&times;</button>

        {/* Token balance */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 100,
            background: dark ? '#2a2a2a' : '#f0f0f0',
            fontSize: 16, fontWeight: 700, color: text,
          }}>
            <TokenIcon size={14} color={text} />
            {tickets}
          </div>
          <div style={{ fontSize: 10, color: sub, marginTop: 4, letterSpacing: 1 }}>TOKENS</div>
        </div>

        {/* Inventory section — only if you own something */}
        {(() => {
          const ownedItems = ALL_POWERUPS.filter(p => (inventory[p.type] || 0) > 0);
          if (ownedItems.length === 0) return null;
          return (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Inventory
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {ownedItems.map(({ type, label, icon, desc }) => {
                  const owned = inventory[type] || 0;
                  const usedThisPuzzle = powerupsUsed[type] || 0;
                  const limit = POWERUP_LIMITS[type];
                  const canUse = owned > 0 && usedThisPuzzle < limit && !completed
                    && (type !== 'trivia_retry' || hasFailed);

                  return (
                    <div key={type} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 14,
                      background: dark ? '#1e3a1e' : '#f1f8f1', border: `1.5px solid ${dark ? '#2e5a2e' : '#d4edd4'}`,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: dark ? '#2e5a2e' : '#e0f2e0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {icon(dark ? '#8bc34a' : '#4caf50')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</div>
                        <div style={{ fontSize: 10, color: sub, marginTop: 1 }}>{desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#8bc34a' : '#4caf50' }}>
                          x{owned}
                        </div>
                        <button
                          onClick={() => canUse && onUse(type)}
                          style={{
                            padding: '7px 14px', borderRadius: 8, border: 'none',
                            fontSize: 12, fontWeight: 700, cursor: canUse ? 'pointer' : 'default',
                            background: canUse ? '#4caf50' : (dark ? '#2a2a2a' : '#e0e0e0'),
                            color: canUse ? '#fff' : (dark ? '#444' : '#aaa'),
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* Shop sections */}
        {POWERUP_SECTIONS.map((section) => (
          <div key={section.heading} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: sub,
              letterSpacing: 2, textTransform: 'uppercase',
              marginBottom: 6, marginTop: 4,
            }}>
              {section.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {section.items.map(({ type, label, icon, desc }) => {
                const cost = POWERUP_COSTS[type];
                return (
                  <div key={type} onClick={() => openPurchase(type)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 14,
                    background: cardBg, border: `1.5px solid ${border}`,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: dark ? '#333' : '#eee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {icon(iconColor)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</div>
                      <div style={{ fontSize: 10, color: sub, marginTop: 1 }}>{desc}</div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 700,
                      color: dark ? '#888' : '#999',
                      flexShrink: 0,
                    }}>
                      {cost}<TokenIcon size={10} color={dark ? '#888' : '#999'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: sub }}>
          Earn tokens by scoring Par or better
        </div>
      </div>

      {/* Purchase popup */}
      {selectedItem && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200,
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: bg, borderRadius: 20, padding: '24px 20px',
            width: '85%', maxWidth: 320, textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            {/* Icon + name */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: dark ? '#333' : '#eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              {selectedItem.icon(iconColor)}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: text, marginBottom: 4 }}>
              {selectedItem.label}
            </div>
            <div style={{ fontSize: 12, color: sub, marginBottom: 20 }}>
              {selectedItem.desc}
            </div>

            {/* Quantity selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${border}`,
                  background: dark ? '#2a2a2a' : '#f5f5f5', color: text,
                  fontSize: 20, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: qty <= 1 ? 0.3 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                &minus;
              </button>
              <div style={{ fontSize: 28, fontWeight: 700, color: text, minWidth: 40 }}>
                {qty}
              </div>
              <button
                onClick={() => setQty(q => Math.min(q + 1, Math.max(1, maxAffordable)))}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${border}`,
                  background: dark ? '#2a2a2a' : '#f5f5f5', color: text,
                  fontSize: 20, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: qty >= maxAffordable ? 0.3 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                +
              </button>
            </div>

            {/* Total cost */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14, fontWeight: 600, color: sub, marginBottom: 16,
            }}>
              Total: <span style={{ color: text, fontWeight: 700 }}>{totalCost}</span>
              <TokenIcon size={12} color={text} />
            </div>

            {/* Confirm / Cancel */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: `1.5px solid ${border}`, background: 'none',
                  fontSize: 13, fontWeight: 600, color: sub, cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={buying || totalCost > tickets || maxAffordable < 1}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: (totalCost <= tickets && !buying) ? 'pointer' : 'default',
                  background: (totalCost <= tickets && !buying) ? '#4caf50' : (dark ? '#2a2a2a' : '#e0e0e0'),
                  color: (totalCost <= tickets && !buying) ? '#fff' : (dark ? '#444' : '#aaa'),
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {buying ? 'Buying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
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
