// src/app/fonts.js

import localFont from 'next/font/local'; 

// 1. 🔠 Inter (الخط المتغير)
export const fontInter = localFont({
  src: [
    { 
        // 🔑 تم تغيير المسار إلى: /fonts/Inter/...
        path: '@public/fonts/Inter/Inter-VariableFont_opsz,wght.ttf', 
        style: 'normal' 
    },
  ],
  weights: '100 900', 
  display: 'swap',
  variable: '--font-inter',
});

// 2. 🧸 Fredoka (الخط المتغير)
export const fontFredoka = localFont({
  src: [
    { 
        // 🔑 تم تغيير المسار إلى: /fonts/Fredoka/...
        path: '@public/fonts/Fredoka/Fredoka-VariableFont_wdth,wght.ttf', 
        style: 'normal' 
    },
  ],
  weights: '300 700', 
  display: 'swap',
  variable: '--font-fredoka',
});

// 3. ✍️ Amiri (الخطوط الثابتة)
export const fontAmiri = localFont({
  src: [
    { 
        // 🔑 تم تغيير المسار إلى: /fonts/Amiri/...
        path: '@public/fonts/Amiri/Amiri-Regular.ttf', 
        weight: '400', 
        style: 'normal' 
    },
    { 
        // 🔑 تم تغيير المسار إلى: /fonts/Amiri/...
        path: '@public/fonts/Amiri/Amiri-Bold.ttf', 
        weight: '700', 
        style: 'normal' 
    },
  ],
  display: 'swap',
  variable: '--font-amiri',
});