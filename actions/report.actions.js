'use server'

import { createClient } from '@supabase/supabase-js'
import { validateSession } from './auth.actions'

/**
 * Supabase Client
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * =========================
 * 1. تقرير الطالب الشامل
 * =========================
 */
export async function getStudentReport(studentId, period = 'month') {
  try {
    const session = await validateSession()
    if (!session.success) return session

    const now = new Date()
    let startDate

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    } else {
      startDate = new Date(0)
    }

    // 👤 الطالب
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id, student_name, total_score, current_level_id')
      .eq('student_id', studentId)
      .single()

    if (studentError || !student) {
      return { success: false, error: 'الطالب غير موجود' }
    }

    // 📄 نتائج الشيتات
    const { data: results, error: resultsError } = await supabase
      .from('sheet_results')
      .select(`
        score,
        total_correct,
        total_wrong,
        total_time_spent,
        created_at
      `)
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())

    if (resultsError) {
      return { success: false, error: resultsError.message }
    }

    const totalSheets = results?.length || 0

    const avgScore =
      totalSheets > 0
        ? results.reduce((sum, r) => sum + (r.score || 0), 0) / totalSheets
        : 0

    const totalCorrect = results.reduce(
      (sum, r) => sum + (r.total_correct || 0),
      0
    )

    const totalWrong = results.reduce(
      (sum, r) => sum + (r.total_wrong || 0),
      0
    )

    const avgAccuracy =
      totalCorrect + totalWrong > 0
        ? (totalCorrect / (totalCorrect + totalWrong)) * 100
        : 0

    return {
      success: true,
      data: {
        studentName: student.student_name,
        totalScore: student.total_score,
        period,
        totalSheets,
        avgScore: Number(avgScore.toFixed(2)),
        avgAccuracy: Number(avgAccuracy.toFixed(2))
      }
    }
  } catch (error) {
    return { success: false, error: 'فشل في جلب تقرير الطالب' }
  }
}

/**
 * =========================
 * 2. تقرير الأداء (Performance Analytics)
 * =========================
 */
export async function getProgressReport(studentId) {
  try {
    const { data, error } = await supabase
      .from('performance_analytics')
      .select(`
        analysis_id,
        student_id,
        rule_id,
        total_attempts,
        correct_attempts,
        average_time,
        weakness_score,
        improvement_rate,
        mastery_level,
        last_practiced,
        rule:rules(rule_id, rule_name)
      `)
      .eq('student_id', studentId)
      .order('weakness_score', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل في جلب تقرير التقدم' }
  }
}

/**
 * =========================
 * 3. أنماط الأخطاء
 * =========================
 */
export async function getErrorPatterns(studentId) {
  try {
    const { data, error } = await supabase
      .from('answer_details')
      .select(`
        is_correct,
        user_answer,
        sheet_results!inner(student_id),
        problem_types(
          rule_id,
          rule:rules(rule_name)
        )
      `)
      .eq('sheet_results.student_id', studentId)
      .eq('is_correct', false)
      .neq('user_answer', 'SKIPPED')

    if (error) {
      return { success: false, error: error.message }
    }

    const map = {}

    data.forEach((item) => {
      const ruleId = item.problem_types?.rule_id
      const ruleName = item.problem_types?.rule?.rule_name

      if (!ruleId) return

      if (!map[ruleId]) {
        map[ruleId] = {
          ruleId,
          ruleName,
          count: 0
        }
      }

      map[ruleId].count++
    })

    return {
      success: true,
      data: Object.values(map).sort((a, b) => b.count - a.count)
    }
  } catch (error) {
    return { success: false, error: 'فشل في تحليل الأخطاء' }
  }
}

/**
 * =========================
 * 4. توصيات الذكاء الاصطناعي
 * =========================
 */
export async function getAiRecommendations(studentId) {
  try {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select(`
        suggestion_id,
        student_id,
        suggested_rule_id,
        suggested_level_id,
        reason,
        confidence_score,
        priority,
        is_applied,
        created_at,
        applied_at,
        suggestedRule:rules(rule_name),
        suggestedLevel:levels(level_name)
      `)
      .eq('student_id', studentId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل في جلب التوصيات' }
  }
}

/**
 * =========================
 * 5. تعليقات المشرف (Mock)
 * =========================
 * (لأن الجدول غير موجود في قاعدة بياناتك)
 */
export async function getSupervisorComments(studentId) {
  return {
    success: true,
    data: [
      {
        id: 1,
        student_id: studentId,
        text: 'تقدم ممتاز في القواعد الأساسية',
        created_at: new Date()
      },
      {
        id: 2,
        student_id: studentId,
        text: 'يحتاج تحسين في السرعة',
        created_at: new Date()
      }
    ]
  }
}

/**
 * =========================
 * 6. تقرير شامل (Dashboard)
 * =========================
 */
export async function generatePeriodicReport(studentId, periodType = 'monthly') {
  try {
    const [report, progress, errors, ai] = await Promise.all([
      getStudentReport(studentId, periodType === 'weekly' ? 'week' : 'month'),
      getProgressReport(studentId),
      getErrorPatterns(studentId),
      getAiRecommendations(studentId)
    ])

    return {
      success: true,
      data: {
        summary: report.data,
        progress: progress.data,
        errorPatterns: errors.data,
        aiRecommendations: ai.data,
        generatedAt: new Date().toISOString(),
        periodType
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'فشل في توليد التقرير الشامل'
    }
  }
}
