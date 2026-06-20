import React, { useState, useEffect } from 'react';
import { Shield, User, ArrowLeft, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface AdminPanelProps {
  token: string;
  onBack: () => void;
  currentUserEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ token, onBack, currentUserEmail }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się pobrać listy użytkowników');
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zmienić roli użytkownika');
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess(`Zmieniono rolę dla ${data.username} na ${newRole}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <ArrowLeft size={16} /> Powrót do Pulpitu
        </button>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={24} style={{ color: 'var(--color-primary)' }} /> Zarządzanie Rolami Użytkowników
        </h2>
        <button onClick={fetchUsers} className="btn btn-secondary" style={{ padding: '8px' }} title="Odśwież">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '15px', borderColor: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="glass-panel" style={{ padding: '15px', borderColor: 'var(--color-primary)', background: 'rgba(16, 185, 129, 0.05)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            Ładowanie listy użytkowników...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px' }}>Skaut / Użytkownik</th>
                <th style={{ padding: '12px' }}>Adres E-mail</th>
                <th style={{ padding: '12px' }}>Data rejestracji</th>
                <th style={{ padding: '12px' }}>Rola</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Działania</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                      <User size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name || user.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>@{user.username}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>{user.email}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: user.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.15)' : user.role === 'HEAD_SCOUT' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: user.role === 'ADMIN' ? '#f87171' : user.role === 'HEAD_SCOUT' ? '#38bdf8' : '#34d399',
                      border: `1px solid ${user.role === 'ADMIN' ? 'rgba(239,68,68,0.2)' : user.role === 'HEAD_SCOUT' ? 'rgba(14,165,233,0.2)' : 'rgba(16,185,129,0.2)'}`
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    {user.email === currentUserEmail ? (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ty (Brak edycji)</span>
                    ) : (
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="glass-input"
                        style={{ padding: '5px 10px', fontSize: '13px', background: 'var(--bg-main)' }}
                      >
                        <option value="SCOUT">SKAUT (SCOUT)</option>
                        <option value="HEAD_SCOUT">SZEF SCOUTINGU (HEAD SCOUT)</option>
                        <option value="ADMIN">ADMINISTRATOR (ADMIN)</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
