import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Star, Award, RefreshCw, LogOut } from 'lucide-react';

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  age: number;
  club: string;
  nationality: string;
  height: number;
  preferredFoot: string;
  photoUrl: string | null;
  technique: number;
  speed: number;
  physicality: number;
  creativity: number;
  mentality: number;
  reports?: Array<{ potential: string; recommendation: string }>;
}

interface DashboardProps {
  token: string;
  user: { username: string; email: string; role: string; name: string | null };
  onSelectPlayer: (id: number) => void;
  onViewAdmin: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ token, user, onSelectPlayer, onViewAdmin, onLogout }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [country, setCountry] = useState('');
  const [club, setClub] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [potentialFilter, setPotentialFilter] = useState('');

  // Add player form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: 'ST',
    age: '20',
    club: '',
    nationality: '',
    height: '180',
    preferredFoot: 'RIGHT',
    technique: '10',
    speed: '10',
    physicality: '10',
    creativity: '10',
    mentality: '10',
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [showOnlyWatchlist, setShowOnlyWatchlist] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/watchlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlistIds(data.map((p: any) => p.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/players?';
      if (position) url += `position=${encodeURIComponent(position)}&`;
      if (country) url += `country=${encodeURIComponent(country)}&`;
      if (club) url += `club=${encodeURIComponent(club)}&`;
      if (minAge) url += `minAge=${minAge}&`;
      if (maxAge) url += `maxAge=${maxAge}&`;
      if (potentialFilter) url += `minPotential=${encodeURIComponent(potentialFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch players');
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchWatchlist();
  }, [position, country, club, minAge, maxAge, potentialFilter, search]);

  const handleToggleWatchlist = async (e: React.MouseEvent, playerId: number) => {
    e.stopPropagation();
    const isWatched = watchlistIds.includes(playerId);
    try {
      if (isWatched) {
        const res = await fetch(`http://localhost:5000/api/watchlist/${playerId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setWatchlistIds(watchlistIds.filter(id => id !== playerId));
        }
      } else {
        const res = await fetch('http://localhost:5000/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ playerId })
        });
        if (res.ok) {
          setWatchlistIds([...watchlistIds, playerId]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      form.append(key, val);
    });

    if (photoFile) {
      form.append('photo', photoFile);
    }

    try {
      const res = await fetch('http://localhost:5000/api/players', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add player');

      setShowAddForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        position: 'ST',
        age: '20',
        club: '',
        nationality: '',
        height: '180',
        preferredFoot: 'RIGHT',
        technique: '10',
        speed: '10',
        physicality: '10',
        creativity: '10',
        mentality: '10',
        photoUrl: ''
      });
      setPhotoFile(null);
      fetchPlayers();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const getAvgRating = (player: Player) => {
    return ((player.technique + player.speed + player.physicality + player.creativity + player.mentality) / 5).toFixed(1);
  };

  const getRatingClass = (score: number) => {
    if (score >= 15) return 'rating-high';
    if (score >= 10) return 'rating-medium';
    return 'rating-low';
  };

  const displayedPlayers = showOnlyWatchlist 
    ? players.filter(p => watchlistIds.includes(p.id))
    : players;

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', marginBottom: '30px', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SCOUT PRO
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Logged in as: <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{user.name} ({user.role})</span></p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user.role === 'ADMIN' && (
            <button onClick={onViewAdmin} className="btn btn-secondary">
              Admin Panel
            </button>
          )}
          <button 
            onClick={() => setShowOnlyWatchlist(!showOnlyWatchlist)} 
            className={`btn ${showOnlyWatchlist ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Star size={16} fill={showOnlyWatchlist ? 'white' : 'none'} /> Watchlist ({watchlistIds.length})
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <UserPlus size={16} /> Add Player
          </button>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '10px' }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Grid containing Filters and Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        
        {/* Sidebar Filters */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} style={{ color: 'var(--color-primary)' }} /> Search Filters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>General Search</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="glass-input" 
                  placeholder="Name, club, country..." 
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }}>
                <option value="">All Positions</option>
                <option value="GK">Goalkeeper (GK)</option>
                <option value="CB">Center Back (CB)</option>
                <option value="LB">Left Back (LB)</option>
                <option value="RB">Right Back (RB)</option>
                <option value="CDM">Defensive Mid (CDM)</option>
                <option value="CM">Central Midfielder (CM)</option>
                <option value="CAM">Attacking Mid (CAM)</option>
                <option value="LW">Left Winger (LW)</option>
                <option value="RW">Right Winger (RW)</option>
                <option value="ST">Striker (ST)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Club</label>
              <input type="text" value={club} onChange={e => setClub(e.target.value)} className="glass-input" placeholder="Club name" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Country / Nationality</label>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="glass-input" placeholder="Poland, England..." style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Min Age</label>
                <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)} className="glass-input" placeholder="15" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Max Age</label>
                <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} className="glass-input" placeholder="40" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Potential Rating</label>
              <select value={potentialFilter} onChange={e => setPotentialFilter(e.target.value)} className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }}>
                <option value="">All Potentials</option>
                <option value="Elite">Elite Potential</option>
                <option value="First Team">First Team Quality</option>
                <option value="Squad Player">Squad Player</option>
                <option value="Development Needed">Development Needed</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setSearch('');
                setPosition('');
                setCountry('');
                setClub('');
                setMinAge('');
                setMaxAge('');
                setPotentialFilter('');
              }} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '10px' }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Players Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '15px' }}>
              <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Fetching players data...</span>
            </div>
          ) : displayedPlayers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No scouted players match your criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {displayedPlayers.map((player) => {
                const avg = getAvgRating(player);
                const isWatched = watchlistIds.includes(player.id);
                return (
                  <div 
                    key={player.id} 
                    onClick={() => onSelectPlayer(player.id)}
                    className="glass-panel" 
                    style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Player Image / Header */}
                    <div style={{ height: '160px', width: '100%', background: 'linear-gradient(to bottom, rgba(16,185,129,0.1), rgba(0,0,0,0.6))', position: 'relative' }}>
                      {player.photoUrl ? (
                        <img 
                          src={player.photoUrl.startsWith('http') ? player.photoUrl : `http://localhost:5000${player.photoUrl}`} 
                          alt={`${player.firstName} ${player.lastName}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60';
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                          <Award size={48} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                      )}
                      
                      {/* Watchlist Star */}
                      <button 
                        onClick={(e) => handleToggleWatchlist(e, player.id)}
                        style={{ position: 'absolute', right: '12px', top: '12px', background: 'rgba(6, 8, 20, 0.6)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Star size={14} fill={isWatched ? 'gold' : 'none'} stroke={isWatched ? 'gold' : 'white'} />
                      </button>

                      {/* Position Tag */}
                      <span style={{ position: 'absolute', left: '12px', bottom: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {player.position}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        {player.firstName} {player.lastName}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                        {player.club} | {player.nationality}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginBottom: '16px' }}>
                        <div>Age: <strong style={{ color: 'white' }}>{player.age}</strong></div>
                        <div>Foot: <strong style={{ color: 'white' }}>{player.preferredFoot}</strong></div>
                        <div>Height: <strong style={{ color: 'white' }}>{player.height} cm</strong></div>
                        <div>Potential: <strong style={{ color: 'var(--color-primary)' }}>{player.reports?.[0]?.potential || 'N/A'}</strong></div>
                      </div>

                      {/* Score Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Avg Rating:</span>
                        <div className={`rating-badge ${getRatingClass(parseFloat(avg))}`}>
                          {avg}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Player Overlay Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: 'var(--bg-main)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus size={20} style={{ color: 'var(--color-primary)' }} /> Scout New Player
            </h3>

            {formError && (
              <div className="glass-panel" style={{ padding: '12px', borderColor: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', marginBottom: '15px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddPlayer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>First Name</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Last Name</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Position</label>
                  <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="glass-input" style={{ background: 'var(--bg-main)' }}>
                    <option value="GK">GK</option>
                    <option value="CB">CB</option>
                    <option value="LB">LB</option>
                    <option value="RB">RB</option>
                    <option value="CDM">CDM</option>
                    <option value="CM">CM</option>
                    <option value="CAM">CAM</option>
                    <option value="LW">LW</option>
                    <option value="RW">RW</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Age</label>
                  <input type="number" required value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Height (cm)</label>
                  <input type="number" required value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Club</label>
                  <input type="text" required value={formData.club} onChange={e => setFormData({ ...formData, club: e.target.value })} className="glass-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Nationality</label>
                  <input type="text" required value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="glass-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Preferred Foot</label>
                  <select value={formData.preferredFoot} onChange={e => setFormData({ ...formData, preferredFoot: e.target.value })} className="glass-input" style={{ background: 'var(--bg-main)' }}>
                    <option value="RIGHT">Right Foot</option>
                    <option value="LEFT">Left Foot</option>
                    <option value="BOTH">Both Feet</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Player Photo</label>
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="glass-input" />
                </div>
              </div>

              {/* Scouting Ratings (1-20) */}
              <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Scout Ratings (1 - 20)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Technique</span>
                    <span>{formData.technique}/20</span>
                  </div>
                  <input type="range" min="1" max="20" value={formData.technique} onChange={e => setFormData({ ...formData, technique: e.target.value })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Speed</span>
                    <span>{formData.speed}/20</span>
                  </div>
                  <input type="range" min="1" max="20" value={formData.speed} onChange={e => setFormData({ ...formData, speed: e.target.value })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Physicality</span>
                    <span>{formData.physicality}/20</span>
                  </div>
                  <input type="range" min="1" max="20" value={formData.physicality} onChange={e => setFormData({ ...formData, physicality: e.target.value })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Creativity</span>
                    <span>{formData.creativity}/20</span>
                  </div>
                  <input type="range" min="1" max="20" value={formData.creativity} onChange={e => setFormData({ ...formData, creativity: e.target.value })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Mentality</span>
                    <span>{formData.mentality}/20</span>
                  </div>
                  <input type="range" min="1" max="20" value={formData.mentality} onChange={e => setFormData({ ...formData, mentality: e.target.value })} style={{ accentColor: 'var(--color-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Player</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
