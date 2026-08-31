import { useEffect, useRef, useState } from 'react';
import { Album, Home, Library, LockKeyhole, LogIn, Mail, Menu, MoreHorizontal, Pause, Play, Search, User, UserPlus, Volume2, X } from 'lucide-react';

const colors = ['olive', 'coral', 'mustard', 'rust', 'rose'];

function Artwork({ index = 0, small = false }) {
  return <div className={`artwork artwork--${colors[index % colors.length]} ${small ? 'artwork--small' : ''}`} aria-hidden="true"><span>{index % 2 ? '◒' : '✦'}</span></div>;
}

function pauseOtherAudio(event) {
  document.querySelectorAll('audio').forEach((audio) => {
    if (audio !== event.currentTarget) audio.pause();
  });
}

function pauseOtherAudioFromDocument(event) {
  document.querySelectorAll('audio').forEach((audio) => {
    if (audio !== event.target) audio.pause();
  });
}

function TrackDetail({ track, index, onClose }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  return <main className="track-detail"><button className="track-detail-close" onClick={onClose}>Back to library</button><Artwork index={index} /><p className="eyebrow">Now selected</p><h1>{track.title}</h1><p>{track.artist?.username || 'Unknown artist'}</p><audio controls autoPlay src={track.uri} onPlay={pauseOtherAudio} /></main>;
}

