/** @type {import('next').NextConfig} */

// ✅ استيراد مكتبة dotenv
require('dotenv').config({ path: './.env' }); 

const nextConfig = {
  experimental: {
    // ترك هذا الخيار لحل مشكلة الخطوط

  },
  compiler: {
    styledComponents: true, // حافظ على أي إعدادات Compiler أخرى
  },
  // ✅ تمرير DATABASE_URL يدوياً إلى بيئة التطبيق
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

module.exports = nextConfig;