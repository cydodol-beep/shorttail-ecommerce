import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shorttail.id'),
  title: {
    default: 'ShortTail.id - Premium Pet Shop Indonesia | Food, Toys & Accessories',
    template: '%s | ShortTail.id'
  },
  description: 'Indonesia\'s leading online pet shop. Shop premium pet food, toys, accessories, and healthcare products for dogs, cats, and small pets. Fast delivery, trusted quality, best prices.',
  keywords: ['pet shop', 'toko hewan', 'pet food', 'dog food', 'cat food', 'pet accessories', 'pet toys', 'Indonesia pet shop', 'online pet store'],
  authors: [{ name: 'ShortTail.id' }],
  creator: 'ShortTail.id',
  publisher: 'ShortTail.id',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://shorttail.id',
    siteName: 'ShortTail.id',
    title: 'ShortTail.id - Premium Pet Shop Indonesia',
    description: 'Shop premium pet food, toys, accessories, and healthcare products. Fast delivery, trusted quality, best prices for your beloved pets.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'ShortTail.id Pet Shop',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShortTail.id - Premium Pet Shop Indonesia',
    description: 'Shop premium pet food, toys, accessories for dogs, cats & small pets. Fast delivery across Indonesia.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://shorttail.id" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
