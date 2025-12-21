'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PawPrint } from 'lucide-react';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { useCategories } from '@/hooks/use-categories';
import { useSocialMedia } from '@/hooks/use-social-media';
import { SocialIcon } from '@/components/ui/social-icon';
import { useLandingSections } from '@/hooks/use-landing-sections';

export function Footer() {
  const { settings: storeSettings } = useStoreSettings();
  const { getActiveCategories } = useCategories();
  const { getActiveLinks } = useSocialMedia();
  const { getSectionSettings } = useLandingSections();
  const categories = getActiveCategories();
  const socialLinks = getActiveLinks();
  
  const footerSettings = getSectionSettings('footer', {
    showSocialLinks: true,
    showCategories: true,
    showSupport: true,
    showLegal: true,
  });
  const showSocialLinks = footerSettings.showSocialLinks;
  const showCategories = footerSettings.showCategories;
  const showSupport = footerSettings.showSupport;
  const showLegal = footerSettings.showLegal;

  return (
    <footer className="border-t border-brown-200 bg-gradient-to-b from-brown-50 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {storeSettings?.storeLogo ? (
                <div className="relative w-10 h-10">
                  {storeSettings.storeLogo.startsWith('data:') ? (
                    <img
                      src={storeSettings.storeLogo}
                      alt={storeSettings.storeName || 'Store Logo'}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Image
                      src={storeSettings.storeLogo}
                      alt={storeSettings.storeName || 'Store Logo'}
                      fill
                      className="object-contain rounded-lg"
                    />
                  )}
                </div>
              ) : (
                <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <span className="font-bold text-xl text-brown-900 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {storeSettings?.storeName || 'ShortTail.id'}
              </span>
            </Link>
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex gap-4 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brown-600 hover:text-primary transition-colors p-2 rounded-full hover:bg-brown-100"
                    title={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          {showCategories && (
            <div>
              <h3 className="font-semibold text-lg text-brown-900 mb-4">Shop</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    All Products
                  </Link>
                </li>
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support */}
          {showSupport && (
            <div>
              <h3 className="font-semibold text-lg text-brown-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal */}
          {showLegal && (
            <div>
              <h3 className="font-semibold text-lg text-brown-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-brown-600 hover:text-primary transition-colors block p-1 rounded-md hover:bg-brown-100">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-brown-200 mt-8 pt-8 text-center">
          <p className="text-sm text-brown-600">
            &copy; {new Date().getFullYear()} ShortTail.id. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
