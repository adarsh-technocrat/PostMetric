/**
 * Sanitize website object(s) before sending to frontend
 * Removes sensitive API keys and adds connection status flags
 */

export function sanitizeWebsiteForFrontend(website: any) {
  if (!website) return null;

  const sanitized = { ...(website.toObject ? website.toObject() : website) };

  // Check if Stripe is connected (without exposing the key)
  const isStripeConnected = !!sanitized.paymentProviders?.stripe?.apiKey;

  // Remove sensitive API keys from paymentProviders
  if (sanitized.paymentProviders) {
    sanitized.paymentProviders = { ...sanitized.paymentProviders };

    if (sanitized.paymentProviders.stripe) {
      sanitized.paymentProviders.stripe = {
        ...sanitized.paymentProviders.stripe,
        // Remove the actual API key, keep only connection status
        apiKey: undefined,
        // Keep webhookSecret if needed for backend operations, but don't expose it
        webhookSecret: sanitized.paymentProviders.stripe.webhookSecret
          ? "***"
          : undefined,
      };
    }
  }

  // Add connection status flag
  sanitized.paymentProviders = {
    ...sanitized.paymentProviders,
    stripe: {
      ...sanitized.paymentProviders?.stripe,
      connected: isStripeConnected,
    },
  };

  return sanitized;
}

export function sanitizeWebsitesForFrontend(websites: any[]) {
  if (!websites || !Array.isArray(websites)) return [];
  return websites.map(sanitizeWebsiteForFrontend).filter(Boolean);
}
