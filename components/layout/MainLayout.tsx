// src/components/layout/MainLayout.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  studentName?: string;
  unreadCount?: number;
}

export default function MainLayout({ 
  children, 
  studentName = 'طالب', 
  unreadCount = 0 
}: MainLayoutProps) {
  const pathname = usePathname();

  // المسارات التي نريد إخفاء الهيدر فيها
  const hideOnPaths = ['/login', '/'];
  const hideHeader = !!pathname && hideOnPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  const [headerHeight, setHeaderHeight] = useState('5rem'); // 80px افتراضي
  
  useEffect(() => {
    if (hideHeader) {
      setHeaderHeight('0px');
      return;
    }

    // حساب ارتفاع الهيدر ديناميكيًا إذا لزم الأمر
    const updateHeaderHeight = () => {
      const header = document.querySelector('nav');
      if (header) {
        const height = header.getBoundingClientRect().height;
        setHeaderHeight(`${height}px`);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [hideHeader]);
  
  return (
    <>
      {!hideHeader && <Header studentName={studentName} unreadCount={unreadCount} />}
      
      <div 
        className="min-h-screen bg-gray-50"
        style={{ paddingTop: headerHeight }}
      >
        <main className="w-full">
          {children}
        </main>
      </div>
    </>
  );
}