/**
 * Enhanced Supabase utilities with retry logic and better timeout handling
 * Solves timeout issues by implementing exponential backoff and retry mechanisms
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

export interface TimeoutOptions {
  timeoutMs?: number;
  skipTimeout?: boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

const DEFAULT_TIMEOUT_MS = 45000; // 45 seconds - more forgiving

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      return timeoutId;
    }),
  ]);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 10000;
  const shouldRetry = options.shouldRetry;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }

      const shouldRetryOp = shouldRetry || isRetryableError(lastError);
      if (!shouldRetryOp) {
        console.error(`Non-retryable error on attempt ${attempt}:`, lastError);
        throw lastError;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function createAbortController(timeoutMs: number = DEFAULT_TIMEOUT_MS): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }, retryOptions);
}

export function getSupabaseFetchOptions(
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): RequestInit {
  return {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export { DEFAULT_TIMEOUT_MS };

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || String(error).toLowerCase();
  
  return (
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('timeout')
  );
}

export function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

export function handleOperationError<T = any>(
  error: any,
  operation: string,
  fallback?: T
): T {
  const message = getErrorMessage(error);
  console.error(`[${operation}] Error:`, error);
  
  return (fallback || null) as T;
}

export class TimeoutError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export function isTimeoutError(error: any): boolean {
  return error instanceof TimeoutError || 
         (error instanceof Error && error.name === 'AbortError') ||
         getErrorMessage(error).toLowerCase().includes('timed out');
}
