'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ***************************************************************
// 4. إدارة القواعد واختيارها (Supabase)
// ***************************************************************

export async function getRulesByLevel(levelId) {
  try {
    const { data, error } = await supabase
      .from('level_rules')
      .select(`
        rule:rules(rule_id, rule_name, description, icon)
      `)
      .eq('level_id', levelId)
      .order('order_in_level')

    if (error) throw error

    return {
      success: true,
      data: data.map(r => r.rule)
    }
  } catch {
    return { success: false, error: 'فشل في جلب القواعد.' }
  }
}

export async function getRuleDetails(ruleId) {
  try {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('rule_id', ruleId)
      .single()

    if (error || !data) {
      return { success: false, error: 'القاعدة غير موجودة.' }
    }

    return { success: true, data }
  } catch {
    return { success: false, error: 'فشل في جلب تفاصيل القاعدة.' }
  }
}

export async function getRuleExamples(ruleId) {
  try {
    const { data, error } = await supabase
      .from('problem_types')
      .select('template, parameters, difficulty_weight')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .limit(3)

    if (error) throw error

    return { success: true, data }
  } catch {
    return { success: false, error: 'فشل في جلب الأمثلة.' }
  }
}

export async function getAvailableSheets(ruleId) {
  try {
    const { data, error } = await supabase
      .from('sheets')
      .select('sheet_id, sheet_name, total_problems, time_limit, difficulty_level')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .order('difficulty_level')

    if (error) throw error

    return { success: true, data }
  } catch {
    return { success: false, error: 'فشل في جلب الشيتات.' }
  }
}

export async function startRulePractice(studentId, ruleId) {
  try {
    const { data: sheet } = await supabase
      .from('sheets')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .order('difficulty_level')
      .limit(1)
      .single()

    if (!sheet) {
      return { success: false, error: 'لا توجد شيتات.' }
    }

    const { data: result, error } = await supabase
      .from('sheet_results')
      .insert({
        student_id: studentId,
        sheet_id: sheet.sheet_id,
        total_time_spent: sheet.time_limit,
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/practice')

    return {
      success: true,
      data: { resultId: result.result_id, sheetId: sheet.sheet_id }
    }
  } catch {
    return { success: false, error: 'فشل في بدء التدريب.' }
  }
}