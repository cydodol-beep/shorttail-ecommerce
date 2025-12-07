'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { useLandingSections } from '@/hooks/use-landing-sections';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings } = useStoreSettings();
  
  const { getSectionSettings } = useLandingSections();
  const sectionSettings = getSectionSettings('newsletter', {
    title: 'Subscribe to Our Newsletter',
    subtitle: 'Get the latest updates on new products, exclusive offers, and pet care tips delivered to your inbox.',
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    
    // Simulate subscription (in real app, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubscribed(true);
    setLoading(false);
    toast.success('Thank you for subscribing!');
  };

  return (
    <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>

          {/* Content */}
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {sectionSettings.title}
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            {sectionSettings.subtitle}
          </p>

          {/* Form */}
          {subscribed ? (
            <div className="flex items-center justify-center gap-3 text-white">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-medium">Thank you for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
              />
              <Button 
                type="submit" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Subscribing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Subscribe
                    <Send className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Trust Text */}
          <p className="text-white/60 text-sm mt-6">
            By subscribing, you agree to receive marketing emails from {settings?.storeName || 'us'}. 
            Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
