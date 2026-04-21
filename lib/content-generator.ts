// ============================================================
// SocialMind — AI Content Generator
// Uses agent personality config to generate platform-specific posts
// ============================================================

import type { AgentConfig, Platform, ContentMixType } from '../src/types/agent.js';

const API_BASE = 'https://api.groq.com/openai/v1';

interface GeneratedContent {
  text: string;
  platform: Platform;
  type: ContentMixType;
  hashtags: string[];
}

function buildSystemPrompt(agent: AgentConfig): string {
  const { identity, personality, rules } = agent;

  return `You are "${identity.name}" — an autonomous social media AI agent.

PERSONALITY:
- Bio: ${identity.bio}
- Tagline: ${identity.tagline}
- Tone: ${personality.tone}
- Writing Style: ${personality.writingStyle}
- Topics of Expertise: ${personality.topics.join(', ')}
- Languages: ${personality.languages.join(', ')}

${personality.examplePosts.length > 0 ? `EXAMPLE POSTS (match this style):
${personality.examplePosts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}` : ''}

CONTENT RULES:
- Hashtag Strategy: ${rules.hashtagStrategy}
${rules.defaultHashtags.length > 0 ? `- Default Hashtags: ${rules.defaultHashtags.join(', ')}` : ''}
- Include Emojis: ${rules.includeEmojis ? 'Yes' : 'No'}
- Include Links: ${rules.includeLinks ? 'Yes' : 'No'}
${rules.brandGuidelines ? `- Brand Guidelines: ${rules.brandGuidelines}` : ''}

FORBIDDEN TOPICS/WORDS:
${[...personality.doNotMention, ...rules.forbiddenWords].join(', ') || 'None specified'}

${personality.systemPrompt ? `ADDITIONAL INSTRUCTIONS:\n${personality.systemPrompt}` : ''}

You must stay in character at all times. Generate content that is authentic, engaging, and matches the personality described above.`;
}

function buildContentPrompt(
  platform: Platform,
  contentType: ContentMixType,
  maxLength: number,
  agent: AgentConfig,
): string {
  const platformNames: Record<Platform, string> = {
    twitter: 'X (Twitter)',
    facebook: 'Facebook',
    instagram: 'Instagram',
  };

  const typeInstructions: Record<ContentMixType, string> = {
    original: 'Write an original post. Be insightful, engaging, and share a valuable thought or observation.',
    reply: 'Write a thoughtful reply/comment that adds value to a conversation. Make it conversational and engaging.',
    quote: 'Write a quote-tweet style post that references an interesting topic with your own take.',
    thread: 'Write the first post of a thread (keep it as a hook/opener that makes people want to read more).',
  };

  const topics = agent.personality.topics;
  const randomTopic = topics.length > 0
    ? topics[Math.floor(Math.random() * topics.length)]
    : 'something relevant to your expertise';

  return `Generate a ${contentType} post for ${platformNames[platform]}.

Topic direction: ${randomTopic}

${typeInstructions[contentType]}

REQUIREMENTS:
- Maximum ${maxLength} characters
- Platform: ${platformNames[platform]}
- Type: ${contentType}
${agent.rules.hashtagStrategy !== 'none' ? `- Include ${agent.rules.hashtagStrategy === 'minimal' ? '1-2' : agent.rules.hashtagStrategy === 'moderate' ? '3-5' : '5-10'} relevant hashtags` : '- No hashtags'}
${agent.rules.includeEmojis ? '- Include relevant emojis naturally' : '- No emojis'}

IMPORTANT: Return ONLY the post content. No quotes, no metadata, no explanation. Just the raw post text.`;
}

export async function generateContent(
  agent: AgentConfig,
  platform: Platform,
  contentType: ContentMixType,
): Promise<GeneratedContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const maxLength = agent.rules.maxPostLength[platform];
  const systemPrompt = buildSystemPrompt(agent);
  const userPrompt = buildContentPrompt(platform, contentType, maxLength, agent);

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || '';

  if (text.length > maxLength) {
    text = text.slice(0, maxLength - 3) + '...';
  }

  const hashtagRegex = /#[\w]+/g;
  const hashtags = text.match(hashtagRegex) || [];

  return {
    text,
    platform,
    type: contentType,
    hashtags,
  };
}

export function selectContentType(
  weights: Record<ContentMixType, number>,
): ContentMixType {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return 'original';

  let random = Math.random() * total;
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return type as ContentMixType;
  }
  return 'original';
}