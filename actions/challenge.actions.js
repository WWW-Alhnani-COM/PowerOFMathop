'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionStudentId, validateSession } from './auth.actions'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

// ***************************************************************
// 1. الثوابت
// ***************************************************************
const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// ===============================================================
// 2. جلب تحديات الطالب
// ===============================================================
export async function getStudentChallenges(filter = 'all') {
  try {
    const studentId = await getSessionStudentId()
    if (!studentId) return { success: false, error: 'يجب تسجيل الدخول', redirect: '/login' }

    const supabase = createClient()

    let query = supabase
      .from('challenges')
      .select(`
        *,
        challenger:students!challenges_challenger_id_fkey(student_id, student_name, total_score),
        challenged:students!challenges_challenged_id_fkey(student_id, student_name, total_score),
        winner:students!challenges_winner_id_fkey(student_name),
        sheet:sheets(
          sheet_id,
          sheet_name,
          difficulty_level,
          required_score,
          time_limit,
          level:levels(level_name, color),
          rule:rules(rule_name, icon)
        )
      `)
      .or(`challenger_id.eq.${studentId},challenged_id.eq.${studentId}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) throw error

    const processed = data.map(c => ({
      ...c,
      sheet: c.sheet ? {
        ...c.sheet,
        difficulty_level: Number(c.sheet.difficulty_level || 1),
        required_score: Number(c.sheet.required_score || 0),
        time_limit: Number(c.sheet.time_limit || 0)
      } : null
    }))

    return { success: true, data: processed }
  } catch (error) {
    return { success: false, error: 'فشل جلب البيانات' }
  }
}

// ===============================================================
// 3. الورقات المتاحة
// ===============================================================
export async function getAvailableSheetsForChallenge() {
  try {
    const session = await validateSession()
    if (!session.success) return session

    const supabase = createClient()

    const { data, error } = await supabase
      .from('sheets')
      .select('sheet_id, sheet_name, level_id, rule_id, total_problems, difficulty_level, time_limit')
      .eq('is_active', true)
      .order('difficulty_level', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل جلب الورقات المتاحة' }
  }
}

// ===============================================================
// 4. تفاصيل التحدي
// ===============================================================
export async function getChallengeDetails(challenge_id) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:students!challenges_challenger_id_fkey(student_id, student_name, total_score),
        challenged:students!challenges_challenged_id_fkey(student_id, student_name, total_score),
        winner:students!challenges_winner_id_fkey(student_name),
        sheet:sheets(
          sheet_id,
          sheet_name,
          level:levels(level_id, level_name, color),
          rule:rules(rule_id, rule_name, icon)
        )
      `)
      .eq('challenge_id', challenge_id)
      .single()

    if (error || !data) {
      return { success: false, error: 'التحدي غير موجود' }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'فشل جلب التفاصيل' }
  }
}

// ===============================================================
// 5. إنشاء تحدي
// ===============================================================
export async function createChallenge({
  sheet_id,
  challenged_id = null,
  challenge_type = 'full_sheet',
  is_public = false,
  time_limit = 10
}) {
  try {
    const session = await validateSession()
    if (!session.success) return session

    const challenger_id = session.data.student_id
    const supabase = createClient()

    // جلب الشيت
    const { data: sheet } = await supabase
      .from('sheets')
      .select('*')
      .eq('sheet_id', sheet_id)
      .single()

    if (!sheet) return { success: false, error: 'الورقة غير موجودة' }

    if (Number(session.data.current_level_id) !== Number(sheet.level_id)) {
      return { success: false, error: 'مستواك لا يسمح' }
    }

    const challenge_code = uuidv4().substring(0, 8).toUpperCase()

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        challenge_code,
        challenger_id,
        challenged_id,
        sheet_id,
        challenge_type,
        status: CHALLENGE_STATUS.PENDING,
        time_limit: time_limit * 60,
        is_public
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/challenges')

    return { success: true, data, message: 'تم إنشاء التحدي' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===============================================================
// 6. الرد على التحدي
// ===============================================================
export async function respondToChallenge(challenge_id, response) {
  try {
    const student_id = await getSessionStudentId()
    const supabase = createClient()

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('challenge_id', challenge_id)
      .single()

    if (!challenge || challenge.challenged_id !== student_id) {
      return { success: false, error: 'غير مصرح' }
    }

    if (response === 'accept') {
      await supabase
        .from('challenge_results')
        .insert([
          { challenge_id, student_id: challenge.challenger_id, score: 0 },
          { challenge_id, student_id: challenge.challenged_id, score: 0 }
        ])

      await supabase
        .from('challenges')
        .update({
          status: CHALLENGE_STATUS.ACCEPTED,
          start_time: new Date()
        })
        .eq('challenge_id', challenge_id)

      return { success: true, message: 'تم القبول' }
    }

    await supabase
      .from('challenges')
      .update({ status: CHALLENGE_STATUS.REJECTED })
      .eq('challenge_id', challenge_id)

    return { success: true, message: 'تم الرفض' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===============================================================
// 7. إرسال إجابة
// ===============================================================
export async function submitChallengeAnswer({
  challenge_id,
  is_correct,
  time_spent
}) {
  try {
    const student_id = await getSessionStudentId()
    const supabase = createClient()

    const { data: result } = await supabase
      .from('challenge_results')
      .select('*')
      .eq('challenge_id', challenge_id)
      .eq('student_id', student_id)
      .single()

    if (!result) throw new Error('لا يوجد سجل')

    const { data } = await supabase
      .from('challenge_results')
      .update({
        score: result.score + (is_correct ? 10 : -2),
        correct_answers: result.correct_answers + (is_correct ? 1 : 0),
        wrong_answers: result.wrong_answers + (is_correct ? 0 : 1),
        total_time: result.total_time + time_spent
      })
      .eq('challenge_result_id', result.challenge_result_id)
      .select()
      .single()

    return { success: true, currentScore: data.score }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===============================================================
// 8. إنهاء التحدي
// ===============================================================
export async function finishChallenge(challenge_id) {
  try {
    const supabase = createClient()

    const { data: results } = await supabase
      .from('challenge_results')
      .select('*')
      .eq('challenge_id', challenge_id)
      .order('score', { ascending: false })

    if (!results || results.length < 2) {
      return { success: false, error: 'بيانات غير كافية' }
    }

    let winner_id = null
    if (results[0].score > results[1].score) {
      winner_id = results[0].student_id
    } else if (results[1].score > results[0].score) {
      winner_id = results[1].student_id
    }

    await supabase
      .from('challenges')
      .update({
        status: CHALLENGE_STATUS.COMPLETED,
        winner_id,
        end_time: new Date()
      })
      .eq('challenge_id', challenge_id)

    if (winner_id) {
      const { data: student } = await supabase
        .from('students')
        .select('total_score, current_streak')
        .eq('student_id', winner_id)
        .single()

      await supabase
        .from('students')
        .update({
          total_score: (student.total_score || 0) + 50,
          current_streak: (student.current_streak || 0) + 1
        })
        .eq('student_id', winner_id)
    }

    revalidatePath('/challenges')

    return { success: true, winner_id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===============================================================
// 9. البحث عن الطلاب
// ===============================================================
export async function searchStudentsForChallenge(query) {
  try {
    const studentId = await getSessionStudentId()
    const supabase = createClient()

    const { data, error } = await supabase
      .from('students')
      .select('student_id, student_name, total_score')
      .ilike('student_name', `%${query}%`)
      .neq('student_id', studentId)
      .limit(10)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}