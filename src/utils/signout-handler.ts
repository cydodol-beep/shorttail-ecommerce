/**
 * Utility functions for handling sign out operations
 */

import { toast } from 'sonner';

/**
 * Handles post-signout operations like redirecting the user
 * @param redirectPath Path to redirect after signout (defaults to /login)
 * @param useReplace Whether to use window.location.replace instead of window.location.href (defaults to true)
 */
export const handlePostSignOutRedirect = (redirectPath: string = '/login', useReplace: boolean = true) => {
  if (typeof window !== 'undefined') {
    if (useReplace) {
      window.location.replace(redirectPath);
    } else {
      window.location.href = redirectPath;
    }
  }
};

/**
 * Handles sign out success with optional toast notification
 * @param showSuccessToast Whether to show a success toast notification
 * @param successMessage Custom success message
 */
export const handleSignOutSuccess = (showSuccessToast: boolean = true, successMessage: string = 'Successfully signed out') => {
  if (showSuccessToast) {
    toast.success(successMessage);
  }
};

/**
 * Handles sign out error with optional toast notification
 * @param error The error that occurred during sign out
 * @param showErrorToast Whether to show an error toast notification
 * @param errorMessage Custom error message
 */
export const handleSignOutError = (error: any, showErrorToast: boolean = true, errorMessage: string = 'Failed to sign out. Please try again.') => {
  console.error('Sign out failed:', error);
  
  if (showErrorToast) {
    toast.error(errorMessage);
  }
};