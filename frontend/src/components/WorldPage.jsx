import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Background from './Background';
import { Sparkles, Shield } from 'lucide-react';
import { resolveUrl } from '../utils/api';

export default function WorldPage() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, itemsRes] = await Promise.all([
          fetch(resolveUrl('/api/v1/portfolio/sections')),
          // Public endpoint returns only published, non-deleted items
          fetch(resolveUrl('/api/v1/portfolio/items?status=published'))
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

      {/* Development Admin Access Link */}
      <Link
        to="/login"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          zIndex: 100,
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.25)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'}
      >
        <Shield size={12} />
        <span>Admin Portal</span>
      </Link>

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
            color: 'var(--text-title)',
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
        <div
          className="fade-in"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '40px 32px',
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
          <div
            style={{
              display: 'inline-flex',
              padding: '14px',
              backgroundColor: 'var(--accent-light)',
              borderRadius: '50%',
              color: 'var(--accent-color)',
              marginBottom: '20px',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
            No Active Constellations Discovered
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
            No portfolio sections exist yet. Create your first section (Projects, Artwork, Resume, etc.) in the CMS to populate this world.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary btn-sm"
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            Go to Admin CMS
          </button>
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
                  background: 'var(--glass-card-bg)',
                  border: 'var(--glass-card-border)',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  boxSizing: 'border-box',
                  transition: 'all var(--transition-speed) var(--transition-easing), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="constellation-node"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                  e.currentTarget.style.border = 'var(--glass-card-hover-border)';
                  e.currentTarget.style.boxShadow = 'var(--glass-card-hover-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.border = 'var(--glass-card-border)';
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
                    filter: 'drop-shadow(0 0 8px var(--glass-card-hover-glow))',
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
                    color: 'var(--text-title)',
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
