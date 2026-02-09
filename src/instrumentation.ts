import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Instrumentation for Next.js 15+
 * 
 * This file initializes Sentry for error tracking and performance monitoring.
 * It runs in both Node.js and Edge runtime environments.
 * 
 * Required environment variable:
 * - SENTRY_DSN: Your Sentry Data Source Name
 * 
 * Optional environment variables:
 * - SENTRY_ENVIRONMENT: 'development', 'staging', 'production'
 * - SENTRY_RELEASE: Application version
 * - NEXT_PUBLIC_SENTRY_DSN: Public DSN for client-side error tracking
 */

/**
 * Register function for Node.js runtime
 * Called by Next.js 15+ instrumentation system
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dsn = process.env.SENTRY_DSN;
    
    if (!dsn) {
      console.warn('SENTRY_DSN not configured. Error tracking disabled.');
      return;
    }

    Sentry.init({
      dsn,
      
      // Environment configuration
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Error sampling
      sampleRate: 1.0,
      
      // Enable debug mode in development
      debug: process.env.NODE_ENV === 'development',
      
      // Before sending hooks for sanitization
      beforeSend(event) {
        // Remove sensitive data before sending to Sentry
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, string>;
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-api-key'];
        }
        
        // Sanitize user data
        if (event.user) {
          delete event.user.ip_address;
          delete event.user.email;
        }
        
        return event;
      },
      
      // Integrations
      integrations: [
        // HTTP integration for Node.js
        Sentry.httpIntegration({
          breadcrumbs: true,
        }),
        
        // Console integration for logging
        Sentry.consoleIntegration(),
        
        // Node fetch integration
        Sentry.nativeNodeFetchIntegration(),
      ],
      
      // Ignore specific errors
      ignoreErrors: [
        // Next.js specific
        'Hydration failed',
        'Text content does not match server-rendered HTML',
        'There was an error while hydrating',
        'Cancel rendering route',
        
        // Common browser extensions
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        
        // Network errors (handled separately)
        'Network Error',
        'Failed to fetch',
        'AbortError',
      ],
      
      // Deny URLs from specific sources
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log('Sentry initialized for Node.js runtime');
  }
  
  if (process.env.NEXT_RUNTIME === 'edge') {
    const dsn = process.env.SENTRY_DSN;
    
    if (!dsn) {
      console.warn('SENTRY_DSN not configured for Edge runtime. Error tracking disabled.');
      return;
    }

    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION,
      
      // Lower sample rate for edge functions
      tracesSampleRate: 0.1,
      sampleRate: 1.0,
      
      // Edge-specific configuration
      integrations: [],
    });

    console.log('Sentry initialized for Edge runtime');
  }
}

/**
 * On request error handler
 * Called by Next.js when a request errors
 */
export const onRequestError = Sentry.captureRequestError;