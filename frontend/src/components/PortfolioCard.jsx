import { Link } from 'react-router-dom';
import { FileText, Eye } from 'lucide-react';
import { resolveUrl } from '../utils/api';

export default function PortfolioCard({ item }) {
  // Generate the URL slug dynamically if not set explicitly in metadata
  const getItemSlug = (itemObj) => {
    if (itemObj.custom_metadata && itemObj.custom_metadata.slug) {
      return itemObj.custom_metadata.slug;
    }
    return itemObj.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const slug = getItemSlug(item);
  const metadata = item.custom_metadata || {};
  
  // Resolve card cover image URL with fallback chain
  const mediaUrl = resolveUrl(metadata.cover_image || metadata.media_url || (metadata.screenshots && metadata.screenshots[0]) || (metadata.images && metadata.images[0]));

  // Determine tags to render as badges
  const tagsToRender = metadata.tech_stack || metadata.artwork_tags || metadata.related_tech || metadata.tags || [];

  return (
    <Link
      to={`/world/item/${slug}`}
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--glass-card-bg)',
        border: 'var(--glass-card-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'all var(--transition-speed) var(--transition-easing), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.border = 'var(--glass-card-hover-border)';
        e.currentTarget.style.boxShadow = 'var(--glass-card-hover-shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.border = 'var(--glass-card-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Media Header */}
      <div
        style={{
          width: '100%',
          height: '180px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Featured badge overlay */}
        {item.is_featured && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              left: '12px', 
              zIndex: 5, 
              backgroundColor: 'rgba(245, 158, 11, 0.95)', 
              color: '#ffffff', 
              fontSize: '10px', 
              fontWeight: 'bold', 
              padding: '4px 8px', 
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            ★ FEATURED
          </div>
        )}

        {/* Project completion status overlay */}
        {metadata.project_status && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              zIndex: 5, 
              backgroundColor: 'rgba(0, 0, 0, 0.75)', 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '10px', 
              fontWeight: '600', 
              padding: '4px 8px', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {metadata.project_status}
          </div>
        )}

        {/* Artwork category overlay */}
        {metadata.category && !metadata.project_status && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              zIndex: 5, 
              backgroundColor: 'rgba(139, 92, 246, 0.85)', 
              color: '#ffffff', 
              fontSize: '10px', 
              fontWeight: '600', 
              padding: '4px 8px', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {metadata.category}
          </div>
        )}

        {mediaUrl ? (
          mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              src={mediaUrl}
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onMouseOver={(e) => e.target.play()}
              onMouseOut={(e) => e.target.pause()}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={item.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        ) : (
          /* Placeholder media icon */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              opacity: 0.5,
            }}
          >
            <FileText size={36} />
            <span style={{ fontSize: '11px', letterSpacing: '1px' }}>TEXT ENTRY</span>
          </div>
        )}

        {/* Hover View overlay */}
        <div
          className="hover-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(7, 7, 24, 0.4)',
            opacity: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = 0;
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Eye size={12} />
            Explore Details
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-title)',
            margin: 0,
          }}
        >
          {item.title}
        </h3>

        {item.description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.description}
          </p>
        )}

        {/* Medium metadata indicator for Artwork */}
        {metadata.medium && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
            Medium: {metadata.medium}
          </div>
        )}

        {/* Tags indicator */}
        {tagsToRender.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: 'auto',
              paddingTop: '10px',
            }}
          >
            {tagsToRender.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
