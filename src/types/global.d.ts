export {};

declare global {
  interface Window {
    stud: {
      authGoogle: () => Promise<any>;
      authLocal: (name: string) => Promise<any>;
      logout: () => Promise<any>;
      getProfile: () => Promise<any>;

      searchMovies: (query: string) => Promise<any[]>;
      trendingMovies: () => Promise<any[]>;

      getWatchlist: () => Promise<any[]>;
      addWatchlist: (movie: unknown) => Promise<any[]>;
      removeWatchlist: (id: number) => Promise<any[]>;

      getReviews: () => Promise<any[]>;
      addReview: (review: unknown) => Promise<any[]>;
      removeReview: (id: string) => Promise<any[]>;
      shareReview: (id: string, friendIds: string[]) => Promise<any[]>;

      getFriends: () => Promise<any[]>;
      addFriend: (name: string) => Promise<any[]>;
      removeFriend: (id: string) => Promise<any[]>;
      getFriendsFeed: () => Promise<any[]>;

      getSettings: () => Promise<any>;
      setSettings: (patch: unknown) => Promise<any>;
      simulateFinished: () => Promise<any>;
      openManualRating: (title: string, service?: string) => Promise<void>;

      getStats: () => Promise<{
        totalReviews: number;
        totalHours: number;
        avgByCategory: Record<string, number>;
        monthly: { month: string; hours: number }[];
        byService: { service: string; count: number }[];
        topRated: { title: string; average: number; service: string }[];
      }>;

      getApiConfig: () => Promise<{ tmdbApiKey: string; googleClientId: string; googleClientSecret: string }>;
      setApiConfig: (patch: unknown) => Promise<{ tmdbApiKey: string; googleClientId: string; googleClientSecret: string }>;

      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<boolean>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
    };
  }
}
