// File: powerofmath-next/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
// ✅ 1. استيراد dotenv
import * as dotenv from 'dotenv';

// 2. التحقق من أننا في بيئة التطوير وأن DATABASE_URL غير موجود
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
    // 3. تحميل ملف .env يدوياً
    dotenv.config({ path: './.env' });
}

// 4. التأكد من وجود المتغير قبل المتابعة (لتحسين رسالة الخطأ)
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Please check your .env file.');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 5. تهيئة PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], 
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;