import { useEffect, useState } from 'react';
import { 
  Plus, Trash, RotateCcw, History, Edit, ArrowUp, ArrowDown, 
  Eye, Search, Layers, FileText, Upload, Image as ImageIcon, Star, Menu 
} from 'lucide-react';

// ==============================================================================
// HELPERS & SUBCOMPONENTS
// ==============================================================================

function TagInput({ tags = [], onChange, placeholder = "Type tag and press Enter..." }) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim().replace(/,$/, '');
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput('');
    }
  };

  const handleRemove = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--accent-color)',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: '2px'
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReorderableMediaList({ urls = [], onChange, onOpenPicker }) {
  const move = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === urls.length - 1) return;
    const nextUrls = [...urls];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = nextUrls[index];
    nextUrls[index] = nextUrls[target];
    nextUrls[target] = temp;
    onChange(nextUrls);
  };

  const remove = (index) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button 
        type="button" 
        className="btn btn-secondary btn-sm" 
        onClick={onOpenPicker} 
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Plus size={14} /> Add Screenshot/Image
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {urls.map((url, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={url} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {url.split('/').pop()}
              </span>
              {idx === 0 && (
                <span className="badge badge-published" style={{ fontSize: '10px', marginLeft: '6px' }}>Auto Card Cover</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '4px 6px' }} disabled={idx === 0} onClick={() => move(idx, 'up')}>
                ▲
              </button>
              <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '4px 6px' }} disabled={idx === urls.length - 1} onClick={() => move(idx, 'down')}>
                ▼
              </button>
              <button type="button" className="btn btn-danger btn-sm" style={{ padding: '4px 6px', color: 'var(--danger-color)', border: 'none', background: 'transparent' }} onClick={() => remove(idx)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPicker({ onSelect, onClose, accept, maxSize, pickerTarget }) {
  const [mediaList, setMediaList] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (pickerTarget === 'resume_pdf') {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        alert("Error: Resume file must be a PDF.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Error: Resume file size must not exceed 10 MB.");
        return;
      }
    } else {
      if (accept) {
        const types = accept.split(',').map(t => t.trim());
        const matches = types.some(type => {
          if (type.endsWith('/*')) {
            const prefix = type.slice(0, -2);
            return file.type.startsWith(prefix);
          }
          return file.type === type || file.name.endsWith(type.replace(/^\./, ''));
        });
        if (!matches && !file.name.endsWith('.pdf')) {
          alert(`Error: Only files matching type ${accept} are allowed.`);
          return;
        }
      }
      if (maxSize && file.size > maxSize) {
        alert(`Error: File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)} MB.`);
        return;
      }
    }

    // Warnings
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      alert("Warning: This image exceeds 2 MB. Future validation will restrict this.");
    } else if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
      alert("Warning: This video exceeds 50 MB. Future validation will restrict this.");
    }

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
        const data = await res.json();
        onSelect(data.secure_url);
      } else {
        alert('Upload failed');
      }
    } catch (e) {
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const filteredList = mediaList.filter(m => 
    m.secure_url?.toLowerCase().includes(search.toLowerCase()) ||
    m.cloudinary_public_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-content" style={{ maxWidth: '700px', width: '90%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        <div className="modal-header">
          <h3>Select Asset from Media Library</h3>
          <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-secondary)' }} onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" accept={accept} style={{ display: 'none'} } onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading library...</p>
          ) : filteredList.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No assets found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
              {filteredList.map(item => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.secure_url)}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-secondary)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  {item.resource_type === 'image' ? (
                    <img src={item.secure_url} alt="Media" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {item.resource_type === 'video' ? '🎬 Video' : '📄 File'}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.secure_url.split('/').pop()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// MAIN PORTFOLIO INVENTORY COMPONENT
// ==============================================================================

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
  const [selectedSectionId, setSelectedSectionId] = useState(() => {
    return localStorage.getItem('last_active_section_id') || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft', 'archived', 'deleted'
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemBody, setItemBody] = useState('');
  const [itemStatus, setItemStatus] = useState('draft');
  const [itemOrder, setItemOrder] = useState(0);
  const [itemIsFeatured, setItemIsFeatured] = useState(false);
  const [itemMetadata, setItemMetadata] = useState({});

  // Media Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('');
  const [pickerAccept, setPickerAccept] = useState('');
  const [pickerMaxSize, setPickerMaxSize] = useState(null);

  // Version History State
  const [historyItem, setHistoryItem] = useState(null);
  const [historyList, setHistoryList] = useState([]);

  // Contact coordinates state
  const [contactEmail, setContactEmail] = useState('');
  const [contactGithub, setContactGithub] = useState('');
  const [contactLinkedin, setContactLinkedin] = useState('');
  const [contactWebsite, setContactWebsite] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactTwitter, setContactTwitter] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [contactAvailability, setContactAvailability] = useState('Open for internships');
  const [contactCustomLinks, setContactCustomLinks] = useState([]);

  // Save active section selection to localStorage
  useEffect(() => {
    if (selectedSectionId) {
      localStorage.setItem('last_active_section_id', selectedSectionId);
    }
  }, [selectedSectionId]);

  const handle401 = (res) => {
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.setItem('redirect_url', window.location.pathname + window.location.search);
      localStorage.setItem('auth_message', 'Your session expired. Please sign in again.');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  // Fetch Core Data
  const fetchSections = async () => {
    try {
      const response = await fetch('/api/v1/portfolio/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data);
        if (data.length > 0) {
          const isValid = data.some(s => s.id === selectedSectionId);
          if (!isValid) {
            const activeSec = data.find(s => s.is_active && s.slug !== 'global');
            if (activeSec) {
              setSelectedSectionId(activeSec.id);
            } else {
              setSelectedSectionId(data[0].id);
            }
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
      } else {
        handle401(response);
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
        if (handle401(res)) return;
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
      } else {
        handle401(res);
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
      } else {
        handle401(res);
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
      setItemIsFeatured(item.is_featured || false);
      
      const metadata = item.custom_metadata || {};
      setItemMetadata(metadata);
      
      const socialLinks = metadata.social_links || [];
      const getUrlForLabel = (label) => socialLinks.find(link => link.label?.toLowerCase() === label.toLowerCase())?.url || '';
      
      setContactEmail(metadata.email || getUrlForLabel('Email'));
      setContactGithub(metadata.github || getUrlForLabel('GitHub'));
      setContactLinkedin(metadata.linkedin || getUrlForLabel('LinkedIn'));
      setContactWebsite(metadata.website || getUrlForLabel('Website') || getUrlForLabel('Portfolio Website'));
      setContactInstagram(metadata.instagram || getUrlForLabel('Instagram'));
      setContactTwitter(metadata.twitter || getUrlForLabel('Twitter/X') || getUrlForLabel('Twitter'));
      setContactLocation(metadata.location || getUrlForLabel('Location'));
      setContactAvailability(metadata.availability_status || 'Open for internships');
      
      const standardLabels = ['email', 'github', 'linkedin', 'website', 'portfolio website', 'instagram', 'twitter', 'twitter/x', 'location'];
      const customLinks = metadata.custom_social_links || socialLinks.filter(link => !standardLabels.includes(link.label?.toLowerCase()));
      setContactCustomLinks(customLinks);
    } else {
      setEditingItem(null);
      setItemTitle('');
      setItemDesc('');
      setItemBody('');
      setItemStatus('draft');
      setItemOrder(items.filter(i => i.section_id === selectedSectionId).length);
      setItemIsFeatured(false);
      setItemMetadata({});
      
      setContactEmail('');
      setContactGithub('');
      setContactLinkedin('');
      setContactWebsite('');
      setContactInstagram('');
      setContactTwitter('');
      setContactLocation('');
      setContactAvailability('Open for internships');
      setContactCustomLinks([]);
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('access_token');
    
    // Auto cover fallback
    const metadata = { ...itemMetadata };
    if (!metadata.cover_image) {
      if (metadata.screenshots && metadata.screenshots.length > 0) {
        metadata.cover_image = metadata.screenshots[0];
      } else if (metadata.images && metadata.images.length > 0) {
        metadata.cover_image = metadata.images[0];
      }
    }

    if (activeSection && activeSection.slug === 'contact') {
      metadata.email = contactEmail;
      metadata.github = contactGithub;
      metadata.linkedin = contactLinkedin;
      metadata.website = contactWebsite;
      metadata.instagram = contactInstagram;
      metadata.twitter = contactTwitter;
      metadata.location = contactLocation;
      metadata.availability_status = contactAvailability;
      metadata.custom_social_links = contactCustomLinks;
      
      metadata.social_links = [
        { label: 'Email', url: contactEmail },
        { label: 'GitHub', url: contactGithub },
        { label: 'LinkedIn', url: contactLinkedin },
        { label: 'Website', url: contactWebsite },
        { label: 'Instagram', url: contactInstagram },
        { label: 'Twitter/X', url: contactTwitter },
        { label: 'Location', url: contactLocation },
        ...contactCustomLinks
      ].filter(link => link.url && link.url.trim() !== '');
    }

    const payload = {
      section_id: selectedSectionId,
      title: itemTitle,
      description: itemDesc,
      content_body: itemBody,
      custom_metadata: metadata,
      status: itemStatus,
      display_order: itemOrder,
      is_featured: itemIsFeatured,
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
        if (handle401(res)) return;
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
      } else {
        handle401(res);
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
      } else {
        handle401(res);
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
      } else {
        handle401(res);
      }
    } catch (e) {}
  };

  // Move Items Order Handlers
  const handleReorderItems = async (index, direction) => {
    const sorted = [...filteredItems].sort((a, b) => a.display_order - b.display_order);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const itemA = sorted[index];
    const itemB = sorted[targetIdx];

    // Swap display order
    const orderA = itemA.display_order;
    const orderB = itemB.display_order;

    itemA.display_order = orderB;
    itemB.display_order = orderA;

    const token = localStorage.getItem('access_token');
    try {
      // Save item A
      const resA = await fetch(`/api/v1/portfolio/items/${itemA.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...itemA, display_order: orderB })
      });
      if (resA.status === 401) {
        handle401(resA);
        return;
      }
      // Save item B
      const resB = await fetch(`/api/v1/portfolio/items/${itemB.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...itemB, display_order: orderA })
      });
      if (resB.status === 401) {
        handle401(resB);
        return;
      }
      fetchItems();
    } catch (e) {}
  };

  const openPickerFor = (field, accept = '', maxSize = null) => {
    setPickerTarget(field);
    setPickerAccept(accept);
    setPickerMaxSize(maxSize);
    setShowPicker(true);
  };

  const handleMediaSelect = (url) => {
    setShowPicker(false);
    if (pickerTarget === 'screenshots') {
      const current = itemMetadata.screenshots || [];
      setItemMetadata({ ...itemMetadata, screenshots: [...current, url] });
    } else if (pickerTarget === 'images') {
      const current = itemMetadata.images || [];
      setItemMetadata({ ...itemMetadata, images: [...current, url] });
    } else if (pickerTarget === 'avatar_url') {
      setItemMetadata({ ...itemMetadata, avatar_url: url, avatar: url });
    } else if (pickerTarget === 'certificate_url') {
      setItemMetadata({ ...itemMetadata, certificate_url: url, certificate: url });
    } else if (pickerTarget === 'badge_url') {
      setItemMetadata({ ...itemMetadata, badge_url: url, badge: url });
    } else if (pickerTarget === 'resume_pdf') {
      setItemMetadata({ ...itemMetadata, resume_pdf: url, resume: url });
    } else {
      setItemMetadata({ ...itemMetadata, [pickerTarget]: url });
    }
  };

  // Helpers
  const activeSection = sections.find(s => s.id === selectedSectionId);

  // Filters for items
  const filteredItems = items.filter(item => {
    if (item.section_id !== selectedSectionId) return false;
    
    if (statusFilter === 'deleted') {
      if (!item.is_deleted) return false;
    } else {
      if (item.is_deleted) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => a.display_order - b.display_order);

  // Render Category dropdown sensible defaults or custom category
  const renderCategoryField = () => {
    const categories = ['Illustration', 'Logo', 'Animation', 'GIF', 'Sketch', 'Painting'];
    const currentVal = itemMetadata.category || '';
    const isCustom = currentVal && !categories.includes(currentVal);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-control"
            value={isCustom ? 'custom' : currentVal}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setItemMetadata({ ...itemMetadata, category: '' });
              } else {
                setItemMetadata({ ...itemMetadata, category: e.target.value });
              }
            }}
          >
            <option value="">Choose category...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="custom">Other / Custom...</option>
          </select>
        </div>
        {(isCustom || !categories.includes(currentVal)) && (
          <div className="form-group">
            <label className="form-label">Custom Category Value</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. UI Design"
              value={currentVal}
              onChange={(e) => setItemMetadata({ ...itemMetadata, category: e.target.value })}
            />
          </div>
        )}
      </div>
    );
  };

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
                {['all', 'published', 'draft', 'archived', 'deleted'].map(status => (
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
            {sortedItems.length === 0 ? (
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
                    <th>Cover Asset</th>
                    <th>Reorder</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500' }}>
                        {item.title}
                        {item.is_featured && <span style={{ marginLeft: '6px', color: 'var(--warning-color)' }}>⭐</span>}
                      </td>
                      <td>
                        <span className={`badge ${item.is_deleted ? 'badge-deleted' : item.status === 'published' ? 'badge-published' : item.status === 'archived' ? 'badge-draft' : 'badge-draft'}`} style={{ opacity: item.status === 'archived' ? 0.6 : 1 }}>
                          {item.is_deleted ? 'Deleted' : item.status}
                        </span>
                      </td>
                      <td><code>v{item.current_version}</code></td>
                      <td>
                        {item.custom_metadata?.cover_image ? (
                          <a href={item.custom_metadata.cover_image} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={12} /> View File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '4px' }} disabled={idx === 0} onClick={() => handleReorderItems(idx, 'up')}>
                            <ArrowUp size={12} />
                          </button>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '4px' }} disabled={idx === sortedItems.length - 1} onClick={() => handleReorderItems(idx, 'down')}>
                            <ArrowDown size={12} />
                          </button>
                        </div>
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
         MODAL: ITEM FORM (DYNAMIC PORTFOLIO FORMS)
         ============================================================================== */}
      {showItemModal && (
        <div className="modal-overlay" style={{ overflowY: 'auto' }}>
          <div className="modal-content" style={{ maxWidth: '750px', margin: '40px auto' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h3>
              <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }} onClick={() => setShowItemModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                
                {/* -------------------- 1. About Me slug -------------------- */}
                {activeSection && activeSection.slug === 'about-me' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={itemTitle}
                          onChange={(e) => setItemTitle(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Age (Optional)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={itemMetadata.age || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, age: parseInt(e.target.value) || '' })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Current Degree</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.degree || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, degree: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Branch / Specialization</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.specialization || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, specialization: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">College / University</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.college || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, college: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Academic Year</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 3rd Year"
                          value={itemMetadata.academic_year || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, academic_year: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Profile Image URL</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Paste image URL..."
                          value={itemMetadata.avatar_url || itemMetadata.avatar || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, avatar_url: e.target.value, avatar: e.target.value })}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('avatar_url', 'image/*')}>
                          Select File
                        </button>
                      </div>
                      {(itemMetadata.avatar_url || itemMetadata.avatar) && (
                        <div style={{ marginTop: '8px' }}>
                          <img src={itemMetadata.avatar_url || itemMetadata.avatar} alt="Profile Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Introduction</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Brief summary line..."
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Personal Biography (Markdown)</label>
                      <textarea
                        className="form-control"
                        value={itemBody}
                        onChange={(e) => setItemBody(e.target.value)}
                        style={{ minHeight: '120px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Career Goals</label>
                      <textarea
                        className="form-control"
                        value={itemMetadata.career_goals || ''}
                        onChange={(e) => setItemMetadata({ ...itemMetadata, career_goals: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Hobbies</label>
                        <textarea
                          className="form-control"
                          value={itemMetadata.hobbies || itemMetadata.interests || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, hobbies: e.target.value, interests: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fun Facts</label>
                        <textarea
                          className="form-control"
                          value={itemMetadata.fun_facts || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, fun_facts: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 2. Projects slug -------------------- */}
                {activeSection && activeSection.slug === 'projects' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Project Title</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Description</label>
                      <input
                        type="text"
                        className="form-control"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Detailed Description (Markdown)</label>
                      <textarea
                        className="form-control"
                        value={itemBody}
                        onChange={(e) => setItemBody(e.target.value)}
                        style={{ minHeight: '120px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Cover Image URL</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Paste cover URL..."
                            value={itemMetadata.cover_image || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, cover_image: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('cover_image', 'image/*')}>
                            Select File
                          </button>
                        </div>
                        {itemMetadata.cover_image && (
                          <div style={{ marginTop: '8px' }}>
                            <img src={itemMetadata.cover_image} alt="Cover Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          </div>
                        )}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Demo Video URL</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Paste video URL..."
                            value={itemMetadata.demo_video || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, demo_video: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('demo_video', 'video/*')}>
                            Select File
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Tech Stack (badges)</label>
                        <TagInput
                          tags={itemMetadata.tech_stack || []}
                          onChange={(next) => setItemMetadata({ ...itemMetadata, tech_stack: next })}
                          placeholder="Add technology..."
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Skill Tags</label>
                        <TagInput
                          tags={itemMetadata.skill_tags || []}
                          onChange={(next) => setItemMetadata({ ...itemMetadata, skill_tags: next })}
                          placeholder="Add skill tag..."
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">GitHub Repository</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.github_repo || itemMetadata.github_link || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, github_repo: e.target.value, github_link: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Live Demo</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.live_demo || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, live_demo: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Documentation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={itemMetadata.documentation_url || itemMetadata.documentation_link || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, documentation_url: e.target.value, documentation_link: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Project Status</label>
                        <select
                          className="form-control"
                          value={itemMetadata.project_status || 'Completed'}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, project_status: e.target.value })}
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Completion Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={itemMetadata.completion_date || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, completion_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Multiple Screenshots</label>
                      <ReorderableMediaList
                        urls={itemMetadata.screenshots || []}
                        onChange={(next) => setItemMetadata({ ...itemMetadata, screenshots: next })}
                        onOpenPicker={() => openPickerFor('screenshots', 'image/*')}
                      />
                    </div>
                  </div>
                )}

                {/* -------------------- 3. Artwork slug -------------------- */}
                {activeSection && activeSection.slug === 'artwork' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Artwork Title</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>

                    {renderCategoryField()}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Medium</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Digital, Ink, Watercolor"
                          value={itemMetadata.medium || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, medium: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Creation Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={itemMetadata.creation_date || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, creation_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Cover Image URL</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Cover URL..."
                            value={itemMetadata.cover_image || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, cover_image: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('cover_image', 'image/*')}>
                            Select
                          </button>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Optional GIF URL</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="GIF URL..."
                            value={itemMetadata.gif_url || itemMetadata.gif || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, gif_url: e.target.value, gif: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('gif_url', 'image/gif')}>
                            Select
                          </button>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Optional Video URL</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Video URL..."
                            value={itemMetadata.video_url || itemMetadata.video || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, video_url: e.target.value, video: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('video_url', 'video/*')}>
                            Select
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Artwork Tags</label>
                      <TagInput
                        tags={itemMetadata.artwork_tags || itemMetadata.tags || []}
                        onChange={(next) => setItemMetadata({ ...itemMetadata, artwork_tags: next, tags: next })}
                        placeholder="Add tag..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Multiple Images</label>
                      <ReorderableMediaList
                        urls={itemMetadata.images || []}
                        onChange={(next) => setItemMetadata({ ...itemMetadata, images: next })}
                        onOpenPicker={() => openPickerFor('images', 'image/*')}
                      />
                    </div>
                  </div>
                )}

                {/* -------------------- 4. Skills & Tech slug -------------------- */}
                {activeSection && activeSection.slug === 'skills-tech' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Skill Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Category</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Frontend, Backend, DevOps"
                          value={itemMetadata.skill_category || itemMetadata.category || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, skill_category: e.target.value, category: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Proficiency Level ({itemMetadata.proficiency || 50}%)</label>
                        <input
                          type="range"
                          className="form-control"
                          min="0"
                          max="100"
                          value={itemMetadata.proficiency || 50}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, proficiency: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Related Technologies</label>
                      <TagInput
                        tags={itemMetadata.related_tech || []}
                        onChange={(next) => setItemMetadata({ ...itemMetadata, related_tech: next })}
                        placeholder="Add related tech..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Related Projects</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Lily Watercolor, Portfolio Website"
                        value={itemMetadata.related_projects || ''}
                        onChange={(e) => setItemMetadata({ ...itemMetadata, related_projects: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Experience Notes / Description</label>
                      <textarea
                        className="form-control"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* -------------------- 5. Achievements slug -------------------- */}
                {activeSection && activeSection.slug === 'achievements' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Achievement Title</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Category</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Competition, Certificate"
                          value={itemMetadata.achievement_category || itemMetadata.category || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, achievement_category: e.target.value, category: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date Received</label>
                        <input
                          type="date"
                          className="form-control"
                          value={itemMetadata.achievement_date || itemMetadata.date || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, achievement_date: e.target.value, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Certificate URL</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Certificate URL..."
                            value={itemMetadata.certificate_url || itemMetadata.certificate || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, certificate_url: e.target.value, certificate: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('certificate_url', 'image/*,application/pdf')}>
                            Select
                          </button>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Badge Image URL</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Badge image URL..."
                            value={itemMetadata.badge_url || itemMetadata.badge || ''}
                            onChange={(e) => setItemMetadata({ ...itemMetadata, badge_url: e.target.value, badge: e.target.value })}
                          />
                          <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('badge_url', 'image/*')}>
                            Select
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">External Link</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Verify URL or news..."
                        value={itemMetadata.external_link || ''}
                        onChange={(e) => setItemMetadata({ ...itemMetadata, external_link: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* -------------------- 6. Resume slug -------------------- */}
                {activeSection && activeSection.slug === 'resume' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Resume Version Label</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Technical Resume 2026"
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Resume Summary</label>
                      <textarea
                        className="form-control"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Resume PDF URL (PDF only, max 10MB)</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Paste PDF URL..."
                          value={itemMetadata.resume_pdf || itemMetadata.resume || ''}
                          onChange={(e) => setItemMetadata({ ...itemMetadata, resume_pdf: e.target.value, resume: e.target.value })}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => openPickerFor('resume_pdf', 'application/pdf', 10 * 1024 * 1024)}>
                          Select PDF File
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 7. Contact slug -------------------- */}
                {activeSection && activeSection.slug === 'contact' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Availability Status</label>
                      <select
                        className="form-control"
                        value={contactAvailability}
                        onChange={(e) => setContactAvailability(e.target.value)}
                      >
                        <option value="Open for internships">Open for internships</option>
                        <option value="Open to freelance">Open to freelance</option>
                        <option value="Open to collaborations">Open to collaborations</option>
                        <option value="Not available">Not available</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="e.g. admin@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Location</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. San Francisco, CA"
                          value={contactLocation}
                          onChange={(e) => setContactLocation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">GitHub URL</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://github.com/username"
                          value={contactGithub}
                          onChange={(e) => setContactGithub(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">LinkedIn URL</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://linkedin.com/in/username"
                          value={contactLinkedin}
                          onChange={(e) => setContactLinkedin(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Website URL</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://example.com"
                          value={contactWebsite}
                          onChange={(e) => setContactWebsite(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Instagram URL</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://instagram.com/username"
                          value={contactInstagram}
                          onChange={(e) => setContactInstagram(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Twitter/X URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://x.com/username"
                        value={contactTwitter}
                        onChange={(e) => setContactTwitter(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Custom Social Links</label>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Define any other social links or coordinates (e.g. Behance, Dribbble).
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {contactCustomLinks.map((link, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="form-control"
                              value={link.label}
                              placeholder="Label (e.g. Behance)"
                              onChange={(e) => {
                                const next = [...contactCustomLinks];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setContactCustomLinks(next);
                              }}
                            />
                            <input
                              type="text"
                              className="form-control"
                              value={link.url}
                              placeholder="URL or Value"
                              onChange={(e) => {
                                const next = [...contactCustomLinks];
                                next[idx] = { ...next[idx], url: e.target.value };
                                setContactCustomLinks(next);
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ color: 'var(--danger-color)', border: 'none', background: 'transparent' }}
                              onClick={() => {
                                setContactCustomLinks(contactCustomLinks.filter((_, i) => i !== idx));
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setContactCustomLinks([...contactCustomLinks, { label: '', url: '' }]);
                        }}
                      >
                        + Add Custom Link
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- DUAL METADATA STATUS FIELDS -------------------- */}
                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Publication Status</label>
                    <select
                      className="form-control"
                      value={itemStatus}
                      onChange={(e) => setItemStatus(e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
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

                {activeSection && ['projects', 'artwork', 'achievements', 'skills-tech'].includes(activeSection.slug) && (
                  <div className="form-group">
                    <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={itemIsFeatured}
                        onChange={(e) => setItemIsFeatured(e.target.checked)}
                      />
                      <Star size={16} style={{ color: itemIsFeatured ? 'var(--warning-color)' : 'var(--text-secondary)' }} />
                      <span>Promote to Featured Item</span>
                    </label>
                  </div>
                )}

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

      {/* ==============================================================================
         EMBEDDED MEDIA PICKER OVERLAY MODAL
         ============================================================================== */}
      {showPicker && (
        <MediaPicker
          pickerTarget={pickerTarget}
          onSelect={handleMediaSelect}
          onClose={() => setShowPicker(false)}
          accept={pickerAccept}
          maxSize={pickerMaxSize}
        />
      )}

    </div>
  );
}
