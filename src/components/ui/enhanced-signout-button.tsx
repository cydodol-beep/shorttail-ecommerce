'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { handlePostSignOutRedirect, handleSignOutSuccess, handleSignOutError } from '@/utils/signout-handler';

interface EnhancedSignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  confirmationMessage?: string;
  redirectPath?: string;
  useReplaceRedirect?: boolean;
  showLoadingSpinner?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successToastMessage?: string;
  errorToastMessage?: string;
  title?: string;
}

export function EnhancedSignOutButton({
  variant = 'ghost',
  size = 'default',
  className = '',
  children,
  onSuccess,
  onError,
  onFinally,
  confirmationMessage = 'Are you sure you want to sign out?',
  redirectPath = '/login',
  useReplaceRedirect = true,
  showLoadingSpinner = true,
  showSuccessToast = true,
  showErrorToast = true,
  successToastMessage = 'Successfully signed out',
  errorToastMessage = 'Failed to sign out. Please try again.',
}: EnhancedSignOutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    // Confirmation dialog
    if (confirmationMessage && !window.confirm(confirmationMessage)) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signOut();

      if (result.error) {
        throw result.error;
      }

      handleSignOutSuccess(showSuccessToast, successToastMessage);

      // Execute success callback
      onSuccess?.();

      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 150));

      // Redirect to login page
      if (typeof window !== 'undefined') {
        // Use router.push for Next.js pages or window.location for full redirect
        if (useReplaceRedirect) {
          window.location.replace(redirectPath);
        } else {
          router.push(redirectPath);
          router.refresh(); // Refresh to clear any cached state
        }
      }

    } catch (error: any) {
      handleSignOutError(error, showErrorToast, errorToastMessage);

      // Execute error callback
      onError?.(error);
    } finally {
      setIsLoading(false);

      // Execute finally callback
      onFinally?.();
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
      title={title}
    >
      {isLoading && showLoadingSpinner ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          {children || (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </>
          )}
        </>
      )}
    </Button>
  );
}