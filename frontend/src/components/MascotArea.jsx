import { useState } from 'react';

export default function MascotArea() {
  const [imageError, setImageError] = useState(false);

  // Configurable animation values (easily adjustable)
  const FLOAT_SPEED = '4.5s';       // Duration of one complete float cycle (4-6s)
  const FLOAT_AMOUNT = '12px';      // Vertical displacement amount (more obvious)
  const BLINK_INTERVAL = '5.5s';   // Automatic eye blink interval (5-6s)

  const css = `
    @keyframes mascotFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-${FLOAT_AMOUNT}); }
    }
    
    @keyframes mascotBlink {
      0%, 96%, 100% { transform: scaleY(1); }
      98% { transform: scaleY(0.1); }
    }
    
    .mascot-container-animate {
      animation: mascotFloat ${FLOAT_SPEED} infinite ease-in-out;
    }
    
    .mascot-eye-left, .mascot-eye-right {
      animation: mascotBlink ${BLINK_INTERVAL} infinite ease-in-out;
      transform-origin: center;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .mascot-container-animate, .mascot-eye-left, .mascot-eye-right {
        animation: none !important;
        transform: none !important;
      }
    }
  `;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '442px',
        height: '598px',
        position: 'relative',
      }}
    >
      <style>{css}</style>

      {/* Soft backlighting behind mascot */}
      <div
        style={{
          position: 'absolute',
          width: '364px',
          height: '364px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, rgba(167, 139, 250, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Responsive Wrapper */}
      <div
        className="mascot-container-animate"
        style={{
          zIndex: 1,
          width: '100%',
          maxWidth: '442px',
          position: 'relative',
        }}
      >
        {!imageError ? (
          <>
            {/* Base Body Layer (blank face for eyes, mouth intact) */}
            <img
              src="/assets/sakura_base.png?v=final"
              alt="Sakura Base"
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />

            {/* Left Eye Layer */}
            <img
              src="/assets/sakura_left_eye.png?v=final"
              className="mascot-eye-left"
              alt="Left Eye"
              style={{
                position: 'absolute',
                left: '48.24%',
                top: '19.33%',
                width: '1.66%',
                height: '1.85%',
                objectFit: 'contain',
              }}
            />

            {/* Right Eye Layer */}
            <img
              src="/assets/sakura_right_eye.png?v=final"
              className="mascot-eye-right"
              alt="Right Eye"
              style={{
                position: 'absolute',
                left: '51.95%',
                top: '19.33%',
                width: '1.66%',
                height: '1.85%',
                objectFit: 'contain',
              }}
            />
          </>
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
              margin: '0 auto',
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

