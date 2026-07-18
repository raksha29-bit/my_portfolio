import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, HardDrive, Cpu, Database, User, Key, Monitor, 
  LogOut, Upload, Image as ImageIcon, AlertTriangle, CheckCircle 
} from 'lucide-react';

function parseUserAgent(ua) {
  if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser' };
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Parse OS
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  // Parse Browser
  if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Trident') || ua.includes('MSIE')) browser = 'Internet Explorer';

  return { os, browser };
}

export default function Settings({ onLogout }) {
  const [activeTab, setActiveTab] = useState('system');
  const [adminInfo, setAdminInfo] = useState(null);
  const navigate = useNavigate();

  // Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle401 = () => {
    localStorage.removeItem('access_token');
    localStorage.setItem('redirect_url', window.location.pathname + window.location.search);
    localStorage.setItem('auth_message', 'Your session expired. Please sign in again.');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const fetchAdminInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        handle401();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setAdminInfo(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (e) {
      console.error('Failed to fetch admin info:', e);
    }
  };

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError('');
    setProfileSuccess('');

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/auth/upload-my-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        handle401();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Could not upload avatar image');
      }

      const data = await response.json();
      setAvatarUrl(data.secure_url);
      setProfileSuccess('Profile picture uploaded successfully!');
      
      // Dispatch custom event to notify TopNav
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setLoading(true);

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch('/api/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          username: username,
          email: email,
          avatar_url: avatarUrl,
        }),
      });

      if (response.status === 401) {
        handle401();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to update profile details.');
      }

      const data = await response.json();
      setAdminInfo(data);
      setProfileSuccess('Profile details updated successfully.');
      
      // Dispatch custom event to notify TopNav
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          password_confirm: confirmPassword,
        }),
      });

      if (response.status === 401) {
        handle401();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to change password.');
      }

      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to sign out from all devices? This will invalidate all sessions.')) {
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await fetch('/api/v1/auth/logout-all-devices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // Ignore
    }

    localStorage.removeItem('access_token');
    if (onLogout) onLogout();
    navigate('/login');
  };

  const parsedUA = adminInfo ? parseUserAgent(adminInfo.user_agent) : { os: 'N/A', browser: 'N/A' };

  const settingsInfo = [
    {
      title: 'Application Module',
      icon: Shield,
      color: 'var(--accent-color)',
      bg: 'var(--accent-light)',
      fields: [
        { label: 'Core version', value: 'v1.4.0 (Release)' },
        { label: 'Environment mode', value: 'Production' },
        { label: 'CORS policy', value: 'Restricted (localhost only)' },
      ],
    },
    {
      title: 'Storage Infrastructure',
      icon: HardDrive,
      color: 'var(--success-color)',
      bg: 'rgba(16, 185, 129, 0.1)',
      fields: [
        { label: 'Active provider', value: 'LocalStorageProvider (Local File Abstraction)' },
        { label: 'Host target path', value: 'backend/app/static/uploads' },
        { label: 'Local server path', value: '/static/uploads/' },
      ],
    },
    {
      title: 'AI Companion Layer',
      icon: Cpu,
      color: 'var(--warning-color)',
      bg: 'rgba(245, 158, 11, 0.1)',
      fields: [
        { label: 'Mascot Guide LLM', value: 'MockProvider (SakuraPersona v2)' },
        { label: 'Streaming capabilities', value: 'Mock streams active' },
        { label: 'Ollama endpoint', value: 'http://localhost:11434 (configured)' },
      ],
    },
    {
      title: 'Database Engine',
      icon: Database,
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.1)',
      fields: [
        { label: 'SQLAlchemy dialect', value: 'SQLite (sqlite:///./portfolio.db)' },
        { label: 'Pool health checks', value: 'Healthy (pre-ping active)' },
        { label: 'Migrations state', value: 'Alembic revision f0fb3375ae2f (applied)' },
      ],
    },
  ];

  return (
    <div className="content-container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '4px' }}>System Settings</h1>
        <p>Manage administrator account details and view runtime environment metadata.</p>
      </div>

      {/* Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '12px', 
          borderBottom: '1px solid var(--border-color)', 
          marginBottom: '32px',
          paddingBottom: '8px'
        }}
      >
        <button
          onClick={() => setActiveTab('system')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            color: activeTab === 'system' ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'system' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px',
            borderBottom: activeTab === 'system' ? '2px solid var(--accent-color)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          ⚙️ System Infrastructure
        </button>
        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            color: activeTab === 'account' ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'account' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '14px',
            borderBottom: activeTab === 'account' ? '2px solid var(--accent-color)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          👤 Account & Profile
        </button>
      </div>

      {activeTab === 'system' ? (
        /* Tab 1: System Info Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {settingsInfo.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  padding: '24px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div
                    style={{
                      backgroundColor: block.bg,
                      color: block.color,
                      padding: '8px',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{block.title}</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {block.fields.map((field) => (
                    <div
                      key={field.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{field.label}</span>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right' }}>
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Account & Profile Configuration */
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Column A: Edit Profile & Password Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Profile Form */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <User size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Edit Profile Information</h3>
              </div>

              {profileSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', fontSize: '13px', borderRadius: '8px', marginBottom: '16px' }}>
                  <CheckCircle size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', fontSize: '13px', borderRadius: '8px', marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={20} style={{ opacity: 0.4 }} />
                    )}
                  </div>
                  <label
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Upload size={14} />
                    {uploadingAvatar ? 'Uploading...' : 'Change Profile Picture'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading || uploadingAvatar}>
                  {loading ? 'Saving details...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

            {/* Password Form */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Key size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Change Account Password</h3>
              </div>

              {passwordSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', fontSize: '13px', borderRadius: '8px', marginBottom: '16px' }}>
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', fontSize: '13px', borderRadius: '8px', marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Changing password...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>

          {/* Column B: Current Session Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Session Card */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                  <Monitor size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Current Session</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Logged in as</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{displayName || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Username</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{username || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Login</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right' }}>
                    {adminInfo?.last_login ? new Date(adminInfo.last_login).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>OS</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{parsedUA.os}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Browser</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{parsedUA.browser}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>IP Address</span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{adminInfo?.masked_ip || 'N/A'}</span>
                </div>
              </div>

              <button 
                onClick={handleLogoutAllDevices} 
                className="btn" 
                style={{ 
                  width: '100%', 
                  backgroundColor: 'transparent', 
                  border: '1px solid var(--danger-color)', 
                  color: 'var(--danger-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '40px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius)',
                  fontWeight: '500',
                  fontSize: '13px'
                }}
              >
                <LogOut size={14} />
                <span>Logout All Devices</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
