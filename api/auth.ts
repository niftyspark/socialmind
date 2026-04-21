// ============================================================
// SocialMind — Auth API (Google OAuth)
// Routes: POST /api/auth (google), GET /api/auth (me)
// ============================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, queryOne } from '../lib/db.js';
import crypto from 'crypto';

export function generateToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000, iat: Date.now() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.AUTH_SECRET || 'dev-secret';
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [encoded, signature] = token.split('.');
    const secret = process.env.AUTH_SECRET || 'dev-secret';
    const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch { return null; }
}

export function getUserId(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7))?.userId || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'No token provided' });
    try {
      const user = await queryOne<{ id: string; email: string; name: string; image: string; created_at: number }>(
        'SELECT id, email, name, image, created_at FROM users WHERE id = $1', [userId]
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user });
    } catch (error) {
      console.error('Auth me error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {
    if (action === 'google-code') {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_APP_URL + '/oauth/callback';

      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
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
        return res.status(401).json({ error: 'Failed to exchange code for token' });
      }

      const tokens = await tokenRes.json();
      const accessToken = tokens.access_token;

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!userRes.ok) {
        return res.status(401).json({ error: 'Failed to get user info' });
      }

      const googleUser = await userRes.json();

      if (!googleUser.email) {
        return res.status(401).json({ error: 'Could not get email from Google' });
      }

      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`).catch(() => {});

      let user = await queryOne<{ id: string; email: string; name: string; image: string; created_at: number }>(
        'SELECT id, email, name, image, created_at FROM users WHERE google_id = $1', [googleUser.sub]
      );

      if (!user) {
        const userId = crypto.randomUUID();
        const now = Date.now();
        await query(
          'INSERT INTO users (id, email, name, image, google_id, auth_provider, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [userId, googleUser.email, googleUser.name || googleUser.email.split('@')[0], googleUser.picture || '', googleUser.sub, 'google', now]
        );
        user = { id: userId, email: googleUser.email, name: googleUser.name || googleUser.email.split('@')[0], image: googleUser.picture || '', created_at: now };
      }

      return res.status(200).json({ token: generateToken(user.id), user: { ...user } });
    }

    return res.status(400).json({ error: 'Invalid action. Use "google-code".' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}