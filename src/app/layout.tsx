// src/app/layout.tsx
import "./globals.css";
import { fontInter, fontFredoka } from './fonts';
import MainLayout from '@components/layout/MainLayout';

export const metadata = {
  title: 'Power Of Math',
  description: 'منصة تعلم الرياضيات التفاعلية للأطفال.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${fontInter.variable} ${fontFredoka.variable}`}>
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}