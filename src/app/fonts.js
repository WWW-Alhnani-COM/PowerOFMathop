import localFont from 'next/font/local';

// Inter
export const fontInter = localFont({
  src: [
    {
      path: '../fonts/Inter/Inter-VariableFont_opsz,wght.ttf',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
});

// Fredoka
export const fontFredoka = localFont({
  src: [
    {
      path: '../fonts/Fredoka/Fredoka-VariableFont_wdth,wght.ttf',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-fredoka',
});

// Amiri
export const fontAmiri = localFont({
  src: [
    {
      path: '../fonts/Amiri/Amiri-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Amiri/Amiri-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-amiri',
});