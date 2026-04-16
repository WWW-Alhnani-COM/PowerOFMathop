'use server'

import { createClient } from '@supabase/supabase-js'
import { validateSession } from './auth.actions'

/**
 * Supabase Client
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

/**
 * Safe helpers
 */
const safeParse = (v) => {
  try {
    return v ? JSON.parse(v) : null
  } catch {
    return v
  }
}

/**
 * 1. تقرير الطالب الشامل
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

    // جلب الطالب
    const { data: student, error: studentError } = await supabase
      .from('student')
      .select('student_name, total_score, current_level_id')
      .eq('student_id', studentId)
      .single()

    if (studentError || !student) {
      return { success: false, error: 'الطالب غير موجود.' }
    }

    // جلب نتائج الشيتات
    const { data: sheetResults, error: sheetError } = await supabase
      .from('sheet_result')
      .select('score, total_correct, total_wrong, total_time_spent')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())

    if (sheetError) {
      return { success: false, error: sheetError.message }
    }

    const totalSheets = sheetResults?.length || 0

    const avgScore =
      totalSheets > 0
        ? sheetResults.reduce((s, r) => s + (r.score || 0), 0) / totalSheets
        : 0

    const totalCorrect = sheetResults.reduce(
      (s, r) => s + (r.total_correct || 0),
      0
    )

    const totalWrong = sheetResults.reduce(
      (s, r) => s + (r.total_wrong || 0),
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
    return { success: false, error: 'فشل في جلب تقرير الطالب.' }
  }
}

/**
 * 2. تقرير التقدم
 */
export async function getProgressReport(studentId) {
  try {
    const { data, error } = await supabase
      .from('performance_analytic')
      .select(`
        *,
        rule:rule(rule_id, rule_name)
      `)
      .eq('student_id', studentId)
      .order('mastery_level', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل في جلب تقرير التقدم.' }
  }
}

/**
 * 3. أنماط الأخطاء
 */
export async function getErrorPatterns(studentId) {
  try {
    const { data, error } = await supabase
      .from('answer_detail')
      .select(`
        is_correct,
        user_answer,
        sheet_result!inner(student_id),
        problemType:problem_type(
          rule_id,
          rule:rule(rule_name)
        )
      `)
      .eq('sheet_result.student_id', studentId)
      .eq('is_correct', false)
      .neq('user_answer', 'SKIPPED')

    if (error) throw error

    const errorCounts = {}

    data.forEach((d) => {
      const ruleId = d.problemType?.rule_id
      const ruleName = d.problemType?.rule?.rule_name

      if (!ruleId) return

      if (!errorCounts[ruleId]) {
        errorCounts[ruleId] = {
          ruleName,
          count: 0
        }
      }

      errorCounts[ruleId].count++
    })

    const result = Object.values(errorCounts).sort(
      (a, b) => b.count - a.count
    )

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: 'فشل في جلب أنماط الأخطاء.' }
  }
}

/**
 * 4. توصيات الذكاء الاصطناعي
 */
export async function getAiRecommendations(studentId) {
  try {
    const { data, error } = await supabase
      .from('ai_suggestion')
      .select(`
        *,
        suggestedRule:rule(rule_name),
        suggestedLevel:level(level_name)
      `)
      .eq('student_id', studentId)
      .order('is_applied', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: 'فشل في جلب توصيات الذكاء الاصطناعي.'
    }
  }
}

/**
 * 5. تعليقات المشرفين (Mock أو جدول اختياري)
 */
export async function getSupervisorComments(studentId) {
  try {
    const { data, error } = await supabase
      .from('supervisor_comment')
      .select('*')
      .eq('student_id', studentId)

    if (error) {
      return {
        success: true,
        data: [
          {
            id: 1,
            text: 'تقدم ممتاز في القواعد الأساسية.',
            date: new Date()
          },
          {
            id: 2,
            text: 'تحسن في السرعة يحتاج تعزيز.',
            date: new Date()
          }
        ]
      }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: 'فشل في جلب تعليقات المشرفين.'
    }
  }
}

/**
 * 6. تقرير دوري شامل
 */
export async function generatePeriodicReport(studentId, periodType) {
  try {
    const reportPeriod =
      periodType === 'quarterly'
        ? 'month'
        : periodType === 'biannual'
          ? 'month'
          : 'month'

    const [report, progress, errors] = await Promise.all([
      getStudentReport(studentId, reportPeriod),
      getProgressReport(studentId),
      getErrorPatterns(studentId)
    ])

    const comprehensiveReport = {
      summary: report.data,
      detailedProgress: progress.data,
      topErrorPatterns: errors.data,
      generationDate: new Date().toISOString(),
      periodType
    }

    return { success: true, data: comprehensiveReport }
  } catch (error) {
    return {
      success: false,
      error: 'فشل في توليد التقرير الدوري.'
    }
  }
}