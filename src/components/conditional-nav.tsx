'use client';

import { usePathname } from 'next/navigation';
import { MainNav } from '@/components/main-nav';

export function ConditionalNav() {
  const pathname = usePathname();
  
  // Don't render MainNav for webinar pages (pattern: /username/templateId)
  // This pattern matches exactly two segments after the root
  if (pathname && pathname !== '/' && pathname.split('/').length === 3 && !pathname.startsWith('/dashboard') && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return null;
  }
  
  return <MainNav />;
}
