'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get type parameter from URL
    const type = searchParams.get('type');

    // If this is a recovery request, we need to ensure that session is established
    if (type === 'recovery') {
      // Listen for auth state changes to detect when the session is established
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session) => {
        console.log('Auth state change event:', event, 'session exists:', !!session);
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          if (session) {
            console.log('Session established via auth state change, showing password reset form');
            setIsTokenValid(true);
          }
        }
      });

      // Also check the current session
      const checkCurrentSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Current session exists, showing password reset form');
          setIsTokenValid(true);
        }
      };

      checkCurrentSession();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } else {
      // If not a recovery request, check if there's a valid session
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // If user is already logged in, redirect to dashboard
          router.push('/dashboard');
        } else {
          // If not logged in and not a recovery request, redirect to login
          router.push('/login');
        }
      };

      checkSession();
    }
  }, [searchParams, router]);

  const form = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    setLoading(true);

    try {
      const supabase = createClient();

      // For password reset, the session should be automatically established when the user clicks the reset link
      // If we get an Auth session missing error, it might be because the session establishment is delayed
      // In this case, we should try to ensure the session is established before updating the password
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        throw new Error(error.message || 'Failed to update password');
      }

      toast.success('Password updated successfully!');

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until we know the token status
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Checking token validity...</p>
      </div>
    );
  }

  // If token is not valid for password recovery, show error
  if (isTokenValid !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>
              Invalid or expired password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-brown-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-brown-900">Update Password</CardTitle>
        <CardDescription className="text-brown-600">
          Enter your new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                className="pl-10"
                value={form.watch('password')}
                onChange={(e) => form.setValue('password', e.target.value)}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={form.watch('confirmPassword')}
              onChange={(e) => form.setValue('confirmPassword', e.target.value)}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}