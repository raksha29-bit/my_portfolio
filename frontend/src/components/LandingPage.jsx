import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from './Background';
import LoadingScreen from './LoadingScreen';
import AudioController from './AudioController';
import MascotArea from './MascotArea';
import DialogueBox from './DialogueBox';
import TransitionOverlay from './TransitionOverlay';

const LANDING_DIALOGUES = [
  { id: 1, speaker: 'Sakura', text: 'Welcome.' },
  { id: 2, speaker: 'Sakura', text: "I'm Sakura." },
  { id: 3, speaker: 'Sakura', text: "I'll be your guide through this world." },
  { id: 4, speaker: 'Sakura', text: "This isn't simply a portfolio." },
  { id: 5, speaker: 'Sakura', text: "It's a collection of everything I've created." }
];

export default function LandingPage() {
  const [loading, setLoading] = useState(true);
  const [startTransition, setStartTransition] = useState(false);
  const navigate = useNavigate();

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  const handleDialogueComplete = () => {
    setStartTransition(true);
  };

  const handleTransitionEnd = () => {
    navigate('/world');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 24px 40px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Twilight Starry Background */}
      <Background />

      {/* Loading Overlay */}
      {loading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* Audio Indicator */}
      {!loading && <AudioController />}

      {/* Nav Transition Overlay */}
      <TransitionOverlay active={startTransition} onTransitionEnd={handleTransitionEnd} />

      {!loading && (
        <>
          {/* Upper Zone: Mascot placement */}
          <div
            className="fade-in"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '860px',
              margin: '0 auto',
            }}
          >
            {/* Shift Mascot left to stand beside dialogue box area */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-start',
                paddingLeft: '16px',
              }}
            >
              <MascotArea />
            </div>
          </div>

          {/* Lower Zone: Dialogue Box aligned to the bottom */}
          <div
            className="fade-in"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px',
            }}
          >
            <DialogueBox dialogues={LANDING_DIALOGUES} onComplete={handleDialogueComplete} />
          </div>
        </>
      )}
    </div>
  );
}
