import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/kasir/', '/checkout/'],
      },
    ],
    sitemap: 'https://shorttail.id/sitemap.xml',
  };
}
