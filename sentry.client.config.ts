import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for browser-side error tracking.
 * It captures errors in the React application, including unhandled exceptions
 * and React component errors.
 * 
 * Required environment variable:
 * - NEXT_PUBLIC_SENTRY_DSN: Public Sentry DSN for client-side tracking
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    
    // Environment and release
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Session replay configuration
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Error sampling
    sampleRate: 1.0,
    
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Integrations
    integrations: [
      // Session replay for debugging user interactions
      Sentry.replayIntegration({
        // Additional replay configuration
        maskAllText: false,
        blockAllMedia: false,
      }),
      
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      
      // Breadcrumbs for console, fetch, etc.
      Sentry.breadcrumbsIntegration(),
      
      // Global handlers for unhandled errors
      Sentry.globalHandlersIntegration({
        onerror: true,
        onunhandledrejection: true,
      }),
    ],
    
    // Before send for data sanitization
    beforeSend(event) {
      // Remove sensitive information
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        delete headers['authorization'];
        delete headers['x-api-key'];
      }
      
      // Sanitize user data
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      
      return event;
    },
    
    // Ignore common non-actionable errors
    ignoreErrors: [
      // React specific
      'Hydration failed',
      'Text content does not match server-rendered HTML',
      'There was an error while hydrating',
      
      // Browser extension errors
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'webkit-masked-url:',
      
      // Network errors (handled by app)
      'Network Error',
      'Failed to fetch',
      'AbortError',
      'Network request failed',
      
      // Third-party script errors
      /ResizeObserver loop limit exceeded/i,
      /Script error\./i,
    ],
    
    // Deny URLs from specific sources
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
      
      // Social media widgets
      /connect\.facebook\.net/i,
      /platform\.twitter\.com/i,
      /static\.xx\.fbcdn\.net/i,
    ],
    
    // Tag events for better filtering
    initialScope: {
      tags: {
        app: 'shorttail-id',
        platform: 'web',
      },
    },
  });
} else {
  console.warn('NEXT_PUBLIC_SENTRY_DSN not configured. Client-side error tracking disabled.');
}