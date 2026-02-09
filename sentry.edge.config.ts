import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for Next.js Edge runtime.
 * Edge runtime runs on Vercel Edge Functions and uses a different
 * initialization than Node.js runtime.
 * 
 * Required environment variable:
 * - SENTRY_DSN: Sentry Data Source Name
 */

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    
    // Environment and release
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Lower sample rate for edge functions to manage costs
    tracesSampleRate: 0.1,
    
    // Error sampling
    sampleRate: 1.0,
    
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Before send for data sanitization
    beforeSend(event) {
      // Remove sensitive information
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        delete headers['authorization'];
        delete headers['cookie'];
        delete headers['x-api-key'];
      }
      
      return event;
    },
    
    // Ignore common non-actionable errors
    ignoreErrors: [
      'Network Error',
      'Failed to fetch',
      'AbortError',
    ],
  });
} else {
  console.warn('SENTRY_DSN not configured for Edge runtime. Error tracking disabled.');
}