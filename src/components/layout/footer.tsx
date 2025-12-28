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
    <footer id="footer" className="bg-[#006d77] py-20 text-[#fdf6ec] relative overflow-hidden"
      style={{ backgroundColor: '#006d77', color: '#fdf6ec' }}>  {/* 60% teal background, main text cream */}

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#fdf6ec]/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"
        style={{ backgroundColor: 'rgba(253, 246, 236, 0.2)' }}></div> {/* 30% cream accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#ff911d]/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"
        style={{ backgroundColor: 'rgba(255, 145, 29, 0.1)' }}></div> {/* 10% accent color */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand - Primary section with teal emphasis (part of 60%) */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[#ff911d] rounded-lg"  // 10% accent for icon background
                style={{ backgroundColor: '#ff911d' }}>
                <PawPrint className="h-6 w-6 text-[#fdf6ec]" />  // 30% cream for icon
              </div>
              <span className="font-bold text-2xl text-[#fdf6ec] tracking-tighter" // 30% cream text
                style={{ color: '#fdf6ec' }}>
                ShortTail<span className="text-[#ff911d]"  // 10% accent
                  style={{ color: '#ff911d' }}>.id</span>
              </span>
            </Link>
            <p className="text-[#fdf6ec]/70 mb-6 max-w-xs"  // 30% cream with transparency
              style={{ color: 'rgba(253, 246, 236, 0.7)' }}>
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
                    className="text-[#fdf6ec] hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: '#fdf6ec' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff911d'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#fdf6ec'}
                    title={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="h-6 w-6" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop - Secondary section with cream text (part of 30%) */}
          {showCategories && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#fdf6ec]"  // 30% cream header
                style={{ color: '#fdf6ec' }}>Shop</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/products"
                    className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    All Products
                  </Link>
                </li>
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                      style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                      onClick={() => {}}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support - Secondary section with cream text (part of 30%) */}
          {showSupport && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#fdf6ec]"  // 30% cream header
                style={{ color: '#fdf6ec' }}>Support</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/help" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal - Secondary section with cream text (part of 30%) */}
          {showLegal && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#fdf6ec]"  // 30% cream header
                style={{ color: '#fdf6ec' }}>Legal</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-[#fdf6ec]/80 hover:text-[#ff911d] transition-colors" // 30% cream, hover 10% accent
                    style={{ color: 'rgba(253, 246, 236, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(253, 246, 236, 0.8)'}
                    onClick={() => {}}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer bottom section - with complementary accent elements */}
        <div className="border-t border-[#ff911d]/30 mt-16 pt-8 text-center"
          style={{ borderTopColor: 'rgba(255, 145, 29, 0.3)' }}>
          <p className="text-[#fdf6ec]/80"  // 30% cream with transparency
            style={{ color: 'rgba(253, 246, 236, 0.8)' }}>
            &copy; {new Date().getFullYear()} ShortTail.id. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}