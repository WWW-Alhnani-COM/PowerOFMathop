// src/actions/student.actions.js
'use server';

import { prisma } from '@/lib/prisma';

// ============================================================
// 1. تسجيل طالب جديد
// ============================================================
export async function registerStudent(studentName, branchId = null) {
  // 🔒 التحقق من صحة المدخلات
  if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) {
    return { success: false, error: 'يجب أن يكون اسم الطالب صالحاً ويتكون من حرفين على الأقل.' };
  }

  const name = studentName.trim();

  try {
    // 🔍 التحقق من التفرد: اسم + فرع
    const existing = await prisma.student.findFirst({
      where: {
        student_name: name,
        branch_id: branchId, // null مسموح (طلاب بدون فرع)
      },
    });

    if (existing) {
      return { success: false, error: 'هذا الاسم مستخدم مسبقاً في نفس الفرع.' };
    }

    // ✅ إنشاء الطالب
    const newStudent = await prisma.student.create({
      data: {
        student_name: name,
        branch_id: branchId ? parseInt(branchId) : null,
        current_level_id: 1, // المستوى الافتراضي
        preferred_language: 'ar',
        status: 'active',
      },
      select: {
        student_id: true,
        student_name: true,
        branch_id: true,
        current_level_id: true,
        created_at: true,
      },
    });

    return { success: true, data: newStudent };
  } catch (error) {
    console.error('Error in registerStudent:', error);
    return { success: false, error: 'فشل إنشاء الحساب. حاول مرة أخرى.' };
  }
}

// ============================================================
// 2. جلب بيانات طالب حسب المعرف
// ============================================================
export async function getStudentById(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { student_id: id },
      select: {
        student_id: true,
        student_name: true,
        branch_id: true,
        current_level_id: true,
        preferred_language: true,
        total_score: true,
        current_streak: true,
        best_streak: true,
        status: true,
        created_at: true,
        updated_at: true,
        branch: { select: { branch_name: true } },
        level: { select: { level_name: true, color: true, icon: true } },
      },
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود.' };
    }

    return { success: true, data: student };
  } catch (error) {
    console.error('Error in getStudentById:', error);
    return { success: false, error: 'فشل جلب بيانات الطالب.' };
  }
}

// ============================================================
// 3. تحديث اسم الطالب
// ============================================================
export async function updateStudentName(studentId, newName) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  if (!newName || newName.trim().length < 2) {
    return { success: false, error: 'الاسم الجديد يجب أن يتكون من حرفين على الأقل.' };
  }

  const name = newName.trim();

  try {
    // 🔍 التحقق من التفرد في نفس الفرع
    const currentStudent = await prisma.student.findUnique({
      where: { student_id: id },
      select: { branch_id: true },
    });

    if (!currentStudent) {
      return { success: false, error: 'الطالب غير موجود.' };
    }

    const existing = await prisma.student.findFirst({
      where: {
        student_name: name,
        branch_id: currentStudent.branch_id,
        student_id: { not: id },
      },
    });

    if (existing) {
      return { success: false, error: 'هذا الاسم مستخدم مسبقاً في نفس الفرع.' };
    }

    // ✅ التحديث
    const updated = await prisma.student.update({
      where: { student_id: id },
      data: { student_name: name },
      select: { student_id: true, student_name: true },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in updateStudentName:', error);
    return { success: false, error: 'فشل تحديث الاسم.' };
  }
}

// ============================================================
// 4. تحديث فرع الطالب
// ============================================================
export async function updateStudentBranch(studentId, branchId) {
  const id = parseInt(studentId);
  const branch = branchId ? parseInt(branchId) : null;

  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    // إذا كان branchId مقدم، تحقق من وجوده
    if (branch !== null) {
      const existingBranch = await prisma.branch.findUnique({
        where: { branch_id: branch },
      });
      if (!existingBranch) {
        return { success: false, error: 'الفرع المحدد غير موجود.' };
      }
    }

    const updated = await prisma.student.update({
      where: { student_id: id },
      data: { branch_id: branch },
      select: {
        student_id: true,
        student_name: true,
        branch_id: true,
        branch: { select: { branch_name: true } },
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in updateStudentBranch:', error);
    return { success: false, error: 'فشل تحديث الفرع.' };
  }
}

// ============================================================
// 5. تحديث المستوى الحالي للطالب
// ============================================================
export async function updateStudentLevel(studentId, levelId) {
  const id = parseInt(studentId);
  const level = parseInt(levelId);

  if (isNaN(id) || isNaN(level)) {
    return { success: false, error: 'معرف الطالب أو المستوى غير صالح.' };
  }

  try {
    // التحقق من وجود المستوى
    const existingLevel = await prisma.level.findUnique({
      where: { level_id: level },
      select: { level_id: true, is_active: true },
    });

    if (!existingLevel || !existingLevel.is_active) {
      return { success: false, error: 'المستوى غير موجود أو غير مفعل.' };
    }

    const updated = await prisma.student.update({
      where: { student_id: id },
      data: { current_level_id: level },
      select: {
        student_id: true,
        student_name: true,
        current_level_id: true,
        level: { select: { level_name: true } },
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in updateStudentLevel:', error);
    return { success: false, error: 'فشل تحديث المستوى.' };
  }
}

// ============================================================
// 6. جلب إحصائيات الطالب (لواجهة الطفل)
// ============================================================
export async function getStudentStats(studentId) {
  const id = parseInt(studentId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { student_id: id },
      select: {
        student_name: true,
        total_score: true,
        current_streak: true,
        best_streak: true,
        total_correct_answers: true,
        total_wrong_answers: true,
        total_time_spent: true,
      },
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود.' };
    }

    return { success: true, data: student };
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    return { success: false, error: 'فشل جلب الإحصائيات.' };
  }
}