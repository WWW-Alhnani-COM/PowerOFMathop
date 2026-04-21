// compone
// nts/layout/Header.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Layers, Trophy, MessageCircle, Menu, X } from 'lucide-react';

import { BarChart3 } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'الرئيسية', icon: Home },
  { href: '/levels', label: 'المستويات', icon: Layers },
  { href: '/challenge', label: 'التحديات', icon: Trophy },
  { href: '/chat', label: 'الدردشة', icon: MessageCircle },
  { href: '/', label: 'التقارير', icon: BarChart3 },
  { href: '/', label: 'النتائج', icon: BarChart3 },
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
    fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-3
    transition-all duration-500
    ${scrolled
      ? 'bg-white/80 backdrop-blur-md border-b border-orange-200/50 shadow-lg'
      : 'bg-white/70 backdrop-blur-sm border-b border-orange-100'}
  `}
>
<div className="max-w-7xl mx-auto flex items-center justify-between gap-4">          
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
  const Icon = link.icon;

  return (
    <Link
      key={link.href}
      href={link.href}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-2xl
        transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-r from-orange-500 to-yellow-400 hover:shadow-[0_0_25px_rgba(255,107,53,0.6)] text-white shadow-lg'
          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}
      `}
    >
      <Icon size={18} />
      <span className="font-medium">{link.label}</span>
    </Link>
  );
})}
          </div>
          
          {/* منطقة المستخدم */}
<div className="flex items-center gap-3 md:gap-6">            {/* زر الدردشة */}
           <Link href="/chat" className="relative">
  <div className="
    w-11 h-11 md:w-12 md:h-12 rounded-2xl
    bg-gradient-to-r from-orange-500 to-yellow-400
    flex items-center justify-center
    text-white shadow-md hover:scale-105 transition-all
  ">
    <MessageCircle size={20} />
  </div>

  {unreadCount > 0 && (
    <span className="
      absolute -top-1 -right-1
      min-w-[20px] h-5 px-1
      bg-red-500 text-white text-xs font-bold
      rounded-full flex items-center justify-center
      shadow-md
    ">
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
  className="
    md:hidden p-2.5 rounded-xl
    bg-gradient-to-r from-orange-500 to-yellow-400
    text-white shadow-md
  "
>
 
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}

            </button>
          </div>
        </div>

        {/* القائمة المتنقلة للجوال */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-xl shadow-xl border border-gray-200 animate-slide-down">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
  const isActive = pathname.startsWith(link.href);
  const Icon = link.icon;

  return (
    <Link
      key={link.href}
      href={link.href}
      className={`
        flex items-center gap-3 p-4 rounded-xl
        transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-[0_0_20px_rgba(255,107,53,0.5)]'
          : 'text-gray-700 hover:bg-orange-50'}
      `}
    >
      <Icon size={20} strokeWidth={2} />
      <span className="font-medium">{link.label}</span>
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
<div className="h-[70px] md:h-[80px]" />    </>
  );
}
