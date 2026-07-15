import { useEffect, useState } from 'react';

export default function TransitionOverlay({ active, onTransitionEnd }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        if (onTransitionEnd) onTransitionEnd();
      }, 600); // 600ms matching transition speed
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [active, onTransitionEnd]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9990,
        backgroundColor: '#03030c',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
        pointerEvents: visible ? 'all' : 'none',
      }}
    />
  );
}
