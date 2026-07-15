import { useState } from 'react';

export default function MascotArea() {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '340px',
        height: '460px',
        position: 'relative',
      }}
    >
      {/* Soft backlighting behind mascot */}
      <div
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, rgba(167, 139, 250, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Target image frame */}
      <div
        style={{
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!imageError ? (
          <img
            src="/assets/sakura.png"
            alt="Sakura Guide"
            onError={() => setImageError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          /* Framed layout placeholder */
          <div
            style={{
              width: '280px',
              height: '380px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '10px',
                opacity: 0.8,
              }}
            >
              Mascot Space
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                opacity: 0.5,
              }}
            >
              Asset Placeholder
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--accent-color)',
                marginTop: '16px',
                opacity: 0.7,
              }}
            >
              [ sakura.png ]
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
