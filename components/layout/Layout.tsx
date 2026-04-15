// src/app/layout.tsx

// استيراد خط Cairo من next/font/google وتصدير متغيّر css له
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-cairo',
});

// استيراد MainLayout (تأكد من مسار الملف الصحيح)
import MainLayout from '@layout/MainLayout'; // عدّل المسار إذا كان مختلفًا

// ... (تعريف metadata)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <body>
        
        {/* استخدام المكون MainLayout مع تمرير children */}
        <MainLayout>{children}</MainLayout>
        
      </body>
    </html>
  );
}