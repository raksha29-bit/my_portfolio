import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardHome from './components/DashboardHome';
import PortfolioInventory from './components/PortfolioInventory';
import MediaManager from './components/MediaManager';
import Settings from './components/Settings';

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

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
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
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
