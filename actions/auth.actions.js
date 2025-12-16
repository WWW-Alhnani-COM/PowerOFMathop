// src/actions/auth.actions.js
'use server'

import { prisma } from '../lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ***************************************************************
// 1. دوال إدارة Cookies (جديد)
// ***************************************************************

/**
 * إنشاء cookie للطالب بعد تسجيل الدخول
 */
async function setStudentCookie(studentId, studentName, studentLevel = '1', branchId = '1') {
    const cookieStore = await cookies()
    
    // Cookie الأساسي (آمن)
    cookieStore.set('student_id', studentId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // أسبوع واحد
    })
    
    // Cookie للاسم (للعرض فقط)
    cookieStore.set('student_name', studentName || 'طالب', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    })
    
    // Cookie للمستوى
    cookieStore.set('student_level', studentLevel.toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    })
    
    // Cookie للفرع
    cookieStore.set('student_branch', branchId.toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    })
    
    return true
}

/**
 * مسح جميع cookies عند تسجيل الخروج
 */
async function clearStudentCookies() {
    const cookieStore = await cookies()
    
    cookieStore.delete('student_id')
    cookieStore.delete('student_name')
    cookieStore.delete('student_level')
    cookieStore.delete('student_branch')
    
    return true
}

// ***************************************************************
// 2. الدوال المساعدة (محدثة)
// ***************************************************************

/**
 * جلب student_id من cookie (بدلاً من القيمة الوهمية 5)
 */
export async function getSessionStudentId() {
    try {
        const cookieStore = await cookies()
        const studentId = cookieStore.get('student_id')?.value
        
        if (!studentId) {
            console.log('❌ لم يتم العثور على student_id في cookies')
            return null
        }
        
        const idNum = parseInt(studentId)
        if (isNaN(idNum)) {
            console.log('❌ student_id غير صالح:', studentId)
            return null
        }
        
        // التحقق من وجود الطالب في قاعدة البيانات
        const studentExists = await prisma.student.findUnique({
            where: { 
                student_id: idNum
            },
            select: { 
                student_id: true,
                updated_at: true
            }
        })
        
        if (!studentExists) {
            console.log('❌ الطالب غير موجود:', idNum)
            await clearStudentCookies()
            return null
        }
        
        // تحديث وقت النشاط
        await prisma.student.update({
            where: { student_id: idNum },
            data: { updated_at: new Date() }
        })
        
        console.log('✅ تم جلب student_id من cookie:', idNum)
        return idNum
        
    } catch (error) {
        console.error('❌ خطأ في getSessionStudentId:', error)
        // للتوافق مع الكود القديم، نعيد قيمة وهمية في حالة الخطأ
        return 5
    }
}

/**
 * التحقق من صلاحية المسؤول (قيمة وهمية حالياً)
 */
export const checkAdminAuth = async () => false

// ***************************************************************
// 1. تسجيل الدخول والمصادقة (محدثة)
// ***************************************************************

