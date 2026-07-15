import { useState, useEffect } from 'react';

export default function DialogueBox({ dialogues, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleText, setVisibleText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Validate dialogue list
  const activeDialogue = dialogues && dialogues.length > 0 && currentIndex < dialogues.length
    ? dialogues[currentIndex]
    : null;

  const handleNext = () => {
    if (!activeDialogue) return;

    if (isTyping) {
      // Skip typing effect and show full text
      setVisibleText(activeDialogue.text);
      setIsTyping(false);
      return;
    }

    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  // Typing effect using safe absolute string slice
  useEffect(() => {
    if (!activeDialogue || !activeDialogue.text) {
      setVisibleText('');
      setIsTyping(false);
      return;
    }

    let charIndex = 0;
    setVisibleText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      charIndex++;
      if (charIndex <= activeDialogue.text.length) {
        setVisibleText(activeDialogue.text.slice(0, charIndex));
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // Smooth typing (20ms per character)

    return () => clearInterval(interval);
  }, [currentIndex, dialogues]);

  // Keyboard shortcut listener (Enter and Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling on spacebar
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isTyping, dialogues]);

  if (!activeDialogue) return null;

  const isLastDialogue = currentIndex === dialogues.length - 1;

  return (
    <div
      onClick={handleNext}
      style={{
        width: '100%',
        maxWidth: '860px',
        minHeight: '140px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.04) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px 36px 36px 36px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Gloss border reflection */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '32px',
          right: '32px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)',
        }}
      />

      {/* Speaker Name */}
      {activeDialogue.speaker && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--accent-color)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            opacity: 0.9,
          }}
        >
          {activeDialogue.speaker}
        </div>
      )}

      {/* Readability Optimized Text Block */}
      <div
        style={{
          fontSize: '17px',
          lineHeight: '1.8',
          color: '#ffffff',
          fontWeight: '500',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {visibleText}
      </div>

      {/* Pulsing Continue Indicator */}
      {!isTyping && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '32px',
            color: 'var(--accent-color)',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '1.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'pulse 1.5s infinite',
            opacity: 0.8,
          }}
        >
          <span>{isLastDialogue ? 'ENTER WORLD' : 'CONTINUE'}</span>
          <span style={{ fontSize: '9px' }}>▼</span>
        </div>
      )}
    </div>
  );
}
