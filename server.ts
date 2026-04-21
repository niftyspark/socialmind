import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === '1';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
};

async function loadEnv() {
  const envPath = resolve(__dirname, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function handleApi(req: any, res: any) {
  if (req.url === '/api/auth' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { action, code } = JSON.parse(body);
        
        if (action === 'google-code' && code) {
          const clientId = process.env.GOOGLE_CLIENT_ID;
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
          const redirectUri = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173') + '/oauth/callback';

          if (!clientId || !clientSecret) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Google OAuth not configured' }));
            return;
          }

          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }),
          });

          if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error('Token exchange error:', err);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to exchange code for token' }));
            return;
          }

          const tokens = await tokenRes.json();
          const accessToken = tokens.access_token;

          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!userRes.ok) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to get user info' }));
            return;
          }

          const googleUser = await userRes.json();

          if (!googleUser.email) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Could not get email from Google' }));
            return;
          }

          const crypto = await import('crypto');
          const userId = crypto.randomUUID();
          const now = Date.now();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            token: `dev-token-${userId}`,
            user: { id: userId, email: googleUser.email, name: googleUser.name || googleUser.email.split('@')[0], image: googleUser.picture || '', created_at: now }
          }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid action' }));
      } catch (e) {
        console.error('API error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

async function start() {
  await loadEnv();
  
  const port = 3000;
  const server = createServer(async (req, res) => {
    if (req.url?.startsWith('/api/')) {
      return handleApi(req, res);
    }

    const isDev = !existsSync(join(__dirname, 'dist'));
    const distPath = isDev ? join(__dirname, 'dist') : join(__dirname, 'dist');
    
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = join(distPath, filePath.split('?')[0]);

    if (!existsSync(filePath) || !filePath.startsWith(distPath)) {
      filePath = join(distPath, 'index.html');
    }

    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
  });
}

start();