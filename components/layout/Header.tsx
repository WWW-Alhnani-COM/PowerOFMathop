// components/layout/Header.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const navLinks = [
  { href: '/dashboard', label: 'الرئيسية' },
  { href: '/levels', label: 'المستويات' },
  { href: '/challenge', label: 'التحديات' },
  { href: '/chat', label: 'الدردشة' },
];


export default function Header({ studentName = 'طالب', unreadCount = 0 }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة المتنقلة عند تغيير المسار
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // اخفاء الهيدر على مسارات معينة (مثال: /login و /)
  const hideOnPaths = ['/login', '/join', '/']; // أضفت '/' هنا
  const shouldHide = !!pathname && hideOnPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  // ----- التغيير: إرجاع فارغ إذا كان يجب الإخفاء -----
  if (shouldHide) return null;
  
  return (
    <>
      <nav 
        className={`
          fixed top-0 left-0 w-full py-4 px-4 md:px-6 z-50 
          ${scrolled 
            ? 'bg-white shadow-lg border-b border-gray-200' 
            : 'bg-white border-b border-gray-100'}
        `}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* الشعار مع صورة */}
          <Link href="/dashboard" className="flex items-center space-x-3 space-x-reverse group">
            {/* صورة الشعار */}
            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
              {/* 🔴 تأكد من وجود الصورة في المجلد الصحيح */}
              <Image
                src="/images/logo.png" // ← مسار مطلق من مجلد public
                alt="Power Of Math Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority // ← لتحميل الصورة أولاً
              />
            </div>
            
            {/* نص الشعار */}
            
          </Link>
          
          {/* روابط التنقل للأجهزة الكبيرة */}
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-6 py-2.5 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600 hover:shadow-sm'}
                  `}
                >
                  <span className="font-medium text-base">{link.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-orange-400 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* منطقة المستخدم */}
          <div className="flex items-center space-x-4 md:space-x-8 space-x-reverse">
            {/* زر الدردشة */}
            <Link href="/chat" className="relative ml-2 md:ml-15">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 flex items-center justify-center text-lg md:text-xl text-gray-700 hover:scale-105 hover:shadow-md transition-all duration-300">
                💬
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* اسم المستخدم للأجهزة الكبيرة */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">مرحباً</p>
                <p className="text-base font-semibold text-gray-800">{studentName}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-medium shadow-md">
                {studentName[0]?.toUpperCase() || 'ط'}
              </div>
            </div>

            {/* زر القائمة المتنقلة للجوال */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center justify-center w-6 h-6">
                <div className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : 'mb-1.5'}`} />
                <div className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'mb-1.5'}`} />
                <div className={`w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* القائمة المتنقلة للجوال */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-xl shadow-xl border border-gray-200 animate-slide-down">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center justify-between p-4 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-600 border-r-4 border-orange-500' 
                        : 'hover:bg-gray-50 text-gray-700'}
                    `}
                  >
                    <span className="font-medium text-base">{link.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
              
              {/* معلومات المستخدم في القائمة المتنقلة */}
              <div className="p-4 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {studentName[0]?.toUpperCase() || 'ط'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{studentName}</p>
                    <p className="text-sm text-gray-500">طالب نشط</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* مساحة لتعويض ارتفاع الهيدر */}
      <div className=" md:h-0" />
    </>
  );
}