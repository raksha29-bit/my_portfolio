import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardHome from './components/DashboardHome';
import PortfolioInventory from './components/PortfolioInventory';
import MediaManager from './components/MediaManager';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import WorldPage from './components/WorldPage';
import PortfolioSectionPage from './components/PortfolioSectionPage';
import PortfolioItemDetail from './components/PortfolioItemDetail';
import ThemeToggle from './components/ThemeToggle';

// Helper to determine navbar title from route path
function getPageTitle(pathname) {
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard Overview';
    case '/dashboard/inventory':
      return 'Portfolio CMS Inventory';
    case '/dashboard/media':
      return 'Media Asset Library';
    case '/dashboard/settings':
      return 'System Settings';
    default:
      return 'Sakura Admin Panel';
  }
}

// Protected Route Wrapper Component
function ProtectedRoute({ token }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

// Dashboard Layout wrapper containing Sidebar and TopNav
function DashboardLayout({ token, onLogout }) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <TopNav pageTitle={pageTitle} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// A component that clears data-theme when navigating away from public pages
function ThemeRouteHandler({ themeMode }) {
  const location = useLocation();

  useEffect(() => {
    const isPublic = !location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/login');
    if (!isPublic) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      // Re-apply public theme when returning to a public page
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (themeMode === 'system') {
        const themeValue = mediaQuery.matches ? 'system-dark' : 'system-light';
        document.documentElement.setAttribute('data-theme', themeValue);
      } else {
        document.documentElement.setAttribute('data-theme', themeMode);
      }
    }
  }, [location.pathname, themeMode]);

  return null;
}

// Public Layout wrapper containing the ThemeToggle
function PublicLayout({ themeMode, onChangeTheme }) {
  return (
    <>
      <ThemeToggle themeMode={themeMode} onChangeTheme={onChangeTheme} />
      <Outlet />
    </>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('sky_theme_preference') || 'system';
  });

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (themeMode === 'system') {
        const themeValue = e.matches ? 'system-dark' : 'system-light';
        document.documentElement.setAttribute('data-theme', themeValue);
      }
    };

    const applyTheme = (mode) => {
      // Only apply themes if not on dashboard or login pages
      const pathname = window.location.pathname;
      const isPublic = !pathname.startsWith('/dashboard') && !pathname.startsWith('/login');
      if (!isPublic) {
        document.documentElement.removeAttribute('data-theme');
        return;
      }

      if (mode === 'system') {
        const themeValue = mediaQuery.matches ? 'system-dark' : 'system-light';
        document.documentElement.setAttribute('data-theme', themeValue);
      } else {
        document.documentElement.setAttribute('data-theme', mode);
      }
    };

    applyTheme(themeMode);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeMode]);

  const handleThemeChange = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('sky_theme_preference', newMode);
  };

  return (
    <BrowserRouter>
      <ThemeRouteHandler themeMode={themeMode} />
      <Routes>
        {/* Public Landing Experience wrapped in PublicLayout */}
        <Route element={<PublicLayout themeMode={themeMode} onChangeTheme={handleThemeChange} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/world" element={<WorldPage />} />
          <Route path="/world/section/:sectionSlug" element={<PortfolioSectionPage />} />
          <Route path="/world/item/:itemSlug" element={<PortfolioItemDetail />} />
        </Route>

        {/* Unauthenticated Login Route */}
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute token={token} />}>
          <Route element={<DashboardLayout token={token} onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/inventory" element={<PortfolioInventory />} />
            <Route path="/dashboard/media" element={<MediaManager />} />
            <Route path="/dashboard/settings" element={<Settings onLogout={handleLogout} />} />
          </Route>
        </Route>

        {/* Catch-all redirect to public landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

