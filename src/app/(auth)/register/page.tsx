'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Invalid Indonesian phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');
  useAuth();
  const { settings } = useStoreSettings();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    
    // Format phone to E.164 format
    const formattedPhone = formatPhoneNumber(data.phone);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          password: data.password,
          full_name: data.name,
          email: data.email || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Registration failed');
        setLoading(false);
        return;
      }

      toast.success('Registration successful! Please wait for admin approval before logging in.');
      router.push('/login');
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Registration failed. Please try again.');
      setLoading(false);
    }
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
        <CardTitle className="text-2xl font-bold text-brown-900">Create Account</CardTitle>
        <CardDescription className="text-brown-600">
          Join the {settings?.storeName || 'ShortTail.id'} family
          {referralCode && (
            <span className="block mt-1 text-primary">
              Referred by: {referralCode}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
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
                  <p className="text-xs text-muted-foreground">Format: 08xx or +62xx (used for login)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">For order notifications</p>
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
                      placeholder="Create a password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Card className="border-brown-200 shadow-lg">
        <CardContent className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    }>
      <RegisterForm />
    </Suspense>
  );
}
