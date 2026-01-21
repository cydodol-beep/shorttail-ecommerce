'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Phone, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+62|62|0)[0-9]{9,13}$/, 'Invalid Indonesian phone number format'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const formatPhoneNumberForEmail = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

const formatPhoneNumberDisplay = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
};

interface ContactAdminData {
  userName: string | null;
  userPhone: string;
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showContactAdminDialog, setShowContactAdminDialog] = useState(false);
  const [contactAdminData, setContactAdminData] = useState<ContactAdminData | null>(null);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumberForEmail(data.phone);

      console.log('=== CLIENT FORGOT PASSWORD ===');
      console.log('Form phone input:', data.phone);
      console.log('Formatted phone (sent to API):', formattedPhone);
      console.log('Form data being sent:', JSON.stringify({ phone: formattedPhone }));

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsContactAdmin) {
          setContactAdminData({
            userName: result.userName,
            userPhone: formatPhoneNumberDisplay(result.userPhone)
          });
          setShowContactAdminDialog(true);
        } else {
          toast.error(result.error || 'Failed to send password reset link');
        }
      } else {
        toast.success(result.message || 'Password reset link sent successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    if (!contactAdminData) return;

    const { userName, userPhone } = contactAdminData;
    const adminEmail = 'shorttail.id@gmail.com';
    
    const subject = encodeURIComponent(`Password Reset Request - ${userName || 'Account'}`);
    const body = encodeURIComponent(
`Dear Admin,

I need assistance resetting my password. My account details are:

Name: ${userName || 'Not provided'}
Phone Number: ${userPhone}

Please help me reset my password or provide further instructions.

Thank you,
${userName || 'User'}`
    );

    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
    setShowContactAdminDialog(false);
  };

  return (
    <>
      <Card className="border-brown-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brown-900">Reset Password</CardTitle>
          <CardDescription className="text-brown-600">
            Enter your phone number and we'll send you a link to reset your password
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>

      <AlertDialog open={showContactAdminDialog} onOpenChange={setShowContactAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Contact Administrator</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2">
              <p>
                {contactAdminData?.userName 
                  ? 'Your account does not have a valid email address associated with it.'
                  : 'We could not find an account with this phone number in our system.'}
              </p>
              <p>
                Please contact our administrator for assistance with password reset.
              </p>
              {contactAdminData && (
                <div className="bg-muted p-3 rounded-md mt-3 space-y-1">
                  <p className="text-sm"><strong>Name:</strong> {contactAdminData.userName || 'Not found'}</p>
                  <p className="text-sm"><strong>Phone:</strong> {contactAdminData.userPhone}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleContactAdmin} className="gap-2">
              <Mail className="h-4 w-4" />
              Contact Admin via Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
