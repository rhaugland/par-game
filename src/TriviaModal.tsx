import { useState } from 'react';
import { TriviaQuestion } from './engine/types';
import { getCategoryIcon } from './engine/trivia';

interface Props {
  question: TriviaQuestion;
  onResult: (correct: boolean | null) => void;
}

export default function TriviaModal({ question, onResult }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    setTimeout(() => onResult(idx === question.answer), 1200);
  };

  const icon = getCategoryIcon(question.category);
  const catLabel = question.category.charAt(0).toUpperCase() + question.category.slice(1);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {!revealed && (
          <button style={styles.closeBtn} onClick={() => onResult(null)} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
            </svg>
          </button>
        )}
        <div style={styles.catRow}>
          <span style={styles.icon}>{icon}</span>
          <span style={styles.cat}>{catLabel}</span>
        </div>
        <div style={styles.question}>{question.question}</div>
        {!revealed && (
          <div style={styles.stakes}>
            <span style={{ color: '#4caf50' }}>Correct: wall removed</span>
            <span style={{ color: '#9e9e9e' }}>|</span>
            <span style={{ color: '#ef5350' }}>Wrong: +1 stroke</span>
          </div>
        )}
        <div style={styles.choices}>
          {question.choices.map((choice, i) => {
            let bg = '#f5f5f7';
            let border = '2px solid transparent';
            let color = '#1a1a2e';

            if (revealed) {
              if (i === question.answer) {
                bg = '#e8f5e9';
                border = '2px solid #4caf50';
                color = '#2e7d32';
              } else if (i === selected && i !== question.answer) {
                bg = '#ffebee';
                border = '2px solid #ef5350';
                color = '#c62828';
              }
            } else if (i === selected) {
              border = '2px solid #1a1a2e';
            }

            return (
              <button
                key={i}
                style={{ ...styles.choice, backgroundColor: bg, border, color }}
                onClick={() => handleSelect(i)}
              >
                <span style={styles.choiceLetter}>{String.fromCharCode(65 + i)}</span>
                {choice}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div style={{
            ...styles.result,
            color: selected === question.answer ? '#4caf50' : '#ef5350',
          }}>
            {selected === question.answer ? 'Correct! Wall removed.' : 'Wrong! Wall stays.'}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '28px 24px',
    width: '88%', maxWidth: 360, position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9e9e9e', padding: 4, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  catRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  icon: { fontSize: 20 },
  cat: {
    fontSize: 11, fontWeight: 600, color: '#9e9e9e',
    textTransform: 'uppercase', letterSpacing: 2,
  },
  question: {
    fontSize: 17, fontWeight: 500, color: '#1a1a2e',
    lineHeight: 1.4, marginBottom: 20,
  },
  choices: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  choice: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 14,
    fontSize: 15, fontWeight: 500, cursor: 'pointer',
    textAlign: 'left', transition: 'all 0.15s',
  },
  choiceLetter: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stakes: {
    display: 'flex', justifyContent: 'center', gap: 8,
    fontSize: 12, fontWeight: 500, marginBottom: 14,
  },
  result: {
    textAlign: 'center', fontSize: 15, fontWeight: 600,
    marginTop: 18, letterSpacing: 0.3,
  },
};
