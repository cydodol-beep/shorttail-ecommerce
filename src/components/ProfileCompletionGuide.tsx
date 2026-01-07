'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, MapPin, Truck, Gift } from 'lucide-react';

export function ProfileCompletionGuide() {
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user || !profile) return;

    // Don't show on settings page to avoid annoyance while editing
    if (pathname?.includes('/dashboard/settings')) {
      setOpen(false);
      return;
    }

    // Check for missing critical information
    const missingInfo = [
      !profile.user_name,
      !profile.user_phoneno,
      !profile.address_line1,
      !profile.city,
      !profile.province_id,
      !profile.postal_code,
    ];

    const hasMissingInfo = missingInfo.some(Boolean);
    
    // Check if we've already shown it this session (optional, but good UX)
    // For now, adhering to "must fill" logic, we show it if info is missing.
    // We can allow them to close it, but it will reappear on refresh/navigation if we are strict.
    // Let's make it open if info is missing.
    
    if (hasMissingInfo) {
      // Small delay to ensure not clashing with other mounting effects
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setOpen(false);
    }
  }, [user, profile, loading, pathname]);

  const handleCompleteProfile = () => {
    setOpen(false);
    router.push('/dashboard/settings');
  };

  const handleRemindLater = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Hi {profile?.user_email?.split('@')[0] || 'there'}! It looks like your profile is incomplete. 
            Fill in your details now to unlock the full ShortTail experience!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
            <div className="bg-primary/10 p-2 rounded-full">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Faster Checkout</h4>
              <p className="text-xs text-muted-foreground">Auto-fill shipping for instant orders.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
            <div className="bg-primary/10 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Accurate Shipping</h4>
              <p className="text-xs text-muted-foreground">Get precise delivery rates to your location.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
            <div className="bg-primary/10 p-2 rounded-full">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Member Rewards</h4>
              <p className="text-xs text-muted-foreground">Unlock points and exclusive tier benefits.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleCompleteProfile} className="w-full" size="lg">
            Complete My Profile Now
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleRemindLater} 
            className="w-full text-muted-foreground text-xs"
          >
            I'll do it later (features may be limited)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
