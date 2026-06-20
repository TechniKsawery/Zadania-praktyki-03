import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Eye, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  Briefcase 
} from 'lucide-react';
import { User } from '../services/api';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  user: User;
  onLogout: () => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
  unreadCount,
}) => {
  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand} onClick={() => onNavigate('DASHBOARD')}>
        <Briefcase size={26} color="var(--accent-color)" />
        <span style={styles.brandText}>Scout<span style={{ color: 'var(--accent-color)' }}>Pro</span></span>
      </div>

      {/* User Info Card */}
      <div style={styles.userCard}>
        <div style={styles.avatar}>
          {user.username.substring(0, 2).toUpperCase()}
        </div>
        <div style={styles.userDetails}>
          <span style={styles.username}>{user.username}</span>
          <span style={{
            ...styles.roleBadge,
            backgroundColor: user.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.15)' : user.role === 'HEAD_SCOUT' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 245, 155, 0.15)',
            color: user.role === 'ADMIN' ? '#ef4444' : user.role === 'HEAD_SCOUT' ? '#00e5ff' : '#00f59b',
            border: user.role === 'ADMIN' ? '1px solid rgba(239, 68, 68, 0.3)' : user.role === 'HEAD_SCOUT' ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(0, 245, 155, 0.3)',
          }}>
            {user.role === 'ADMIN' ? 'Admin' : user.role === 'HEAD_SCOUT' ? 'Head Scout' : 'Scout'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <button 
          onClick={() => onNavigate('DASHBOARD')}
          style={{
            ...styles.navLink,
            ...(currentView === 'DASHBOARD' ? styles.navLinkActive : {})
          }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => onNavigate('PLAYERS_LIST')}
          style={{
            ...styles.navLink,
            ...(currentView === 'PLAYERS_LIST' || currentView === 'PLAYER_DETAIL' || currentView === 'PLAYER_FORM' || currentView === 'REPORT_FORM' ? styles.navLinkActive : {})
          }}
        >
          <Users size={18} />
          <span>Zawodnicy</span>
        </button>

        <button 
          onClick={() => onNavigate('WATCHLIST')}
          style={{
            ...styles.navLink,
            ...(currentView === 'WATCHLIST' ? styles.navLinkActive : {})
          }}
        >
          <Eye size={18} />
          <span>Obserwowani</span>
        </button>

        <button 
          onClick={() => onNavigate('NOTIFICATIONS')}
          style={{
            ...styles.navLink,
            ...(currentView === 'NOTIFICATIONS' ? styles.navLinkActive : {})
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <Bell size={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Powiadomienia</span>
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </div>
        </button>

        {user.role === 'ADMIN' && (
          <button 
            onClick={() => onNavigate('ADMIN_PANEL')}
            style={{
              ...styles.navLink,
              ...(currentView === 'ADMIN_PANEL' ? styles.navLinkActive : {})
            }}
          >
            <ShieldAlert size={18} />
            <span>Panel Admina</span>
          </button>
        )}
      </nav>

      {/* Logout button */}
      <button onClick={onLogout} style={styles.logoutBtn}>
        <LogOut size={18} />
        <span>Wyloguj się</span>
      </button>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.75rem 1.25rem',
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    marginBottom: '2rem',
    paddingLeft: '0.5rem',
  },
  brandText: {
    fontFamily: 'var(--font-title)',
    fontWeight: 800,
    fontSize: '1.35rem',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--border-radius-md)',
    padding: '0.85rem',
    marginBottom: '2rem',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--accent-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--accent-color)',
    fontFamily: 'var(--font-title)',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  username: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  roleBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
    width: 'fit-content',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-title)',
    fontWeight: '500',
    fontSize: '0.9rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  navLinkActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.08)',
    color: 'var(--accent-color)',
    fontWeight: '600',
    borderLeft: '3px solid var(--accent-color)',
    borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0',
  },
  badge: {
    backgroundColor: 'var(--accent-color)',
    color: '#000',
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '0.1rem 0.4rem',
    borderRadius: '10px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    fontFamily: 'var(--font-title)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    marginTop: 'auto',
  },
};
