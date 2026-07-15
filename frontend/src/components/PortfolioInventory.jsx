import { useEffect, useState } from 'react';
import { Plus, Trash, RotateCcw, History, Edit, ArrowUp, ArrowDown, Eye, Search, Layers, FileText } from 'lucide-react';

export default function PortfolioInventory() {
  const [activeSubTab, setActiveSubTab] = useState('items'); // 'items' or 'sections'

  // Sections State
  const [sections, setSections] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [secName, setSecName] = useState('');
  const [secSlug, setSecSlug] = useState('');
  const [secIcon, setSecIcon] = useState('📁');
  const [secAllowedTypes, setSecAllowedTypes] = useState(['text']);
  const [secIsActive, setSecIsActive] = useState(true);

  // Items State
  const [items, setItems] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft', 'deleted'
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemBody, setItemBody] = useState('');
  const [itemStatus, setItemStatus] = useState('draft');
  const [itemOrder, setItemOrder] = useState(0);
  const [itemMetadata, setItemMetadata] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);

  // Version History State
  const [historyItem, setHistoryItem] = useState(null);
  const [historyList, setHistoryList] = useState([]);

  // Fetch Core Data
  const fetchSections = async () => {
    try {
      const response = await fetch('/api/v1/portfolio/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data);
        if (data.length > 0 && !selectedSectionId) {
          // Find first active section
          const activeSec = data.find(s => s.is_active && s.slug !== 'global');
          if (activeSec) {
            setSelectedSectionId(activeSec.id);
          } else {
            setSelectedSectionId(data[0].id);
          }
        }
      }
    } catch (e) {}
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/portfolio/items?include_deleted=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSections();
    fetchItems();
  }, []);

  // Section CRUD Handlers
  const handleOpenSectionModal = (sec = null) => {
    if (sec) {
      setEditingSection(sec);
      setSecName(sec.name);
      setSecSlug(sec.slug);
      setSecIcon(sec.icon || '📁');
      setSecAllowedTypes(sec.allowed_content_types || []);
      setSecIsActive(sec.is_active);
    } else {
      setEditingSection(null);
      setSecName('');
      setSecSlug('');
      setSecIcon('📁');
      setSecAllowedTypes(['text']);
      setSecIsActive(true);
    }
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const payload = {
      name: secName,
      slug: secSlug || secName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: secIcon,
      allowed_content_types: secAllowedTypes,
      is_active: secIsActive,
      display_order: editingSection ? editingSection.display_order : sections.length
    };

    try {
      let res;
      if (editingSection) {
        res = await fetch(`/api/v1/portfolio/sections/${editingSection.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/v1/portfolio/sections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowSectionModal(false);
        fetchSections();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error saving section');
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  const handleReorderSections = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    // Swap display order
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    const token = localStorage.getItem('access_token');
    const sectionIds = newSections.map(s => s.id);

    try {
      const res = await fetch('/api/v1/portfolio/sections/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sectionIds)
      });
      if (res.ok) {
        setSections(newSections);
      }
    } catch (e) {}
  };

  const handleToggleSectionActive = async (sec) => {
    const token = localStorage.getItem('access_token');
    const payload = { is_active: !sec.is_active };
    try {
      const res = await fetch(`/api/v1/portfolio/sections/${sec.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchSections();
      }
    } catch (e) {}
  };

  // Item CRUD Handlers
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemTitle(item.title);
      setItemDesc(item.description || '');
      setItemBody(item.content_body || '');
      setItemStatus(item.status);
      setItemOrder(item.display_order);
      setItemMetadata(item.custom_metadata || {});
      setUploadedFile(null);
    } else {
      setEditingItem(null);
      setItemTitle('');
      setItemDesc('');
      setItemBody('');
      setItemStatus('draft');
      setItemOrder(0);
      setItemMetadata({});
      setUploadedFile(null);
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    let metadata = { ...itemMetadata };

    // Handle Dynamic Upload File first if allowed by section
    if (uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      // Link it to this item if we are editing, or default resolves it
      if (editingItem) {
        formData.append('portfolio_item_id', editingItem.id);
      }

      try {
        const uploadRes = await fetch('/api/v1/media/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const media = await uploadRes.json();
          // Store local uploaded media URL in item custom_metadata
          metadata.media_url = media.secure_url;
          metadata.media_id = media.id;
        } else {
          alert('Failed to upload file');
          return;
        }
      } catch (err) {
        alert('Error uploading file');
        return;
      }
    }

    const payload = {
      section_id: selectedSectionId,
      title: itemTitle,
      description: itemDesc,
      content_body: itemBody,
      custom_metadata: metadata,
      status: itemStatus,
      display_order: itemOrder
    };

    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/v1/portfolio/items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/v1/portfolio/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowItemModal(false);
        fetchItems();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error saving portfolio item');
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  const handleSoftDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to move this item to Trash?')) return;
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`/api/v1/portfolio/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (e) {}
  };

  const handleRestoreItem = async (itemId) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`/api/v1/portfolio/items/${itemId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (e) {}
  };

  const handleViewHistory = async (item) => {
    const token = localStorage.getItem('access_token');
    setHistoryItem(item);
    try {
      const res = await fetch(`/api/v1/portfolio/items/${item.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (e) {}
  };

  // Helpers
  const activeSection = sections.find(s => s.id === selectedSectionId);

  // Filters for items
  const filteredItems = items.filter(item => {
    // 1. Section match
    if (item.section_id !== selectedSectionId) return false;
    
    // 2. Status match
    if (statusFilter === 'deleted') {
      if (!item.is_deleted) return false;
    } else {
      if (item.is_deleted) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    }

    // 3. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    }

    return true;
  });

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Portfolio Content Manager</h1>
          <p>Configure custom portfolio visual zones and manage dynamic items.</p>
        </div>

        {/* View switcher */}
        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '2px', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setActiveSubTab('items')}
            className={`btn btn-sm ${activeSubTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: activeSubTab === 'items' ? 'var(--shadow-sm)' : 'none' }}
          >
            <FileText size={14} />
            Items
          </button>
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`btn btn-sm ${activeSubTab === 'sections' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: activeSubTab === 'sections' ? 'var(--shadow-sm)' : 'none' }}
          >
            <Layers size={14} />
            Sections
          </button>
        </div>
      </div>

      {/* ==============================================================================
         TAB: SECTIONS
         ============================================================================== */}
      {activeSubTab === 'sections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Custom Sections</h2>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenSectionModal()}>
              <Plus size={14} /> Add Section
            </button>
          </div>

          <div className="table-container">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Slug</th>
                  <th>Allowed Media</th>
                  <th>Status</th>
                  <th>Reorder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.filter(s => s.slug !== 'global').map((sec, idx) => (
                  <tr key={sec.id}>
                    <td style={{ fontWeight: '500' }}>
                      <span style={{ marginRight: '8px' }}>{sec.icon || '📁'}</span>
                      {sec.name}
                    </td>
                    <td><code>{sec.slug}</code></td>
                    <td>
                      {sec.allowed_content_types?.map(t => (
                        <span key={t} className="badge badge-published" style={{ marginRight: '4px', fontSize: '10px' }}>
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge ${sec.is_active ? 'badge-published' : 'badge-draft'}`}>
                        {sec.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px' }} disabled={idx === 0} onClick={() => handleReorderSections(idx, 'up')}>
                          <ArrowUp size={12} />
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px' }} disabled={idx === sections.length - 1} onClick={() => handleReorderSections(idx, 'down')}>
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenSectionModal(sec)}>
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          className={`btn ${sec.is_active ? 'btn-danger' : 'btn-primary'} btn-sm`}
                          style={{
                            backgroundColor: sec.is_active ? 'transparent' : 'var(--accent-color)',
                            color: sec.is_active ? 'var(--danger-color)' : '#fff',
                            borderColor: sec.is_active ? 'var(--danger-color)' : 'var(--accent-color)'
                          }}
                          onClick={() => handleToggleSectionActive(sec)}
                        >
                          {sec.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================================
         TAB: ITEMS
         ============================================================================== */}
      {activeSubTab === 'items' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Section Selector */}
              <select
                className="form-control"
                style={{ width: '200px', height: '36px', padding: '0 8px' }}
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                {sections.filter(s => s.slug !== 'global').map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.icon || '📁'} {sec.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '2px', backgroundColor: 'var(--bg-secondary)', height: '36px' }}>
                {['all', 'published', 'draft', 'deleted'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      border: 'none',
                      background: statusFilter === status ? 'var(--bg-card)' : 'none',
                      color: statusFilter === status ? 'var(--accent-color)' : 'var(--text-secondary)',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: '500',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: statusFilter === status ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    {status === 'deleted' ? 'Trash' : status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Search Bar */}
              <div className="search-bar" style={{ height: '36px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Create Item Button */}
              <button className="btn btn-primary btn-sm" disabled={!selectedSectionId} onClick={() => handleOpenItemModal()}>
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container">
            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No items match your active filters. Click "Add Item" to create one.
              </div>
            ) : (
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Media</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500' }}>{item.title}</td>
                      <td>
                        <span className={`badge ${item.is_deleted ? 'badge-deleted' : item.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                          {item.is_deleted ? 'Deleted' : item.status}
                        </span>
                      </td>
                      <td><code>v{item.current_version}</code></td>
                      <td>
                        {item.custom_metadata?.media_url ? (
                          <a href={item.custom_metadata.media_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={12} /> View File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>None</span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!item.is_deleted ? (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleOpenItemModal(item)}>
                                <Edit size={12} /> Edit
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleViewHistory(item)}>
                                <History size={12} /> Revisions
                              </button>
                              <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => handleSoftDeleteItem(item.id)}>
                                <Trash size={12} /> Delete
                              </button>
                            </>
                          ) : (
                            <button className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--success-color)' }} onClick={() => handleRestoreItem(item.id)}>
                              <RotateCcw size={12} /> Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================================
         MODAL: SECTION FORM
         ============================================================================== */}
      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingSection ? 'Edit Section' : 'Create Section'}</h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }} onClick={() => setShowSectionModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveSection}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Section Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Pixel Artworks"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Slug (unique URL path)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. pixel-artworks"
                    value={secSlug}
                    onChange={(e) => setSecSlug(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Icon Emoji</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 🎨"
                    value={secIcon}
                    onChange={(e) => setSecIcon(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Allowed Content Media Types</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    {['text', 'image', 'video', 'raw'].map(type => (
                      <label key={type} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={secAllowedTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSecAllowedTypes([...secAllowedTypes, type]);
                            } else {
                              setSecAllowedTypes(secAllowedTypes.filter(t => t !== type));
                            }
                          }}
                        />
                        {type.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={secIsActive}
                      onChange={(e) => setSecIsActive(e.target.checked)}
                    />
                    Is Active (visible in public queries)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSectionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
         MODAL: ITEM FORM
         ============================================================================== */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }} onClick={() => setShowItemModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Retro Space Shooter"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Brief intro block text..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Content Body</label>
                  <textarea
                    className="form-control"
                    placeholder="Write detailed article, credits, mechanics details here..."
                    value={itemBody}
                    onChange={(e) => setItemBody(e.target.value)}
                  />
                </div>

                {/* DYNAMIC FORMS RENDER BASED ON ALLOWED MEDIA TYPES */}
                {activeSection && (activeSection.allowed_content_types?.includes('image') || activeSection.allowed_content_types?.includes('video')) && (
                  <div className="form-group" style={{ padding: '14px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-secondary)' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Dynamic Media Asset File</label>
                    <input
                      type="file"
                      accept={activeSection.allowed_content_types.includes('video') ? 'image/*,video/*' : 'image/*'}
                      onChange={(e) => setUploadedFile(e.target.files[0])}
                      style={{ fontSize: '13px' }}
                    />
                    <p style={{ fontSize: '11px', marginTop: '6px' }}>
                      Allowed types: {activeSection.allowed_content_types.filter(t => t !== 'text').join(', ')}
                    </p>
                    {itemMetadata.media_url && (
                      <div style={{ marginTop: '10px', fontSize: '12px' }}>
                        Current File: <a href={itemMetadata.media_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>{itemMetadata.media_url.split('/').pop()}</a>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={itemStatus}
                      onChange={(e) => setItemStatus(e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={itemOrder}
                      onChange={(e) => setItemOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
         MODAL: VERSION HISTORY (REVISIONS)
         ============================================================================== */}
      {historyItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Version History</h3>
                <p style={{ fontSize: '12px', margin: 0 }}>Revisions log for: {historyItem.title}</p>
              </div>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }} onClick={() => setHistoryItem(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {historyList.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Loading revisions...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {historyList.map(ver => (
                    <div
                      key={ver.id}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--accent-color)', fontSize: '14px' }}>
                          Version {ver.version_number}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(ver.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{ver.title}</h4>
                      {ver.description && <p style={{ fontSize: '13px', marginBottom: '6px' }}>{ver.description}</p>}
                      {ver.content_body && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                          {ver.content_body}
                        </div>
                      )}
                      {ver.custom_metadata?.media_url && (
                        <div style={{ marginTop: '8px', fontSize: '11px' }}>
                          Media File: <a href={ver.custom_metadata.media_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>{ver.custom_metadata.media_url}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHistoryItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
