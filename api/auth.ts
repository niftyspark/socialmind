// ============================================================
// SocialMind — Auth API (email/password + Firebase Google sign-in)
// Routes: POST /api/auth (login/register/google), GET /api/auth (me)
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

/**
 * Verify a Firebase ID token by decoding it and checking
 * the signature against Google's public keys.
 * This avoids needing firebase-admin SDK on the server.
 */
async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string; email: string; name: string; picture: string;
} | null> {
  try {
    // Decode the JWT header to get the key ID (kid)
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const kid = header.kid;

    // Fetch Google's public keys for Firebase
    const keysRes = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    const keys = await keysRes.json() as Record<string, string>;
    const cert = keys[kid];
    if (!cert) return null;

    // Verify the token using Node.js crypto
    const [, payloadB64, signatureB64] = idToken.split('.');
    const signedData = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    const isValid = crypto.createVerify('RSA-SHA256')
      .update(signedData)
      .verify(cert, signature);

    if (!isValid) return null;

    // Decode the payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Verify claims
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (projectId && payload.aud !== projectId) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!payload.sub) return null;

    return {
      uid: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || '',
    };
  } catch (err) {
    console.error('Firebase token verification error:', err);
    return null;
  }
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

  // POST /api/auth
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {
    // ── Firebase Google sign-in ──
    if (action === 'google') {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: 'Firebase ID token is required' });

      const firebaseUser = await verifyFirebaseIdToken(idToken);
      if (!firebaseUser) return res.status(401).json({ error: 'Invalid Firebase token' });

      // Find or create user by google_id (Firebase UID)
      let user = await queryOne<{ id: string; email: string; name: string; image: string; created_at: number }>(
        'SELECT id, email, name, image, created_at FROM users WHERE google_id = $1', [firebaseUser.uid]
      );

      if (!user) {
        // Check if email already exists (link accounts)
        user = await queryOne<{ id: string; email: string; name: string; image: string; created_at: number }>(
          'SELECT id, email, name, image, created_at FROM users WHERE email = $1', [firebaseUser.email.toLowerCase()]
        );

        if (user) {
          // Link Firebase UID to existing account
          await query('UPDATE users SET google_id = $1, image = $2, auth_provider = $3 WHERE id = $4',
            [firebaseUser.uid, firebaseUser.picture, 'google', user.id]);
          user.image = firebaseUser.picture;
        } else {
          // Create new user
          const userId = crypto.randomUUID();
          const now = Date.now();
          await query(
            'INSERT INTO users (id, email, name, image, google_id, auth_provider, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, firebaseUser.email.toLowerCase(), firebaseUser.name || firebaseUser.email.split('@')[0], firebaseUser.picture, firebaseUser.uid, 'google', now]
          );
          user = { id: userId, email: firebaseUser.email.toLowerCase(), name: firebaseUser.name || firebaseUser.email.split('@')[0], image: firebaseUser.picture, created_at: now };
        }
      }

      return res.status(200).json({ token: generateToken(user.id), user });
    }

    // ── Email/password auth ──
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

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
      if (hashPassword(password, user.password_salt) !== user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });
      const { password_hash: _ph, password_salt: _ps, ...safeUser } = user;
      void _ph; void _ps;
      return res.status(200).json({ token: generateToken(user.id), user: safeUser });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "login", "register", or "google".' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
