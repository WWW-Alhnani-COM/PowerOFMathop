// src/actions/level.actions.js
'use server';

import { prisma } from '@/lib/prisma';

// جلب جميع المستويات النشطة مع إحصائيات
export async function getActiveLevelsWithStats(studentId = null) {
  try {
    // جلب المستويات
    const levels = await prisma.level.findMany({
      where: { is_active: true },
      orderBy: { level_order: 'asc' },
      select: {
        level_id: true,
        level_name: true,
        description: true,
        color: true,
        icon: true,
        level_order: true,
        _count: {
          select: {
            levelRules: true,
            sheets: true,
          }
        }
      }
    });

    // إذا كان هناك طالب، نجلب تقدمه
    let studentProgress = [];
    if (studentId) {
      studentProgress = await prisma.sheetResult.groupBy({
        by: ['sheet_id'],
        where: {
          student_id: parseInt(studentId),
          status: 'completed'
        },
        _count: {
          result_id: true
        }
      });
    }

    // دمج البيانات
    const levelsWithStats = await Promise.all(levels.map(async (level) => {
      // جلب عدد الطلاب في هذا المستوى
      const studentCount = await prisma.student.count({
        where: { current_level_id: level.level_id }
      });

      // حساب عدد التمارين المكتملة للطالب
      const completedSheets = studentId ? 
        await prisma.sheetResult.count({
          where: {
            student_id: parseInt(studentId),
            sheet: {
              level_id: level.level_id
            },
            status: 'completed'
          }
        }) : 0;

      return {
        ...level,
        stats: {
          total_rules: level._count.levelRules,
          total_sheets: level._count.sheets,
          total_students: studentCount,
          student_completed_sheets: completedSheets,
          progress_percentage: level._count.sheets > 0 ? 
            Math.round((completedSheets / level._count.sheets) * 100) : 0
        }
      };
    }));

    return { 
      success: true, 
      data: levelsWithStats,
      totalLevels: levels.length
    };
  } catch (error) {
    console.error('Error in getActiveLevelsWithStats:', error);
    return { 
      success: false, 
      error: 'فشل جلب المستويات.' 
    };
  }
}

// جلب تقدم الطالب الحالي
export async function getStudentProgress(studentId) {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(studentId) },
      select: {
        student_name: true,
        total_score: true,
        current_streak: true,
        best_streak: true,
        total_correct_answers: true,
        total_wrong_answers: true,
        level: {
          select: {
            level_name: true,
            level_order: true
          }
        }
      }
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    // جلب إحصائيات إضافية
    const totalAttempts = await prisma.sheetResult.count({
      where: { student_id: parseInt(studentId) }
    });

    const completedAttempts = await prisma.sheetResult.count({
      where: { 
        student_id: parseInt(studentId),
        status: 'completed'
      }
    });

    return {
      success: true,
      data: {
        ...student,
        stats: {
          total_attempts: totalAttempts,
          completed_attempts: completedAttempts,
          accuracy: student.total_correct_answers + student.total_wrong_answers > 0 ?
            Math.round((student.total_correct_answers / (student.total_correct_answers + student.total_wrong_answers)) * 100) : 0,
          completion_rate: totalAttempts > 0 ?
            Math.round((completedAttempts / totalAttempts) * 100) : 0
        }
      }
    };
  } catch (error) {
    console.error('Error in getStudentProgress:', error);
    return { success: false, error: 'فشل جلب تقدم الطالب' };
  }
}

// الدالة الأصلية (للتوافق مع الكود القديم)
export async function getActiveLevels() {
  try {
    const levels = await prisma.level.findMany({
      where: { is_active: true },
      orderBy: { level_order: 'asc' },
      select: {
        level_id: true,
        level_name: true,
        description: true,
        color: true,
        icon: true,
        level_order: true,
      }
    });
    return { success: true, data: levels };
  } catch (error) {
    console.error('Error in getActiveLevels:', error);
    return { success: false, error: 'فشل جلب المستويات.' };
  }
}

// جلب قواعد مستوى معين
export async function getRulesByLevel(levelId) {
  const id = parseInt(levelId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف مستوى غير صالح.' };
  }

  try {
    const level = await prisma.level.findUnique({
      where: { level_id: id, is_active: true },
      include: {
        levelRules: {
          include: {
            rule: {
              select: {
                rule_id: true,
                rule_name: true,
                description: true,
                icon: true,
              }
            }
          }
        }
      }
    });

    if (!level) {
      return { success: false, error: 'المستوى غير موجود أو غير نشط.' };
    }

    const rules = level.levelRules.map(lr => lr.rule);
    return { success: true, data: { level, rules } };
  } catch (error) {
    console.error('Error in getRulesByLevel:', error);
    return { success: false, error: 'فشل جلب قواعد المستوى.' };
  }
}

// جلب أوراق تمارين لقاعدة معينة
export async function getSheetsByRule(ruleId) {
  const id = parseInt(ruleId);
  if (isNaN(id)) {
    return { success: false, error: 'معرف قاعدة غير صالح.' };
  }

  try {
    const sheets = await prisma.sheet.findMany({
      where: { 
        rule_id: id, 
        is_active: true 
      },
      select: {
        sheet_id: true,
        sheet_name: true,
        total_problems: true,
        time_limit: true,
        required_score: true,
      },
      orderBy: { created_at: 'asc' }
    });

    const rule = await prisma.rule.findUnique({
      where: { rule_id: id },
      select: { rule_name: true }
    });

    return { 
      success: true, 
      data: { 
        rule: rule || { rule_name: '---' }, 
        sheets 
      } 
    };
  } catch (error) {
    console.error('Error in getSheetsByRule:', error);
    return { success: false, error: 'فشل جلب تمارين القاعدة.' };
  }
}