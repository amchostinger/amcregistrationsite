/**
 * components/layout/AdminLayout.jsx
 * Sidebar + header shell for all admin pages.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// SVG icon components — avoids emoji encoding issues
const Icons = {
  Dashboard:     () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Registrations: () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  Payments:      () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  Speakers:      () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  Resources:     () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>,
  Awards:        () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  Schedule:      () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Hotels:        () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Settings:      () => <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

const ADMIN_NAV = [
  { to: '/admin',               label: 'Dashboard',     Icon: Icons.Dashboard,     exact: true },
  { to: '/admin/registrations', label: 'Registrations', Icon: Icons.Registrations },
  { to: '/admin/payments',      label: 'Payments',      Icon: Icons.Payments },
  { to: '/admin/speakers',      label: 'Speakers',      Icon: Icons.Speakers },
  { to: '/admin/resources',     label: 'Resources',     Icon: Icons.Resources },
  { to: '/admin/awards',        label: 'Awards',        Icon: Icons.Awards },
  { to: '/admin/schedule',      label: 'Schedule',      Icon: Icons.Schedule },
  { to: '/admin/hotels',        label: 'Hotels',        Icon: Icons.Hotels },
  { to: '/admin/settings',      label: 'Settings',      Icon: Icons.Settings },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Below lg the sidebar is an off-canvas drawer; picking a page closes it.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [pathname]);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen lg:flex" style={{ background: '#f4f6f8' }}>
      {/* Scrim — only ever visible while the mobile drawer is open */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 flex flex-col transition-transform duration-300
                    lg:static lg:z-auto lg:translate-x-0
                    ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--color-navy)' }}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-2">
          <div>
            <div style={{ fontFamily: 'Cinzel, serif' }} className="text-gold font-bold text-sm tracking-widest uppercase">AMC 2027</div>
            <div className="text-white/50 text-xs mt-0.5 font-body">Admin Dashboard</div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white p-1 -mr-1"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {ADMIN_NAV.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded font-body text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold text-navy'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="p-4 border-t border-white/10">
          <div className="font-body text-white/50 text-xs mb-3 truncate">{admin?.email}</div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 font-body text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            Sign Out
          </button>
          <NavLink to="/" className="block mt-1.5 px-3 py-1.5 font-body text-xs text-white/40 hover:text-gold transition-colors">
            &larr; Back to website
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="lg:hidden -ml-1 p-2 rounded-lg text-navy hover:bg-gray-100 transition-colors flex-shrink-0"
                onClick={() => setNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <h1 style={{ fontFamily: 'Cinzel, serif' }} className="text-navy text-sm sm:text-base font-bold tracking-wide uppercase truncate">
                <span className="hidden sm:inline">AMC 2027 Conference Administration</span>
                <span className="sm:hidden">AMC 2027 Admin</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-gray-600 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                style={{ background: 'var(--color-navy)', color: 'var(--color-gold)' }}
              >
                {admin?.name?.[0] || 'A'}
              </div>
              <span className="hidden sm:inline">{admin?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
