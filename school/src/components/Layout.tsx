import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Bus,
  IdCard,
  Handshake,
  MapPinned,
  KeyRound,
  LogOut,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/students', label: 'Students', icon: GraduationCap },
  { to: '/app/buses', label: 'Buses', icon: Bus },
  { to: '/app/drivers', label: 'School Drivers', icon: IdCard },
  { to: '/app/private', label: 'Private Drivers', icon: Handshake },
  { to: '/app/fleet', label: 'Live Fleet', icon: MapPinned },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Navigation size={17} />
          </div>
          <div className="sidebar-brand-name">HakikaRide School</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/app/change-password" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <KeyRound size={18} />
            Change Password
          </NavLink>
          <button
            className="sidebar-link"
            style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', textAlign: 'left' }}
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            Sign Out
          </button>
          {user && (
            <div style={{ padding: '10px 12px 0', fontSize: 12, color: '#6B7280' }}>{user.email}</div>
          )}
        </div>
      </aside>

      <div className="main-area">
        <Outlet />
      </div>
    </div>
  );
}
