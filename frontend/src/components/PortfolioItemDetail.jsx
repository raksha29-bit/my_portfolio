import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Background from './Background';
import { ArrowLeft, ExternalLink, Calendar, Code, Tag } from 'lucide-react';
import { marked } from 'marked';


export default function PortfolioItemDetail() {
  const { itemSlug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [parentSection, setParentSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        // 1. Fetch item by slug
        const itemRes = await fetch(`/api/v1/portfolio/items/by-slug/${itemSlug}`);
        if (!itemRes.ok) {
          throw new Error('Creations archive file not found.');
        }
        const itemData = await itemRes.json();
        setItem(itemData);

        // 2. Fetch parent section details to build breadcrumbs and return path
        if (itemData && itemData.section_id) {
          const sectionsRes = await fetch('/api/v1/portfolio/sections');
          if (sectionsRes.ok) {
            const sections = await sectionsRes.json();
            const parent = sections.find((s) => s.id === itemData.section_id);
            setParentSection(parent);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [itemSlug]);

  // Convert markdown to HTML securely
  const getMarkdownHtml = (markdownContent) => {
    if (!markdownContent) return '';
    try {
      return { __html: marked.parse(markdownContent) };
    } catch (e) {
      return { __html: markdownContent };
    }
  };

  const mediaUrl = item?.custom_metadata?.media_url;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 80px 24px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Starry Night Atmosphere */}
      <Background />

      <div style={{ width: '100%', maxWidth: '800px', zIndex: 10 }}>
        {/* Navigation Breadcrumbs / Back button */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <button
            onClick={() => {
              if (parentSection) {
                navigate(`/world/section/${parentSection.slug}`);
              } else {
                navigate('/world');
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft size={14} />
            Back to {parentSection ? parentSection.name : 'Observatory'}
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '60px 0', textAlign: 'center' }}>
            Retrieving creation file record...
          </div>
        ) : error ? (
          <div style={{ color: 'var(--danger-color)', padding: '60px 0', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <article className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Media Banner Section */}
            {mediaUrl && (
              <div
                style={{
                  width: '100%',
                  maxHeight: '440px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }}
              >
                {mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={item.title}
                    style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }}
                  />
                )}
              </div>
            )}

            <div
              style={{
                padding: '32px',
                background: 'var(--glass-card-bg)',
                border: 'var(--glass-card-border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                transition: 'background var(--transition-speed) var(--transition-easing), border-color var(--transition-speed) var(--transition-easing)',
              }}
            >
              <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-title)', margin: 0, letterSpacing: '0.5px' }}>
                {item.title}
              </h1>

              {item.description && (
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0, fontWeight: '400' }}>
                  {item.description}
                </p>
              )}

              {/* Specs line metadata */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '16px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--accent-color)' }} />
                  <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                </div>

                {parentSection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={14} style={{ color: 'var(--accent-color)' }} />
                    <span>Constellation: {parentSection.name}</span>
                  </div>
                )}
              </div>

              {/* Tags pills */}
              {item.custom_metadata?.tags && Array.isArray(item.custom_metadata.tags) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {item.custom_metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '11px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Markdown content body rendering area */}
            {item.content_body && (
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={getMarkdownHtml(item.content_body)}
                style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '12px',
                }}
              />
            )}

            {/* External Call to action links (Live Demo / Github Repo) if present in metadata */}
            {(item.custom_metadata?.demo_url || item.custom_metadata?.github_url) && (
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '24px',
                  marginTop: '12px',
                }}
              >
                {item.custom_metadata.demo_url && (
                  <a
                    href={item.custom_metadata.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{
                      borderRadius: '24px',
                      padding: '10px 24px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    Launch Live Project
                  </a>
                )}

                {item.custom_metadata.github_url && (
                  <a
                    href={item.custom_metadata.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: '24px',
                      padding: '10px 24px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    View Code Repository
                  </a>
                )}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
