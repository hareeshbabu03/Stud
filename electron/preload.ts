import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('stud', {
  authGoogle: () => ipcRenderer.invoke('auth:google'),
  authLocal: (name: string) => ipcRenderer.invoke('auth:local', name),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getProfile: () => ipcRenderer.invoke('profile:get'),

  searchMovies: (query: string) => ipcRenderer.invoke('movies:search', query),
  trendingMovies: () => ipcRenderer.invoke('movies:trending'),

  getWatchlist: () => ipcRenderer.invoke('watchlist:get'),
  addWatchlist: (movie: unknown) => ipcRenderer.invoke('watchlist:add', movie),
  removeWatchlist: (id: number) => ipcRenderer.invoke('watchlist:remove', id),

  getReviews: () => ipcRenderer.invoke('reviews:get'),
  addReview: (review: unknown) => ipcRenderer.invoke('reviews:add', review),
  removeReview: (id: string) => ipcRenderer.invoke('reviews:remove', id),
  shareReview: (id: string, friendIds: string[]) => ipcRenderer.invoke('reviews:share', { id, friendIds }),

  getFriends: () => ipcRenderer.invoke('friends:get'),
  addFriend: (name: string) => ipcRenderer.invoke('friends:add', name),
  removeFriend: (id: string) => ipcRenderer.invoke('friends:remove', id),
  getFriendsFeed: () => ipcRenderer.invoke('friends:feed'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch: unknown) => ipcRenderer.invoke('settings:set', patch),
  simulateFinished: () => ipcRenderer.invoke('dev:simulate-finished'),
  openManualRating: (title: string, service?: string) => ipcRenderer.invoke('rating:openManual', { title, service }),

  getStats: () => ipcRenderer.invoke('stats:get'),

  getApiConfig: () => ipcRenderer.invoke('settings:getApiConfig'),
  setApiConfig: (patch: unknown) => ipcRenderer.invoke('settings:setApiConfig', patch),

  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized')
});
