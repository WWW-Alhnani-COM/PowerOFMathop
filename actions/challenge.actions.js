'use server'

import { createClient } from '../lib/supabaseServer'
import { getSessionStudentId, validateSession } from './auth.actions'
import { v4 as uuidv4 } from 'uuid'

// =====================================================
// Helper Supabase (SSR آمن)
// =====================================================
function getSupabase() {
  return createClient()
}

// =====================================================
// الثوابت
// =====================================================
export const CHALLENGE_TYPES = {
  QUICK: 'quick',
  FULL_SHEET: 'full_sheet',
  RULE_BASED: 'rule_based',
  CUSTOM: 'custom'
}

export const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// =====================================================
// Helper: حساب الدقة
// =====================================================
async function calculateAccuracy(resultId) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('answer_detail')
    .select('is_correct')
    .eq('result_id', resultId)

  if (error || !data?.length) return 0

  const correct = data.filter(r => r.is_correct === true).length
  return (correct / data.length) * 100
}

// =====================================================
// Helper: streak
// =====================================================
async function calculateBestStreak(studentId, isWin) {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('students')
    .select('current_streak, best_streak')
    .eq('student_id', studentId)
    .single()

  if (!data) return 0

  if (!isWin) return data.best_streak || 0

  const newStreak = (data.current_streak || 0) + 1
  return Math.max(data.best_streak || 0, newStreak)
}

