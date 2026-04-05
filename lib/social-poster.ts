// ============================================================
// SocialMind — Social Media Poster (Composio-only)
// All posting goes through Composio's action execution API.
// ============================================================

import type { Platform, AgentConfig } from '../src/types/agent.js';

interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

interface ComposioActionResult {
  data?: Record<string, unknown>;
  successful?: boolean;
  successfull?: boolean;
  error?: string | null;
}

const COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v2';

async function executeComposioAction(
  actionSlug: string,
  params: Record<string, unknown>,
  connectedAccountId: string,
): Promise<ComposioActionResult> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error('COMPOSIO_API_KEY not configured');

  const response = await fetch(`${COMPOSIO_API_BASE}/actions/${actionSlug}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      connectedAccountId,
      input: params,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Composio action ${actionSlug} failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<ComposioActionResult>;
}

function isSuccess(result: ComposioActionResult): boolean {
  return result.successful === true || result.successfull === true;
}

/**
 * Generate a direct, public image URL for Instagram posts.
 * Instagram requires a non-redirecting, publicly accessible image URL.
 * 
 * Uses picsum.photos and resolves the redirect to get the direct fastly CDN URL.
 * The text goes in the Instagram caption, not on the image itself.
 */
async function generateImageUrl(content: string): Promise<string> {
  // Create a deterministic seed from content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash) % 1000;
  const picsumUrl = `https://picsum.photos/seed/${seed}/1080/1080.jpg`;

  // Resolve the 302 redirect to get the direct CDN URL
  try {
    const response = await fetch(picsumUrl, { method: 'HEAD', redirect: 'manual' });
    const location = response.headers.get('location');
    if (location) return location;
  } catch {
    // fallback below
  }

  // Fallback: use a known static public image
  return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080&h=1080&fit=crop&q=80';
}

// ----------------------------------------------------------------
// Twitter (X)
// ----------------------------------------------------------------

async function postToTwitter(
  content: string,
  agent: AgentConfig,
): Promise<PostResult> {
  const connection = agent.platforms.twitter;
  if (!connection.connected || !connection.connectedAccountId) {
    return { success: false, error: 'Twitter not connected via Composio' };
  }

  try {
    const result = await executeComposioAction(
      'TWITTER_CREATION_OF_A_POST',
      { text: content },
      connection.connectedAccountId,
    );

    if (isSuccess(result)) {
      const tweetData = result.data || {};
      const tweetId = tweetData.id as string | undefined;
      return {
        success: true,
        postId: tweetId,
        postUrl: tweetId ? `https://x.com/i/status/${tweetId}` : undefined,
      };
    }

    return { success: false, error: result.error || 'Composio Twitter post failed' };
  } catch (error) {
    return { success: false, error: `Twitter via Composio: ${error}` };
  }
}

// ----------------------------------------------------------------
// Facebook
// ----------------------------------------------------------------

async function postToFacebook(
  content: string,
  agent: AgentConfig,
): Promise<PostResult> {
  const connection = agent.platforms.facebook;
  if (!connection.connected || !connection.connectedAccountId) {
    return { success: false, error: 'Facebook not connected via Composio' };
  }

  try {
    const pagesResult = await executeComposioAction(
      'FACEBOOK_LIST_MANAGED_PAGES',
      { limit: 1 },
      connection.connectedAccountId,
    );

    let pageId: string | undefined;
    const pagesData = pagesResult.data;
    if (pagesData) {
      const pages = (pagesData as Record<string, unknown>).data as Array<{ id: string }> | undefined;
      if (Array.isArray(pages) && pages.length > 0) {
        pageId = pages[0].id;
      } else if (Array.isArray(pagesData) && pagesData.length > 0) {
        pageId = (pagesData as Array<{ id: string }>)[0].id;
      }
    }

    if (!pageId) {
      return { success: false, error: 'No Facebook Pages found. Connect a Page with admin access.' };
    }

    const postResult = await executeComposioAction(
      'FACEBOOK_CREATE_POST',
      { message: content, page_id: pageId, published: true },
      connection.connectedAccountId,
    );

    if (isSuccess(postResult)) {
      const postData = postResult.data || {};
      const postId = postData.id as string | undefined;
      return {
        success: true,
        postId,
        postUrl: postId ? `https://facebook.com/${postId}` : undefined,
      };
    }

    return { success: false, error: postResult.error || 'Composio Facebook post failed' };
  } catch (error) {
    return { success: false, error: `Facebook via Composio: ${error}` };
  }
}

// ----------------------------------------------------------------
// Instagram — requires image for feed posts
// Flow: get user ID -> create media container -> publish
// ----------------------------------------------------------------

