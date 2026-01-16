/**
 * AISim Tracking API
 * Handles all event tracking and analytics for the flash-ui frontend
 */

// Configuration - Update with your n8n webhook URLs
const N8N_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-server.com/webhook';

// Session management
let sessionId: string | null = null;
let fingerprint: string | null = null;

/**
 * Generate a browser fingerprint for session tracking
 */
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 'unknown',
  ];

  const data = components.join('|');
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

/**
 * Initialize tracking session
 */
export async function initTracking(): Promise<{ sessionId: string; fingerprint: string }> {
  if (sessionId && fingerprint) {
    return { sessionId, fingerprint };
  }

  fingerprint = await generateFingerprint();

  // Check localStorage for existing session
  const storedSession = localStorage.getItem('aisim_session');
  if (storedSession) {
    try {
      const parsed = JSON.parse(storedSession);
      // Session valid for 24 hours
      if (parsed.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
        sessionId = parsed.sessionId;
        return { sessionId, fingerprint };
      }
    } catch (e) {
      // Invalid stored session
    }
  }

  // Create new session
  sessionId = crypto.randomUUID();
  localStorage.setItem('aisim_session', JSON.stringify({
    sessionId,
    timestamp: Date.now()
  }));

  return { sessionId, fingerprint };
}

/**
 * Get UTM parameters from URL
 */
function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || ''
  };
}

/**
 * Track generated asset
 */
export async function trackAsset(data: {
  prompt: string;
  styleName: string;
  htmlContent: string;
  generationTimeMs: number;
  modelUsed?: string;
}): Promise<{ assetId: string; sessionId: string } | null> {
  // If N8N URL is not configured, return null silently
  if (!N8N_BASE_URL || N8N_BASE_URL.includes('your-n8n-server.com')) {
    return null;
  }

  try {
    const { sessionId: sid, fingerprint: fp } = await initTracking();
    const utm = getUTMParams();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${N8N_BASE_URL}/aisim/track-asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        fingerprint: fp,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        ...utm,
        ...data
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return result;
    }
    return null;
  } catch (error) {
    // Silently fail - tracking should never break the app
    return null;
  }
}

/**
 * Track user interaction
 */
export async function trackInteraction(data: {
  assetId: string;
  type: 'view' | 'click' | 'hover' | 'copy' | 'download' | 'share' | 'favorite' | 'request_build';
  data?: Record<string, any>;
}): Promise<void> {
  // If N8N URL is not configured, return silently
  if (!N8N_BASE_URL || N8N_BASE_URL.includes('your-n8n-server.com')) {
    return;
  }

  try {
    const { sessionId: sid } = await initTracking();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(`${N8N_BASE_URL}/aisim/track-interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        assetId: data.assetId,
        type: data.type,
        data: data.data || {},
        pageUrl: window.location.href,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (error) {
    // Silently fail - tracking should never break the app
  }
}

/**
 * AI Chat for lead capture
 */
export async function sendChatMessage(data: {
  assetId: string;
  message: string;
  leadId?: string;
  email?: string;
  name?: string;
}): Promise<{
  success: boolean;
  leadId?: string;
  message?: string;
  checkoutUrl?: string;
} | null> {
  try {
    const { sessionId: sid } = await initTracking();

    const response = await fetch(`${N8N_BASE_URL}/aisim/lead-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        ...data
      })
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to send chat message:', error);
    return null;
  }
}

/**
 * Create Stripe checkout session
 */
export async function createCheckout(leadId: string, assetId: string): Promise<string | null> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/aisim/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, assetId })
    });

    if (response.ok) {
      const result = await response.json();
      return result.checkoutUrl;
    }
    return null;
  } catch (error) {
    console.error('Failed to create checkout:', error);
    return null;
  }
}

/**
 * Analytics helpers
 */
export const Analytics = {
  // Track page view
  pageView: async () => {
    await initTracking();
    // Can be extended to send to analytics service
  },

  // Track event
  event: async (name: string, properties?: Record<string, any>) => {
    const { sessionId: sid } = await initTracking();
    console.log(`[Analytics] ${name}`, { sessionId: sid, ...properties });
    // Can be extended to send to analytics service
  }
};

// Auto-initialize on import (non-blocking)
if (typeof window !== 'undefined') {
  initTracking().catch(() => {
    // Silently fail - tracking is optional
  });
}
