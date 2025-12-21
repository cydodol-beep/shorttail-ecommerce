'use client';

import Link from 'next/link';
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
    <footer id="footer" className="bg-cream py-20 text-teal relative overflow-hidden">
      {/* Decorative Element */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-teal rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-teal tracking-tighter">
                ShortTail<span className="text-accent">.id</span>
              </span>
            </Link>
            <p className="text-teal/70 mb-6 max-w-xs">
              Premium pet supplies for happy, healthy Anabul. Quality products, fast delivery, and expert care advice.
            </p>
            {showSocialLinks && socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:text-accent transition-colors"
                    title={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="h-6 w-6" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          {showCategories && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-teal">Shop</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/products" className="text-teal/80 hover:text-accent transition-colors">
                    All Products
                  </Link>
                </li>
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-teal/80 hover:text-accent transition-colors"
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
              <h3 className="font-bold text-xl mb-6 text-teal">Support</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/help" className="text-teal/80 hover:text-accent transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-teal/80 hover:text-accent transition-colors">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-teal/80 hover:text-accent transition-colors">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-teal/80 hover:text-accent transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal */}
          {showLegal && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-teal">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-teal/80 hover:text-accent transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-teal/80 hover:text-accent transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-teal/80 hover:text-accent transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-teal/20 mt-16 pt-8 text-center">
          <p className="text-teal/80">
            &copy; {new Date().getFullYear()} ShortTail.id. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}