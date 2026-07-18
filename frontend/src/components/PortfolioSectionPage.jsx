import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Background from './Background';
import PortfolioCard from './PortfolioCard';
import { 
  ArrowLeft, Search, Tag, Inbox, Calendar, Code, ExternalLink, 
  Download, Award, User, Briefcase, Mail, MapPin, Sparkles 
} from 'lucide-react';

export default function PortfolioSectionPage() {
  const { sectionSlug } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    const fetchSectionData = async () => {
      try {
        setLoading(true);
        // 1. Fetch section by slug
        const secRes = await fetch(`/api/v1/portfolio/sections/by-slug/${sectionSlug}`);
        if (!secRes.ok) {
          throw new Error('Constellation section not found.');
        }
        const secData = await secRes.json();
        setSection(secData);

        if (secData) {
          // 2. Fetch items for this section
          const itemsRes = await fetch(`/api/v1/portfolio/items?section_id=${secData.id}&status=published`);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            // Filter out any drafts/archives for the public view
            setItems(itemsData.filter(i => i.status === 'published' && !i.is_deleted));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSectionData();
  }, [sectionSlug]);

  // Priority sorting: Featured first, then respect display_order
  const sortedItems = [...items].sort((a, b) => {
    const supportsFeatured = ['projects', 'artwork', 'achievements', 'skills-tech'].includes(sectionSlug);
    if (supportsFeatured) {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
    }
    return a.display_order - b.display_order;
  });

  // Aggregate all unique tags from items list for filter bar (tech_stack, skill_tags, etc.)
  const uniqueTags = Array.from(
    new Set(sortedItems.flatMap((item) => {
      const metadata = item.custom_metadata || {};
      const tStack = metadata.tech_stack || [];
      const sTags = metadata.skill_tags || [];
      const aTags = metadata.artwork_tags || [];
      const rTech = metadata.related_tech || [];
      return [...tStack, ...sTags, ...aTags, ...rTech];
    }))
  );

  // Filter items client-side
  const filteredItems = sortedItems.filter((item) => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const bodyMatch = item.content_body?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !bodyMatch) return false;
    }
    // 2. Selected Tag
    if (selectedTag) {
      const metadata = item.custom_metadata || {};
      const allTags = [
        ...(metadata.tech_stack || []),
        ...(metadata.skill_tags || []),
        ...(metadata.artwork_tags || []),
        ...(metadata.related_tech || [])
      ];
      if (!allTags.includes(selectedTag)) return false;
    }
    return true;
  });

  // Render dynamic empty state
  const renderEmptyState = () => {
    let msg = "No entries published in this constellation yet.";
    if (sectionSlug === 'about-me') {
      msg = "No biography profile has been published yet.";
    } else if (sectionSlug === 'projects') {
      msg = "No projects in this constellation yet.";
    } else if (sectionSlug === 'artwork') {
      msg = "No artworks have been added to the gallery yet.";
    } else if (sectionSlug === 'skills-tech') {
      msg = "No skill ratings or technical proficiencies listed yet.";
    } else if (sectionSlug === 'achievements') {
      msg = "No certificates or achievements added yet.";
    } else if (sectionSlug === 'resume') {
      msg = "No resume documents have been published yet.";
    } else if (sectionSlug === 'contact') {
      msg = "No contact details available yet.";
    }
    
    return (
      <div
        style={{
          padding: '80px 24px',
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Inbox size={36} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: '15px' }}>{msg}</span>
      </div>
    );
  };

  // ==============================================================================
  // CUSTOM SECTION RENDERERS
  // ==============================================================================

  // 1. About Me section
  const renderAboutMe = () => {
    if (filteredItems.length === 0) return renderEmptyState();
    const profile = filteredItems[0]; // Display the main profile item
    const metadata = profile.custom_metadata || {};

    return (
      <div 
        className="fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '40px',
          alignItems: 'start',
          background: 'var(--glass-card-bg)',
          border: 'var(--glass-card-border)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
          transition: 'background var(--transition-speed) var(--transition-easing)'
        }}
      >
        {/* Profile Card Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
          <div 
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--accent-color)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            {metadata.avatar_url || metadata.avatar ? (
              <img src={metadata.avatar_url || metadata.avatar} alt={profile.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <User size={64} />
              </div>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--text-title)', marginBottom: '6px' }}>{profile.title}</h2>
            {metadata.degree && (
              <p style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                {metadata.degree} in {metadata.specialization}
              </p>
            )}
            {metadata.college && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>{metadata.college}</p>
            )}
            {metadata.academic_year && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0', fontStyle: 'italic' }}>{metadata.academic_year}</p>
            )}
            {metadata.age && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>Age: {metadata.age}</p>
            )}
          </div>
        </div>

        {/* Biography Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-title)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '12px' }}>Biography</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px' }}>{profile.description}</p>
            <div style={{ color: 'rgba(255,255,255,0.95)', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
              {profile.content_body}
            </div>
          </div>

          {metadata.career_goals && (
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--text-title)', marginBottom: '8px' }}>Career Aspirations</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{metadata.career_goals}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {(metadata.hobbies || metadata.interests) && (
              <div>
                <h3 style={{ fontSize: '16px', color: 'var(--text-title)', marginBottom: '8px' }}>Interests & Hobbies</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{metadata.hobbies || metadata.interests}</p>
              </div>
            )}
            {metadata.fun_facts && (
              <div>
                <h3 style={{ fontSize: '16px', color: 'var(--text-title)', marginBottom: '8px' }}>Fun Facts</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{metadata.fun_facts}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. Skills & Tech section (Grouped by Category)
  const renderSkills = () => {
    if (filteredItems.length === 0) return renderEmptyState();

    // Group skills by category
    const groups = filteredItems.reduce((acc, item) => {
      const cat = item.custom_metadata?.skill_category || 'Other Core Technologies';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {Object.entries(groups).map(([category, list]) => (
          <div 
            key={category}
            style={{
              background: 'var(--glass-card-bg)',
              border: 'var(--glass-card-border)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-title)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              {category}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {list.map(skill => {
                const proficiency = skill.custom_metadata?.proficiency || 50;
                return (
                  <div key={skill.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {skill.title}
                        {skill.is_featured && <span style={{ color: 'var(--warning-color)', fontSize: '12px' }}>⭐</span>}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: '600' }}>{proficiency}%</span>
                    </div>
                    {/* Proficiency progress bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${proficiency}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-color) 100%)', 
                          borderRadius: '4px' 
                        }} 
                      />
                    </div>
                    {skill.custom_metadata?.related_tech && skill.custom_metadata.related_tech.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {skill.custom_metadata.related_tech.map(tech => (
                          <span key={tech} className="badge badge-published" style={{ fontSize: '9px', padding: '2px 6px' }}>{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 3. Achievements section
  const renderAchievements = () => {
    if (filteredItems.length === 0) return renderEmptyState();

    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredItems.map(item => {
          const metadata = item.custom_metadata || {};
          return (
            <div
              key={item.id}
              style={{
                background: 'var(--glass-card-bg)',
                border: 'var(--glass-card-border)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '20px',
                alignItems: 'start',
                backdropFilter: 'blur(20px)',
              }}
            >
              {metadata.badge_url ? (
                <img src={metadata.badge_url} alt="Badge" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--accent-color)' }}>
                  <Award size={36} />
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-title)', margin: 0 }}>
                    {item.title}
                    {item.is_featured && <span style={{ marginLeft: '6px', color: 'var(--warning-color)' }}>⭐</span>}
                  </h3>
                  {metadata.achievement_date && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(metadata.achievement_date).toLocaleDateString()}</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>{item.description}</p>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  {metadata.certificate_url && (
                    <a href={metadata.certificate_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}>
                      <Download size={12} /> View Certificate
                    </a>
                  )}
                  {metadata.external_link && (
                    <a href={metadata.external_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}>
                      <ExternalLink size={12} /> Verify Credential
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 4. Resume section
  const renderResume = () => {
    if (filteredItems.length === 0) return renderEmptyState();
    const resume = filteredItems[0]; // Render the primary published resume
    const pdfUrl = resume.custom_metadata?.resume_pdf;

    return (
      <div 
        className="fade-in"
        style={{
          background: 'var(--glass-card-bg)',
          border: 'var(--glass-card-border)',
          borderRadius: '24px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', color: 'var(--text-title)', margin: 0 }}>{resume.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>{resume.description}</p>
          </div>
          {pdfUrl && (
            <a href={pdfUrl} download className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px' }}>
              <Download size={14} /> Download PDF
            </a>
          )}
        </div>

        {pdfUrl ? (
          <div style={{ width: '100%', height: '700px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
            <object 
              data={pdfUrl} 
              type="application/pdf" 
              width="100%" 
              height="100%"
            >
              <div style={{ padding: '40px', textAlign: 'center', color: '#333333' }}>
                <p style={{ fontWeight: '500', marginBottom: '16px' }}>Your browser does not support inline PDF previews.</p>
                <a href={pdfUrl} download className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={14} /> Download Resume PDF
                </a>
              </div>
            </object>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No PDF attachment has been uploaded yet.</p>
        )}
      </div>
    );
  };

  // 5. Contact section
  const renderContact = () => {
    if (filteredItems.length === 0) return renderEmptyState();
    const contact = filteredItems[0];
    const metadata = contact.custom_metadata || {};
    const socialLinks = metadata.social_links || [];

    return (
      <div 
        className="fade-in"
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'var(--glass-card-bg)',
          border: 'var(--glass-card-border)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(24px)',
          textAlign: 'center',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div 
          style={{
            display: 'inline-flex',
            padding: '16px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '50%',
            color: 'var(--accent-color)',
            marginBottom: '24px',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)'
          }}
        >
          <Mail size={32} />
        </div>
        <h2 style={{ fontSize: '24px', color: 'var(--text-title)', marginBottom: '8px' }}>Get in Touch</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Feel free to reach out for projects, collaborations, or professional opportunities!
        </p>

        {metadata.availability_status && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success-color)', fontSize: '13px', fontWeight: '600', marginBottom: '32px' }}>
            <Sparkles size={14} />
            <span>Status: {metadata.availability_status}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          {socialLinks.filter(link => link.url).map((link, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)';
              }}
            >
              <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{link.label}</span>
              {link.url.startsWith('http') || link.url.includes('.com') || link.url.includes('@') ? (
                <a 
                  href={link.url.includes('@') && !link.url.startsWith('http') ? `mailto:${link.url}` : link.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {link.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 35)}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{link.url}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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

      <div style={{ width: '100%', maxWidth: '1000px', zIndex: 10 }}>
        {/* Navigation Return Button */}
        <button
          onClick={() => navigate('/world')}
          className="btn btn-secondary btn-sm"
          style={{
            marginBottom: '32px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft size={14} />
          Return to Observatory
        </button>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '60px 0', textAlign: 'center' }}>
            Fetching archive documents...
          </div>
        ) : error ? (
          <div style={{ color: 'var(--danger-color)', padding: '60px 0', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div className="fade-in">
            {/* Hero Section Header */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px', filter: 'drop-shadow(0 0 8px var(--glass-card-hover-glow))' }}>
                  {section.icon || '📁'}
                </span>
                <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-title)', margin: 0 }}>
                  {section.name}
                </h1>
              </div>
              {section.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', margin: 0, maxWidth: '700px' }}>
                  {section.description}
                </p>
              )}
            </div>

            {/* Custom section render triggers */}
            {sectionSlug === 'about-me' && renderAboutMe()}
            {sectionSlug === 'skills-tech' && renderSkills()}
            {sectionSlug === 'achievements' && renderAchievements()}
            {sectionSlug === 'resume' && renderResume()}
            {sectionSlug === 'contact' && renderContact()}

            {/* Generic sections renderer (Projects, Artwork, Custom grids) */}
            {!['about-me', 'skills-tech', 'achievements', 'resume', 'contact'].includes(sectionSlug) && (
              <div>
                {/* Filter controls row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Search */}
                  <div className="search-bar" style={{ height: '36px', maxWidth: '300px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search works..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Unique Tags pills */}
                  {uniqueTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Tag size={12} style={{ color: 'var(--text-secondary)' }} />
                      {uniqueTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          style={{
                            border: selectedTag === tag ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: selectedTag === tag ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            color: selectedTag === tag ? 'var(--accent-color)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontWeight: selectedTag === tag ? '600' : '400',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {filteredItems.length === 0 ? (
                  renderEmptyState()
                ) : sectionSlug === 'artwork' ? (
                  /* Gallery visual masonry grid for Artwork */
                  <div
                    style={{
                      columnCount: 'auto',
                      columnWidth: '290px',
                      columnGap: '24px',
                      width: '100%'
                    }}
                  >
                    {filteredItems.map(item => (
                      <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '24px' }}>
                        <PortfolioCard item={item} />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Standard grid for Projects / others */
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    {filteredItems.map(item => (
                      <PortfolioCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
