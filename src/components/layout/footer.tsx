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
    <footer id="footer" className="bg-[#fdf6ec] py-20 text-[#006d77] relative overflow-hidden"
      style={{ backgroundColor: '#fdf6ec', color: '#006d77' }}>  {/* 30% cream background, main text teal */}

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#006d77]/30 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"
        style={{ backgroundColor: 'rgba(0, 109, 119, 0.3)' }}></div> {/* 60% teal accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#ff911d]/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"
        style={{ backgroundColor: 'rgba(255, 145, 29, 0.1)' }}></div> {/* 10% accent color */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand - Primary section with teal emphasis (part of 60%) */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[#006d77] rounded-lg"  // 60% teal
                style={{ backgroundColor: '#006d77' }}>
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-[#006d77] tracking-tighter" // 60% teal text
                style={{ color: '#006d77' }}>
                ShortTail<span className="text-[#ff911d]"  // 10% accent
                  style={{ color: '#ff911d' }}>.id</span>
              </span>
            </Link>
            <p className="text-[#006d77]/70 mb-6 max-w-xs"  // 60% teal with transparency
              style={{ color: 'rgba(0, 109, 119, 0.7)' }}>
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
                    className="text-[#006d77] hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: '#006d77' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff911d'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#006d77'}
                    title={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="h-6 w-6" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop - Secondary section with teal text (part of 60%) */}
          {showCategories && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#006d77]"  // 60% teal header
                style={{ color: '#006d77' }}>Shop</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/products" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    All Products
                  </Link>
                </li>
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                      style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support - Secondary section with teal text (part of 60%) */}
          {showSupport && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#006d77]"  // 60% teal header
                style={{ color: '#006d77' }}>Support</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/help" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal - Secondary section with teal text (part of 60%) */}
          {showLegal && (
            <div>
              <h3 className="font-bold text-xl mb-6 text-[#006d77]"  // 60% teal header
                style={{ color: '#006d77' }}>Legal</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-[#006d77]/80 hover:text-[#ff911d] transition-colors" // 60% teal, hover 10% accent
                    style={{ color: 'rgba(0, 109, 119, 0.8)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ff911d'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(0, 109, 119, 0.8)'}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer bottom section - 60% teal border and text */}
        <div className="border-t border-[#006d77]/20 mt-16 pt-8 text-center"
          style={{ borderTopColor: 'rgba(0, 109, 119, 0.2)' }}>
          <p className="text-[#006d77]/80"  // 60% teal with transparency
            style={{ color: 'rgba(0, 109, 119, 0.8)' }}>
            &copy; {new Date().getFullYear()} ShortTail.id. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}