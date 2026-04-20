'use server'

import { createClient } from '@supabase/supabase-js'
import { validateSession } from './auth.actions'

/**
 * Supabase client (Service Role)
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

/**
 * Helper: safe JSON stringify
 */
const safeStringify = (value) => {
  try {
    return value ? JSON.stringify(value) : null
  } catch {
    return null
  }
}

/**
 * Helper: safe JSON parse
 */
const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return value
  }
}

/**
 * submitAnswer - مطابق لقاعدة بياناتك
 */
export async function submitAnswer({
  result_id,
  problem,
  user_answer,
  time_spent,
  sequence_number
}) {
  try {
    // التحقق من الجلسة
    const session = await validateSession()
    if (!session.success) return session

    // التحقق من الإجابة
    const is_correct =
      String(user_answer) === String(problem.correct_answer)

    // إدخال البيانات في answer_details (مطابق للـ schema)
    const { data, error } = await supabase
      .from('answer_details')
      .insert({
        result_id: result_id, // sheet_results.result_id
        problem_type_id: problem?.problem_type_id ?? null, // problem_types
        problem_data: safeStringify(problem),
        user_answer: String(user_answer),
        correct_answer: String(problem.correct_answer),
        time_spent: time_spent,
        is_correct: is_correct,
        sequence_number: sequence_number
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: {
        ...data,
        problem_data: safeParse(data.problem_data)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'فشل في إرسال الإجابة'
    }
  }
}
