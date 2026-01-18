import { createBrowserClient } from '@supabase/ssr';

// Singleton instance to prevent memory leaks from creating multiple clients
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Use SSR-compatible browser client for proper cookie handling
// Returns a singleton instance to prevent memory accumulation
export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Auto-refresh tokens to prevent session expiration
          autoRefreshToken: true,
          // Persist session in storage
          persistSession: true,
          // Detect session from URL (for magic links, etc.)
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'Content-Type': 'application/json',
          },
          // Configure fetch options with increased timeout
          fetch: (url, options = {}) => {
            // Set timeout explicitly in fetch options
            // Increased to 45 seconds for better resilience on slow connections
            return fetch(url, {
              ...options,
              signal: options.signal || AbortSignal.timeout(45000), // 45 seconds timeout
            });
          },
        },
      }
    );
  }
  return supabaseClient;
}
