'use client';

import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  MessageCircle,
  Send,
  type LucideIcon,
} from 'lucide-react';

interface SocialIconProps {
  icon: string;
  className?: string;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v8" />
      <path d="M8.5 10.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5c0 2.5-2 4-3.5 6.5" />
    </svg>
  );
}

const iconMap: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  whatsapp: MessageCircle,
  telegram: Send,
};

export function SocialIcon({ icon, className = 'h-5 w-5' }: SocialIconProps) {
  const iconKey = icon.toLowerCase();
  
  if (iconKey === 'tiktok') {
    return <TikTokIcon className={className} />;
  }
  
  if (iconKey === 'pinterest') {
    return <PinterestIcon className={className} />;
  }
  
  const IconComponent = iconMap[iconKey] || MessageCircle;
  return <IconComponent className={className} />;
}
