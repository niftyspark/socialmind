// ============================================================
// SocialMind — Auth API (consolidated: login, register, me)
// Routes: POST /api/auth (login/register), GET /api/auth (me)
// ============================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, queryOne } from '../lib/db.js';
import crypto from 'crypto';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

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
  // GET /api/auth = get current user
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

  // POST /api/auth = login or register
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    if (action === 'register') {
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const userId = crypto.randomUUID();
      const salt = crypto.randomBytes(32).toString('hex');
      const hashedPassword = hashPassword(password, salt);
      const now = Date.now();
      await query(
        'INSERT INTO users (id, email, name, password_hash, password_salt, auth_provider, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, email.toLowerCase(), name || email.split('@')[0], hashedPassword, salt, 'email', now]
      );
      const user = { id: userId, email: email.toLowerCase(), name: name || email.split('@')[0], image: '', created_at: now };
      return res.status(201).json({ token: generateToken(userId), user });

    } else if (action === 'login') {
      const user = await queryOne<{ id: string; email: string; name: string; image: string; password_hash: string; password_salt: string; created_at: number }>(
        'SELECT id, email, name, image, password_hash, password_salt, created_at FROM users WHERE email = $1', [email.toLowerCase()]
      );
      if (!user || !user.password_hash || !user.password_salt) return res.status(401).json({ error: 'Invalid email or password' });

      if (hashPassword(password, user.password_salt) !== user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const { password_hash: _ph, password_salt: _ps, ...safeUser } = user;
      void _ph; void _ps;
      return res.status(200).json({ token: generateToken(user.id), user: safeUser });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "login" or "register".' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
