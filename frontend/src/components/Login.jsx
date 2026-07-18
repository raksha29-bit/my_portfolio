import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react';
import { resolveUrl } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [setupRequired, setSetupRequired] = useState(false);
  const [hasDevAccount, setHasDevAccount] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // For Login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // For Setup Form
  const [setupEmail, setSetupEmail] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupDisplayName, setSetupDisplayName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const msg = localStorage.getItem('auth_message');
    if (msg) {
      setInfoMessage(msg);
      localStorage.removeItem('auth_message');
    }
  }, []);

  useEffect(() => {
    async function checkSetup() {
      try {
        const response = await fetch(resolveUrl('/api/v1/auth/setup-status'));
        if (response.ok) {
          const data = await response.json();
          setSetupRequired(data.setup_required);
          setHasDevAccount(data.has_dev_account);
        }
      } catch (err) {
        console.error('Failed to check setup status:', err);
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(resolveUrl('/api/v1/auth/upload-avatar'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Could not upload profile picture');
      }

      const data = await response.json();
      setAvatarUrl(data.secure_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (setupPassword !== setupPasswordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // 1. Create administrator account
      const response = await fetch(resolveUrl('/api/v1/auth/setup-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: setupEmail,
          username: setupUsername,
          password: setupPassword,
          display_name: setupDisplayName || setupUsername,
          avatar_url: avatarUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Setup failed. Please try again.');
      }

      // 2. Automatically log in after setup succeeds
      const loginResponse = await fetch(resolveUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_or_username: setupEmail,
          password: setupPassword,
        }),
      });

      if (!loginResponse.ok) {
        const errData = await loginResponse.json();
        throw new Error(errData.detail || 'Setup completed, but login failed. Please sign in manually.');
      }

      const loginData = await loginResponse.json();
      localStorage.setItem('access_token', loginData.access_token);
      onLoginSuccess(loginData.access_token);
      
      const nextUrl = localStorage.getItem('redirect_url');
      if (nextUrl) {
        localStorage.removeItem('redirect_url');
        navigate(nextUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(resolveUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_or_username: identifier,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Incorrect email/username or password');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      onLoginSuccess(data.access_token);
      
      const nextUrl = localStorage.getItem('redirect_url');
      if (nextUrl) {
        localStorage.removeItem('redirect_url');
        navigate(nextUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '450px',
          width: '100%',
          boxShadow: 'var(--shadow-md)',
          padding: '32px 24px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              backgroundColor: 'var(--accent-light)',
              borderRadius: '50%',
              color: 'var(--accent-color)',
              marginBottom: '16px',
            }}
          >
            <Lock size={28} />
          </div>
          <h1>{setupRequired ? 'Setup Admin Account' : 'Sakura CMS'}</h1>
          <p>
            {setupRequired
              ? 'Configure your permanent admin credentials.'
              : 'Sign in to manage your game portfolio'}
          </p>
          {setupRequired && hasDevAccount && (
            <div style={{ fontSize: '12px', color: 'var(--accent-purple)', marginTop: '8px', fontStyle: 'italic' }}>
              Setting up your real account will permanently disable settings.ADMIN_EMAIL (admin@example.com)
            </div>
          )}
        </div>

        {infoMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--accent-color)',
              fontSize: '14px',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldAlert size={16} />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--danger-color)',
              fontSize: '14px',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {setupRequired ? (
          /* Setup / First-Time Administrator Signup Form */
          <form onSubmit={handleSetupSubmit}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="raksha"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Raksha"
                  value={setupDisplayName}
                  onChange={(e) => setSetupDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="raksha@gmail.com"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
              />
            </div>

            {/* Avatar upload */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Profile Picture (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {avatarUrl ? (
                    <img src={resolveUrl(avatarUrl)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={20} style={{ opacity: 0.4 }} />
                  )}
                </div>
                <label
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Upload size={14} />
                  {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="••••••••"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="••••••••"
                  value={setupPasswordConfirm}
                  onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '40px' }}
              disabled={loading || uploadingAvatar}
            >
              {loading ? 'Initializing Setup...' : 'Setup Administrator'}
            </button>
          </form>
        ) : (
          /* Normal Sign In Form */
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="admin or admin@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '40px' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
