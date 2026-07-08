import { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { searchMovies, trendingMovies } from './tmdb';
import { signInWithGoogle } from './googleAuth';
import { BackgroundDetector } from './detector';

type ApiConfig = { tmdbApiKey: string; googleClientId: string; googleClientSecret: string };

const store = new Store({
  name: 'stud-data',
  defaults: {
    profile: null,
    watchlist: [],
    reviews: [],
    friends: [],
    settings: { detectionEnabled: true, minWatchMinutes: 120 },
    // Runtime-configurable credentials. Nothing here ships in source control -
    // each user pastes their own free TMDb key / Google OAuth client in Settings.
    apiConfig: { tmdbApiKey: '', googleClientId: '', googleClientSecret: '' }
  }
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let ratingWindow: BrowserWindow | null = null;
let detector: BackgroundDetector | null = null;

function apiConfig(): ApiConfig {
  return store.get('apiConfig') as ApiConfig;
}

function rendererPath() {
  return path.join(__dirname, '..', 'dist', 'index.html');
}

function createMainWindow() {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); return; }
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 780,
    minWidth: 1000,
    minHeight: 650,
    title: 'Stud',
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#0f0d13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.on('render-process-gone', (_event, details) => console.error('[Stud] Renderer gone:', details.reason));
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => console.error('[Stud] Failed load:', errorCode, errorDescription));

  const devUrl = process.env.STUD_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(rendererPath());

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createRatingWindow(payload: { title: string; service: string; watchedSeconds: number }) {
  if (ratingWindow) ratingWindow.close();
  ratingWindow = new BrowserWindow({
    width: 480,
    height: 740,
    minWidth: 460,
    minHeight: 700,
    resizable: true,
    alwaysOnTop: true,
    title: 'Log movie',
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#0f0d13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ratingWindow.setMenuBarVisibility(false);
  const query = new URLSearchParams({ rating: '1', title: payload.title, service: payload.service, watchedSeconds: String(payload.watchedSeconds) });
  const devUrl = process.env.STUD_DEV_SERVER_URL;
  if (devUrl) ratingWindow.loadURL(`${devUrl}/?${query.toString()}`);
  else ratingWindow.loadFile(rendererPath(), { query: Object.fromEntries(query.entries()) });
  ratingWindow.on('closed', () => { ratingWindow = null; });
}

function getTrayIcon() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray.png');
  const fileIcon = nativeImage.createFromPath(iconPath);
  if (!fileIcon.isEmpty()) return fileIcon;

  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAy0lEQVR4Ae3XMQ6EIBAE0P//T3vYxGBBbSAg9EQeZ4PNTEhDSmWxDfm/9nUBgF8DgL8F4HMA8LcAfA4A/hYwmn3f5wkA2BrHMZRlGbMsC9u2AQB5nkNKSfM8BwDkeQ4ApmnCtm0AQF3XLIriui6cc1EUYRgGvV6PcRwBAPM8s21bWZZBlmWgKAqappFtG8uyQAiBpmnquqYoirRtG4qi4Ps+qqpC0zSoqgqjKABAcRwyDEMURcG2bZiWRV3XGIYBiqJgWRZFUfD9Pq7rwjAMdF2HpmnQNA2appFlGQBQFIWmaWh5/o0QmgC8F4DPAcDfAvA5APhbAD4HAH8LQPkFjgddnCwvz0YAAAAASUVORK5CYII='
  );
}

function createTray() {
  try {
    tray = new Tray(getTrayIcon());
    tray.setToolTip('Stud — movie tracker');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open Stud', click: () => createMainWindow() },
      { label: 'Test finished movie popup', click: () => createRatingWindow({ title: 'Interstellar', service: 'Netflix', watchedSeconds: 7200 }) },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]));
  } catch (error) {
    console.warn('[Stud] Tray disabled:', error);
  }
}

