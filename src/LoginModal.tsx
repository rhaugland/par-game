import { SignIn, SignUp } from '@clerk/react';
import { useState } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (!visible) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <button style={styles.x} onClick={onClose}>&times;</button>

        {mode === 'signin' ? (
          <>
            <SignIn
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { boxShadow: 'none', border: 'none' },
                },
              }}
            />
            <div style={styles.toggle}>
              Don&apos;t have an account?{' '}
              <button style={styles.link} onClick={() => setMode('signup')}>Sign up</button>
            </div>
          </>
        ) : (
          <>
            <SignUp
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { boxShadow: 'none', border: 'none' },
                },
              }}
            />
            <div style={styles.toggle}>
              Already have an account?{' '}
              <button style={styles.link} onClick={() => setMode('signin')}>Sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '20px 16px',
    width: '92%', maxWidth: 400, position: 'relative',
    maxHeight: '90dvh', overflowY: 'auto',
  },
  x: {
    position: 'absolute', top: 8, right: 8,
    background: 'none', border: 'none', fontSize: 28, color: '#bdbdbd',
    cursor: 'pointer', zIndex: 10, width: 44, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  toggle: {
    textAlign: 'center', fontSize: 13, color: '#9e9e9e', marginTop: 8,
  },
  link: {
    background: 'none', border: 'none', color: '#1a1a2e',
    fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
    fontSize: 13,
  },
};