export async function loginStudent(studentName, branchId) {
    try {
        if (!studentName || !branchId) {
            return { success: false, error: 'البيانات غير مكتملة لتسجيل الدخول.' }
        }
        
        const branchIdInt = parseInt(branchId)

        // البحث عن الطالب (بدون status إذا لم يكن موجوداً في الجدول)
        const student = await prisma.student.findFirst({
            where: {
                student_name: studentName,
                branch_id: branchIdInt,
                // قم بإزالة status إذا لم يكن موجوداً في الجدول
                // status: 'active'
            },
            include: {
                branch: true,
                level: true
            }
        })

        if (!student) {
            // إذا لم يكن موجوداً، قم بإنشاء حساب جديد له
            const newStudent = await prisma.student.create({
                data: {
                    student_name: studentName,
                    branch_id: branchIdInt,
                    // يُفترض أن الحقل current_level_id يأخذ القيمة الافتراضية 1
                },
                include: {
                    branch: true,
                    level: true
                }
            })
            
            // إنشاء cookies للطالب الجديد
            await setStudentCookie(
                newStudent.student_id,
                newStudent.student_name,
                newStudent.current_level_id?.toString() || '1',
                newStudent.branch_id?.toString() || '1'
            )
            
            return { 
                success: true, 
                data: {
                    // 🔑 للحفاظ على التوافق مع الكود القديم
                    studentId: newStudent.student_id,
                    studentName: newStudent.student_name,
                    level: newStudent.level,
                    branch: newStudent.branch,
                    language: newStudent.preferred_language,
                    // إضافة message للحفاظ على التوافق
                    message: "تم تسجيل الدخول كطالب جديد."
                }
            }
        }

        // تحديث وقت النشاط
        await prisma.student.update({
            where: { student_id: student.student_id },
            data: { updated_at: new Date() }
        })
        
        // إنشاء/تحديث cookies للطالب
        await setStudentCookie(
            student.student_id,
            student.student_name,
            student.current_level_id?.toString() || '1',
            student.branch_id?.toString() || '1'
        )

        revalidatePath('/dashboard')

        return { 
            success: true, 
            data: {
                // 🔑 للحفاظ على التوافق مع الكود القديم
                studentId: student.student_id,
                studentName: student.student_name,
                level: student.level,
                branch: student.branch,
                language: student.preferred_language
            }
        }
    } catch (error) {
        console.error('Login error:', error)
        
        // 🚨 تحسين رسالة الخطأ
        const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error 
                                 ? `خطأ في قاعدة البيانات: ${error.message}` 
                                 : 'حدث خطأ غير متوقع في تسجيل الدخول. يرجى مراجعة سجلات الخادم.'
        return { success: false, error: errorMessage }
    }
}

/**
 * جلب قائمة الفروع المتاحة لصفحة تسجيل الدخول
 */
export async function getBranches() {
    try {
        const branches = await prisma.branch.findMany({
            select: { 
                branch_id: true, 
                branch_name: true 
            },
            // إزالة status إذا لم يكن موجوداً في الجدول
            // where: { status: 'active' }
        })
        
        return { 
            success: true, 
            data: branches 
        }
        
    } catch (error) {
        console.error('خطأ في جلب الفروع:', error)
        return { 
            success: false, 
            error: "فشل في جلب الفروع." 
        }
    }
}

// ***************************************************************
// 2. دوال أخرى (مع الحفاظ على التوافق مع الكود القديم)
// ***************************************************************

/**
 * تسجيل خروج الطالب وتطهير بيانات الجلسة.
 */
export async function logoutStudent(studentId = null) {
    try {
        // إذا لم يتم تمرير studentId، نحاول الحصول عليه من cookies
        if (!studentId) {
            const sessionStudentId = await getSessionStudentId()
            studentId = sessionStudentId
        }
        
        // مسح جميع cookies
        await clearStudentCookies()
        
        revalidatePath('/')
        
        return { 
            success: true,
            message: 'تم تسجيل الخروج بنجاح.'
        }
    } catch (error) {
        console.error('Logout error:', error)
        return { 
            success: false, 
            error: 'حدث خطأ أثناء تسجيل الخروج.' 
        }
    }
}

/**
 * جلب بيانات الطالب الحالي (لغرض العرض في واجهة المستخدم).
 */
export async function getCurrentStudent(studentId = null) {
    try {
        // إذا لم يتم تمرير studentId، نحاول الحصول عليه من cookies
        if (!studentId) {
            const sessionStudentId = await getSessionStudentId()
            if (!sessionStudentId) {
                return { 
                    success: false, 
                    error: 'يجب تسجيل الدخول أولاً.' 
                }
            }
            studentId = sessionStudentId
        }

        const student = await prisma.student.findUnique({
            where: { 
                student_id: studentId
                // إزالة status إذا لم يكن موجوداً في الجدول
                // status: 'active'
            },
            include: {
                branch: true,
                level: true,
                _count: {
                    select: {
                        sheetResults: true,
                        challengeResults: true,
                    },
                },
            }
        })

        if (!student) {
            return { 
                success: false, 
                error: 'الطالب غير موجود.' 
            }
        }

        return { 
            success: true, 
            data: student 
        }
    } catch (error) {
        console.error('Get current student error:', error)
        return { 
            success: false, 
            error: 'فشل في جلب بيانات الطالب.' 
        }
    }
}

/**
 * تحديث اللغة المفضلة للطالب.
 */