function startDetector() {
  const settings: any = store.get('settings');
  if (!settings.detectionEnabled) return;
  const minWatchMinutes = Math.max(1, Math.min(300, Number(settings.minWatchMinutes || 120)));
  detector = new BackgroundDetector((payload) => {
    createRatingWindow(payload);
    new Notification({ title: 'Stud', body: `Ready to rate ${payload.title}` }).show();
  }, minWatchMinutes * 60);
  detector.start();
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  startDetector();
});

ipcMain.handle('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.handle('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  return win.isMaximized();
});
ipcMain.handle('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close());
ipcMain.handle('window:isMaximized', (event) => BrowserWindow.fromWebContents(event.sender)?.isMaximized() || false);

ipcMain.handle('auth:google', async () => {
  const cfg = apiConfig();
  const profile = await signInWithGoogle({ clientId: cfg.googleClientId, clientSecret: cfg.googleClientSecret });
  store.set('profile', profile);
  return profile;
});

ipcMain.handle('auth:local', (_event, name: string) => {
  const profile = { id: `local-${Date.now()}`, name: name || 'Local User', email: '', avatar: '' };
  store.set('profile', profile);
  return profile;
});

ipcMain.handle('auth:logout', () => { store.set('profile', null); return null; });
ipcMain.handle('profile:get', () => store.get('profile'));

ipcMain.handle('movies:search', (_event, query: string) => searchMovies(query, apiConfig().tmdbApiKey));
ipcMain.handle('movies:trending', () => trendingMovies(apiConfig().tmdbApiKey));

ipcMain.handle('watchlist:get', () => store.get('watchlist'));
ipcMain.handle('watchlist:add', (_event, movie) => {
  const list = store.get('watchlist') as any[];
  if (!list.some((m) => m.id === (movie as any).id)) list.unshift(movie);
  store.set('watchlist', list);
  return list;
});
ipcMain.handle('watchlist:remove', (_event, id: number) => {
  const list = (store.get('watchlist') as any[]).filter((m) => m.id !== id);
  store.set('watchlist', list);
  return list;
});
ipcMain.handle('reviews:get', () => store.get('reviews'));
ipcMain.handle('reviews:add', (_event, review) => {
  const profile: any = store.get('profile');
  const reviews = store.get('reviews') as any[];
  reviews.unshift({
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    user: profile ? { name: profile.name, email: profile.email, avatar: profile.avatar } : { name: 'Local User' },
    sharedWith: [] as string[],
    ...review
  });
  store.set('reviews', reviews);
  return reviews;
});
ipcMain.handle('reviews:remove', (_event, id: string) => {
  const reviews = (store.get('reviews') as any[]).filter((r) => r.id !== id);
  store.set('reviews', reviews);
  return reviews;
});
// Sets which friends a review is shared with. Replaces the old boolean
// `shared` flag, which had no way to say *who* it was shared with - that's
// what caused the feed to guess a friend by array index.
ipcMain.handle('reviews:share', (_event, { id, friendIds }: { id: string; friendIds: string[] }) => {
  const reviews = (store.get('reviews') as any[]).map((r) => (r.id === id ? { ...r, sharedWith: friendIds } : r));
  store.set('reviews', reviews);
  return reviews;
});

ipcMain.handle('friends:get', () => store.get('friends'));
ipcMain.handle('friends:add', (_event, friendName: string) => {
  const friends = store.get('friends') as any[];
  const clean = String(friendName || '').trim();
  if (clean && !friends.some((f) => f.name.toLowerCase() === clean.toLowerCase())) {
    friends.unshift({ id: Date.now().toString(), name: clean, addedAt: new Date().toISOString() });
  }
  store.set('friends', friends);
  return friends;
});
ipcMain.handle('friends:remove', (_event, id: string) => {
  const friends = (store.get('friends') as any[]).filter((f) => f.id !== id);
  store.set('friends', friends);
  return friends;
});
// Real pairing now: a review only shows up per-friend if that friend's id is
// actually in review.sharedWith, instead of being assigned by array index.
ipcMain.handle('friends:feed', () => {
  const friends = store.get('friends') as any[];
  const reviews = (store.get('reviews') as any[]).filter((r) => Array.isArray(r.sharedWith) && r.sharedWith.length > 0);
  return reviews.map((r) => ({
    ...r,
    sharedWithNames: (r.sharedWith as string[])
      .map((fid) => friends.find((f) => f.id === fid)?.name)
      .filter(Boolean)
  }));
});

ipcMain.handle('settings:get', () => store.get('settings'));
ipcMain.handle('settings:set', (_event, patch) => {
  const cleanPatch: any = { ...patch };
  if ('minWatchMinutes' in cleanPatch) {
    cleanPatch.minWatchMinutes = Math.max(1, Math.min(300, Number(cleanPatch.minWatchMinutes) || 120));
  }
  const updated = { ...(store.get('settings') as any), ...cleanPatch };
  store.set('settings', updated);
  detector?.stop();
  detector = null;
  startDetector();
  return updated;
});

// Runtime credentials, stored locally only (electron-store JSON file on disk).
// Never bundled with the app and never committed to source control.
ipcMain.handle('settings:getApiConfig', () => {
  const cfg = apiConfig();
  // Don't ship the raw secret back to the renderer more than needed for editing;
  // this is a local desktop app so it's acceptable here, but we mask by default
  // client-side. Full value is returned so the Settings form can be pre-filled.
  return cfg;
});
ipcMain.handle('settings:setApiConfig', (_event, patch: Partial<ApiConfig>) => {
  const updated = { ...apiConfig(), ...patch };
  store.set('apiConfig', updated);
  return updated;
});

ipcMain.handle('dev:simulate-finished', () => createRatingWindow({ title: 'Interstellar', service: 'Netflix', watchedSeconds: 7200 }));

// Lets the user log a rating manually from the Watchlist page, instead of
// only ever being triggered by background detection.
ipcMain.handle('rating:openManual', (_event, payload: { title: string; service?: string }) => {
  createRatingWindow({ title: payload.title, service: payload.service || 'Manual entry', watchedSeconds: 0 });
});

ipcMain.handle('stats:get', () => {
  const reviews = store.get('reviews') as any[];
  const categories = ['story', 'acting', 'direction', 'visuals', 'music'];

  const totalHours = reviews.reduce((sum, r) => sum + (Number(r.watchedSeconds) || 0), 0) / 3600;

  const avgByCategory: Record<string, number> = {};
  for (const cat of categories) {
    const scored = reviews.filter((r) => typeof r.categories?.[cat] === 'number');
    avgByCategory[cat] = scored.length ? scored.reduce((s, r) => s + r.categories[cat], 0) / scored.length : 0;
  }

  const monthlyMap = new Map<string, number>();
  for (const r of reviews) {
    const month = (r.createdAt || '').slice(0, 7); // YYYY-MM
    if (!month) continue;
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + (Number(r.watchedSeconds) || 0) / 3600);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, hours]) => ({ month, hours: Math.round(hours * 10) / 10 }));

  const serviceMap = new Map<string, number>();
  for (const r of reviews) {
    const service = r.service || 'Unknown';
    serviceMap.set(service, (serviceMap.get(service) || 0) + 1);
  }
  const byService = Array.from(serviceMap.entries()).map(([service, count]) => ({ service, count }));

  const topRated = [...reviews]
    .filter((r) => typeof r.average === 'number')
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map((r) => ({ title: r.title, average: r.average, service: r.service }));

  return {
    totalReviews: reviews.length,
    totalHours: Math.round(totalHours * 10) / 10,
    avgByCategory,
    monthly,
    byService,
    topRated
  };
});

app.on('window-all-closed', (event: any) => event.preventDefault());

declare global { namespace Electron { interface App { isQuitting?: boolean } } }
