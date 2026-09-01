import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Home,
  Library,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Pause,
  Play,
  Plus,
  Repeat2,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  User,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

const palette = ['olive', 'coral', 'mustard', 'rust', 'rose'];
const STORAGE_KEYS = {
  liked: 'sonata-liked-tracks',
  recent: 'sonata-recently-played',
  playlists: 'sonata-playlists',
};

function safeText(value, fallback = 'Unknown') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

function getArtistName(artist, fallback = 'Unknown artist') {
  if (!artist) return fallback;
  if (typeof artist === 'string') return safeText(artist, fallback);
  if (artist.username) return safeText(artist.username, fallback);
  if (artist.name) return safeText(artist.name, fallback);
  return fallback;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function getAlbumTitle(track, albumMap) {
  if (!track) return 'Unknown album';
  if (track.album?.title) return safeText(track.album.title, 'Unknown album');
  if (track.albumTitle) return safeText(track.albumTitle, 'Unknown album');

  const albumMatch = Object.values(albumMap).find((album) =>
    Array.isArray(album?.musics) && album.musics.some((item) => item?._id === track._id || item?.id === track._id)
  );

  return albumMatch?.title ? safeText(albumMatch.title, 'Unknown album') : 'Unknown album';
}

function Artwork({ album, index = 0, small = false, large = false }) {
  const coverUrl = album?.coverUri || album?.cover || '';
  const titleText = safeText(album?.title || 'SONATA', 'SONATA');
  const letters = titleText
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const artistText = safeText(album?.artist?.username || album?.artist?.name || 'Sonata', 'Sonata').slice(0, 18);

  return (
    <div className={`artwork artwork--${palette[index % palette.length]} ${small ? 'artwork--small' : ''} ${large ? 'artwork--large' : ''} ${!coverUrl ? 'artwork--placeholder' : ''}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={safeText(album?.title || 'Album artwork', 'Album artwork')} loading="lazy" />
      ) : (
        <div className="artwork-fallback">
          <span>{letters || 'S'}</span>
          <small>{artistText}</small>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div>
        <p className="eyebrow">{title}</p>
        <h3>{message}</h3>
      </div>
      {actionLabel && (
        <button type="button" className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function TrackRow({ track, index, albumName, isLiked, onPlay, onToggleFavorite, onAddToPlaylist, selected = false }) {
  const artistName = getArtistName(track?.artist, 'Unknown artist');

  return (
    <div className={`track-row ${selected ? 'track-row--selected' : ''}`}>
      <button type="button" className="track-play-button" onClick={() => onPlay(track)} aria-label={`Play ${safeText(track?.title, 'Unknown title')}`}>
        <Play size={13} />
      </button>

      <span className="track-number">{String(index + 1).padStart(2, '0')}</span>

      <div className="track-copy">
        <strong>{safeText(track?.title, 'Unknown title')}</strong>
        <span>
          {artistName}
          {albumName ? ` • ${albumName}` : ''}
        </span>
      </div>

      <span className="track-duration">{formatDuration(Number(track?.duration || 0))}</span>

      <button
        type="button"
        className="track-add-button"
        onClick={(event) => {
          event.stopPropagation();
          onAddToPlaylist(track);
        }}
        aria-label={`Add ${safeText(track?.title, 'track')} to playlist`}
      >
        <Plus size={12} />
      </button>

      <button
        type="button"
        className={`mini-favorite ${isLiked ? 'mini-favorite--liked' : ''}`}
        onClick={() => onToggleFavorite(track)}
        aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}

function AlbumCard({ album, index, onOpenAlbum, onPlay, isLiked, onToggleFavorite, compact=false }) {
  const title = safeText(album?.title, 'Unknown title');
  const artistName = getArtistName(album?.artist, 'Unknown artist');
  const trackCount = Array.isArray(album?.musics) ? album.musics.length : 0;

  return (
    <div className={`album-card ${compact ? 'album-card--compact' : ''}`}>
      <div className="album-card-art">
        <Artwork album={album} index={index} />
        <button type="button" className="album-play-button" onClick={() => onPlay(album?.musics?.[0] || null)} aria-label={`Play ${title}`}>
          <Play size={16} />
        </button>
      </div>

      <div className="album-card-meta">
        <button type="button" className="album-card-title" onClick={() => onOpenAlbum(album)}>
          {title}
        </button>
        <span>{artistName}</span>
        {trackCount > 0 && <small>{trackCount} tracks</small>}
      </div>

      <button
        type="button"
        className={`album-favorite ${isLiked ? 'album-favorite--liked' : ''}`}
        onClick={() => onToggleFavorite(album?.musics?.[0])}
        aria-label={isLiked ? 'Remove favorite' : 'Add favorite'}
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}

function AuthScreen({ mode, setMode, onAuthenticated }) {
  const signup = mode === 'signup';
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    const body = signup
      ? { ...form, username: form.username.trim(), email: form.email.trim().toLowerCase() }
      : { username: form.username.trim(), password: form.password };

    try {
      const response = await fetch(`/api/auth/${signup ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
      onAuthenticated(data.user);
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="brand auth-brand">
          <span className="brand-mark">S</span>
          <span>SONATA</span>
        </div>

        <section className="auth-card">
          <div className="auth-heading">
            <span className="auth-icon">{signup ? <UserPlus size={20} /> : <LogIn size={20} />}</span>
            <p className="eyebrow">{signup ? 'Create your account' : 'Welcome back'}</p>
            <h2>{signup ? 'Create your account' : 'Sign in to Sonata.'}</h2>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {signup && (
              <label>
                <span>Username</span>
                <div className="input-wrap">
                  <User size={16} />
                  <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
                </div>
              </label>
            )}

            {signup && (
              <label>
                <span>Account type</span>
                <div className="input-wrap">
                  <UserPlus size={16} />
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                    <option value="user">Listener</option>
                    <option value="artist">Artist</option>
                  </select>
                </div>
              </label>
            )}

            <label>
              <span>{signup ? 'Email' : 'Username or email'}</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type={signup ? 'email' : 'text'}
                  value={signup ? form.email : form.username}
                  onChange={(event) => setForm({ ...form, [signup ? 'email' : 'username']: event.target.value })}
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="input-wrap">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  minLength={signup ? 6 : undefined}
                  required
                />
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="submit-button" disabled={busy}>
              {busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'Need an account?'}{' '}
            <button type="button" onClick={() => setMode(signup ? 'login' : 'signup')}>
              {signup ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}

function ArtistDashboard({ onLogout, artist }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumTracks, setAlbumTracks] = useState([]);
  const [albumCover, setAlbumCover] = useState(null);
  const [albumCoverPreview, setAlbumCoverPreview] = useState('');
  const [albumSearch, setAlbumSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [previewTrack, setPreviewTrack] = useState(null);
  const previewAudioRef = useRef(null);

  const artistName = safeText(artist?.username, 'Artist');

  async function loadTracks() {
    setLoadingTracks(true);
    try {
      const response = await fetch('/api/music/mine', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load your tracks');
      setTracks(data.musics || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your tracks.');
    } finally {
      setLoadingTracks(false);
    }
  }

  async function loadAlbums() {
    setLoadingAlbums(true);
    try {
      const response = await fetch('/api/music/albums', { credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load your albums');

      const artistId = artist?._id || artist?.id;
      const myAlbums = (data.albums || []).filter((album) => {
        if (!album) return false;
        const albumArtistId = typeof album.artist === 'string' ? album.artist : album.artist?._id;
        return !artistId || albumArtistId === artistId || albumArtistId === artist?.username;
      });

      setAlbums(myAlbums);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your albums.');
    } finally {
      setLoadingAlbums(false);
    }
  }

  useEffect(() => {
    loadTracks().catch(() => undefined);
    loadAlbums().catch(() => undefined);
  }, [artist]);

  useEffect(() => {
    if (!albumCover) {
      setAlbumCoverPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(albumCover);
    setAlbumCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [albumCover]);

  function toggleTrackSelection(trackId) {
    setAlbumTracks((previous) => previous.includes(trackId)
      ? previous.filter((id) => id !== trackId)
      : [...previous, trackId]);
  }

  const filteredAlbumTracks = useMemo(() => {
    const query = albumSearch.trim().toLowerCase();
    if (!query) return tracks;
    return tracks.filter((track) => safeText(track.title, '').toLowerCase().includes(query));
  }, [albumSearch, tracks]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!title.trim()) {
      setError('Please enter a track title.');
      return;
    }

    if (!file) {
      setError('Please select an audio file.');
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('music', file);

    try {
      const response = await fetch('/api/music/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Upload failed. Please try again.');
      setTitle('');
      setFile(null);
      setMessage('Track uploaded successfully.');
      event.target.reset();
      await loadTracks();
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function createAlbumAction(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!albumTitle.trim()) {
      setError('Please enter an album title.');
      return;
    }

    if (!albumTracks.length) {
      setError('Select at least one track for the album.');
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.append('title', albumTitle.trim());
    albumTracks.forEach((trackId) => formData.append('musics', trackId));
    if (albumCover) formData.append('cover', albumCover);

    try {
      const response = await fetch('/api/music/album', { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not create album');
      setAlbumTitle('');
      setAlbumTracks([]);
      setAlbumCover(null);
      setAlbumSearch('');
      setMessage('Album created successfully.');
      event.target.reset();
      await loadAlbums();
    } catch (albumError) {
      setError(albumError.message || 'Unable to create album.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteTrack(track) {
    if (!track?._id) return;
    const confirmed = window.confirm(`Delete "${safeText(track.title, 'this track')}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/music/${track._id}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to delete this track.');
      setMessage('Track deleted.');
      await loadTracks();
      await loadAlbums();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this track.');
    }
  }

  async function deleteAlbum(album) {
    if (!album?._id) return;
    const confirmed = window.confirm(`Delete "${safeText(album.title, 'this album')}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/music/album/${album._id}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to delete this album.');
      setMessage('Album deleted.');
      setSelectedAlbum(null);
      await loadAlbums();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this album.');
    }
  }

  function openAlbum(album) {
    setSelectedAlbum((previous) => (previous && previous._id === album._id ? null : album));
  }

  useEffect(() => {
    if (!previewTrack || !previewAudioRef.current) return;

    const audio = previewAudioRef.current;
    audio.src = previewTrack.uri;
    audio.load();
    audio.currentTime = 0;
    audio.play().catch(() => {
      setPreviewTrack(null);
      setError('Unable to preview this track.');
    });
  }, [previewTrack]);

  function toggleTrackPreview(track) {
    if (!track?.uri) return;

    if (previewTrack && previewTrack._id === track._id) {
      if (previewAudioRef.current) {
        if (previewAudioRef.current.paused) {
          previewAudioRef.current.play().catch(() => {
            setError('Unable to preview this track.');
          });
          return;
        }

        previewAudioRef.current.pause();
      }
      setPreviewTrack(null);
      return;
    }

    setPreviewTrack(track);
  }

  return (
    <main className="artist-page">
      <header className="artist-header">
        <div className="artist-header__brand">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span>SONATA</span>
          </div>
          <span className="artist-header__label">ARTIST STUDIO</span>
        </div>

        <div className="artist-header__meta">
          <span>{artistName}</span>
          <button type="button" className="logout-button" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section className="artist-shell">
        <div className="artist-hero panel">
          <div>
            <p className="eyebrow">Artist studio</p>
            <h1>
              Put your music
              <br />
              <em>in the room.</em>
            </h1>
            <p className="artist-copy">Upload tracks, create albums, and manage your catalog with the SONATA studio flow.</p>
          </div>

          <div className="artist-hero__stats">
            <div className="stat-card">
              <span>Tracks</span>
              <strong>{tracks.length}</strong>
            </div>
            <div className="stat-card">
              <span>Albums</span>
              <strong>{albums.length}</strong>
            </div>
          </div>
        </div>

        <div className="studio-grid">
          <section className="panel form-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Upload</p>
                <h2>Upload a track</h2>
              </div>
            </div>

            <form className="studio-form" onSubmit={submit}>
              <label className="field">
                <span>Track title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your track a name" required />
              </label>

              <label className="field">
                <span>Audio file</span>
                <input type="file" accept="audio/*" onChange={(event) => setFile(event.target.files[0] || null)} required />
              </label>

              <div className="field field--read-only">
                <span>Artist</span>
                <div className="field-value">{artistName}</div>
              </div>

              {error && <p className="form-error">{error}</p>}
              {message && <p className="form-success">{message}</p>}

              <button type="submit" className="primary-button" disabled={busy}>
                {busy ? 'Uploading...' : 'Upload Track'}
              </button>
            </form>
          </section>

          <section className="panel form-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Release tools</p>
                <h2>Create an album</h2>
              </div>
            </div>

            <form className="studio-form" onSubmit={createAlbumAction}>
              <label className="field">
                <span>Album title</span>
                <input value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} placeholder="Name your album" required />
              </label>

              <div className="field">
                <span>Choose tracks</span>
                <input value={albumSearch} onChange={(event) => setAlbumSearch(event.target.value)} placeholder="Search your tracks..." />
                <div className="track-checklist">
                  {filteredAlbumTracks.length ? filteredAlbumTracks.map((track) => (
                    <label key={track._id} className="check-option">
                      <input type="checkbox" checked={albumTracks.includes(track._id)} onChange={() => toggleTrackSelection(track._id)} />
                      <span>{safeText(track.title, 'Untitled track')}</span>
                      <small>{formatDuration(Number(track.duration || 0))}</small>
                    </label>
                  )) : (
                    <div className="empty-panel empty-panel--small">
                      No tracks uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="field field--file">
                <span>Cover artwork</span>
                <input type="file" accept="image/*" onChange={(event) => setAlbumCover(event.target.files[0] || null)} />
                {albumCoverPreview && <img src={albumCoverPreview} alt="Album cover preview" className="cover-preview" />}
              </div>

              <button type="submit" className="primary-button" disabled={busy || !tracks.length}>
                {busy ? 'Creating album...' : 'Create Album'}
              </button>
            </form>
          </section>
        </div>

        <section className="catalog-panel panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Your catalog</p>
              <h2>Tracks</h2>
            </div>
            <span className="record-count">{tracks.length} tracks</span>
          </div>

          {loadingTracks ? (
            <div className="skeleton-grid skeleton-grid--compact">
              {[1, 2, 3].map((item) => <div key={item} className="skeleton-card" />)}
            </div>
          ) : tracks.length ? (
            <div className="catalog-list">
              {tracks.map((track, index) => (
                <article key={track._id || `${track.title}-${index}`} className="catalog-row">
                  <div className="catalog-row__meta">
                    <span className="catalog-row__num">{String(index + 1).padStart(2, '0')}</span>
                    <Artwork album={{ title: safeText(track.title, 'Untitled track'), coverUri: track.coverUri || '', artist: track.artist }} index={index} small />
                    <div>
                      <strong>{safeText(track.title, 'Untitled track')}</strong>
                      <span>{getArtistName(track.artist, artistName)} • {getAlbumTitle(track, {})}</span>
                    </div>
                  </div>

                  <span className="catalog-row__duration">{formatDuration(Number(track.duration || 0))}</span>

                  <div className="catalog-row__actions">
                    {track.uri && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => toggleTrackPreview(track)}
                      >
                        {previewTrack && previewTrack._id === track._id && previewAudioRef.current && !previewAudioRef.current.paused ? 'Pause' : 'Preview'}
                      </button>
                    )}
                    <button type="button" className="text-button" onClick={() => deleteTrack(track)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <p>No tracks uploaded yet.</p>
              <button type="button" className="primary-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Upload your first track</button>
            </div>
          )}
        </section>

        <section className="catalog-panel panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Your catalog</p>
              <h2>Albums</h2>
            </div>
            <span className="record-count">{albums.length} albums</span>
          </div>

          {loadingAlbums ? (
            <div className="skeleton-grid skeleton-grid--compact">
              {[1, 2].map((item) => <div key={item} className="skeleton-card" />)}
            </div>
          ) : albums.length ? (
            <div className="album-grid album-grid--studio">
              {albums.map((album, index) => (
                <div key={album._id || `${album.title}-${index}`} className={`studio-album-card ${selectedAlbum?._id === album._id ? 'studio-album-card--selected' : ''}`} onClick={() => openAlbum(album)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAlbum(album); } }}>
                  <Artwork album={album} index={index} />
                  <div className="studio-album-card__meta">
                    <strong>{safeText(album.title, 'Untitled album')}</strong>
                    <span>{Array.isArray(album.musics) ? album.musics.length : 0} tracks</span>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteAlbum(album);
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <p>No albums yet.</p>
            </div>
          )}

          {selectedAlbum && (
            <div className="album-detail-panel">
              <div className="album-detail-panel__header">
                <Artwork album={selectedAlbum} index={0} large />
                <div>
                  <p className="eyebrow">Album</p>
                  <h3>{safeText(selectedAlbum.title, 'Untitled album')}</h3>
                  <span>{getArtistName(selectedAlbum.artist, artistName)}</span>
                </div>
              </div>

              <div className="album-detail-panel__tracks">
                {(selectedAlbum.musics || []).map((track, index) => (
                  <div key={track._id || `${track.title}-${index}`} className="album-track-item">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{safeText(track.title, 'Untitled track')}</strong>
                    <small>{formatDuration(Number(track.duration || 0))}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>

      <audio
        ref={previewAudioRef}
        preload="auto"
        onPause={() => {
          if (previewTrack && previewAudioRef.current && previewAudioRef.current.currentTime > 0) {
            setPreviewTrack(null);
          }
        }}
        onEnded={() => setPreviewTrack(null)}
      />
    </main>
  );
}

function PlaylistTrackRow({ track, index, albumName, isLiked, onPlay, onToggleFavorite, selected = false }) {
  const artistName = getArtistName(track?.artist, 'Unknown artist');

  return (
    <div className={`track-row ${selected ? 'track-row--selected' : ''}`} onClick={() => onPlay(track)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPlay(track); } }}>
      <span className="track-number">{String(index + 1).padStart(2, '0')}</span>

      <Artwork album={{ title: getAlbumTitle(track, {}), coverUri: track?.coverUri || '', artist: track?.artist }} index={index} small />

      <div className="track-copy">
        <strong>{safeText(track?.title, 'Unknown title')}</strong>
        <span>
          {artistName}
          {albumName ? ` • ${albumName}` : ''}
        </span>
      </div>

      <span className="track-duration">{formatDuration(Number(track?.duration || 0))}</span>

      <button
        type="button"
        className={`mini-favorite ${isLiked ? 'mini-favorite--liked' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(track);
        }}
        aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}

function PlaylistDetailPage({
  playlist,
  playlistTracks,
  albumMap,
  selectedTrack,
  likedTracks,
  onBack,
  onPlayTrack,
  onToggleFavorite,
  onAddSongs,
  onRemoveTrack,
  addSongOptions,
  addSongSearch,
  onAddSongSearchChange,
  selectedAddSongs,
  onToggleAddSong,
  onAddSelectedSongs,
  onCloseAddSongs,
  addSongMode,
}) {
  const tracks = Array.isArray(playlistTracks) ? playlistTracks : [];

  return (
    <main className="album-detail-page">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to library
      </button>

      <section className="album-detail-hero">
        <Artwork album={{ title: playlist?.name || 'Playlist', coverUri: '', artist: { username: 'SONATA' } }} index={0} large />

        <div className="album-detail-copy">
          <p className="eyebrow">Playlist</p>
          <h1>{safeText(playlist?.name, 'Untitled playlist')}</h1>
          <p>{tracks.length} tracks</p>

          <div className="album-detail-actions">
            <button type="button" className="primary-button" onClick={() => onPlayTrack(tracks[0] || null)}>
              <Play size={16} />
              Play playlist
            </button>
            <button type="button" className="secondary-button" onClick={onAddSongs}>
              <Plus size={16} />
              Add Songs
            </button>
          </div>
        </div>
      </section>

      <section className="track-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Tracks</p>
            <h2>{tracks.length ? `${tracks.length} songs` : 'No songs yet'}</h2>
          </div>
        </div>

        {tracks.length ? (
          <div className="track-list">
            {tracks.map((track, index) => (
              <div key={track?._id || `${track?.title}-${index}`} className="track-row-wrapper">
                <PlaylistTrackRow
                  track={track}
                  index={index}
                  albumName={getAlbumTitle(track, albumMap)}
                  isLiked={!!track?._id && likedTracks.includes(track._id)}
                  selected={!!selectedTrack && !!track?._id && selectedTrack._id === track._id}
                  onPlay={onPlayTrack}
                  onToggleFavorite={onToggleFavorite}
                />
                <button
                  type="button"
                  className="playlist-remove-inline"
                  onClick={() => {
                    if (window.confirm(`Remove ${safeText(track?.title, 'this track')} from ${safeText(playlist?.name, 'this playlist')}?`)) {
                      onRemoveTrack(track);
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No songs in this playlist yet" message="Add music to begin building this queue." actionLabel="Add Songs" onAction={onAddSongs} />
        )}
      </section>

      {addSongMode && (
        <div className="playlist-modal-backdrop" onClick={onCloseAddSongs}>
          <div className="playlist-modal" onClick={(event) => event.stopPropagation()}>
            <div className="playlist-modal-header">
              <div>
                <p className="eyebrow">Add songs</p>
                <h3>{safeText(playlist?.name, 'Playlist')}</h3>
              </div>
              <button type="button" className="playlist-close-button" onClick={onCloseAddSongs}>✕</button>
            </div>

            <input
              value={addSongSearch}
              onChange={(event) => onAddSongSearchChange(event.target.value)}
              className="playlist-search-input"
              placeholder="Search songs..."
              aria-label="Search songs to add"
            />

            {addSongOptions.length ? (
              <div className="playlist-add-list">
                {addSongOptions.map((track) => (
                  <label key={track._id} className="playlist-add-item">
                    <input type="checkbox" checked={selectedAddSongs.includes(track._id)} onChange={() => onToggleAddSong(track._id)} />
                    <div className="playlist-add-copy">
                      <strong>{safeText(track.title, 'Unknown title')}</strong>
                      <span>{getArtistName(track?.artist, 'Unknown artist')}</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="empty-state playlist-empty-state">
                <p className="eyebrow">All your songs are already in this playlist.</p>
              </div>
            )}

            <div className="playlist-modal-actions">
              <button type="button" className="secondary-button" onClick={onCloseAddSongs}>Cancel</button>
              <button type="button" className="primary-button" onClick={onAddSelectedSongs} disabled={!selectedAddSongs.length}>Add Selected</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AlbumDetailPage({ album, onBack, onPlayTrack, likedTracks, onToggleFavorite }) {
  const albumTracks = Array.isArray(album?.musics) ? album.musics : [];
  const artistName = getArtistName(album?.artist, 'Unknown artist');
  const heroTrack = albumTracks[0] || null;

  return (
    <main className="album-detail-page">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to library
      </button>

      <section className="album-detail-hero">
        <Artwork album={album} index={0} large />

        <div className="album-detail-copy">
          <p className="eyebrow">Album</p>
          <h1>{safeText(album?.title, 'Unknown title')}</h1>
          <p>{artistName}</p>

          <div className="album-detail-actions">
            <button type="button" className="primary-button" onClick={() => onPlayTrack(heroTrack)}>
              <Play size={16} />
              Play
            </button>
            <button type="button" className="secondary-button" onClick={() => onToggleFavorite(heroTrack)}>
              {heroTrack && likedTracks.includes(heroTrack._id) ? '♥ Liked' : '♡ Like'}
            </button>
          </div>
        </div>
      </section>

      <section className="track-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Tracks</p>
            <h2>{albumTracks.length ? `${albumTracks.length} songs` : 'No tracks yet'}</h2>
          </div>
        </div>

        {albumTracks.length ? (
          <div className="track-list">
            {albumTracks.map((track, index) => (
              <div key={track?._id || `${track?.title}-${index}`} className="track-row" onClick={() => onPlayTrack(track)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPlayTrack(track); } }}>
                <span className="track-number">{String(index + 1).padStart(2, '0')}</span>

                <div className="track-copy">
                  <strong>{safeText(track?.title, 'Unknown title')}</strong>
                  <span>{artistName}</span>
                </div>

                <span className="track-duration">{formatDuration(Number(track?.duration || 0))}</span>

                <button type="button" className={`mini-favorite ${track && likedTracks.includes(track._id) ? 'mini-favorite--liked' : ''}`} onClick={(event) => { event.stopPropagation(); onToggleFavorite(track); }} aria-label="Toggle favorite">
                  {track && likedTracks.includes(track._id) ? '♥' : '♡'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing here yet" message="This album has no tracks in the library." />
        )}
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [albumDetail, setAlbumDetail] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const [mobileNav, setMobileNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState('Songs');
  const [audioError, setAudioError] = useState('');
  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState('playlist');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistQueue, setPlaylistQueue] = useState([]);
  const [playlistAddModalOpen, setPlaylistAddModalOpen] = useState(false);
  const [playlistAddSearch, setPlaylistAddSearch] = useState('');
  const [playlistAddSelection, setPlaylistAddSelection] = useState([]);
  const audioRef = useRef(null);
  const repeatEnabled = repeatMode !== 'off';

  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.liked);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.recent);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.playlists);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.liked, JSON.stringify(likedTracks));
  }, [likedTracks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(playlists));
  }, [playlists]);

  const albumMap = useMemo(() => {
    return albums.reduce((accumulator, album) => {
      accumulator[album._id] = album;
      return accumulator;
    }, {});
  }, [albums]);

  const uniqueArtists = useMemo(() => {
    const names = [
      ...tracks.map((track) => getArtistName(track?.artist, 'Unknown artist')),
      ...albums.map((album) => getArtistName(album?.artist, 'Unknown artist')),
    ];
    return [...new Set(names.filter(Boolean))];
  }, [tracks, albums]);

  async function loadLibrary() {
    setLoading(true);
    setError('');

    try {
      const [musicResponse, albumResponse] = await Promise.all([
        fetch('/api/music', { credentials: 'include' }),
        fetch('/api/music/albums', { credentials: 'include' }),
      ]);

      const musicData = await musicResponse.json().catch(() => ({}));
      const albumData = await albumResponse.json().catch(() => ({}));

      if (!musicResponse.ok || !albumResponse.ok) {
        throw new Error('Could not load the library');
      }

      setTracks(Array.isArray(musicData.musics) ? musicData.musics : []);
      setAlbums(Array.isArray(albumData.albums) ? albumData.albums : []);
    } catch (libraryError) {
      setError(libraryError.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadLibrary();
  }, [user]);

  function authenticate(authenticatedUser) {
    setUser(authenticatedUser);
    loadLibrary();
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network issues during logout and close the app state
    }

    setUser(null);
    setTracks([]);
    setAlbums([]);
    setSelectedTrack(null);
    setSelectedPlaylistId(null);
    setAlbumDetail(null);
    setPlaying(false);
    setAudioError('');
    setCurrentTime(0);
    setDuration(0);
  }

  function recordRecentlyPlayed(track) {
    if (!track || !track._id) return;

    const nextEntry = {
      _id: track._id,
      title: safeText(track.title, 'Unknown title'),
      artist: getArtistName(track.artist, 'Unknown artist'),
      albumTitle: getAlbumTitle(track, albumMap),
      uri: track.uri,
      duration: Number(track.duration || 0),
      playedAt: Date.now(),
    };

    setRecentlyPlayed((previous) => [nextEntry, ...previous.filter((item) => item._id !== track._id)].slice(0, 6));
  }

  function toggleFavorite(track) {
    if (!track?._id) return;

    setLikedTracks((previous) =>
      previous.includes(track._id)
        ? previous.filter((id) => id !== track._id)
        : [...previous, track._id]
    );
  }

  function handleTrackSelection(track) {
    if (!track) {
      setAudioError('Unable to play this track.');
      return;
    }

    if (!track.uri) {
      setAudioError('Unable to play this track.');
      return;
    }

    setActivePlaylistId(null);
    setSelectedPlaylistId(null);
    setPlaylistQueue([]);
    setSelectedTrack(track);
    setAudioError('');
    recordRecentlyPlayed(track);
  }

  function getPlaylistTracks(playlist) {
    if (!playlist || !Array.isArray(playlist.tracks)) return [];
    return playlist.tracks.filter(Boolean);
  }

  function openPlaylist(playlistId) {
    const nextPlaylist = playlists.find((playlist) => playlist.id === playlistId);
    if (!nextPlaylist) return;

    setSelectedPlaylistId(playlistId);
    setActiveNav('Your Library');
  }

  function playPlaylistQueue(playlistId, startTrack = null) {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;

    const queue = getPlaylistTracks(playlist);
    if (!queue.length) {
      setActivePlaylistId(playlist.id);
      setPlaylistQueue([]);
      setSelectedPlaylistId(playlist.id);
      setSelectedTrack(null);
      setAudioError('No songs in this playlist yet.');
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const start = startTrack && queue.some((track) => track._id === startTrack._id)
      ? startTrack
      : queue[0];

    setSelectedPlaylistId(playlist.id);
    setActivePlaylistId(playlist.id);
    setPlaylistQueue(queue);
    setSelectedTrack(start);
    setAudioError('');
    recordRecentlyPlayed(start);
  }

  useEffect(() => {
    if (!selectedTrack || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = selectedTrack.uri;
    audio.load();
    audio.volume = volume / 100;
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);

    audio.play().then(() => setPlaying(true)).catch(() => {
      setAudioError('Unable to play this track.');
    });
  }, [selectedTrack, volume]);

  function togglePlayback() {
    if (!selectedTrack || !audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    audioRef.current.play().then(() => setPlaying(true)).catch(() => {
      setAudioError('Unable to play this track.');
    });
  }

  function changeTrack(direction) {
    if (activePlaylistId && playlistQueue.length) {
      const currentIndex = selectedTrack ? playlistQueue.findIndex((track) => track._id === selectedTrack._id) : -1;
      const nextIndex = currentIndex === -1 ? 0 : currentIndex + direction;

      if (nextIndex < 0) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (audioRef.current.paused) {
            audioRef.current.play().then(() => setPlaying(true)).catch(() => setAudioError('Unable to play this track.'));
          }
        }
        return;
      }

      if (nextIndex >= playlistQueue.length) {
        if (!repeatEnabled) {
          if (audioRef.current) {
            audioRef.current.pause();
            setPlaying(false);
          }
          return;
        }
        setSelectedTrack(playlistQueue[0]);
        return;
      }

      setSelectedTrack(playlistQueue[nextIndex]);
      return;
    }

    if (!tracks.length) return;

    const currentIndex = selectedTrack ? tracks.findIndex((track) => track._id === selectedTrack._id) : -1;
    const nextIndex = currentIndex === -1 ? 0 : currentIndex + direction;
    const safeIndex = nextIndex < 0 ? tracks.length - 1 : nextIndex >= tracks.length ? 0 : nextIndex;

    setSelectedTrack(tracks[safeIndex]);
  }

  function playPlaylist(playlistId, startTrack = null) {
    playPlaylistQueue(playlistId, startTrack);
  }

  function cycleRepeatMode() {
    setRepeatMode((previous) => {
      if (previous === 'off') return 'playlist';
      if (previous === 'playlist') return 'one';
      return 'off';
    });
  }

  function createPlaylistFromPrompt() {
    const nextName = window.prompt('Playlist name');
    if (!nextName || !nextName.trim()) return;

    setPlaylists((previous) => [
      ...previous,
      { id: `${Date.now()}`, name: nextName.trim(), tracks: [] },
    ]);
  }

  function addTrackToPlaylistByPrompt(track) {
    if (!track) return;

    if (!playlists.length) {
      const playlistName = window.prompt('Create a playlist first. Enter a playlist name', 'My playlist');
      if (!playlistName || !playlistName.trim()) return;

      const created = { id: `${Date.now()}`, name: playlistName.trim(), tracks: [track] };
      setPlaylists((previous) => [...previous, created]);
      return;
    }

    const options = playlists.map((playlist) => playlist.name).join(', ');
    const selectedName = window.prompt(`Add to which playlist? Available: ${options}`, playlists[0].name);
    if (!selectedName || !selectedName.trim()) return;

    const targetPlaylist = playlists.find(
      (playlist) => playlist.name.trim().toLowerCase() === selectedName.trim().toLowerCase()
    );

    if (!targetPlaylist) {
      window.alert(`Playlist "${selectedName}" was not found. Use one of the existing names.`);
      return;
    }

    setPlaylists((previous) => previous.map((playlist) => {
      if (playlist.id !== targetPlaylist.id) return playlist;
      const alreadyExists = playlist.tracks.some((item) => item._id === track._id);
      if (alreadyExists) return playlist;
      return { ...playlist, tracks: [...playlist.tracks, track] };
    }));
  }

  function renamePlaylist(playlistId) {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;

    const nextName = window.prompt('Rename playlist', playlist.name);
    if (!nextName || !nextName.trim()) return;

    setPlaylists((previous) => previous.map((item) => (
      item.id === playlistId ? { ...item, name: nextName.trim() } : item
    )));
  }

  function deletePlaylist(playlistId) {
    setPlaylists((previous) => previous.filter((item) => item.id !== playlistId));
  }

  function addTrackToPlaylist(playlistId, track) {
    if (!track) return;

    setPlaylists((previous) => previous.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const exists = playlist.tracks.some((item) => item._id === track._id);
      if (exists) return playlist;
      return { ...playlist, tracks: [...playlist.tracks, track] };
    }));

    if (activePlaylistId === playlistId && playlistQueue.length) {
      setPlaylistQueue((previousQueue) => {
        const alreadyQueued = previousQueue.some((item) => item._id === track._id);
        if (alreadyQueued) return previousQueue;
        return [...previousQueue, track];
      });
    }
  }

  function addTracksToPlaylist(playlistId, tracksToAdd) {
    if (!playlistId || !tracksToAdd.length) return;

    setPlaylists((previous) => previous.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const nextTracks = [...playlist.tracks];
      tracksToAdd.forEach((track) => {
        if (!nextTracks.some((item) => item._id === track._id)) {
          nextTracks.push(track);
        }
      });
      return { ...playlist, tracks: nextTracks };
    }));

    if (activePlaylistId === playlistId) {
      setPlaylistQueue((previousQueue) => {
        const combined = [...previousQueue];
        tracksToAdd.forEach((track) => {
          if (!combined.some((item) => item._id === track._id)) {
            combined.push(track);
          }
        });
        return combined;
      });
    }

    setPlaylistAddSelection([]);
    setPlaylistAddSearch('');
    setPlaylistAddModalOpen(false);
  }

  function addTrackToPlaylistFromPrompt(playlistId) {
    if (!tracks.length) {
      window.alert('Your library is empty right now. Add some tracks before creating a playlist.');
      return;
    }

    const trackNames = tracks.map((track) => safeText(track.title, 'Untitled track')).join(', ');
    const trackTitle = window.prompt(`Enter a track title to add to this playlist. Available tracks: ${trackNames}`, tracks[0]?.title || '');

    if (!trackTitle || !trackTitle.trim()) return;

    const matchedTrack = tracks.find((track) => safeText(track.title, '').toLowerCase() === trackTitle.trim().toLowerCase())
      || tracks.find((track) => safeText(track.title, '').toLowerCase().includes(trackTitle.trim().toLowerCase()));

    if (!matchedTrack) {
      window.alert(`No matching track was found for "${trackTitle}". Try one of the existing song names.`);
      return;
    }

    addTrackToPlaylist(playlistId, matchedTrack);
  }

  function removeTrackFromPlaylist(playlistId, trackId) {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;

    const nextTracks = playlist.tracks.filter((track) => track._id !== trackId);

    setPlaylists((previous) => previous.map((item) => {
      if (item.id !== playlistId) return item;
      return { ...item, tracks: item.tracks.filter((track) => track._id !== trackId) };
    }));

    if (activePlaylistId === playlistId) {
      const nextQueue = playlistQueue.filter((track) => track._id !== trackId);
      setPlaylistQueue(nextQueue);

      if (selectedTrack && selectedTrack._id === trackId) {
        const fallbackTrack = nextQueue[0] || null;
        setSelectedTrack(fallbackTrack);
        if (!fallbackTrack && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setPlaying(false);
        }
      }
    }

    if (selectedPlaylistId === playlistId) {
      const nextSelected = nextTracks.find((track) => track._id === selectedTrack?._id);
      if (!nextSelected && selectedTrack && selectedTrack._id === trackId && nextTracks[0]) {
        setSelectedTrack(nextTracks[0]);
      }
    }
  }

  const availablePlaylistTracks = useMemo(() => {
    if (!selectedPlaylistId) return [];
    const currentPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId);
    if (!currentPlaylist) return [];

    const includedIds = new Set(currentPlaylist.tracks.map((track) => track._id).filter(Boolean));
    return tracks.filter((track) => !includedIds.has(track._id));
  }, [selectedPlaylistId, playlists, tracks]);

  const filteredPlaylistOptions = useMemo(() => {
    const query = playlistAddSearch.trim().toLowerCase();
    if (!query) return availablePlaylistTracks;
    return availablePlaylistTracks.filter((track) => (
      safeText(track?.title, '').toLowerCase().includes(query)
      || getArtistName(track?.artist, '').toLowerCase().includes(query)
    ));
  }, [availablePlaylistTracks, playlistAddSearch]);

  const name = safeText(user?.username, 'Listener');
  const recentTracks = recentlyPlayed.length ? recentlyPlayed : [];

  const madeForLibrary = useMemo(() => {
    if (!tracks.length && !albums.length) return [];
    return [...albums.slice(0, 4), ...tracks.slice(0, 2)];
  }, [tracks, albums]);

  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return {
        tracks: tracks.slice(0, 5),
        albums: albums.slice(0, 5),
        artists: uniqueArtists.slice(0, 5),
      };
    }

    return {
      tracks: tracks.filter((track) => {
        const title = safeText(track?.title, '').toLowerCase();
        const artist = getArtistName(track?.artist, '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      }),
      albums: albums.filter((album) => {
        const title = safeText(album?.title, '').toLowerCase();
        const artist = getArtistName(album?.artist, '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      }),
      artists: uniqueArtists.filter((artist) => artist.toLowerCase().includes(query)),
    };
  }, [searchQuery, tracks, albums, uniqueArtists]);

  const renderLibrarySection = () => {
    if (libraryTab === 'Songs') {
      return tracks.length ? (
        <div className="track-list">
          {tracks.map((track, index) => (
            <TrackRow
              key={track._id || `${track.title}-${index}`}
              track={track}
              index={index}
              albumName={getAlbumTitle(track, albumMap)}
              isLiked={likedTracks.includes(track._id)}
              onPlay={handleTrackSelection}
              onToggleFavorite={toggleFavorite}
              onAddToPlaylist={addTrackToPlaylistByPrompt}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="YOUR LIBRARY IS QUIET" message="Add music to begin building your collection." />
      );
    }

    if (libraryTab === 'Albums') {
      return albums.length ? (
        <div className="album-grid library-album-grid">
          {albums.map((album, index) => (
            <AlbumCard
              key={album._id || `${album.title}-${index}`}
              album={album}
              index={index}
              onOpenAlbum={setAlbumDetail}
              onPlay={(track) => handleTrackSelection(track || album?.musics?.[0] || null)}
              isLiked={!!(album?.musics?.[0] && likedTracks.includes(album.musics[0]._id))}
              onToggleFavorite={(track) => toggleFavorite(track || album?.musics?.[0])}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="YOUR LIBRARY IS QUIET" message="Add music to begin building your collection." />
      );
    }

    if (libraryTab === 'Artists') {
      return uniqueArtists.length ? (
        <div className="artist-grid">
          {uniqueArtists.map((artist) => (
            <div key={artist} className="artist-chip">
              <span>{artist}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No artists yet" message="Your catalog will appear here once music is added." />
      );
    }

    return playlists.length ? (
      <div className="playlist-grid">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-card">
            <div className="playlist-card-head">
              <span className="playlist-dot" />
              <strong>{playlist.name}</strong>
              <div className="playlist-actions">
                <button type="button" onClick={() => addTrackToPlaylistFromPrompt(playlist.id)}>Add track</button>
                <button type="button" onClick={() => renamePlaylist(playlist.id)}>Rename</button>
                <button type="button" onClick={() => deletePlaylist(playlist.id)}>Delete</button>
              </div>
            </div>

            <p>{playlist.tracks.length} tracks</p>

            {playlist.tracks.length ? (
              <div className="mini-track-list">
                {playlist.tracks.slice(0, 4).map((track, index) => (
                  <div key={track._id || `${track.title}-${index}`} className="mini-track-item">
                    <span>{safeText(track.title, 'Unknown title')}</span>
                    <button type="button" className="playlist-remove-button" onClick={() => removeTrackFromPlaylist(playlist.id, track._id)}>Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No tracks added yet.</p>
            )}

            <button type="button" className="secondary-button" onClick={() => playPlaylist(playlist.id)}>
              Play playlist
            </button>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState title="NO PLAYLISTS YET" message="Create a playlist for the music you want to keep close." actionLabel="Create Playlist" onAction={createPlaylistFromPrompt} />
    );
  };

  const renderMainView = () => {
    if (activeNav === 'Search') {
      return (
        <section className="section-block search-page">
          <div className="search-panel">
            <p className="eyebrow">Search</p>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search songs, albums, artists..." aria-label="Search the library" />
          </div>

          {searchQuery.trim() ? (
            <div className="search-results">
              <div className="search-group">
                <h3>Songs</h3>
                {results.tracks.length ? (
                  <div className="track-list">
                    {results.tracks.map((track, index) => (
                      <TrackRow
                        key={track._id || `${track.title}-${index}`}
                        track={track}
                        index={index}
                        albumName={getAlbumTitle(track, albumMap)}
                        isLiked={likedTracks.includes(track._id)}
                        onPlay={handleTrackSelection}
                        onToggleFavorite={toggleFavorite}
                        onAddToPlaylist={addTrackToPlaylistByPrompt}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="NOTHING FOUND" message="Try another song, artist, or album." />
                )}
              </div>

              <div className="search-group">
                <h3>Albums</h3>
                {results.albums.length ? (
                  <div className="album-grid search-album-grid">
                    {results.albums.map((album, index) => (
                      <AlbumCard
                        key={album._id || `${album.title}-${index}`}
                        album={album}
                        index={index}
                        onOpenAlbum={setAlbumDetail}
                        onPlay={(track) => handleTrackSelection(track || album?.musics?.[0])}
                        isLiked={!!(album?.musics?.[0] && likedTracks.includes(album.musics[0]._id))}
                        onToggleFavorite={(track) => toggleFavorite(track || album?.musics?.[0])}
                        compact
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="NOTHING FOUND" message="Try another song, artist, or album." />
                )}
              </div>

              <div className="search-group">
                <h3>Artists</h3>
                {results.artists.length ? (
                  <div className="artist-grid">
                    {results.artists.map((artist) => (
                      <div key={artist} className="artist-chip">
                        <span>{artist}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="NOTHING FOUND" message="Try another song, artist, or album." />
                )}
              </div>
            </div>
          ) : (
            <div className="search-empty-state">Search your library for tracks, albums, and artists.</div>
          )}
        </section>
      );
    }

    if (activeNav === 'Your Library') {
      if (selectedPlaylistId) {
        const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId);
        if (!selectedPlaylist) {
          setSelectedPlaylistId(null);
        }

        return (
          <PlaylistDetailPage
            playlist={selectedPlaylist}
            playlistTracks={selectedPlaylist ? getPlaylistTracks(selectedPlaylist) : []}
            albumMap={albumMap}
            selectedTrack={selectedTrack}
            likedTracks={likedTracks}
            onBack={() => setSelectedPlaylistId(null)}
            onPlayTrack={(track) => {
              if (!selectedPlaylist) return;
              playPlaylist(selectedPlaylist.id, track || getPlaylistTracks(selectedPlaylist)[0] || null);
            }}
            onToggleFavorite={toggleFavorite}
            onAddSongs={() => {
              setPlaylistAddSearch('');
              setPlaylistAddSelection([]);
              setPlaylistAddModalOpen(true);
            }}
            onRemoveTrack={(track) => {
              if (!selectedPlaylist || !track?._id) return;
              removeTrackFromPlaylist(selectedPlaylist.id, track._id);
            }}
            addSongOptions={filteredPlaylistOptions}
            addSongSearch={playlistAddSearch}
            onAddSongSearchChange={setPlaylistAddSearch}
            selectedAddSongs={playlistAddSelection}
            onToggleAddSong={(trackId) => {
              setPlaylistAddSelection((previous) => previous.includes(trackId)
                ? previous.filter((id) => id !== trackId)
                : [...previous, trackId]);
            }}
            onAddSelectedSongs={() => {
              if (!selectedPlaylist) return;
              const nextTracks = tracks.filter((track) => playlistAddSelection.includes(track._id));
              addTracksToPlaylist(selectedPlaylist.id, nextTracks);
            }}
            onCloseAddSongs={() => {
              setPlaylistAddModalOpen(false);
              setPlaylistAddSelection([]);
              setPlaylistAddSearch('');
            }}
            addSongMode={playlistAddModalOpen}
          />
        );
      }

      return (
        <section className="section-block library-page">
          <div className="section-header library-header">
            <div>
              <p className="eyebrow">Your library</p>
              <h2>Collections</h2>
            </div>
            <button type="button" className="secondary-button" onClick={createPlaylistFromPrompt}>+ Create Playlist</button>
          </div>

          <div className="library-tabs">
            {['Songs', 'Albums', 'Artists', 'Playlists'].map((tab) => (
              <button type="button" key={tab} className={libraryTab === tab ? 'tab-button tab-button--active' : 'tab-button'} onClick={() => setLibraryTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          {renderLibrarySection()}
        </section>
      );
    }

    return (
      <>
        <section className="welcome-section">
          <div>
            <p className="eyebrow">Music that stays with you.</p>
            <h1>SONATA</h1>
            <p className="welcome-copy">{name}, your next favorite listen is already in your library.</p>
            <button type="button" className="primary-button hero-button" onClick={() => setActiveNav('Your Library')}>
              Explore Library
            </button>
          </div>

          <div className="hero-note">
            <span className="note-line" />
            <span>DB / LIVE</span>
            <span className="note-line" />
          </div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <div>
              <p className="eyebrow">From your database</p>
              <h2>Albums</h2>
            </div>
            <span className="record-count">{albums.length} albums</span>
          </div>

          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton-card" />
              ))}
            </div>
          ) : albums.length ? (
            <div className="album-grid">
              {albums.map((album, index) => (
                <AlbumCard
                  key={album._id || `${album.title}-${index}`}
                  album={album}
                  index={index}
                  onOpenAlbum={setAlbumDetail}
                  onPlay={(track) => handleTrackSelection(track || album?.musics?.[0] || null)}
                  isLiked={!!(album?.musics?.[0] && likedTracks.includes(album.musics[0]._id))}
                  onToggleFavorite={(track) => toggleFavorite(track || album?.musics?.[0])}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="YOUR LIBRARY IS QUIET" message="Add music to begin building your collection." />
          )}
        </section>

        <section className="section-block">
          <div className="section-header">
            <div>
              <p className="eyebrow">Your listening</p>
              <h2>Recently Played</h2>
            </div>
          </div>

          {recentTracks.length ? (
            <div className="recent-list">
              {recentTracks.map((track, index) => (
                <div key={`${track._id}-${track.playedAt || index}`} className="recent-item">
                  <div className="track-copy">
                    <strong>{safeText(track.title, 'Unknown title')}</strong>
                    <span>{safeText(track.artist, 'Unknown artist')} • {safeText(track.albumTitle, 'Unknown album')}</span>
                  </div>

                  <span className="track-duration">{formatDuration(Number(track.duration || 0))}</span>

                  <button type="button" className="mini-play-button" onClick={() => handleTrackSelection({ ...track, uri: track.uri, title: track.title, artist: { username: track.artist }, _id: track._id })}>
                    <Play size={13} />
                  </button>

                  <button type="button" className={`mini-favorite ${likedTracks.includes(track._id) ? 'mini-favorite--liked' : ''}`} onClick={() => toggleFavorite({ _id: track._id })}>
                    {likedTracks.includes(track._id) ? '♥' : '♡'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="NO RECENTLY PLAYED TRACKS" message="Your listening history will appear here once you start listening." actionLabel="Explore Library" onAction={() => setActiveNav('Your Library')} />
          )}
        </section>

        <section className="section-block">
          <div className="section-header">
            <div>
              <p className="eyebrow">Curated</p>
              <h2>Made for your library</h2>
            </div>
          </div>

          {madeForLibrary.length ? (
            <div className="album-grid">
              {madeForLibrary.map((item, index) => {
                if (item && item.musics) {
                  return (
                    <AlbumCard
                      key={item._id || `${item.title}-${index}`}
                      album={item}
                      index={index}
                      onOpenAlbum={setAlbumDetail}
                      onPlay={(track) => handleTrackSelection(track || item?.musics?.[0] || null)}
                      isLiked={!!(item?.musics?.[0] && likedTracks.includes(item.musics[0]._id))}
                      onToggleFavorite={(track) => toggleFavorite(track || item?.musics?.[0])}
                    />
                  );
                }

                return (
                  <div key={item?._id || `${item?.title || 'track'}-${index}`} className="album-card">
                    <div className="album-card-art">
                      <Artwork album={{ title: safeText(item?.title, 'Unknown title') }} index={index} />
                    </div>
                    <div className="album-card-meta">
                      <button type="button" className="album-card-title" onClick={() => handleTrackSelection(item)}>
                        {safeText(item?.title, 'Unknown title')}
                      </button>
                      <span>{getArtistName(item?.artist, 'Unknown artist')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="YOUR LIBRARY IS QUIET" message="Add music to begin building your collection." />
          )}
        </section>
      </>
    );
  };

  if (!user) return <AuthScreen mode={mode} setMode={setMode} onAuthenticated={authenticate} />;
  if (user?.role === 'artist') return <ArtistDashboard onLogout={logout} artist={user} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>SONATA</span>
        </div>

        <button type="button" className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
          <X size={20} />
        </button>

        <nav className="primary-nav">
          {['Home', 'Search', 'Your Library'].map((label) => {
            const Icon = label === 'Home' ? Home : label === 'Search' ? Search : Library;
            return (
              <button type="button" key={label} className={activeNav === label ? 'nav-item nav-item--active' : 'nav-item'} onClick={() => { setActiveNav(label); setMobileNav(false); }}>
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="library-heading">Playlists</div>
        <div className="playlist-list">
          <button type="button" className="playlist-create" onClick={createPlaylistFromPrompt}>+ Create Playlist</button>
          {playlists.length ? (
            playlists.map((playlist) => (
              <div key={playlist.id} className="playlist-item-row">
                <button type="button" className="playlist-item" onClick={() => openPlaylist(playlist.id)}>
                  <span className="playlist-dot" />
                  <span>{playlist.name}</span>
                </button>
                <button type="button" className="playlist-add-mini" onClick={(event) => {
                  event.stopPropagation();
                  addTrackToPlaylistFromPrompt(playlist.id);
                }} aria-label={`Add a track to ${playlist.name}`}>
                  +
                </button>
              </div>
            ))
          ) : (
            <p className="playlist-empty">No playlists yet.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="profile-initial">{name.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{name}</strong>
            <span>Signed in</span>
          </div>
          <button type="button" className="logout-button" onClick={logout} aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <div className="topbar-actions">
            <span className="connection-label">DB / LIVE</span>
            <span className="avatar">{name.slice(0, 2).toUpperCase()}</span>
          </div>
        </header>

        {albumDetail ? (
          <AlbumDetailPage album={albumDetail} onBack={() => setAlbumDetail(null)} onPlayTrack={handleTrackSelection} likedTracks={likedTracks} onToggleFavorite={toggleFavorite} />
        ) : (
          renderMainView()
        )}
      </main>

      <div className="player-bar">
        <div className="now-playing">
          {selectedTrack ? (
            <>
              <Artwork album={{ title: getAlbumTitle(selectedTrack, albumMap), coverUri: selectedTrack.coverUri || '' }} index={0} small />
              <div>
                <strong>{safeText(selectedTrack.title, 'Unknown title')}</strong>
                <span>{getArtistName(selectedTrack.artist, 'Unknown artist')}</span>
              </div>
            </>
          ) : (
            <>
              <div className="artwork artwork--empty artwork--small"><span>♪</span></div>
              <div>
                <strong>Select a track to play</strong>
                <span>SONATA library</span>
              </div>
            </>
          )}

          <button type="button" className={`icon-button ${selectedTrack && likedTracks.includes(selectedTrack._id) ? 'icon-button--liked' : ''}`} onClick={() => toggleFavorite(selectedTrack)} aria-label="Favorite track">
            {selectedTrack && likedTracks.includes(selectedTrack._id) ? '♥' : '♡'}
          </button>
        </div>

        <div className="player-controls">
          <div className="transport">
            <button type="button" className="player-button" onClick={() => changeTrack(-1)} aria-label="Previous track">
              <SkipBack size={16} />
            </button>
            <button type="button" className="play-button" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" className="player-button" onClick={() => changeTrack(1)} aria-label="Next track">
              <SkipForward size={16} />
            </button>
          </div>

          <div className="progress-line">
            <span>{formatDuration(currentTime)}</span>
            <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(event) => {
              const nextValue = Number(event.target.value);
              setCurrentTime(nextValue);
              if (audioRef.current) audioRef.current.currentTime = nextValue;
            }} aria-label="Playback progress" />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="player-tools">
          <button type="button" className={`mini-toggle ${shuffleEnabled ? 'mini-toggle--active' : ''}`} onClick={() => setShuffleEnabled((value) => !value)} aria-label="Shuffle">
            <Shuffle size={15} />
          </button>
          <button type="button" className={`mini-toggle ${repeatEnabled ? 'mini-toggle--active' : ''}`} onClick={cycleRepeatMode} aria-label="Repeat mode">
            <Repeat2 size={15} />
          </button>

          <div className="volume-wrap">
            {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <input type="range" min={0} max={100} value={volume} onChange={(event) => {
              const nextValue = Number(event.target.value);
              setVolume(nextValue);
              if (audioRef.current) audioRef.current.volume = nextValue / 100;
            }} aria-label="Volume" />
          </div>
        </div>
      </div>

      <audio ref={audioRef} preload="auto" onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={() => {
        if (activePlaylistId && playlistQueue.length) {
          const currentIndex = selectedTrack ? playlistQueue.findIndex((track) => track._id === selectedTrack._id) : -1;

          if (repeatMode === 'one') {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => setAudioError('Unable to play this track.'));
            }
            return;
          }

          const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;

          if (nextIndex < playlistQueue.length) {
            const nextTrack = playlistQueue[nextIndex];
            setSelectedTrack(nextTrack);
            recordRecentlyPlayed(nextTrack);
            return;
          }

          if (repeatMode === 'playlist' || repeatMode === 'off') {
            const firstTrack = playlistQueue[0];
            setSelectedTrack(firstTrack);
            recordRecentlyPlayed(firstTrack);
            return;
          }

          setPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          return;
        }

        if (repeatMode === 'one') {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          return;
        }

        if (repeatMode === 'playlist') {
          const currentIndex = selectedTrack ? tracks.findIndex((track) => track._id === selectedTrack._id) : -1;
          const nextTrack = tracks[(currentIndex + 1) % tracks.length] || tracks[0];
          if (nextTrack) {
            setSelectedTrack(nextTrack);
            recordRecentlyPlayed(nextTrack);
            return;
          }
        }

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setPlaying(false);
      }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setAudioError('Unable to play this track.')} />

      {audioError && <div className="player-error">{audioError}</div>}
    </div>
  );
}

export default App;