import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';

export default function TopNav({ pageTitle }) {
  const [adminEmail, setAdminEmail] = useState('Admin');

  useEffect(() => {
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
          setAdminEmail(data.email);
        }
      } catch (e) {
        // Fallback to default
      }
    };
    fetchAdminInfo();
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
        <UserIcon size={16} />
        <span style={{ fontWeight: '500' }}>{adminEmail}</span>
      </div>
    </div>
  );
}