// =====================================================
// 1. جلب تحديات الطالب
// =====================================================
export async function getStudentChallenges(filter = 'all') {
  try {
    const supabase = getSupabase()
    const studentId = await getSessionStudentId()

    if (!studentId) {
      return { success: false, error: 'يجب تسجيل الدخول' }
    }

    let query = supabase
      .from('challenge')
      .select(`
        *,
        challenger:students!challenger_id(*),
        challenged:students!challenged_id(*),
        winner:students!winner_id(*),
        sheet:sheet(*)
      `)
      .or(`challenger_id.eq.${studentId},challenged_id.eq.${studentId}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) throw error

    const processed = (data || []).map(c => ({
      ...c,
      sheet: c.sheet
        ? {
            ...c.sheet,
            difficulty_level: Number(c.sheet.difficulty_level || 0),
            required_score: Number(c.sheet.required_score || 0),
            time_limit: Number(c.sheet.time_limit || 0)
          }
        : null
    }))

    const completed = processed.filter(c => c.status === 'completed').length
    const wins = processed.filter(c => c.winner_id === studentId).length

    return {
      success: true,
      data: {
        challenges: processed,
        statistics: {
          total: processed.length,
          completed,
          wins,
          winRate: completed ? (wins / completed) * 100 : 0
        }
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 2. إنشاء تحدي
// =====================================================
export async function createChallenge(params) {
  try {
    const supabase = getSupabase()
    const session = await validateSession()

    if (!session.success) return session

    const challenger_id = session.data.student_id

    const { data: sheet } = await supabase
      .from('sheet')
      .select('*')
      .eq('sheet_id', params.sheet_id)
      .single()

    if (!sheet) {
      return { success: false, error: 'الورقة غير موجودة' }
    }

    if (session.data.current_level_id !== sheet.level_id) {
      return { success: false, error: 'يجب أن تكون في نفس المستوى' }
    }

    if (params.challenged_id) {
      const { data: existing } = await supabase
        .from('challenge')
        .select('*')
        .or(
          `and(challenger_id.eq.${challenger_id},challenged_id.eq.${params.challenged_id}),and(challenger_id.eq.${params.challenged_id},challenged_id.eq.${challenger_id})`
        )
        .in('status', ['pending', 'accepted', 'in_progress'])
        .maybeSingle()

      if (existing) {
        return { success: false, error: 'يوجد تحدي قائم' }
      }
    }

    const { data, error } = await supabase
      .from('challenge')
      .insert({
        challenge_code: uuidv4().slice(0, 8).toUpperCase(),
        challenger_id,
        challenged_id: params.challenged_id || null,
        sheet_id: params.sheet_id,
        challenge_type: params.challenge_type || CHALLENGE_TYPES.FULL_SHEET,
        status: CHALLENGE_STATUS.PENDING,
        time_limit: (params.time_limit || 10) * 60,
        is_public: params.is_public || false
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 3. التحديات العامة
// =====================================================
export async function getPublicChallenges() {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*)`)
    .eq('is_public', true)
    .eq('status', CHALLENGE_STATUS.PENDING)

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 4. تفاصيل التحدي
// =====================================================
export async function getChallengeDetails(challenge_id) {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*), challenger:students!*, challenged:students!*`)
    .eq('challenge_id', challenge_id)
    .single()

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 5. الرد على التحدي
// =====================================================
export async function respondToChallenge(challenge_id, response) {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const status =
    response === 'accept'
      ? CHALLENGE_STATUS.ACCEPTED
      : CHALLENGE_STATUS.REJECTED

  const { data, error } = await supabase
    .from('challenge')
    .update({
      status,
      start_time:
        response === 'accept' ? new Date(Date.now() + 5000) : null,
      end_time: response === 'reject' ? new Date() : null
    })
    .eq('challenge_id', challenge_id)
    .select()
    .single()

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 6. إلغاء التحدي
// =====================================================
export async function cancelChallenge(challenge_id) {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .update({
      status: CHALLENGE_STATUS.CANCELLED,
      end_time: new Date()
    })
    .eq('challenge_id', challenge_id)
    .select()

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 7. التحديات النشطة
// =====================================================
export async function getActiveChallenges() {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const id = session.data.student_id

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*)`)
    .or(`challenger_id.eq.${id},challenged_id.eq.${id}`)
    .in('status', [
      CHALLENGE_STATUS.PENDING,
      CHALLENGE_STATUS.ACCEPTED,
      CHALLENGE_STATUS.IN_PROGRESS
    ])

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 8. أوراق التحدي
// =====================================================
export async function getAvailableSheetsForChallenge() {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('sheet')
    .select(`*, level:levels(*)`)
    .eq('level_id', session.data.current_level_id)
    .eq('is_active', true)

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 9. بدء التحدي
// =====================================================
export async function startChallenge(challenge_id) {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .update({
      status: CHALLENGE_STATUS.IN_PROGRESS,
      start_time: new Date()
    })
    .eq('challenge_id', challenge_id)
    .select()

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 10. البحث عن الطلاب
// =====================================================
export async function searchStudentsForChallenge(query) {
  const supabase = getSupabase()
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('students')
    .select(`*, levels(*)`)
    .ilike('student_name', `%${query}%`)
    .neq('student_id', session.data.student_id)
    .limit(10)

  return error
    ? { success: false, error: error.message }
    : { success: true, data }
}

// =====================================================
// 11. submit answer
// =====================================================
export async function submitChallengeAnswer(payload) {
  try {
    const supabase = getSupabase()
    const session = await validateSession()
    if (!session.success) return session

    const student_id = session.data.student_id

    const { data: result } = await supabase
      .from('challenge_result')
      .select('*')
      .eq('challenge_id', payload.challenge_id)
      .eq('student_id', student_id)
      .single()

    if (!result) {
      return { success: false, error: 'لا توجد نتيجة' }
    }

    const accuracy = await calculateAccuracy(result.sheet_result_id)

    const { error } = await supabase
      .from('sheet_result')
      .update({
        total_correct: payload.is_correct
          ? result.total_correct + 1
          : result.total_correct,
        total_wrong: !payload.is_correct
          ? result.total_wrong + 1
          : result.total_wrong,
        total_time_spent:
          result.total_time_spent + payload.time_spent,
        accuracy
      })
      .eq('result_id', result.sheet_result_id)

    if (error) throw error

    return { success: true, message: 'تم الحفظ' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 12. إكمال التحدي
// =====================================================
export async function completeChallenge(challenge_id, results) {
  try {
    const supabase = getSupabase()
    const session = await validateSession()
    if (!session.success) return session

    const student_id = session.data.student_id

    await supabase
      .from('challenge')
      .update({
        status: CHALLENGE_STATUS.COMPLETED,
        end_time: new Date()
      })
      .eq('challenge_id', challenge_id)

    const bestStreak = await calculateBestStreak(
      student_id,
      results.score > 50
    )

    await supabase
      .from('students')
      .update({
        total_score: results.score,
        current_streak: results.score > 50 ? 1 : 0,
        best_streak: bestStreak
      })
      .eq('student_id', student_id)

    return { success: true, message: 'تم الإكمال' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// الثوابت export
// =====================================================
export const getChallengeTypes = () => CHALLENGE_TYPES
export const getChallengeStatus = () => CHALLENGE_STATUS
