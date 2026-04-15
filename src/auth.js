// src/auth.js
// ⚠️ يجب التأكد من تثبيت الحزم: next-auth, @auth/prisma-adapter, @auth/core

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter'; 
import { prisma } from '@lib/prisma'; // ⚠️ تأكد أن مسارك لملف prisma هو './lib/prisma'
import GitHub from '@auth/core/providers/github'; 
import Credentials from '@auth/core/providers/credentials'; 


// ***************************************************************
// 1. التكوين الأساسي (Configuration)
// ***************************************************************
export const config = {
    // 💡 ربط Prisma لتخزين بيانات المستخدم والجلسة
    adapter: PrismaAdapter(prisma), 
    
    providers: [
        GitHub({ 
            clientId: process.env.GITHUB_ID, 
            clientSecret: process.env.GITHUB_SECRET 
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                student_id: { label: "Student ID", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // ⚠️ يجب استبدال هذا بمنطق التحقق الفعلي
                if (credentials?.student_id === 'test' && credentials?.password === '1234') {
                    return {
                        id: '101', 
                        name: 'Test Student',
                        email: 'test@example.com', 
                    };
                }
                return null;
            },
        }),
    ],

    // 💡 دالات الـ Callbacks: مهمة لإضافة ID الطالب للجلسة/الرمز (JWT)
    callbacks: {
        async session({ session, token }) { 
            if (token) {
                session.user.id = token.sub; 
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id; 
            }
            return token;
        }
    },
    
    // 🔑 استراتيجية JWT ضرورية لعمل Server/Client Components معاً
    session: {
        strategy: "jwt", 
    },

    pages: {
        signIn: '/login',
    }
};

// ***************************************************************
// 2. تطبيق التكوين وتصدير الدوال (لتفادي خطأ is not a function)
// ***************************************************************

// 🔑 يتم إنشاء الوحدة بالكامل مرة واحدة
const NextAuthModule = NextAuth(config);

// 🔑 تصدير الدوال بشكل فردي وصريح ومضمون
export const { handlers } = NextAuthModule; // تُستخدم في Route Handler API
export const { auth } = NextAuthModule;     // تُستخدم في Server Components (مثل ChatPage)
export const { signIn } = NextAuthModule;
export const { signOut } = NextAuthModule;