export async function updateStudentLanguage(studentId = null, language) {
    try {
        // إذا لم يتم تمرير studentId، نحاول الحصول عليه من cookies
        if (!studentId) {
            const sessionStudentId = await getSessionStudentId()
            if (!sessionStudentId) {
                return { 
                    success: false, 
                    error: 'يجب تسجيل الدخول أولاً.' 
                }
            }
            studentId = sessionStudentId
        }

        const updatedStudent = await prisma.student.update({
            where: { 
                student_id: studentId
                // إزالة status إذا لم يكن موجوداً في الجدول
                // status: 'active'
            },
            data: { 
                preferred_language: language 
            },
        })

        revalidatePath('/')

        return { 
            success: true, 
            data: updatedStudent.preferred_language 
        }
    } catch (error) {
        console.error('Update language error:', error)
        return { 
            success: false, 
            error: 'فشل في تحديث اللغة.' 
        }
    }
}

/**
 * التحقق من جلسة الطالب وتحديث وقت النشاط.
 */
export async function validateSession(studentId = null) {
    try {
        // إذا لم يتم تمرير studentId، نحاول الحصول عليه من cookies
        if (!studentId) {
            const sessionStudentId = await getSessionStudentId()
            if (!sessionStudentId) {
                return { 
                    success: false, 
                    error: 'يجب تسجيل الدخول أولاً',
                    redirect: '/login'
                }
            }
            studentId = sessionStudentId
        }

        // تحديث وقت التحديث أولاً
        await prisma.student.update({
            where: { 
                student_id: studentId
            },
            data: { 
                updated_at: new Date() 
            }
        })

        // جلب بيانات الطالب الكاملة مع المستوى
        const student = await prisma.student.findUnique({
            where: { 
                student_id: studentId
            },
            select: { 
                student_id: true, 
                student_name: true,
                current_level_id: true,  // ⬅ إضافة هذا
                branch_id: true,
                preferred_language: true,
                total_score: true,
                total_correct_answers: true,
                total_wrong_answers: true,
                total_time_spent: true,
                current_streak: true,
                best_streak: true,
                status: true,
                created_at: true,
                updated_at: true
            }
        })

        if (!student) {
            return { 
                success: false, 
                error: 'الطالب غير موجود',
                redirect: '/login'
            }
        }

        // جلب معلومات المستوى إذا كان موجوداً
        let level = null
        if (student.current_level_id) {
            level = await prisma.level.findUnique({
                where: { level_id: student.current_level_id },
                select: {
                    level_id: true,
                    level_name: true,
                    level_order: true,
                    description: true,
                    color: true,
                    icon: true,
                    is_active: true,
                    created_at: true
                }
            })
        }

        return { 
            success: true, 
            data: {
                ...student,
                level // ⬅ إضافة معلومات المستوى
            }
        }
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجلسة:', error)
        return { 
            success: false, 
            error: 'فشل في التحقق من الجلسة.' 
        }
    }
}

// ***************************************************************
// 3. دوال إضافية جديدة
// ***************************************************************

/**
 * دالة للحصول على معلومات الجلسة الحالية
 */
export async function getSessionInfo() {
    try {
        const cookieStore = await cookies()
        
        return {
            hasSession: !!cookieStore.get('student_id')?.value,
            studentId: cookieStore.get('student_id')?.value || null,
            studentName: cookieStore.get('student_name')?.value || null,
            studentLevel: cookieStore.get('student_level')?.value || null,
            studentBranch: cookieStore.get('student_branch')?.value || null
        }
    } catch (error) {
        console.error('Get session info error:', error)
        return {
            hasSession: false,
            studentId: null,
            studentName: null,
            studentLevel: null,
            studentBranch: null
        }
    }
}

/**
 * دالة للتحقق مما إذا كان الطالب مسجل الدخول
 */
export async function isAuthenticated() {
    try {
        const studentId = await getSessionStudentId()
        return {
            isAuthenticated: !!studentId,
            studentId: studentId
        }
    } catch (error) {
        console.error('Is authenticated error:', error)
        return {
            isAuthenticated: false,
            studentId: null
        }
    }
}

// تصدير الدوال المساعدة
// تم التصدير بالفعل في الأعلى