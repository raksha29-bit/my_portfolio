import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Background from './Background';
import { ArrowLeft, ExternalLink, Calendar, Code, Tag, Award, Download, ShieldCheck } from 'lucide-react';
import { marked } from 'marked';
import { resolveUrl } from '../utils/api';

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
        const itemRes = await fetch(resolveUrl(`/api/v1/portfolio/items/by-slug/${itemSlug}`));
        if (!itemRes.ok) {
          throw new Error('Creations archive file not found.');
        }
        const itemData = await itemRes.json();
        setItem(itemData);

        // 2. Fetch parent section details
        if (itemData && itemData.section_id) {
          const sectionsRes = await fetch(resolveUrl('/api/v1/portfolio/sections'));
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

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <Background />
        <span style={{ zIndex: 10 }}>Retrieving creation file record...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
        <Background />
        <span style={{ zIndex: 10 }}>{error}</span>
      </div>
    );
  }

  const metadata = item?.custom_metadata || {};
  const rawMediaUrl = metadata.cover_image || metadata.media_url || (metadata.screenshots && metadata.screenshots[0]) || (metadata.images && metadata.images[0]);
  const mediaUrl = rawMediaUrl ? resolveUrl(rawMediaUrl) : '';
  const screenshots = (metadata.screenshots || []).map(resolveUrl);
  const images = (metadata.images || []).map(resolveUrl);

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
      <Background />

      <div style={{ width: '100%', maxWidth: '800px', zIndex: 10 }}>
        {/* Navigation Return Button */}
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

        <article style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Cover Media Banner */}
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
                  style={{ width: '100%', height: '100%', maxHeight: '440px', objectFit: 'cover' }}
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
              gap: '20px',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px)',
              transition: 'background var(--transition-speed) var(--transition-easing), border-color var(--transition-speed) var(--transition-easing)',
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start', flexDirection: 'row', flexWrap: 'wrap' }}>
              {parentSection && parentSection.slug === 'achievements' && (metadata.badge_url || metadata.badge) && (
                <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={resolveUrl(metadata.badge_url || metadata.badge)} 
                    alt="Badge" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))' }} 
                  />
                </div>
              )}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: '600', color: 'var(--text-title)', margin: 0 }}>
                    {item.title}
                  </h1>
                  {item.is_featured && (
                    <span className="badge badge-published" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      ★ Featured
                    </span>
                  )}
                </div>
                {item.description && (
                  <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Spec details by section type */}
            {parentSection && parentSection.slug === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                  {metadata.project_status && (
                    <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <strong style={{ color: 'var(--text-title)' }}>{metadata.project_status}</strong></div>
                  )}
                  {metadata.completion_date && (
                    <div><span style={{ color: 'var(--text-secondary)' }}>Completion:</span> <strong style={{ color: 'var(--text-title)' }}>{new Date(metadata.completion_date).toLocaleDateString()}</strong></div>
                  )}
                </div>

                {metadata.tech_stack && metadata.tech_stack.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tech Stack</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {metadata.tech_stack.map(tech => (
                        <span key={tech} className="badge badge-published" style={{ fontSize: '10px' }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parentSection && parentSection.slug === 'artwork' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                {metadata.category && (
                  <div><span style={{ color: 'var(--text-secondary)' }}>Category:</span> <strong style={{ color: 'var(--text-title)' }}>{metadata.category}</strong></div>
                )}
                {metadata.medium && (
                  <div><span style={{ color: 'var(--text-secondary)' }}>Medium:</span> <strong style={{ color: 'var(--text-title)' }}>{metadata.medium}</strong></div>
                )}
              </div>
            )}

            {/* Standard tags / metadata line */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '16px',
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
          </div>

          {/* Detailed Markdown Content body */}
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

          {/* Project Screenshot Gallery */}
          {screenshots.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-title)', marginBottom: '16px' }}>Gallery & Screenshots</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {screenshots.map((scr, idx) => (
                  <a 
                    key={idx} 
                    href={scr} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-color)', 
                      display: 'block',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <img src={scr} alt={`Screenshot ${idx + 1}`} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Artwork Image Gallery */}
          {images.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-title)', marginBottom: '16px' }}>Artwork Gallery</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {images.map((img, idx) => (
                  <a 
                    key={idx} 
                    href={img} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-color)', 
                      display: 'block',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Certificate Preview */}
          {parentSection && parentSection.slug === 'achievements' && (metadata.certificate_url || metadata.certificate) && (() => {
            const certUrl = resolveUrl(metadata.certificate_url || metadata.certificate);
            return (
              <div style={{ background: 'var(--glass-card-bg)', border: 'var(--glass-card-border)', padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--text-title)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--accent-color)' }} />
                  <span>Certificate Attachment</span>
                </h3>
                {certUrl.match(/\.(pdf)$/i) ? (
                  <div style={{ height: '500px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                    <object data={certUrl} type="application/pdf" width="100%" height="100%">
                      <div style={{ padding: '24px', textAlign: 'center', color: '#333333' }}>
                        <a href={certUrl} download className="btn btn-primary">
                          <Download size={14} /> Download Certificate PDF
                        </a>
                      </div>
                    </object>
                  </div>
                ) : (
                  <img src={certUrl} alt="Certificate" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
                )}
              </div>
            );
          })()}

          {/* External Call to action links (Live Demo / Github Repo) */}
          {(metadata.live_demo || metadata.github_repo || metadata.github_link || metadata.documentation_url || metadata.documentation_link || metadata.external_link) && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '24px',
                marginTop: '12px',
                flexWrap: 'wrap'
              }}
            >
              {metadata.live_demo && (
                <a
                  href={metadata.live_demo}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
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

              {(metadata.github_repo || metadata.github_link) && (
                <a
                  href={metadata.github_repo || metadata.github_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
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

              {(metadata.documentation_url || metadata.documentation_link) && (
                <a
                  href={metadata.documentation_url || metadata.documentation_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
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
                  Read Documentation
                </a>
              )}

              {metadata.external_link && parentSection && parentSection.slug === 'achievements' && (
                <a
                  href={metadata.external_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
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
                  Verify Credential
                </a>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
