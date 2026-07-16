import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Background from './Background';
import PortfolioCard from './PortfolioCard';
import { ArrowLeft, Search, Tag, Inbox } from 'lucide-react';

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
        const secData = await secRes.ok ? await secRes.json() : null;
        setSection(secData);

        if (secData) {
          // 2. Fetch items for this section
          const itemsRes = await fetch(`/api/v1/portfolio/items?section_id=${secData.id}`);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            // Filter out any drafts for the public view
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

  // Aggregate all unique tags from items list for filter bar
  const uniqueTags = Array.from(
    new Set(items.flatMap((item) => item.custom_metadata?.tags || []))
  );

  // Filter items client-side
  const filteredItems = items.filter((item) => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    // 2. Selected Tag
    if (selectedTag) {
      const tags = item.custom_metadata?.tags || [];
      if (!tags.includes(selectedTag)) return false;
    }
    return true;
  });

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
      {/* Starry Background */}
      <Background />

      {/* Main Container Shell */}
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

            {/* Content Cards Grid */}
            {filteredItems.length === 0 ? (
              <div
                style={{
                  padding: '80px 24px',
                  border: '1px dashed rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Inbox size={32} style={{ opacity: 0.5 }} />
                <span>No creations found matching your search.</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '24px',
                }}
              >
                {filteredItems.map((item) => (
                  <PortfolioCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
