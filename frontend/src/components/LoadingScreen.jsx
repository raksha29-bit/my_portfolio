import { useEffect, useState } from 'react';

export default function LoadingScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show loading screen for 1.2s, then trigger fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1200);

    // Call onComplete callback after fade-out transition finishes (1.6s total)
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#03030c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* Decorative spinning ring */}
      <div
        style={{
          width: '56px',
          height: '56px',
          border: '2px solid rgba(129, 140, 248, 0.1)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 1.2s linear infinite',
          marginBottom: '24px',
        }}
      />
      
      {/* Clean loading typography */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: '500',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
      >
        Initializing World
      </div>
    </div>
  );
}
