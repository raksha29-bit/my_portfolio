import { VolumeX } from 'lucide-react';

export default function AudioController() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <button
        disabled
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'not-allowed',
          opacity: 0.5,
          transition: 'all 0.2s ease',
        }}
        title="Ambient audio is disabled in this phase"
      >
        <VolumeX size={16} />
      </button>
    </div>
  );
}