async function getInstagramUserId(connectedAccountId: string): Promise<string | null> {
  try {
    const result = await executeComposioAction(
      'INSTAGRAM_GET_USER_INFO',
      {},
      connectedAccountId,
    );
    if (isSuccess(result) && result.data) {
      return (result.data.id as string) || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function postToInstagram(
  content: string,
  agent: AgentConfig,
  imageUrl?: string,
): Promise<PostResult> {
  const connection = agent.platforms.instagram;
  if (!connection.connected || !connection.connectedAccountId) {
    return { success: false, error: 'Instagram not connected via Composio' };
  }

  try {
    // Step 1: Get the Instagram Business Account ID
    const igUserId = await getInstagramUserId(connection.connectedAccountId);
    if (!igUserId) {
      return { success: false, error: 'Could not retrieve Instagram user ID. Make sure this is a Business/Creator account.' };
    }

    // Step 2: Generate an image if none provided
    // Instagram requires an image_url for feed posts — text-only is not supported.
    const finalImageUrl = imageUrl || await generateImageUrl(content);

    // Step 3: Create a media container (draft)
    const containerResult = await executeComposioAction(
      'INSTAGRAM_CREATE_MEDIA_CONTAINER',
      {
        ig_user_id: igUserId,
        image_url: finalImageUrl,
        caption: content,
        content_type: 'photo',
      },
      connection.connectedAccountId,
    );

    if (!isSuccess(containerResult)) {
      // Extract detailed error from Composio/Instagram response
      const errData = containerResult.data || {};
      const igError = (errData.error as Record<string, unknown>)?.error_user_msg
        || (errData.error as Record<string, unknown>)?.message
        || containerResult.error;
      return {
        success: false,
        error: `Failed to create container (status ${containerResult.error ? 'error' : 'unknown'}). Response: ${JSON.stringify(errData.error || containerResult.error || errData)}`,
      };
      void igError; // used in the error string above indirectly
    }

    const containerData = containerResult.data || {};
    const creationId = (containerData.id || containerData.creation_id) as string | undefined;

    if (!creationId) {
      return { success: false, error: 'No creation ID returned from Instagram. Container response: ' + JSON.stringify(containerData) };
    }

    // Step 4: Wait for Instagram to process the media container.
    // Instagram needs time to download and process the image before we can publish.
    // Poll the container status, retrying up to 5 times with increasing delays.
    let mediaReady = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      // Wait: 5s, 8s, 10s, 12s, 15s (total ~50s max)
      const delayMs = [5000, 8000, 10000, 12000, 15000][attempt];
      await new Promise(resolve => setTimeout(resolve, delayMs));

      try {
        const statusResult = await executeComposioAction(
          'INSTAGRAM_GET_POST_STATUS',
          { ig_container_id: creationId, ig_user_id: igUserId },
          connection.connectedAccountId,
        );
        const statusData = statusResult.data || {};
        const statusCode = (statusData.status_code || statusData.status || '').toString().toUpperCase();

        if (statusCode === 'FINISHED' || statusCode === 'PUBLISHED') {
          mediaReady = true;
          break;
        }
        if (statusCode === 'ERROR') {
          return { success: false, error: `Instagram media processing failed: ${JSON.stringify(statusData)}` };
        }
        // IN_PROGRESS — keep waiting
      } catch {
        // Status check failed — still try publishing after the wait
        if (attempt >= 2) {
          mediaReady = true; // attempt publish anyway after enough waiting
          break;
        }
      }
    }

    if (!mediaReady) {
      // Last resort: try publishing anyway — sometimes status check isn't available
      // but the media is actually ready
    }

    // Step 5: Publish the container
    const publishResult = await executeComposioAction(
      'INSTAGRAM_CREATE_POST',
      {
        ig_user_id: igUserId,
        creation_id: creationId,
      },
      connection.connectedAccountId,
    );

    if (isSuccess(publishResult)) {
      const publishData = publishResult.data || {};
      const mediaId = publishData.id as string | undefined;
      return {
        success: true,
        postId: mediaId,
        postUrl: mediaId ? `https://instagram.com/p/${mediaId}` : undefined,
      };
    }

    // If publish failed, extract the error detail
    const pubErrData = publishResult.data || {};
    const pubErrMsg = (pubErrData.error as Record<string, unknown>)?.error_user_msg
      || (pubErrData.error as Record<string, unknown>)?.message
      || publishResult.error
      || 'Failed to publish Instagram post';
    return {
      success: false,
      error: `Failed to create post (status ${(pubErrData.error as Record<string, unknown>)?.code || 'unknown'}). Response: ${JSON.stringify(pubErrData.error || pubErrMsg)}`,
    };
  } catch (error) {
    return { success: false, error: `Instagram via Composio: ${error}` };
  }
}

// ----------------------------------------------------------------
// Unified poster
// ----------------------------------------------------------------

export async function postToPlatform(
  content: string,
  platform: Platform,
  agent: AgentConfig,
  imageUrl?: string,
): Promise<PostResult> {
  switch (platform) {
    case 'twitter':
      return postToTwitter(content, agent);
    case 'facebook':
      return postToFacebook(content, agent);
    case 'instagram':
      return postToInstagram(content, agent, imageUrl);
    default:
      return { success: false, error: `Unknown platform: ${platform}` };
  }
}
