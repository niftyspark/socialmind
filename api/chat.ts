// ============================================================
// SocialMind — AI Chat Proxy (uses Groq)
// ============================================================
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE = 'https://api.groq.com/openai/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  try {
    const { messages, model, temperature, top_p, max_tokens, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const body = JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages,
      stream: stream ?? true,
      temperature: temperature ?? 1,
      top_p: top_p ?? 1,
      max_tokens: max_tokens ?? 4096,
    });

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: errorBody });
    }

    if (stream !== false) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: 'No response body' });
      }

      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch {
      } finally {
        res.end();
      }
    } else {
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error('Chat proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}