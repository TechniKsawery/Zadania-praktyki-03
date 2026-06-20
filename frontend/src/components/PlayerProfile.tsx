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

  // AI Generation State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{
    description: string;
    potential: string;
    comparison: string;
    suggestions: string;
  } | null>(null);

  // New Report Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    strengths: '',
    weaknesses: '',
    potential: 'First Team',
    recommendation: 'MONITOR'
  });
  const [reportError, setReportError] = useState('');

  // Video Upload State
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
      if (!res.ok) throw new Error(data.error || 'Failed to fetch player details');
      setPlayer(data);

      // If player already has a report with AI description, load it into local AI results
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

    // Attach current AI results to the report if they are available
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
      if (!res.ok) throw new Error(data.error || 'Failed to save report');

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
    if (!window.confirm('Are you sure you want to delete this scouting report?')) return;
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
      if (!res.ok) throw new Error('PDF failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ScoutReport_${player?.lastName || 'Player'}.pdf`;
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate AI insights');
      
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
      setVideoError('Please select a video file.');
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
      if (!res.ok) throw new Error(data.error || 'Failed to upload video');

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
        <span style={{ color: 'var(--color-text-muted)' }}>Loading scout details...</span>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Player not found.</p>
        <button onClick={onBack} className="btn btn-secondary">Go Back</button>
      </div>
    );
  }

  const ratings = [
    { label: 'Technique', value: player.technique },
    { label: 'Speed', value: player.speed },
    { label: 'Physicality', value: player.physicality },
    { label: 'Creativity', value: player.creativity },
    { label: 'Mentality', value: player.mentality }
  ];

  const getBarColor = (score: number) => {
    if (score >= 15) return 'linear-gradient(90deg, #10b981, #34d399)';
    if (score >= 10) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Back button */}
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px', padding: '8px 16px' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Main player layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Column: Player Bio & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Bio */}
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
                <span style={{ color: 'var(--color-text-muted)' }}>Nationality</span>
                <span style={{ fontWeight: 600 }}>{player.nationality}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Age</span>
                <span style={{ fontWeight: 600 }}>{player.age} years old</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Height</span>
                <span style={{ fontWeight: 600 }}>{player.height} cm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Preferred Foot</span>
                <span style={{ fontWeight: 600 }}>{player.preferredFoot}</span>
              </div>
            </div>
          </div>

          {/* Card: Ratings progress */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--color-primary)' }}>Scout Ratings</h3>
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

        {/* Right Column: Dynamic tabs details */}
        <div>
          {/* Tabs Menu */}
          <div className="glass-panel" style={{ display: 'flex', padding: '6px', gap: '5px', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <FileText size={16} /> Scouting Reports ({player.reports?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('videos')} 
              className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <VideoIcon size={16} /> Video Highlights ({player.videos?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('ai')} 
              className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexGrow: 1, padding: '10px' }}
            >
              <BrainCircuit size={16} /> AI Assistant insights
            </button>
          </div>

          {/* TAB 1: REPORTS */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Scouting Reports History</h3>
                <button onClick={() => setShowReportForm(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  <Plus size={16} /> Create Report
                </button>
              </div>

              {showReportForm && (
                <div className="glass-panel animate-fade-in" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ marginBottom: '15px' }}>New Report Form</h4>
                  {reportError && <div style={{ color: 'red', marginBottom: '10px' }}>{reportError}</div>}
                  <form onSubmit={handleCreateReport}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Strengths</label>
                        <textarea required className="glass-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={reportFormData.strengths} onChange={e => setReportFormData({ ...reportFormData, strengths: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Weaknesses</label>
                        <textarea required className="glass-input" style={{ width: '100%', height: '80px', resize: 'vertical' }} value={reportFormData.weaknesses} onChange={e => setReportFormData({ ...reportFormData, weaknesses: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Overall Potential</label>
                        <select className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }} value={reportFormData.potential} onChange={e => setReportFormData({ ...reportFormData, potential: e.target.value })}>
                          <option value="Elite">Elite Potential</option>
                          <option value="First Team">First Team Quality</option>
                          <option value="Squad Player">Squad Player</option>
                          <option value="Development Needed">Development Needed</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Recommendation</label>
                        <select className="glass-input" style={{ width: '100%', background: 'var(--bg-main)' }} value={reportFormData.recommendation} onChange={e => setReportFormData({ ...reportFormData, recommendation: e.target.value })}>
                          <option value="SIGN">SIGN</option>
                          <option value="MONITOR">MONITOR</option>
                          <option value="DISCARD">DISCARD</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" onClick={() => setShowReportForm(false)} className="btn btn-secondary">Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Report</button>
                    </div>
                  </form>
                </div>
              )}

              {player.reports?.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No reports logged yet. Start by clicking 'Create Report'.
                </div>
              ) : (
                player.reports.map((report) => (
                  <div key={report.id} className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          Scouted by: <strong>{report.author?.name || 'Unknown'}</strong> ({report.author?.role})
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '15px' }}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleDownloadPDF(report.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} title="Download PDF">
                          <FileDown size={14} /> PDF
                        </button>
                        {(userRole === 'ADMIN' || userRole === 'HEAD_SCOUT') && (
                          <button onClick={() => handleDeleteReport(report.id)} className="btn btn-secondary" style={{ padding: '6px', color: 'var(--color-danger)' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <h5 style={{ color: 'var(--color-primary)', fontSize: '13px', marginBottom: '4px' }}>Strengths</h5>
                        <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{report.strengths}</p>
                      </div>
                      <div>
                        <h5 style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '4px' }}>Weaknesses</h5>
                        <p style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{report.weaknesses}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px', fontSize: '12px' }}>
                      <div>Potential: <strong style={{ color: 'white' }}>{report.potential}</strong></div>
                      <div>Recommendation: <strong style={{ color: report.recommendation === 'SIGN' ? '#34d399' : report.recommendation === 'MONITOR' ? '#fbbf24' : '#f87171' }}>{report.recommendation}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3>Player Highlights & Video Analysis</h3>

              {/* Video Player Modal overlay */}
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

              {/* Upload form */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} style={{ color: 'var(--color-primary)' }} /> Upload Video Clip
                </h4>
                {videoError && <div style={{ color: 'red', marginBottom: '10px' }}>{videoError}</div>}
                
                <form onSubmit={handleVideoUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Clip Title</label>
                    <input type="text" required value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="glass-input" placeholder="Goal, Interception, Skills..." />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Video File</label>
                    <input type="file" required accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="glass-input" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={uploadingVideo} style={{ height: '40px' }}>
                    {uploadingVideo ? 'Uploading...' : 'Upload Clip'}
                  </button>
                </form>
              </div>

              {/* Videos Grid */}
              {player.videos?.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No video clips uploaded yet. Use the uploader above.
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

          {/* TAB 3: AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>AI Player Intelligence (Gemini)</h3>
                <button 
                  onClick={handleGenerateAI} 
                  disabled={generatingAi} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} /> 
                  {generatingAi ? 'Generating report...' : aiResult ? 'Re-generate insights' : 'Generate AI Insights'}
                </button>
              </div>

              {generatingAi && (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 20px' }} />
                  <h4>Evaluating scouting profiles with Gemini AI...</h4>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>Formulating player description, potential index, real-world comparison, and training suggestions.</p>
                </div>
              )}

              {!generatingAi && !aiResult && (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Click 'Generate AI Insights' to generate an automatic evaluation based on player stats and metrics.
                </div>
              )}

              {!generatingAi && aiResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Card: AI description */}
                  <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary)' }}>
                      <Sparkles size={16} /> AI Summary & Description
                    </h4>
                    <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{aiResult.description}</p>
                  </div>

                  {/* Card: Potential & Development */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Potential Assessment</h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>{aiResult.potential}</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>Similar Players</h4>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>{aiResult.comparison}</p>
                    </div>
                  </div>

                  {/* Card: suggestions */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--color-primary)' }}>Suggested Development Road Map</h4>
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
