import { shell } from 'electron';
import http from 'http';
import crypto from 'crypto';

const REDIRECT_URI = 'http://127.0.0.1:42813/oauth/callback';
const PORT = 42813;

type GoogleProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type GoogleCredentials = {
  clientId: string;
  // Google's "Desktop app" OAuth client type still requires this in the token
  // exchange even for a PKCE flow (their API rejects the request without it).
  // It is NOT treated as confidential for installed apps per Google's own docs,
  // but we still never want it sitting in git history - it lives in local
  // electron-store, entered by each user in Settings, never in source control.
  clientSecret: string;
};

function base64url(input: Buffer) {
  return input.toString('base64url');
}

function randomState() {
  return crypto.randomBytes(24).toString('hex');
}

function html(message: string) {
  return `<!doctype html><html><head><title>Stud Login</title><style>body{font-family:system-ui;background:#0f0d13;color:#f5efe6;display:grid;place-items:center;height:100vh;margin:0}.card{background:#17131f;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:32px;max-width:420px;text-align:center}h1{color:#f1b251}</style></head><body><div class="card"><h1>Stud</h1><p>${message}</p></div></body></html>`;
}

export async function signInWithGoogle(credentials: GoogleCredentials): Promise<GoogleProfile> {
  const { clientId, clientSecret } = credentials || ({} as GoogleCredentials);
  if (!clientId || !clientSecret) {
    throw new Error('Google sign-in is not configured. Add your Google Client ID and Client Secret in Settings.');
  }

  const state = randomState();
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return new Promise<GoogleProfile>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
        if (reqUrl.pathname !== '/oauth/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const error = reqUrl.searchParams.get('error');
        if (error) throw new Error(`Google sign-in cancelled: ${error}`);

        const returnedState = reqUrl.searchParams.get('state');
        if (returnedState !== state) throw new Error('Google sign-in failed: state mismatch.');

        const code = reqUrl.searchParams.get('code');
        if (!code) throw new Error('Google sign-in failed: missing authorization code.');

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
          })
        });

        const tokenData: any = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(`Google token exchange failed: ${JSON.stringify(tokenData)}`);
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const user: any = await userRes.json();
        if (!userRes.ok) throw new Error(`Google profile fetch failed: ${JSON.stringify(user)}`);

        const profile: GoogleProfile = {
          id: user.sub,
          name: user.name || user.email || 'Google User',
          email: user.email || '',
          avatar: user.picture || ''
        };

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html('Login successful. You can close this tab and return to Stud.'));
        server.close();
        resolve(profile);
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(html(err.message || 'Google sign-in failed.'));
        server.close();
        reject(err);
      }
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') reject(new Error('Google login port 42813 is already in use. Close the old Stud/login window and try again.'));
      else reject(err);
    });

    server.listen(PORT, '127.0.0.1', async () => {
      await shell.openExternal(authUrl.toString());
    });

    setTimeout(() => {
      try { server.close(); } catch {}
      reject(new Error('Google sign-in timed out. Please try again.'));
    }, 120000);
  });
}
