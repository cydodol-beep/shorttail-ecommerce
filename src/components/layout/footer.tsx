'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PawPrint } from 'lucide-react';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { useCategories } from '@/hooks/use-categories';
import { useSocialMedia } from '@/hooks/use-social-media';
import { SocialIcon } from '@/components/ui/social-icon';

export function Footer() {
  const { settings: storeSettings } = useStoreSettings();
  const { getActiveCategories } = useCategories();
  const { getActiveLinks } = useSocialMedia();
  const categories = getActiveCategories();
  const socialLinks = getActiveLinks();

  return (
    <footer className="border-t border-brown-200 bg-brown-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {storeSettings?.storeLogo ? (
                <div className="relative w-8 h-8">
                  {storeSettings.storeLogo.startsWith('data:') ? (
                    <img
                      src={storeSettings.storeLogo}
                      alt={storeSettings.storeName || 'Store Logo'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={storeSettings.storeLogo}
                      alt={storeSettings.storeName || 'Store Logo'}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="p-1.5 bg-primary rounded-lg">
                  <PawPrint className="h-6 w-6 text-white" />
                </div>
              )}
              <span className="font-bold text-xl text-brown-900">{storeSettings?.storeName || 'ShortTail.id'}</span>
            </Link>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brown-500 hover:text-primary transition-colors"
                    title={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-brown-900 mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-brown-600 hover:text-primary">
                  All Products
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/products?category=${cat.slug}`} 
                    className="text-sm text-brown-600 hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-brown-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-brown-600 hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-brown-600 hover:text-primary">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-brown-600 hover:text-primary">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-brown-600 hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-brown-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-brown-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-brown-600 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-brown-600 hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
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
