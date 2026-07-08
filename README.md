# Stud v2 Final

Modern Electron + React + TypeScript desktop movie tracker.

## Run

```bash
npm install
npm start
```

## What's included

- Borderless/frameless Electron window with custom title bar and window controls.
- Flexible popup timer from Settings: 1 to 300 minutes.
- Movie rating popup with category ratings.
- Manual "Rate now" from Watchlist.
- Analytics dashboard with charts.
- Improved friends/review sharing.
- Tray icon fallback so the app will not crash if the image is missing.
- Runtime API key settings for TMDb and Google OAuth. No hardcoded credentials.

## API keys

Open Settings → API keys and paste your own:

- TMDb API key
- Google OAuth Client ID
- Google OAuth Client Secret

The app still works with demo movies if no TMDb key is added.

## Notes

You can ignore normal npm deprecation/audit warnings for now. Do not run `npm audit fix --force` unless you are ready to handle Electron dependency breaking changes.
