'use server';

import { createClient } from '@utils/supabase/server';

const supabase = createClient();

// ======================================================
// 1. المستويات مع الإحصائيات
// ======================================================
export async function getActiveLevelsWithStats(studentId = null) {
  try {
    // المستويات
    const { data: levels } = await supabase
      .from('level')
      .select(`
        level_id,
        level_name,
        description,
        color,
        icon,
        level_order,
        levelRules:level_rule(count),
        sheets:sheet(count)
      `)
      .eq('is_active', true)
      .order('level_order', { ascending: true });

    if (!levels) {
      return { success: false, error: 'لا توجد مستويات' };
    }

    let completedByStudent = [];

    // تقدم الطالب (اختياري)
    if (studentId) {
      const { data } = await supabase
        .from('sheet_result')
        .select('sheet_id')
        .eq('student_id', Number(studentId))
        .eq('status', 'completed');

      completedByStudent = data || [];
    }

    const levelsWithStats = await Promise.all(
      levels.map(async (level) => {
        // عدد الطلاب في المستوى
        const { count: studentCount } = await supabase
          .from('student')
          .select('*', { count: 'exact', head: true })
          .eq('current_level_id', level.level_id);

        // عدد التمارين المكتملة للطالب داخل هذا المستوى
        let completedSheets = 0;

        if (studentId) {
          const { count } = await supabase
            .from('sheet_result')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', Number(studentId))
            .eq('status', 'completed');

          completedSheets = count || 0;
        }

        const totalSheets = level.sheets?.[0]?.count || 0;

        return {
          ...level,
          stats: {
            total_rules: level.levelRules?.[0]?.count || 0,
            total_sheets: totalSheets,
            total_students: studentCount || 0,
            student_completed_sheets: completedSheets,
            progress_percentage: totalSheets
              ? Math.round((completedSheets / totalSheets) * 100)
              : 0,
          },
        };
      })
    );

    return {
      success: true,
      data: levelsWithStats,
      totalLevels: levels.length,
    };
  } catch (error) {
    return { success: false, error: 'فشل جلب المستويات' };
  }
}

// ======================================================
// 2. تقدم الطالب
// ======================================================
export async function getStudentProgress(studentId) {
  const id = Number(studentId);
  if (!id) return { success: false, error: 'studentId غير صالح' };

  try {
    const { data: student } = await supabase
      .from('student')
      .select(`
        student_name,
        total_score,
        current_streak,
        best_streak,
        total_correct_answers,
        total_wrong_answers,
        level:level_id(level_name, level_order)
      `)
      .eq('student_id', id)
      .single();

    if (!student) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const { count: totalAttempts } = await supabase
      .from('sheet_result')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id);

    const { count: completedAttempts } = await supabase
      .from('sheet_result')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'completed');

    const accuracy =
      student.total_correct_answers + student.total_wrong_answers > 0
        ? Math.round(
            (student.total_correct_answers /
              (student.total_correct_answers + student.total_wrong_answers)) *
              100
          )
        : 0;

    return {
      success: true,
      data: {
        ...student,
        stats: {
          total_attempts: totalAttempts || 0,
          completed_attempts: completedAttempts || 0,
          accuracy,
          completion_rate: totalAttempts
            ? Math.round((completedAttempts / totalAttempts) * 100)
            : 0,
        },
      },
    };
  } catch {
    return { success: false, error: 'فشل جلب التقدم' };
  }
}

// ======================================================
// 3. المستويات (بسيط)
// ======================================================
export async function getActiveLevels() {
  try {
    const { data } = await supabase
      .from('level')
      .select('level_id,level_name,description,color,icon,level_order')
      .eq('is_active', true)
      .order('level_order', { ascending: true });

    return { success: true, data };
  } catch {
    return { success: false, error: 'فشل جلب المستويات' };
  }
}

// ======================================================
// 4. قواعد مستوى
// ======================================================
export async function getRulesByLevel(levelId) {
  const id = Number(levelId);
  if (!id) return { success: false, error: 'levelId غير صالح' };

  try {
    const { data: level } = await supabase
      .from('level')
      .select(`
        level_id,
        level_name,
        level_rule(
          rule:rule_id(
            rule_id,
            rule_name,
            description,
            icon
          )
        )
      `)
      .eq('level_id', id)
      .eq('is_active', true)
      .single();

    if (!level) {
      return { success: false, error: 'المستوى غير موجود' };
    }

    const rules = level.level_rule?.map((lr) => lr.rule) || [];

    return {
      success: true,
      data: { level, rules },
    };
  } catch {
    return { success: false, error: 'فشل جلب القواعد' };
  }
}

// ======================================================
// 5. أوراق التمارين
// ======================================================
export async function getSheetsByRule(ruleId) {
  const id = Number(ruleId);
  if (!id) return { success: false, error: 'ruleId غير صالح' };

  try {
    const { data: sheets } = await supabase
      .from('sheet')
      .select(
        'sheet_id,sheet_name,total_problems,time_limit,required_score'
      )
      .eq('rule_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    const { data: rule } = await supabase
      .from('rule')
      .select('rule_name')
      .eq('rule_id', id)
      .single();

    return {
      success: true,
      data: {
        rule: rule || { rule_name: '---' },
        sheets: sheets || [],
      },
    };
  } catch {
    return { success: false, error: 'فشل جلب التمارين' };
  }
}