import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from './Background';
import { Sparkles, HelpCircle } from 'lucide-react';

export default function WorldPage() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, itemsRes] = await Promise.all([
          fetch('/api/v1/portfolio/sections'),
          // Public endpoint returns only published, non-deleted items
          fetch('/api/v1/portfolio/items')
        ]);

        if (secRes.ok && itemsRes.ok) {
          const secData = await secRes.json();
          const itemsData = await itemsRes.json();

          // Filter active sections and ignore global utility assets
          setSections(secData.filter(s => s.is_active && s.slug !== 'global'));
          setItems(itemsData);
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCreationCount = (sectionId) => {
    return items.filter(item => item.section_id === sectionId).length;
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Starry Night Atmosphere */}
      <Background />

      {/* Header Info */}
      <div
        className="fade-in"
        style={{
          textAlign: 'center',
          marginBottom: '64px',
          maxWidth: '600px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--accent-color)',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            marginBottom: '12px',
          }}
        >
          Grand Observatory
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '1px',
          }}
        >
          Celestial Archive
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: '1.7',
            margin: 0,
          }}
        >
          Select a glowing constellation to explore Sakura's creations.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '60px', zIndex: 10 }}>
          Aligning constellations...
        </div>
      ) : sections.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', padding: '60px', zIndex: 10, textAlign: 'center' }}>
          No active constellations discovered. Set sections to Active in the CMS.
        </div>
      ) : (
        /* Constellation map flex grid */
        <div
          className="fade-in"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '40px',
            maxWidth: '1000px',
            width: '100%',
            zIndex: 10,
            animationDelay: '0.2s',
          }}
        >
          {sections.map((sec, idx) => {
            const count = getCreationCount(sec.id);
            // Stagger position offset slightly for organic constellation map feel
            const offsetTop = idx % 2 === 0 ? '15px' : '-15px';

            return (
              <div
                key={sec.id}
                onClick={() => navigate(`/world/section/${sec.slug}`)}
                style={{
                  position: 'relative',
                  marginTop: offsetTop,
                  cursor: 'pointer',
                  width: '260px',
                  height: '180px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  boxSizing: 'border-box',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="constellation-node"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                  e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.25)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Connector lines behind nodes */}
                <div
                  style={{
                    position: 'absolute',
                    width: '30px',
                    height: '1px',
                    background: 'linear-gradient(to right, rgba(167, 139, 250, 0.3), transparent)',
                    right: '-32px',
                    top: '50%',
                    pointerEvents: 'none',
                    display: idx === sections.length - 1 ? 'none' : 'block',
                  }}
                />

                {/* Glowing center star */}
                <div
                  style={{
                    fontSize: '24px',
                    marginBottom: '16px',
                    filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.6))',
                    animation: 'pulse 3s infinite ease-in-out',
                  }}
                >
                  {sec.icon || '📁'}
                </div>

                {/* Destination name */}
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <Sparkles size={12} style={{ color: 'var(--accent-color)' }} />
                  {sec.name}
                </div>

                {/* Creations count */}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.5px',
                  }}
                >
                  {count} {count === 1 ? 'creation' : 'creations'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