function AuthScreen({ mode, setMode, onAuthenticated }) {
  const signup = mode === 'signup';
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const body = signup
      ? { ...form, username: form.username.trim(), email: form.email.trim().toLowerCase() }
      : { username: form.username.trim(), password: form.password };
    try {
      const response = await fetch(`/api/auth/${signup ? 'register' : 'login'}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const responseText = await response.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = {}; }
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
      onAuthenticated(data.user);
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-aside"><div className="brand"><span className="brand-mark">S</span><span>sonata</span></div><p className="eyebrow">Your music, in full color</p><h1>A better place<br /><em>to listen.</em></h1><p>Find the music waiting in your library and make the room your own.</p></div><section className="auth-panel"><div className="auth-heading"><span className="auth-icon">{signup ? <UserPlus size={20} /> : <LogIn size={20} />}</span><p className="eyebrow">{signup ? 'Create your account' : 'Welcome back'}</p><h2>{signup ? 'Start listening.' : 'Sign in to Sonata.'}</h2><p>{signup ? 'Your personal music space is a few details away.' : 'Your library is ready when you are.'}</p></div><form className="auth-form" onSubmit={submit}>{signup && <label><span>Username</span><div className="input-wrap"><User size={16} /><input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></div></label>}{signup && <label><span>Account type</span><div className="input-wrap"><UserPlus size={16} /><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="user">Listener</option><option value="artist">Artist</option></select></div></label>}<label><span>{signup ? 'Email' : 'Username or email'}</span><div className="input-wrap"><Mail size={16} /><input required type={signup ? 'email' : 'text'} value={form[signup ? 'email' : 'username']} onChange={(event) => setForm({ ...form, [signup ? 'email' : 'username']: event.target.value })} /></div></label><label><span>Password</span><div className="input-wrap"><LockKeyhole size={16} /><input required type="password" minLength={signup ? 6 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></label>{error && <p className="form-error">{error}</p>}<button className="submit-button" disabled={busy}>{busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}</button></form><p className="auth-switch">{signup ? 'Already have an account?' : 'New to Sonata?'} <button onClick={() => { setMode(signup ? 'login' : 'signup'); setError(''); }}>{signup ? 'Sign in' : 'Create an account'}</button></p></section></main>;
}

function ArtistDashboard({ onLogout }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumTracks, setAlbumTracks] = useState([]);
  const [albumCover, setAlbumCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadTracks() {
    const response = await fetch('/api/music/mine', { credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not load your tracks');
    setTracks(data.musics || []);
  }

  useEffect(() => { loadTracks().catch((loadError) => setError(loadError.message)); }, []);

  async function submit(event) {
    event.preventDefault(); setMessage(''); setError('');
    if (!file) { setError('Choose an audio file first.'); return; }
    setBusy(true);
    const formData = new FormData(); formData.append('title', title.trim()); formData.append('music', file);
    try {
      const response = await fetch('/api/music/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Upload failed (${response.status})`);
      setTitle(''); setFile(null); event.target.reset(); setMessage('Track uploaded successfully.');
      await loadTracks();
    } catch (uploadError) { setError(uploadError.message); } finally { setBusy(false); }
  }

  async function renameTrack(track) {
    const nextTitle = window.prompt('Track title', track.title);
    if (!nextTitle || nextTitle.trim() === track.title) return;
    const response = await fetch(`/api/music/${track._id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: nextTitle.trim() }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not update track');
    await loadTracks(); setMessage('Track updated successfully.');
  }

  async function removeTrack(track) {
    if (!window.confirm(`Delete "${track.title}"?`)) return;
    const response = await fetch(`/api/music/${track._id}`, { method: 'DELETE', credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not delete track');
    await loadTracks(); setMessage('Track deleted successfully.');
  }

  async function createAlbum(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (!albumTracks.length) { setError('Select at least one track for the album.'); return; }
    const formData = new FormData(); formData.append('title', albumTitle.trim()); albumTracks.forEach((trackId) => formData.append('musics', trackId)); if (albumCover) formData.append('cover', albumCover);
    const response = await fetch('/api/music/album', { method: 'POST', credentials: 'include', body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not create album');
    setAlbumTitle(''); setAlbumTracks([]); setAlbumCover(null); event.target.reset(); setMessage('Album created successfully.');
  }

  return <main className="artist-page"><header className="artist-header"><div className="brand"><span className="brand-mark">S</span><span>sonata</span></div><button className="logout-button" onClick={onLogout}>Log out</button></header><section className="artist-content"><p className="eyebrow">Artist studio</p><h1>Put your music<br /><em>in the room.</em></h1><p className="artist-copy">Upload, preview, and manage your tracks from one place.</p><form className="upload-form" onSubmit={submit}><label><span>Track title</span><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your track a name" /></label><label><span>Audio file</span><input required type="file" accept="audio/*" onChange={(event) => setFile(event.target.files[0] || null)} /></label>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<button className="submit-button" disabled={busy}>{busy ? 'Uploading...' : 'Upload track'}</button></form><form className="upload-form album-form" onSubmit={createAlbum}><p className="eyebrow">Release tools</p><h2>Create an album</h2><label><span>Album title</span><input required value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} placeholder="Name your album" /></label><label><span>Choose tracks</span><select multiple required value={albumTracks} onChange={(event) => setAlbumTracks(Array.from(event.target.selectedOptions, (option) => option.value))}>{tracks.map((track) => <option key={track._id} value={track._id}>{track.title}</option>)}</select></label><label><span>Cover artwork</span><input type="file" accept="image/*" onChange={(event) => setAlbumCover(event.target.files[0] || null)} /></label><button className="submit-button" disabled={!tracks.length}>Create album</button></form><section className="artist-tracks"><div className="section-header"><div><p className="eyebrow">Your uploads</p><h2>Tracks</h2></div><span className="record-count">{tracks.length} records</span></div>{tracks.length ? <div className="artist-track-list">{tracks.map((track) => <div className="artist-track" key={track._id}><span>{track.title}</span><span className="artist-track-actions"><audio controls preload="none" src={track.uri} /><button type="button" onClick={() => renameTrack(track)}>Edit</button><button type="button" onClick={() => removeTrack(track)}>Delete</button></span></div>)}</div> : <p className="artist-empty">No tracks uploaded yet.</p>}</section></section></main>;
}

function App() {
    const [user, setUser] = useState(null); const [mode, setMode] = useState('login'); const [tracks, setTracks] = useState([]); const [albums, setAlbums] = useState([]); const [selectedTrack, setSelectedTrack] = useState(null); const [detailTrack, setDetailTrack] = useState(null); const [playing, setPlaying] = useState(false); const [audioError, setAudioError] = useState(''); const [mobileNav, setMobileNav] = useState(false); const [activeNav, setActiveNav] = useState('Home'); const audioRef = useRef(null);

  useEffect(() => {
    document.addEventListener('play', pauseOtherAudioFromDocument, true);
    return () => document.removeEventListener('play', pauseOtherAudioFromDocument, true);
  }, []);

  useEffect(() => {
    const target = activeNav === 'Home'
      ? document.querySelector('.welcome-section')
      : document.querySelector('.track-section');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeNav]);

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return undefined;
    const existing = mainContent.querySelector('.search-popover');
    existing?.remove();
    if (activeNav !== 'Search') return undefined;

    const searchPopover = document.createElement('div');
    searchPopover.className = 'search-popover';
    searchPopover.innerHTML = '<label>Search your library</label><input type="search" placeholder="Track, album, or artist" autofocus />';
    mainContent.prepend(searchPopover);
    const input = searchPopover.querySelector('input');
    let emptyState = null;
    const filter = () => {
      const query = input.value.trim().toLowerCase();
      const items = document.querySelectorAll('.album-card, .track-row');
      let visibleCount = 0;
      items.forEach((item) => {
        item.hidden = query && !item.textContent.toLowerCase().includes(query);
        if (!item.hidden) visibleCount += 1;
      });
      if (!emptyState) { emptyState = document.createElement('p'); emptyState.className = 'search-empty'; searchPopover.append(emptyState); }
      emptyState.textContent = query && !visibleCount ? 'Nothing found in your library.' : '';
      emptyState.hidden = !query || visibleCount > 0;
    };
    input.addEventListener('input', filter);
    input.focus();
    return () => {
      input.removeEventListener('input', filter);
      searchPopover.remove();
      document.querySelectorAll('.album-card, .track-row').forEach((item) => { item.hidden = false; });
    };
  }, [activeNav]);

  async function loadLibrary() {
    const [musicResponse, albumResponse] = await Promise.all([fetch('/api/music', { credentials: 'include' }), fetch('/api/music/albums', { credentials: 'include' })]);
    if (!musicResponse.ok || !albumResponse.ok) throw new Error('Please sign in');
    const musicData = await musicResponse.json(); const albumData = await albumResponse.json();
    setTracks(musicData.musics || []); setAlbums(albumData.albums || []);
  }
  useEffect(() => { loadLibrary().catch(() => setUser(null)); }, []);
  function authenticate(authenticatedUser) { setUser(authenticatedUser); loadLibrary().catch(() => {}); }
    function playTrack(track) { setSelectedTrack(track); setDetailTrack(track); setAudioError(''); if (!track.uri) { setAudioError('This track has no audio URL.'); return; } if (audioRef.current) { audioRef.current.src = track.uri; audioRef.current.load(); audioRef.current.play().then(() => setPlaying(true)).catch(() => setAudioError('This audio file could not be played.')); } }
  function togglePlayback() { if (!selectedTrack || audioError) return; if (playing) { audioRef.current?.pause(); setPlaying(false); } else { audioRef.current?.play().then(() => setPlaying(true)).catch(() => setAudioError('This audio file could not be played.')); } }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); setUser(null); setTracks([]); setAlbums([]); setSelectedTrack(null); setPlaying(false); }

  if (!user && tracks.length === 0 && albums.length === 0) return <AuthScreen mode={mode} setMode={setMode} onAuthenticated={authenticate} />;
  if (user?.role === 'artist') return <ArtistDashboard onLogout={logout} />;
  const name = user?.username || 'Listener';
  if (detailTrack) return <TrackDetail track={detailTrack} index={tracks.indexOf(detailTrack)} onClose={() => setDetailTrack(null)} />;
  return <div className="app-shell"><aside className={`sidebar ${mobileNav ? 'sidebar--open' : ''}`}><div className="brand"><span className="brand-mark">S</span><span>sonata</span></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button><nav className="primary-nav">{[['Home', Home], ['Search', Search], ['Your Library', Library]].map(([label, Icon]) => <button className={activeNav === label ? 'nav-item nav-item--active' : 'nav-item'} key={label} onClick={() => { setActiveNav(label); setMobileNav(false); }}><Icon size={18} /><span>{label}</span></button>)}</nav><div className="library-heading">Your database library</div><p className="library-count">{tracks.length} tracks · {albums.length} albums</p><div className="sidebar-footer"><div className="profile-initial">{name.slice(0, 2).toUpperCase()}</div><div><strong>{name}</strong><span>Signed in</span></div><button className="logout-button" onClick={logout}>Log out</button></div></aside><main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22} /></button><div className="topbar-actions"><span className="connection-label">Live library</span><span className="avatar">{name.slice(0, 2).toUpperCase()}</span></div></header><section className="welcome-section"><div><p className="eyebrow">Your collection</p><h1>Good evening,<br /><em>{name}.</em></h1><p className="welcome-copy">Every track here comes directly from your Sonata library.</p></div><div className="hero-note"><span className="note-line" /><span>DB / LIVE</span><span className="note-line" /></div></section><section className="section-block"><div className="section-header"><div><p className="eyebrow">From your database</p><h2>Albums</h2></div><span className="record-count">{albums.length} records</span></div>{albums.length ? <div className="album-grid">{albums.map((album, index) => <button className="album-card" key={album._id || album.title} onClick={() => album.musics?.[0] && playTrack(album.musics[0])}><Artwork index={index} /><span className="album-meta">{album.musics?.length || 0} tracks</span><strong>{album.title}</strong><span>{album.artist?.username || 'Unknown artist'}</span></button>)}</div> : <div className="empty-state"><Album size={22} /><span>No albums in your database yet.</span></div>}</section><section className="section-block track-section"><div className="section-header"><div><p className="eyebrow">Your uploaded music</p><h2>All tracks</h2></div><span className="record-count">{tracks.length} records</span></div>{tracks.length ? <div className="track-list">{tracks.map((track, index) => <button className="track-row" key={track._id || track.title} onClick={() => playTrack(track)}><span className="track-number">{String(index + 1).padStart(2, '0')}</span><Artwork index={index} small /><span className="track-copy"><strong>{track.title}</strong><span>{track.artist?.username || 'Unknown artist'}</span></span><MoreHorizontal className="track-more" size={18} /></button>)}</div> : <div className="empty-state"><Library size={22} /><span>No music in your database yet.</span></div>}</section></main><footer className="player-bar"><div className="now-playing">{selectedTrack ? <><Artwork index={tracks.indexOf(selectedTrack)} small /><div><strong>{selectedTrack.title}</strong><span>{selectedTrack.artist?.username || 'Unknown artist'}</span></div><button className={liked ? 'icon-button icon-button--liked' : 'icon-button'} onClick={() => setLiked(!liked)} aria-label="Like track"><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button></> : <span className="player-empty">Select a track to play</span>}</div><div className="player-controls"><button className="play-button" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'} disabled={!selectedTrack}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button></div><div className="player-tools"><Volume2 size={17} /><div className="volume-line"><span /></div></div></footer><audio ref={audioRef} onEnded={() => setPlaying(false)} /></div>;
}

export default App;
