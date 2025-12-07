'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PawPrint, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useStoreSettings } from '@/hooks/use-store-settings';
import Image from 'next/image';

const loginSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Invalid Indonesian phone number format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

// Helper to format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return '+' + cleaned;
};

// Convert phone to email-like format for Supabase auth (workaround)
const phoneToEmail = (phone: string): string => {
  // Remove + and use phone as email: +628123456789 -> 628123456789@phone.local
  const cleanPhone = phone.replace(/^\+/, '');
  return `${cleanPhone}@phone.local`;
};

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const { settings } = useStoreSettings();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Format phone to E.164 format
    const formattedPhone = formatPhoneNumber(data.phone);
    
    // Look up the auth email by phone number (handles both old and new registration systems)
    let loginEmail: string;
    
    try {
      const lookupRes = await fetch('/api/auth/lookup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const lookupData = await lookupRes.json();
      
      if (lookupData.email) {
        loginEmail = lookupData.email;
      } else {
        // Fallback to phone-to-email format (new registration system)
        loginEmail = phoneToEmail(formattedPhone);
      }
    } catch {
      // Fallback to phone-to-email format
      loginEmail = phoneToEmail(formattedPhone);
    }
    
    const { data: authData, error } = await signInWithEmail(loginEmail, data.password);
    
    if (error) {
      toast.error('Invalid phone number or password');
      setLoading(false);
      return;
    }

    // Check if user is approved
    if (authData?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', authData.user.id)
        .single();
      
      if (userProfile && !userProfile.is_approved) {
        // Sign out the user and show error
        await supabase.auth.signOut();
        toast.error('Your account is pending approval. Please wait for admin approval.');
        setLoading(false);
        return;
      }
    }

    toast.success('Login successful!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Card className="border-brown-200 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {settings?.storeLogo ? (
            <div className="relative w-32 h-20">
              {settings.storeLogo.startsWith('data:') ? (
                <img
                  src={settings.storeLogo}
                  alt={settings.storeName || 'Store Logo'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={settings.storeLogo}
                  alt={settings.storeName || 'Store Logo'}
                  fill
                  className="object-contain"
                />
              )}
            </div>
          ) : (
            <div className="p-3 bg-primary/10 rounded-full">
              <PawPrint className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold text-brown-900">Welcome Back</CardTitle>
        <CardDescription className="text-brown-600">
          Sign in to {settings?.storeName || 'ShortTail.id'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="08123456789"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Format: 08xx or +62xx</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
