'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PawPrint, Loader2, Phone, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return '+' + cleaned;
};

const phoneToEmail = (phone: string): string => {
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
    
    const formattedPhone = formatPhoneNumber(data.phone);
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
        loginEmail = phoneToEmail(formattedPhone);
      }
    } catch {
      loginEmail = phoneToEmail(formattedPhone);
    }
    
    const { data: authData, error } = await signInWithEmail(loginEmail, data.password);
    
    if (error) {
      toast.error('Invalid phone number or password');
      setLoading(false);
      return;
    }

    if (authData?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', authData.user.id)
        .single();
      
      if (userProfile && !userProfile.is_approved) {
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
    <div className="w-full max-w-sm bg-white rounded-lg shadow-md border border-gray-200">
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {settings?.storeLogo ? (
            <div className="relative w-8 h-8 shrink-0">
              {settings.storeLogo.startsWith('data:') ? (
                <img
                  src={settings.storeLogo}
                  alt=""
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={settings.storeLogo}
                  alt=""
                  fill
                  className="object-contain"
                />
              )}
            </div>
          ) : (
            <div className="p-1 bg-primary/10 rounded shrink-0">
              <PawPrint className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">
              {settings?.storeName || 'ShortTail.id'}
            </h1>
            <p className="text-xs text-gray-500">Sign in to continue</p>
          </div>
        </div>
      </div>

      {/* Dense Form */}
      <div className="p-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-gray-700">Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="tel"
                        placeholder="08123456789"
                        className="h-8 pl-7 pr-2 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-gray-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••"
                        className="h-8 pl-7 pr-2 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            {/* Compact Actions */}
            <div className="pt-1 space-y-2">
              <Button 
                type="submit" 
                className="w-full h-8 text-sm" 
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-between text-xs">
                <Link 
                  href="/forgot-password" 
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
                <Link 
                  href="/register" 
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
