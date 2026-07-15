import { useEffect, useState } from 'react';
import { Grid, List, Search, Upload, Trash, Eye, File, RefreshCw } from 'lucide-react';

export default function MediaManager() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/media/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMediaList(data);
      }
    } catch (e) {
      // Gracefully catch fetch exceptions
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        fetchMedia();
      } else {
        alert('File upload failed.');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this media asset permanently?')) return;

    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`/api/v1/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchMedia();
        if (selectedMedia && selectedMedia.id === mediaId) {
          setSelectedMedia(null);
        }
      } else {
        alert('Failed to delete media asset.');
      }
    } catch (err) {}
  };

  // Helper to format bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Filter media based on search query
  const filteredMedia = mediaList.filter((m) => {
    const q = searchQuery.toLowerCase();
    const urlMatch = m.secure_url?.toLowerCase().includes(q);
    const idMatch = m.cloudinary_public_id?.toLowerCase().includes(q);
    const formatMatch = m.file_format?.toLowerCase().includes(q);
    return urlMatch || idMatch || formatMatch;
  });

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Media Asset Library</h1>
          <p>Host and manage images, video clips, and static assets.</p>
        </div>

        {/* View mode buttons */}
        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '2px', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none' }}
          >
            <Grid size={14} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none' }}
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>

      {/* Action panel: search & upload */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search media by filename, key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <button className="btn btn-secondary btn-sm" onClick={fetchMedia} style={{ padding: '6px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading library assets...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div style={{ padding: '40px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No media found. Upload a file to populate your media manager.
        </div>
      ) : (
        <>
          {/* ==============================================================================
             GRID VIEW
             ============================================================================== */}
          {viewMode === 'grid' && (
            <div className="media-grid">
              {filteredMedia.map((media) => {
                const name = media.secure_url.split('/').pop();
                return (
                  <div key={media.id} className="media-card" onClick={() => setSelectedMedia(media)}>
                    {media.resource_type === 'image' ? (
                      <img src={media.secure_url} alt="" className="media-thumbnail" />
                    ) : (
                      <div className="media-placeholder">
                        <File size={36} />
                        <span style={{ fontSize: '11px', fontWeight: '500' }}>
                          {media.file_format?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    )}
                    {/* Hover Overlay Delete */}
                    <button
                      className="btn btn-danger btn-sm"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      }}
                      onClick={(e) => handleDeleteMedia(media.id, e)}
                    >
                      <Trash size={12} />
                    </button>
                    {/* Caption name */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '6px 8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==============================================================================
             LIST VIEW
             ============================================================================== */}
          {viewMode === 'list' && (
            <div className="table-container">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Filename</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Uploaded At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedia.map((media) => {
                    const filename = media.secure_url.split('/').pop();
                    return (
                      <tr key={media.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMedia(media)}>
                        <td>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              backgroundColor: 'var(--bg-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {media.resource_type === 'image' ? (
                              <img src={media.secure_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <File size={16} style={{ color: 'var(--text-secondary)' }} />
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: '500' }}>{filename}</td>
                        <td><code>{media.file_format || 'N/A'}</code></td>
                        <td>{formatBytes(media.file_size)}</td>
                        <td><span className="badge badge-published" style={{ fontSize: '11px' }}>{media.resource_type}</span></td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {new Date(media.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedMedia(media); }}>
                              <Eye size={12} />
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-color)' }} onClick={(e) => handleDeleteMedia(media.id, e)}>
                              <Trash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ==============================================================================
         MODAL: MEDIA DETAIL PREVIEW
         ============================================================================== */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asset Properties</h3>
              <button
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}
                onClick={() => setSelectedMedia(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {selectedMedia.resource_type === 'image' ? (
                  <img
                    src={selectedMedia.secure_url}
                    alt=""
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                    <File size={64} />
                    <span>No visual preview for type: {selectedMedia.resource_type}</span>
                  </div>
                )}
              </div>

              {/* Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Filename</span>
                  <span style={{ fontWeight: '500' }}>{selectedMedia.secure_url.split('/').pop()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Storage Key (Public ID)</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedMedia.cloudinary_public_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>File Format</span>
                  <span style={{ fontWeight: '500' }}><code>{selectedMedia.file_format || 'unknown'}</code></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>File Size</span>
                  <span style={{ fontWeight: '500' }}>{formatBytes(selectedMedia.file_size)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Full Address (URL)</span>
                  <a
                    href={selectedMedia.secure_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}
                  >
                    {selectedMedia.secure_url}
                  </a>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMedia(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
