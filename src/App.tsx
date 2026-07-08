import { useEffect, useMemo, useState } from 'react';
import { Home, Search, Star, Users, User, Settings, PlayCircle, LogOut, Minus, Square, X, BarChart3 } from 'lucide-react';
import Discover from './pages/Discover';
import Watchlist from './pages/Watchlist';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import HomePage from './pages/HomePage';
import RatingPopup from './pages/RatingPopup';
import Stats from './pages/Stats';

type Page = 'home' | 'discover' | 'watchlist' | 'friends' | 'profile' | 'settings' | 'stats';

const nav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'stats', label: 'Analytics', icon: BarChart3 },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings }
] as const;

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const isRating = params.get('rating') === '1';
  const detectedTitle = params.get('title') || 'Detected Movie';
  const detectedService = params.get('service') || '';
  const [page, setPage] = useState<Page>('home');
  const [profile, setProfile] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { window.stud.getProfile().then(setProfile); }, []);

  const pageNode = useMemo(() => {
    switch (page) {
      case 'home': return <HomePage profile={profile} go={setPage} />;
      case 'discover': return <Discover />;
      case 'watchlist': return <Watchlist />;
      case 'friends': return <Friends />;
      case 'profile': return <Profile profile={profile} onProfile={setProfile} />;
      case 'stats': return <Stats />;
      case 'settings': return <SettingsPage />;
    }
  }, [page, profile]);

  if (isRating) return <div className="window-root"><WindowTitleBar title="Log movie" compact /><RatingPopup title={detectedTitle} service={detectedService} /></div>;

  async function login() {
    setBusy(true); setLoginError('');
    try { setProfile(await window.stud.authGoogle()); }
    catch (e: any) { setLoginError(e.message || 'Google login failed'); }
    finally { setBusy(false); }
  }
  async function localLogin() { setProfile(await window.stud.authLocal('Local Stud User')); }
  async function logout() { setProfile(await window.stud.logout()); }

  return (
    <div className="window-root">
      <WindowTitleBar title="Stud" />
      <div className="app">
      <aside className="sidebar">
        <div className="brand">Stud</div>
        <div className="tag">Track. Rate. Share movies.</div>
        <nav className="nav">
          {nav.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}><Icon size={18}/>{item.label}</button>;
          })}
        </nav>
        <div className="profile-card">
          {profile ? <>
            <div className="user-mini">{profile.avatar ? <img src={profile.avatar}/> : <div className="avatar-fallback">{profile.name?.[0] || 'S'}</div>}<div><b>{profile.name}</b><div className="subtitle">{profile.email || 'Local profile'}</div></div></div>
            <button className="ghost wide" onClick={logout}><LogOut size={15}/> Sign out</button>
          </> : <>
            <button className="wide" onClick={login} disabled={busy}>{busy ? 'Opening Google...' : 'Sign in with Google'}</button>
            <button className="ghost wide" onClick={localLogin}>Use local mode</button>
            {loginError && <div className="error">{loginError}</div>}
          </>}
        </div>
      </aside>
      <main className="content">{pageNode}</main>
      </div>
    </div>
  );
}


function WindowTitleBar({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <div className={compact ? 'custom-titlebar compact-titlebar' : 'custom-titlebar'}>
      <div className="titlebar-left">
        <div className="titlebar-logo">🎬</div>
        <span>{title}</span>
      </div>
      <div className="titlebar-actions">
        <button aria-label="Minimize" onClick={() => window.stud.windowMinimize()}><Minus size={14} /></button>
        <button aria-label="Maximize" onClick={() => window.stud.windowMaximize()}><Square size={12} /></button>
        <button className="close-btn" aria-label="Close" onClick={() => window.stud.windowClose()}><X size={15} /></button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [apiConfig, setApiConfig] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.stud.getSettings().then(setSettings);
    window.stud.getApiConfig().then(setApiConfig);
  }, []);

  async function save(patch: any) { setSettings(await window.stud.setSettings(patch)); }

  async function saveApiConfig(patch: any) {
    const next = { ...apiConfig, ...patch };
    setApiConfig(next);
  }

  async function persistApiConfig() {
    const updated = await window.stud.setApiConfig(apiConfig);
    setApiConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings || !apiConfig) return <div className="panel">Loading settings...</div>;

  return (
    <>
      <div className="topbar"><div><div className="title">Settings</div><div className="subtitle">App preferences and developer tools.</div></div></div>
      <div className="panel settings-grid">
        <div>
          <h3>Background detection</h3>
          <p className="subtitle">Stud watches supported streaming window titles and shows only the final rating popup after enough watch time.</p>
        </div>
        <label className="switch-row"><input type="checkbox" checked={!!settings.detectionEnabled} onChange={(e)=>save({ detectionEnabled: e.target.checked })}/> Enabled</label>
        <label>Popup after watch time (minutes)<input className="search small" type="number" min="1" max="300" value={settings.minWatchMinutes} onChange={(e)=>save({ minWatchMinutes: Number(e.target.value) || 120 })}/></label>
        <p className="subtitle">Current popup trigger: <b>{settings.minWatchMinutes}</b> minutes. You can change this anytime; Stud restarts background detection automatically.</p>
        <button className="primary" onClick={() => window.stud.simulateFinished()}><PlayCircle size={16}/> Test final rating popup</button>
      </div>

      <div className="panel settings-grid">
        <div>
          <h3>API keys</h3>
          <p className="subtitle">
            Stud ships with no credentials baked in. Paste your own free keys below — they're saved only on this machine,
            never in source control. Get a TMDb key at <b>themoviedb.org/settings/api</b> and a Google OAuth client at{' '}
            <b>console.cloud.google.com</b> (application type "Desktop app", redirect URI{' '}
            <b>http://127.0.0.1:42813/oauth/callback</b>).
          </p>
        </div>
        <label>
          TMDb API key
          <input
            className="search wide"
            type="text"
            placeholder="Paste your TMDb API key"
            value={apiConfig.tmdbApiKey}
            onChange={(e) => saveApiConfig({ tmdbApiKey: e.target.value })}
          />
        </label>
        <label>
          Google OAuth Client ID
          <input
            className="search wide"
            type="text"
            placeholder="xxxxx.apps.googleusercontent.com"
            value={apiConfig.googleClientId}
            onChange={(e) => saveApiConfig({ googleClientId: e.target.value })}
          />
        </label>
        <label>
          Google OAuth Client Secret
          <input
            className="search wide"
            type="password"
            placeholder="Paste your OAuth client secret"
            value={apiConfig.googleClientSecret}
            onChange={(e) => saveApiConfig({ googleClientSecret: e.target.value })}
          />
        </label>
        <div className="row">
          <button className="primary" onClick={persistApiConfig}>Save API keys</button>
          {saved && <span className="tiny-muted">Saved locally ✓</span>}
        </div>
      </div>
    </>
  );
}
