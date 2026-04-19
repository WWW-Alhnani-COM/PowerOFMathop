'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

// ***************************************************************
// 1. جلب القواعد حسب المستوى (مطابق level_rules)
// ***************************************************************

export async function getRulesByLevel(levelId) {
  try {
    const { data, error } = await supabase
      .from('level_rules')
      .select(`
        order_in_level,
        rule:rules (
          rule_id,
          rule_name,
          description,
          icon
        )
      `)
      .eq('level_id', levelId)
      .order('order_in_level', { ascending: true })

    if (error) throw error

    return {
      success: true,
      data: data.map(item => item.rule)
    }

  } catch (error) {
    return { success: false, error: 'فشل في جلب القواعد.' }
  }
}

// ***************************************************************
// 2. تفاصيل القاعدة (مطابقة rules)
// ***************************************************************

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

// ***************************************************************
// 3. أمثلة القاعدة (problem_types - مطابق لقاعدتك)
// ***************************************************************

export async function getRuleExamples(ruleId) {
  try {
    const { data, error } = await supabase
      .from('problem_types')
      .select('template, parameters, difficulty_weight, expected_time')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .limit(3)

    if (error) throw error

    return { success: true, data }

  } catch {
    return { success: false, error: 'فشل في جلب الأمثلة.' }
  }
}

// ***************************************************************
// 4. الشيتات المتاحة (مطابقة sheets)
// ***************************************************************

export async function getAvailableSheets(ruleId) {
  try {
    const { data, error } = await supabase
      .from('sheets')
      .select('sheet_id, sheet_name, total_problems, time_limit, required_score, difficulty_level')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true })

    if (error) throw error

    return { success: true, data }

  } catch {
    return { success: false, error: 'فشل في جلب الشيتات.' }
  }
}

// ***************************************************************
// 5. بدء التدريب (sheet_results مطابق 100% لقاعدتك)
// ***************************************************************

export async function startRulePractice(studentId, ruleId) {
  try {
    const supabaseClient = supabase

    // جلب أول شيت متاح حسب القاعدة
    const { data: sheet, error: sheetError } = await supabaseClient
      .from('sheets')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true })
      .limit(1)
      .single()

    if (sheetError || !sheet) {
      return { success: false, error: 'لا توجد شيتات لهذه القاعدة.' }
    }

    // إنشاء نتيجة جديدة (مطابقة sheet_results)
    const { data: result, error } = await supabaseClient
      .from('sheet_results')
      .insert({
        student_id: studentId,
        sheet_id: sheet.sheet_id,
        total_correct: 0,
        total_wrong: 0,
        total_time_spent: 0,
        score: 0,
        accuracy: 0,
        speed_rate: 0,
        status: 'in_progress',
        start_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/practice')

    return {
      success: true,
      data: {
        resultId: result.result_id,
        sheetId: sheet.sheet_id
      }
    }

  } catch {
    return { success: false, error: 'فشل في بدء التدريب.' }
  }
}
