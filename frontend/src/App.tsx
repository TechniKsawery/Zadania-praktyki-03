import { useState, useEffect } from 'react';
import { LogIn, UserPlus, Bell, AlertCircle } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PlayerProfile } from './components/PlayerProfile';
import { AdminPanel } from './components/AdminPanel';

interface UserInfo {
  username: string;
  email: string;
  role: string;
  name: string | null;
}

interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(!!token);

  // Routing state
  const [currentView, setCurrentView] = useState<'dashboard' | 'player-details' | 'admin'>('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isRegister, setIsRegister] = useState(false);

  // Auth Forms State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('SCOUT');
  const [authError, setAuthError] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
      fetchNotifications();
      // Poll notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setNotifications([]);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error(err);
      setToken(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.filter(n => !n.read));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      setCurrentView('dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          email: authEmail,
          password: authPassword,
          name: authName,
          role: authRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setToken(data.token);
      setUser(data.user);
      setCurrentView('dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentView('dashboard');
    setSelectedPlayerId(null);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <span>Authorizing Scout Session...</span>
      </div>
    );
  }

  // RENDER LOGIN / REGISTER VIEW
  if (!token) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '40px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
              SCOUT PRO
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              {isRegister ? 'Create scout account' : 'Football Scouting Platform'}
            </p>
          </div>

          {authError && (
            <div className="glass-panel" style={{ padding: '12px', borderColor: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13.5px' }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          {isRegister ? (
            <form onSubmit={handleRegister}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Username</label>
                  <input type="text" required value={authUsername} onChange={e => setAuthUsername(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Full Name</label>
                  <input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Email</label>
                  <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Password</label>
                  <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Role</label>
                  <select value={authRole} onChange={e => setAuthRole(e.target.value)} className="glass-input" style={{ background: 'var(--bg-main)' }}>
                    <option value="SCOUT">SCOUT</option>
                    <option value="HEAD_SCOUT">HEAD SCOUT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginBottom: '15px' }}>
                <UserPlus size={16} /> Sign Up
              </button>
              <div style={{ textAlign: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Already have an account? </span>
                <button type="button" onClick={() => setIsRegister(false)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>Log In</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Email</label>
                  <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Password</label>
                  <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="glass-input" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px', marginBottom: '15px' }}>
                <LogIn size={16} /> Log In
              </button>
              <div style={{ textAlign: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>New to Scout Pro? </span>
                <button type="button" onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>Register</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // RENDER APP SHELL
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="glass-panel" style={{ borderRadius: '0px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 30px', position: 'sticky', top: 0, zIndex: 999 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => { setCurrentView('dashboard'); setSelectedPlayerId(null); }}>
            Scout Pro
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Notifications Button */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer', position: 'relative', padding: '6px' }}
            >
              <Bell size={20} />
              {unreadNotificationsCount > 0 && (
                <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="glass-panel animate-fade-in" style={{ position: 'absolute', right: 0, top: '40px', width: '320px', padding: '15px', background: 'var(--bg-main)', zIndex: 1001, maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px' }}>Notifications</h4>
                  <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '11px', cursor: 'pointer' }}>Clear Read</button>
                </div>

                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', padding: '15px 0' }}>No notifications</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(16,185,129,0.06)', border: `1px solid ${n.read ? 'transparent' : 'rgba(16,185,129,0.1)'}`, cursor: 'pointer', fontSize: '12.5px' }}
                      >
                        <p style={{ color: n.read ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>{n.message}</p>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Name & Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{user?.name}</span>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>{user?.role}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, padding: '20px 0' }}>
        {currentView === 'dashboard' && (
          <Dashboard 
            token={token} 
            user={user!} 
            onSelectPlayer={(id) => {
              setSelectedPlayerId(id);
              setCurrentView('player-details');
            }}
            onViewAdmin={() => setCurrentView('admin')}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'player-details' && selectedPlayerId && (
          <PlayerProfile 
            playerId={selectedPlayerId} 
            token={token} 
            userRole={user!.role}
            onBack={() => {
              setSelectedPlayerId(null);
              setCurrentView('dashboard');
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel 
            token={token} 
            currentUserEmail={user!.email}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
