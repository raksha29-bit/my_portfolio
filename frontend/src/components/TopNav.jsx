import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';

export default function TopNav({ pageTitle }) {
  const [adminInfo, setAdminInfo] = useState(null);

  const fetchAdminInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdminInfo(data);
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchAdminInfo();

    // Listen to custom event for profile changes
    window.addEventListener('profile-updated', fetchAdminInfo);
    return () => {
      window.removeEventListener('profile-updated', fetchAdminInfo);
    };
  }, []);

  return (
    <div
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Title */}
      <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
        {pageTitle}
      </h2>

      {/* User profile info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          fontSize: '14px',
          color: 'var(--text-primary)',
        }}
      >
        {adminInfo?.avatar_url ? (
          <img 
            src={adminInfo.avatar_url} 
            alt="Avatar" 
            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : (
          <UserIcon size={16} />
        )}
        <span style={{ fontWeight: '500' }}>
          {adminInfo?.display_name || adminInfo?.email || 'Admin'}
        </span>
        {!adminInfo?.avatar_url && <span>👤</span>}
      </div>
    </div>
  );
}
