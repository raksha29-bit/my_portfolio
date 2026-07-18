import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Image, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { resolveUrl } from '../utils/api';

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(resolveUrl('/api/v1/auth/logout'), { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('access_token');
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, end: true },
    { name: 'Portfolio CMS', path: '/dashboard/inventory', icon: FolderOpen, end: false },
    { name: 'Media Manager', path: '/dashboard/media', icon: Image, end: false },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, end: false },
  ];

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        height: '100vh',
      }}
    >
      {/* Brand logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '18px',
          color: 'var(--text-primary)',
          marginBottom: '32px',
          paddingLeft: '8px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--accent-color)',
            color: '#fff',
            padding: '6px',
            borderRadius: 'var(--radius)',
            display: 'flex',
          }}
        >
          <ShieldAlert size={20} />
        </div>
        <span>Sakura Admin</span>
      </div>

      {/* Nav Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                fontSize: '14px',
                fontWeight: '500',
                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                transition: 'all 0.15s ease',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--danger-color)',
          backgroundColor: 'transparent',
          border: 'none',
          textAlign: 'left',
          width: '100%',
          cursor: 'pointer',
          borderRadius: 'var(--radius)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
