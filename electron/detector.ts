const STREAMING_KEYWORDS = [
  'Netflix', 'Prime Video', 'Amazon Prime', 'Disney+', 'Disney Plus', 'Hotstar',
  'JioCinema', 'Zee5', 'ZEE5', 'SonyLIV', 'Sony LIV', 'Hulu', 'Max', 'HBO Max',
  'Apple TV', 'Peacock', 'Paramount+', 'YouTube', 'Google Chrome', 'Microsoft Edge'
];

const DELIMITERS = [' - ', ' — ', ' | ', ' • '];
const GENERIC = ['home', 'browse', 'search', 'new & popular', 'my list', 'sign in', 'youtube'];

export type DetectionPayload = { title: string; service: string; watchedSeconds: number };

function parseWindowTitle(title: string, ownerName: string | undefined | null) {
  const haystack = `${title} ${ownerName || ''}`.toLowerCase();
  const service = STREAMING_KEYWORDS.find((k) => haystack.includes(k.toLowerCase()));
  if (!service) return null;

  let segments = [title];
  for (const d of DELIMITERS) {
    if (title.includes(d)) { segments = title.split(d).map((s) => s.trim()).filter(Boolean); break; }
  }
  const junk = [...STREAMING_KEYWORDS, 'Google Chrome', 'Microsoft Edge', 'Safari', 'Firefox'];
  const candidate = segments.find((seg) => !junk.some((j) => seg.toLowerCase() === j.toLowerCase())) || segments[0];
  if (!candidate || GENERIC.includes(candidate.toLowerCase())) return null;
  return { title: candidate, service };
}

export class BackgroundDetector {
  private timer: NodeJS.Timeout | null = null;
  private current: { title: string; service: string; watchedSeconds: number; missingTicks: number; notified: boolean } | null = null;
  private notifiedTitles = new Set<string>();

  constructor(private onFinished: (payload: DetectionPayload) => void, private minWatchSeconds = 120 * 60) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick().catch((err) => console.log('[Stud detector]', err.message)), 5000);
  }

  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  private async tick() {
    const activeWin = (await import('active-win')).default;
    const win = await activeWin();
    const parsed = win ? parseWindowTitle(win.title || '', win.owner?.name) : null;
    if (parsed) {
      if (this.current?.title === parsed.title) {
        this.current.watchedSeconds += 5;
        this.current.missingTicks = 0;
        this.notifyIfReady();
      } else {
        this.flush();
        this.current = { ...parsed, watchedSeconds: 5, missingTicks: 0, notified: false };
        this.notifyIfReady();
      }
      return;
    }
    if (this.current) {
      this.current.missingTicks += 1;
      if (this.current.missingTicks >= 9) this.flush();
    }
  }

  private flush() {
    if (this.current) this.notifyIfReady();
    this.current = null;
  }

  private notifyIfReady() {
    if (!this.current || this.current.notified) return;
    if (this.current.watchedSeconds < this.minWatchSeconds) return;

    const key = `${this.current.service.toLowerCase()}::${this.current.title.toLowerCase()}`;
    if (this.notifiedTitles.has(key)) {
      this.current.notified = true;
      return;
    }

    this.notifiedTitles.add(key);
    this.current.notified = true;
    this.onFinished({
      title: this.current.title,
      service: this.current.service,
      watchedSeconds: this.current.watchedSeconds
    });
  }
}
