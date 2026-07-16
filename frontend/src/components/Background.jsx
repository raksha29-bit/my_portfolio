import { useMemo } from 'react';

export default function Background() {
  // Generate 80 stars at random positions with random twinkle speeds and delays
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 80; i++) {
      list.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1, // Size range: 1px to 3px
        delay: `${Math.random() * 5}s`,
        duration: `${2 + Math.random() * 4}s`,
      });
    }
    return list;
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -10,
        background: 'var(--bg-sky-gradient)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Moonlight lighting effect */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '10%',
          width: '700px',
          height: '700px',
          background: 'var(--glow-top-bg)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Soft Pinkish/Purple ambient glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-5%',
          width: '800px',
          height: '800px',
          background: 'var(--glow-bottom-bg)',
          borderRadius: '50%',
          filter: 'blur(100px)',
        }}
      />

      {/* Twilight Clouds */}
      <div className="twilight-clouds" style={{ opacity: 'var(--cloud-opacity, 0)', transition: 'opacity var(--transition-speed) var(--transition-easing)' }}>
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
      </div>

      {/* Stars Grid */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            opacity: 'var(--star-opacity-min, 0.1)',
            animation: `twinkle ${star.duration} infinite ease-in-out`,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
