import { useEffect, useState } from 'react';
import { Layers, FileText, FileEdit, HardDrive, Clock, ArrowRight } from 'lucide-react';
import { resolveUrl } from '../utils/api';

export default function DashboardHome() {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all resources in parallel
        const [secRes, itemsRes, mediaRes] = await Promise.all([
          fetch(resolveUrl('/api/v1/portfolio/sections')),
          fetch(resolveUrl('/api/v1/portfolio/items?include_deleted=true'), { headers }),
          fetch(resolveUrl('/api/v1/media/'), { headers }),
        ]);

        if (secRes.ok && itemsRes.ok && mediaRes.ok) {
          const secData = await secRes.json();
          const itemsData = await itemsRes.json();
          const mediaData = await mediaRes.json();

          setSections(secData);
          setItems(itemsData);
          setMediaList(mediaData);
        }
      } catch (e) {
        // Handle fetch errors gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading dashboard statistics...
      </div>
    );
  }

  // Calculations
  const activeSections = sections.filter(s => s.is_active).length;
  const activeItems = items.filter(i => !i.is_deleted);
  const totalItemsCount = activeItems.length;
  const draftItems = activeItems.filter(i => i.status === 'draft');
  const deletedItemsCount = items.filter(i => i.is_deleted).length;
  const mediaCount = mediaList.length;

  // Filter lists for dashboard feed
  const recentlyUpdated = [...activeItems]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  const draftList = [...draftItems].slice(0, 5);

  const recentUploads = [...mediaList]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Helper to format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="content-container">
      {/* Welcome segment */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '4px' }}>Overview</h1>
        <p>Real-time analytics and management of your game portfolio CMS.</p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Active Sections</span>
            <Layers size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className="stats-value">{activeSections} / {sections.length}</div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Total CMS Items</span>
            <FileText size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className="stats-value">{totalItemsCount}</div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Draft Items</span>
            <FileEdit size={18} style={{ color: 'var(--warning-color)' }} />
          </div>
          <div className="stats-value">{draftItems.length}</div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stats-label">Media Files</span>
            <HardDrive size={18} style={{ color: 'var(--success-color)' }} />
          </div>
          <div className="stats-value">{mediaCount}</div>
        </div>
      </div>

      {/* Main dashboard feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column - Recently Updated */}
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} style={{ color: 'var(--accent-color)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recently Updated Items</h3>
          </div>

          {recentlyUpdated.length === 0 ? (
            <p style={{ fontSize: '14px', fontStyle: 'italic' }}>No portfolio items found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentlyUpdated.map((item) => {
                const section = sections.find((s) => s.id === item.section_id);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {section ? section.name : 'Unknown Section'} • Version {item.current_version}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatDate(item.updated_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Top segment: Drafts, Bottom segment: Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Draft Items */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              backgroundColor: 'var(--bg-card)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileEdit size={18} style={{ color: 'var(--warning-color)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Draft Items ({draftItems.length})</h3>
            </div>

            {draftList.length === 0 ? (
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                All items are published!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {draftList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <ArrowRight size={14} style={{ color: 'var(--warning-color)' }} />
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Uploads */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              backgroundColor: 'var(--bg-card)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <HardDrive size={18} style={{ color: 'var(--success-color)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Uploads</h3>
            </div>

            {recentUploads.length === 0 ? (
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                No media uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {recentUploads.map((media) => (
                  <div
                    key={media.id}
                    style={{
                      width: '64px',
                      height: '64px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {media.resource_type === 'image' ? (
                      <img
                        src={resolveUrl(media.secure_url)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {media.file_format?.toUpperCase() || 'FILE'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deleted Items notification banner if any */}
      {deletedItemsCount > 0 && (
        <div
          style={{
            marginTop: '24px',
            padding: '12px 20px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            You have <strong>{deletedItemsCount}</strong> soft-deleted item(s) in the trash.
          </span>
        </div>
      )}
    </div>
  );
}
