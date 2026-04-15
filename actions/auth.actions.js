// src/actions/auth.actions.js
'use server'

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async (cookieStore) => {
  const store = cookieStore || await cookies();
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // يمكن تجاهل هذا في السيرفر
          }
        },
      },
    },
  );
};

// ***************************************************************
// 1. دوال إدارة Cookies
// ***************************************************************

async function setStudentCookie(studentId, studentName, studentLevel = '1', branchId = '1') {
    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === 'production'
    
    const options = {
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    }

    cookieStore.set('student_id', studentId.toString(), { ...options, httpOnly: true })
    cookieStore.set('student_name', studentName || 'طالب', { ...options, httpOnly: false })
    cookieStore.set('student_level', studentLevel.toString(), { ...options, httpOnly: false })
    cookieStore.set('student_branch', branchId.toString(), { ...options, httpOnly: false })
    
    return true
}

async function clearStudentCookies() {
    const cookieStore = await cookies()
    cookieStore.delete('student_id')
    cookieStore.delete('student_name')
    cookieStore.delete('student_level')
    cookieStore.delete('student_branch')
    return true
}

// ***************************************************************
// 2. الدوال المساعدة (Supabase)
// ***************************************************************

export async function getSessionStudentId() {
    try {
        const cookieStore = await cookies()
        const studentId = cookieStore.get('student_id')?.value
        if (!studentId) return null
        
        const idNum = parseInt(studentId)
        const supabase = await createClient()

        // التحقق من وجود الطالب وتحديث وقت النشاط
        const { data: student, error } = await supabase
            .from('student')
            .select('student_id')
            .eq('student_id', idNum)
            .single()

        if (error || !student) {
            await clearStudentCookies()
            return null
        }

        await supabase
            .from('student')
            .update({ updated_at: new Date().toISOString() })
            .eq('student_id', idNum)

        return idNum
    } catch (error) {
        console.error('❌ Error in getSessionStudentId:', error)
        return null 
    }
}

// ***************************************************************
// 3. تسجيل الدخول والمصادقة
// ***************************************************************

export async function loginStudent(studentName, branchId) {
    try {
        if (!studentName || !branchId) {
            return { success: false, error: 'البيانات غير مكتملة.' }
        }
        
        const supabase = await createClient()
        const branchIdInt = parseInt(branchId)

        // البحث عن الطالب
        const { data: student, error: searchError } = await supabase
            .from('student')
            .select('*, branch(*), level(*)')
            .eq('student_name', studentName)
            .eq('branch_id', branchIdInt)
            .maybeSingle()

        if (searchError) throw searchError

        let targetStudent = student

        if (!student) {
            // إنشاء طالب جديد (Auto-Registration)
            const { data: newStudent, error: createError } = await supabase
                .from('student')
                .insert([{
                    student_name: studentName,
                    branch_id: branchIdInt,
                    current_level_id: 1
                }])
                .select('*, branch(*), level(*)')
                .single()

            if (createError) throw createError
            targetStudent = newStudent
        }

        // تحديث وقت النشاط والـ Cookies
        await supabase
            .from('student')
            .update({ updated_at: new Date().toISOString() })
            .eq('student_id', targetStudent.student_id)

        await setStudentCookie(
            targetStudent.student_id,
            targetStudent.student_name,
            targetStudent.current_level_id?.toString() || '1',
            targetStudent.branch_id?.toString() || '1'
        )

        revalidatePath('/dashboard')

        return { 
            success: true, 
            data: {
                studentId: targetStudent.student_id,
                studentName: targetStudent.student_name,
                level: targetStudent.level,
                branch: targetStudent.branch,
                language: targetStudent.preferred_language,
                message: student ? "تم تسجيل الدخول." : "تم تسجيل الدخول كطالب جديد."
            }
        }
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'حدث خطأ في الاتصال بـ Supabase.' }
    }
}

export async function getBranches() {
    try {
        const supabase = await createClient()
        const { data: branches, error } = await supabase
            .from('branches')
            .select('branch_id, branch_name')
        
        if (error) throw error
        return { success: true, data: branches }
    } catch (error) {
        return { success: false, error: "فشل جلب الفروع." }
    }
}

// ***************************************************************
// 4. إدارة الحالة والبيانات الحالية
// ***************************************************************

export async function logoutStudent() {
    await clearStudentCookies()
    revalidatePath('/')
    return { success: true, message: 'تم تسجيل الخروج بنجاح.' }
}

export async function validateSession() {
    try {
        const studentId = await getSessionStudentId()
        if (!studentId) return { success: false, redirect: '/login' }

        const supabase = await createClient()
        const { data: student, error } = await supabase
            .from('student')
            .select('*, level(*)')
            .eq('student_id', studentId)
            .single()

        if (error || !student) return { success: false, redirect: '/login' }

        return { success: true, data: student }
    } catch (error) {
        return { success: false, error: 'خطأ في التحقق من الجلسة.' }
    }
}

export async function updateStudentLanguage(language) {
    try {
        const studentId = await getSessionStudentId()
        if (!studentId) return { success: false, error: 'غير مسجل.' }

        const supabase = await createClient()
        const { error } = await supabase
            .from('student')
            .update({ preferred_language: language })
            .eq('student_id', studentId)

        if (error) throw error
        revalidatePath('/')
        return { success: true, data: language }
    } catch (error) {
        return { success: false, error: 'فشل تحديث اللغة.' }
    }
}

export async function getSessionInfo() {
    const cookieStore = await cookies()
    return {
        hasSession: !!cookieStore.get('student_id')?.value,
        studentId: cookieStore.get('student_id')?.value || null,
        studentName: cookieStore.get('student_name')?.value || null,
        studentLevel: cookieStore.get('student_level')?.value || null,
        studentBranch: cookieStore.get('student_branch')?.value || null
    }
}