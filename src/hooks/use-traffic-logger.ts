import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useTrafficLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Combine pathname and search parameters to get full URL
    const fullPath = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const fullUrl = window.location.origin + fullPath;

    // Log page view to analytics
    const logVisit = async () => {
      try {
        // Get geolocation data (optional, only if user consents)
        // This is just sample data - you might want to use a geolocation service
        const geoData = {
          country: navigator.language.split('-')[1] || '',
          city: '', // Could implement geolocation lookup
          latitude: null,
          longitude: null
        };

        const response = await fetch('/api/analytics/traffic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageUrl: fullUrl,
            referrer: document.referrer,
            ...geoData
          }),
        });

        if (!response.ok) {
          console.error('Failed to log traffic:', response.statusText);
        }
      } catch (error) {
        console.error('Error logging traffic:', error);
      }
    };

    // Add a small delay to ensure all page elements are loaded
    const timer = setTimeout(logVisit, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);
}