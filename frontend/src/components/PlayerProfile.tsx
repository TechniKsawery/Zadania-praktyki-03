import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Video as VideoIcon, BrainCircuit, Trash2, Plus, Sparkles, Upload, FileDown, RefreshCw } from 'lucide-react';

interface Report {
  id: number;
  strengths: string;
  weaknesses: string;
  potential: string;
  recommendation: string;
  aiDescription: string | null;
  aiDevelopmentSuggestion: string | null;
  aiComparison: string | null;
  createdAt: string;
  author: { name: string | null; role: string };
}

interface Video {
  id: number;
  title: string;
  videoUrl: string;
  createdAt: string;
}

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
  reports: Report[];
  videos: Video[];
}

interface PlayerProfileProps {
  playerId: number;
  token: string;
  userRole: string;
  onBack: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ playerId, token, userRole, onBack }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'videos' | 'ai'>('reports');

  // Stan generowania analizy AI
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{
    description: string;
    potential: string;
    comparison: string;
    suggestions: string;
    isMock?: boolean;
  } | null>(null);

  // Stan formularza nowego raportu
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    strengths: '',
    weaknesses: '',
    potential: 'First Team',
    recommendation: 'MONITOR'
  });
  const [reportError, setReportError] = useState('');

  // Stan wgrywania filmów wideo
  const [videoTitle, setVideoTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const fetchPlayerDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/players/${playerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się pobrać szczegółowych danych zawodnika');
      setPlayer(data);

      // Jeśli zawodnik ma już wygenerowany opis AI, załaduj go do widoku
      const latestWithAi = data.reports?.find((r: Report) => r.aiDescription);
      if (latestWithAi) {
        setAiResult({
          description: latestWithAi.aiDescription || '',
          potential: latestWithAi.potential || '',
          comparison: latestWithAi.aiComparison || '',
          suggestions: latestWithAi.aiDevelopmentSuggestion || ''
        });
      } else {
        setAiResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerDetails();
  }, [playerId]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');

    const body = {
      playerId,
      ...reportFormData,
      aiDescription: aiResult?.description || null,
      aiDevelopmentSuggestion: aiResult?.suggestions || null,
      aiComparison: aiResult?.comparison || null
    };

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać raportu');

      setShowReportForm(false);
      setReportFormData({
        strengths: '',
        weaknesses: '',
        potential: 'First Team',
        recommendation: 'MONITOR'
      });
      fetchPlayerDetails();
    } catch (err: any) {
      setReportError(err.message);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten raport scoutingowy?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlayerDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = async (reportId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Generowanie PDF nie powiodło się');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RaportScout_${player?.lastName || 'Zawodnik'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ playerId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generowanie analizy AI nie powiodło się');
      
      setAiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoError('');
    if (!videoFile) {
      setVideoError('Wybierz plik wideo.');
      return;
    }

    setUploadingVideo(true);
    const form = new FormData();
    form.append('playerId', String(playerId));
    form.append('title', videoTitle);
    form.append('video', videoFile);

    try {
      const res = await fetch('http://localhost:5000/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się przesłać nagrania');

      setVideoTitle('');
      setVideoFile(null);
      fetchPlayerDetails();
    } catch (err: any) {
      setVideoError(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '15px' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        <span style={{ color: 'var(--color-text-muted)' }}>Pobieranie szczegółów zawodnika...</span>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Nie odnaleziono profilu zawodnika.</p>
        <button onClick={onBack} className="btn btn-secondary">Powrót</button>
      </div>
    );
  }

  const ratings = [
    { label: 'Technika', value: player.technique },
    { label: 'Szybkość', value: player.speed },
    { label: 'Warunki fizyczne', value: player.physicality },
    { label: 'Kreatywność', value: player.creativity },
    { label: 'Mentalność', value: player.mentality }
  ];

  const getBarColor = (score: number) => {
    if (score >= 15) return 'linear-gradient(90deg, #10b981, #34d399)';
    if (score >= 10) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Przycisk powrotu */}
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px', padding: '8px 16px' }}>
        <ArrowLeft size={16} /> Powrót do Pulpitu
      </button>

      {/* Główny układ profilu */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Kolumna lewa: Dane osobowe i statystyki */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dane Biograficzne */}
          <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px', background: 'rgba(255,255,255,0.03)' }}>
              {player.photoUrl ? (
                <img 
                  src={player.photoUrl.startsWith('http') ? player.photoUrl : `http://localhost:5000${player.photoUrl}`} 
                  alt={`${player.firstName} ${player.lastName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BrainCircuit size={64} style={{ color: 'var(--color-text-muted)', opacity: 0.2 }} />
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
              {player.firstName} {player.lastName}
            </h2>
            <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>
              {player.position} | {player.club}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Narodowość</span>
                <span style={{ fontWeight: 600 }}>{player.nationality}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Wiek</span>
                <span style={{ fontWeight: 600 }}>{player.age} lat</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Wzrost</span>
                <span style={{ fontWeight: 600 }}>{player.height} cm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Preferowana noga</span>
                <span style={{ fontWeight: 600 }}>{player.preferredFoot === 'RIGHT' ? 'Prawa' : player.preferredFoot === 'LEFT' ? 'Lewa' : 'Obie'}</span>
              </div>
            </div>
          </div>

          {/* Oceny scouta */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--color-primary)' }}>Parametry Zawodnika</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ratings.map(stat => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
                    <span style={{ fontWeight: 700 }}>{stat.value} / 20</span>
                  </div>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar-fill"
                      style={{ 
                        width: `${(stat.value / 20) * 100}%`,
                        background: getBarColor(stat.value)
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Kolumna prawa: Zakładki szczegółowe */}
        <div>
          {/* Menu Zakładek */}
          <div className="glass-panel" style={{ display: 'flex', padding: '6px', gap: '5px', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <FileText size={16} /> Raporty Scoutingowe ({player.reports?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('videos')} 
              className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <VideoIcon size={16} /> Wideoanaliza ({player.videos?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('ai')} 
              className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <BrainCircuit size={16} /> Analiza AI (Gemini)
            </button>
          </div>

          {/* ZAKŁADKA 1: RAPORTY */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Historia Raportów</h3>
                <button onClick={() => setShowReportForm(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  <Plus size={16} /> Dodaj Raport
                </button>
              </div>

              {showReportForm && (
                <div className="glass-panel animate-fade-in" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ marginBottom: '15px' }}>Formularz Nowego Raportu</h4>
                  {reportError && <div style={{ color: 'red', marginBottom: '10px' }}>{reportError}</div>}
                  <form onSubmit={handleCreateReport}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Mocne strony</label>
                        <textarea required className="glass-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={reportFormData.strengths} onChange={e => setReportFormData({ ...reportFormData, strengths: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Słabe strony</label>
                        <textarea required className="glass-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={reportFormData.weaknesses} onChange={e => setReportFormData({ ...reportFormData, weaknesses: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ogólna klasyfikacja potencjału</label>
                        <select className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }} value={reportFormData.potential} onChange={e => setReportFormData({ ...reportFormData, potential: e.target.value })}>
                          <option value="Elite">Klasa światowa (Elite)</option>
                          <option value="First Team">Pierwszy zespół (First Team)</option>
                          <option value="Squad Player">Zawodnik rotacyjny (Squad)</option>
                          <option value="Development Needed">Wymaga rozwoju (Develop)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Rekomendacja dla klubu</label>
                        <select className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }} value={reportFormData.recommendation} onChange={e => setReportFormData({ ...reportFormData, recommendation: e.target.value })}>
                          <option value="SIGN">KUP/PODPISZ (SIGN)</option>
                          <option value="MONITOR">OBSERWUJ (MONITOR)</option>
                          <option value="DISCARD">ODRZUĆ (DISCARD)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" onClick={() => setShowReportForm(false)} className="btn btn-secondary">Anuluj</button>
                      <button type="submit" className="btn btn-primary">Zapisz Raport</button>
                    </div>
                  </form>
                </div>
              )}

              {player.reports?.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Brak zapisanych raportów. Kliknij 'Dodaj Raport', aby dodać nową ocenę.
                </div>
              ) : (
                player.reports.map((report) => (
                  <div key={report.id} className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          Scout: <strong>{report.author?.name || 'Nieznany'}</strong> ({report.author?.role})
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '15px' }}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDownloadPDF(report.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} title="Pobierz PDF">
                          <FileDown size={14} /> PDF
                        </button>
                        {(userRole === 'ADMIN' || userRole === 'HEAD_SCOUT') && (
                          <button onClick={() => handleDeleteReport(report.id)} className="btn btn-secondary" style={{ padding: '6px', color: 'var(--color-danger)' }} title="Usuń">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <h5 style={{ color: 'var(--color-primary)', fontSize: '13px', marginBottom: '4px' }}>Mocne Strony</h5>
                        <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{report.strengths}</p>
                      </div>
                      <div>
                        <h5 style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '4px' }}>Słabe Strony</h5>
                        <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{report.weaknesses}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px', fontSize: '12px' }}>
                      <div>Potencjał: <strong style={{ color: 'white' }}>{report.potential}</strong></div>
                      <div>Rekomendacja: <strong style={{ color: report.recommendation === 'SIGN' ? '#34d399' : report.recommendation === 'MONITOR' ? '#fbbf24' : '#f87171' }}>{report.recommendation}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ZAKŁADKA 2: WIDEO */}
          {activeTab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3>Wideoanaliza i Skróty Zawodnika</h3>

              {/* Odtwarzacz Wideo Modal */}
              {activeVideoUrl && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }} onClick={() => setActiveVideoUrl(null)}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                    <video 
                      src={`http://localhost:5000${activeVideoUrl}`}
                      controls 
                      autoPlay 
                      style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: '0px 0px 40px rgba(0,0,0,0.8)' }}
                    />
                    <button 
                      onClick={() => setActiveVideoUrl(null)} 
                      style={{ position: 'absolute', right: '-40px', top: '-10px', background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}

              {/* Formularz dodawania wideo */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} style={{ color: 'var(--color-primary)' }} /> Prześlij Nowe Nagranie (Highlight)
                </h4>
                {videoError && <div style={{ color: 'red', marginBottom: '10px' }}>{videoError}</div>}
                
                <form onSubmit={handleVideoUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Tytuł nagrania</label>
                    <input type="text" required value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="glass-input" placeholder="Bramki, interwencje, dryblingi..." />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Plik wideo</label>
                    <input type="file" required accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="glass-input" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploadingVideo} style={{ height: '40px' }}>
                    {uploadingVideo ? 'Przesyłanie...' : 'Prześlij plik'}
                  </button>
                </form>
              </div>

              {/* Lista filmów */}
              {player.videos?.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Brak wgranych filmów wideo. Użyj powyższego formularza.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {player.videos.map(video => (
                    <div 
                      key={video.id} 
                      onClick={() => setActiveVideoUrl(video.videoUrl)}
                      className="glass-panel" 
                      style={{ cursor: 'pointer', overflow: 'hidden', padding: '0px' }}
                    >
                      <div style={{ height: '120px', background: '#0a0d20', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ background: 'rgba(16,185,129,0.2)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <VideoIcon size={20} style={{ color: 'var(--color-primary)' }} />
                        </div>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {video.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ZAKŁADKA 3: ANALIZA AI */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Inteligentna Analiza AI (Google Gemini)</h3>
                <button 
                  onClick={handleGenerateAI} 
                  disabled={generatingAi} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} /> 
                  {generatingAi ? 'Generowanie raportu...' : aiResult ? 'Odśwież analizę AI' : 'Generuj wgląd AI'}
                </button>
              </div>

              {generatingAi && (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 20px' }} />
                  <h4>Sztuczna inteligencja analizuje dane statystyczne zawodnika...</h4>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>Tworzenie spersonalizowanego opisu profilu, ocena potencjału rozwoju, porównanie do znanych graczy i plan treningowy.</p>
                </div>
              )}

              {!generatingAi && !aiResult && (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Kliknij przycisk 'Generuj wgląd AI', aby otrzymać automatyczną ocenę na podstawie parametrów liczbowych zawodnika.
                </div>
              )}

              {!generatingAi && aiResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status źródła analizy */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: aiResult.isMock === undefined ? '#64748b' : aiResult.isMock === false ? '#00F59b' : '#f59e0b',
                      boxShadow: aiResult.isMock === undefined ? 'none' : aiResult.isMock === false ? '0 0 8px #00F59b' : '0 0 8px #f59e0b'
                    }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>Status źródła:</span>
                    <strong style={{ color: aiResult.isMock === undefined ? '#94a3b8' : aiResult.isMock === false ? '#00F59b' : '#f59e0b' }}>
                      {aiResult.isMock === undefined ? 'Wczytano z bazy danych (zapisana analiza)' : aiResult.isMock === false ? 'Połączono z Gemini API' : 'Tryb offline (lokalny mock)'}
                    </strong>
                  </div>

                  {/* Podsumowanie */}
                  <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary)' }}>
                      <Sparkles size={16} /> Podsumowanie i Profil Profilu AI
                    </h4>
                    <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{aiResult.description}</p>
                  </div>

                  {/* Klasyfikacja i Porównanie */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Ocena Potencjału rozwoju</h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>{aiResult.potential}</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Podobni Gracze (Styl gry)</h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>{aiResult.comparison}</p>
                    </div>
                  </div>

                  {/* Ścieżka rozwoju */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--color-primary)' }}>Sugerowana Ścieżka Dalszego Rozwoju</h4>
                    <div style={{ fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {aiResult.suggestions}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
