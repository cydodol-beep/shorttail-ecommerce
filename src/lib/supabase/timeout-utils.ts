/**
 * Utility for adding timeout protection to Supabase queries
 * Prevents TimeoutError and AbortError issues
 */

export interface TimeoutConfig {
  timeout?: number; // Timeout in milliseconds (default: 10000)
  onTimeout?: () => void; // Optional callback when timeout occurs
}

/**
 * Creates an AbortController with automatic timeout
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms = 10 seconds)
 * @returns Object with abortController and cleanup function
 */
export function createQueryTimeout(timeoutMs: number = 10000) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
  
  const cleanup = () => clearTimeout(timeoutId);
  
  return { abortController, cleanup };
}

/**
 * Wrapper for Supabase query with automatic timeout and error handling
 * @param queryFn - Function that returns a Supabase query
 * @param config - Timeout configuration
 * @returns Query result or null on timeout
 */
export async function withTimeout<T>(
  queryFn: (signal: AbortSignal) => Promise<{ data: T | null; error: any }>,
  config: TimeoutConfig = {}
): Promise<{ data: T | null; error: any }> {
  const { timeout = 10000, onTimeout } = config;
  const { abortController, cleanup } = createQueryTimeout(timeout);
  
  try {
    const result = await queryFn(abortController.signal);
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    
    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Supabase Timeout] Query timed out after', timeout, 'ms');
      onTimeout?.();
      return { data: null, error: { message: 'Query timed out', code: 'TIMEOUT' } };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: any): boolean {
  return error?.code === 'TIMEOUT' || error?.message?.includes('timed out');
}
