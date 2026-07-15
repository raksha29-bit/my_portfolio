import { useNavigate } from 'react-router-dom';
import Background from './Background';
import { Compass, ArrowLeft } from 'lucide-react';

export default function WorldPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Night Sky Atmosphere */}
      <Background />

      <div
        className="fade-in"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '44px 36px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Pulsing indicator */}
        <div
          style={{
            display: 'inline-flex',
            padding: '16px',
            backgroundColor: 'var(--accent-light)',
            borderRadius: '50%',
            color: 'var(--accent-color)',
            marginBottom: '28px',
            animation: 'pulse 2s infinite',
          }}
        >
          <Compass size={32} />
        </div>

        {/* Story Transition Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            lineHeight: '1.8',
            color: 'var(--text-secondary)',
            marginBottom: '36px',
          }}
        >
          <p style={{ color: '#ffffff', fontWeight: '500', fontSize: '18px', marginBottom: '8px' }}>
            The gates have opened.
          </p>
          <p>The world beyond is still being prepared.</p>
          <p>Return soon.</p>
          <p style={{ color: 'var(--accent-color)', fontWeight: '500', marginTop: '4px' }}>
            The next chapter awaits.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ padding: '8px 20px', borderRadius: '20px' }}>
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Return to Gates
          </button>
        </div>
      </div>
    </div>
  );
}
