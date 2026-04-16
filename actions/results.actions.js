'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

// ***************************************************************
// 6. نتائج الشيتات وتحليلها (Supabase)
// ***************************************************************

export async function getSheetResults(resultId) {
  try {
    const { data: sheetResult, error } = await supabase
      .from('sheet_results')
      .select(`
        *,
        student:students(student_name),
        sheet:sheets(sheet_name, total_problems, required_score),
        answerDetails:answer_details(
          sequence_number,
          is_correct,
          time_spent,
          user_answer,
          correct_answer
        )
      `)
      .eq('result_id', resultId)
      .eq('status', 'completed')
      .single()

    if (error || !sheetResult) {
      return { success: false, error: 'نتيجة الشيت غير موجودة أو لم تكتمل بعد.' }
    }

    return { success: true, data: sheetResult }
  } catch (error) {
    return { success: false, error: 'فشل في جلب نتائج الشيت.' }
  }
}

export async function calculateSheetStats(resultId) {
  try {
    const { data: details, error } = await supabase
      .from('answer_details')
      .select('*')
      .eq('result_id', resultId)

    if (error) throw error

    const totalAnswers = details.length
    const totalCorrect = details.filter(d => d.is_correct).length
    const totalWrong = totalAnswers - totalCorrect
    const totalTime = details.reduce((s, d) => s + (d.time_spent || 0), 0)

    const accuracy = totalAnswers ? (totalCorrect / totalAnswers) * 100 : 0
    const speedRate = totalTime ? totalAnswers / totalTime : 0

    return {
      success: true,
      data: { totalAnswers, totalCorrect, totalWrong, totalTime, accuracy, speedRate }
    }
  } catch {
    return { success: false, error: 'فشل في حساب الإحصائيات.' }
  }
}

export async function saveSheetResults(resultId, finalData) {
  try {
    const { data, error } = await supabase
      .from('sheet_results')
      .update({
        end_time: new Date().toISOString(),
        ...finalData
      })
      .eq('result_id', resultId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/results/${resultId}`)

    return { success: true, data }
  } catch {
    return { success: false, error: 'فشل في حفظ النتائج النهائية.' }
  }
}

export async function getPerformanceAnalysis(studentId, resultId) {
  try {
    const { data: wrongAnswers, error } = await supabase
      .from('answer_details')
      .select(`
        problemType:problem_types(
          rule_id,
          rule:rules(rule_name)
        )
      `)
      .eq('result_id', resultId)
      .eq('is_correct', false)

    if (error) throw error

    const errorsByRule = {}

    wrongAnswers.forEach(d => {
      const ruleId = d.problemType.rule_id
      const ruleName = d.problemType.rule.rule_name

      if (!errorsByRule[ruleId]) {
        errorsByRule[ruleId] = { ruleName, count: 0 }
      }
      errorsByRule[ruleId].count++
    })

    const ruleIds = Object.keys(errorsByRule)

    for (const ruleId of ruleIds) {
      const item = errorsByRule[ruleId]

      const { data: existing } = await supabase
        .from('performance_analytics')
        .select('*')
        .eq('student_id', studentId)
        .eq('rule_id', ruleId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('performance_analytics')
          .update({
            total_attempts: existing.total_attempts + item.count,
            weakness_score: existing.weakness_score + item.count * 0.5
          })
          .eq('id', existing.id)
      } else {
        await supabase.from('performance_analytics').insert({
          student_id: studentId,
          rule_id: ruleId,
          total_attempts: item.count,
          weakness_score: item.count * 0.5
        })
      }
    }

    return { success: true, data: errorsByRule }
  } catch {
    return { success: false, error: 'فشل في تحليل الأداء.' }
  }
}

export async function getRecommendations(studentId) {
  try {
    const { data: weakRules } = await supabase
      .from('performance_analytics')
      .select(`
        rule_id,
        weakness_score,
        mastery_level,
        rule:rules(rule_name)
      `)
      .eq('student_id', studentId)
      .gt('weakness_score', 0)
      .order('weakness_score', { ascending: false })
      .limit(3)

    const suggestions = weakRules.map(w => ({
      ruleId: w.rule_id,
      ruleName: w.rule.rule_name,
      reason: `ضعف في ${w.rule.rule_name} (${w.weakness_score})`,
      priority: 5
    }))

    for (const s of suggestions) {
      await supabase.from('ai_suggestions').insert({
        student_id: studentId,
        suggested_rule_id: s.ruleId,
        reason: s.reason,
        priority: s.priority
      })
    }

    return { success: true, data: suggestions }
  } catch {
    return { success: false, error: 'فشل في جلب التوصيات.' }
  }
}