// src/actions/challenge.actions.js - Supabase Version (FULL + FIXED)
'use server'

import { createClient } from '@supabase/supabase-js'
import { getSessionStudentId, validateSession } from './auth.actions'
import { v4 as uuidv4 } from 'uuid'

// ***************************************************************
// Supabase Client
// ***************************************************************

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

// ***************************************************************
// الثوابت
// ***************************************************************

const CHALLENGE_TYPES = {
  QUICK: 'quick',
  FULL_SHEET: 'full_sheet',
  RULE_BASED: 'rule_based',
  CUSTOM: 'custom'
}

const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

// ***************************************************************
// Helper Functions (مضافة بشكل صحيح)
// ***************************************************************

async function calculateAccuracy(result_id) {
  try {
    const { data, error } = await supabase
      .from('answer_detail')
      .select('is_correct')
      .eq('result_id', result_id)

    if (error) throw error
    if (!data || data.length === 0) return 0

    const correct = data.filter(a => a.is_correct === true).length
    const total = data.length

    return (correct / total) * 100
  } catch (error) {
    console.error('calculateAccuracy error:', error)
    return 0
  }
}

async function calculateBestStreak(student_id, currentWin) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('current_streak, best_streak')
      .eq('student_id', student_id)
      .single()

    if (error || !data) return 0

    if (currentWin) {
      const newStreak = (data.current_streak || 0) + 1
      return Math.max(data.best_streak || 0, newStreak)
    }

    return data.best_streak || 0
  } catch (error) {
    console.error('calculateBestStreak error:', error)
    return 0
  }
}

// ***************************************************************
// Helper
// ***************************************************************

function toNumber(value, fallback = 0) {
  return value !== null && value !== undefined ? Number(value) : fallback
}

// ***************************************************************
// 1. جلب تحديات الطالب
// ***************************************************************

export async function getStudentChallenges(filter = 'all') {
  try {
    const studentId = await getSessionStudentId()
    if (!studentId) return { success: false, error: 'يجب تسجيل الدخول' }

    let query = supabase
      .from('challenge')
      .select(`
        *,
        challenger:students!challenge_challenger_id_fkey(*),
        challenged:students!challenge_challenged_id_fkey(*),
        winner:students!challenge_winner_id_fkey(*),
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
      sheet: c.sheet ? {
        ...c.sheet,
        difficulty_level: toNumber(c.sheet.difficulty_level),
        required_score: toNumber(c.sheet.required_score),
        time_limit: toNumber(c.sheet.time_limit)
      } : null
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

// ***************************************************************
// 2. إنشاء تحدي
// ***************************************************************

export async function createChallenge(params) {
  try {
    const session = await validateSession()
    if (!session.success) return session

    const challenger_id = session.data.student_id

    const { data: sheet } = await supabase
      .from('sheet')
      .select('*')
      .eq('sheet_id', params.sheet_id)
      .single()

    if (!sheet) return { success: false, error: 'الورقة غير موجودة' }

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
        challenged_id: params.challenged_id,
        sheet_id: params.sheet_id,
        challenge_type: params.challenge_type || 'full_sheet',
        status: 'pending',
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

// ***************************************************************
// 3 - 9 باقي الدوال (مختصرة بدون تغيير المنطق الأساسي)
// ***************************************************************

export async function getPublicChallenges() {
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*)`)
    .eq('is_public', true)
    .eq('status', 'pending')

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function getChallengeDetails(challenge_id) {
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*), challenger:students!*, challenged:students!*`)
    .eq('challenge_id', challenge_id)
    .single()

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function respondToChallenge(challenge_id, response) {
  const session = await validateSession()
  if (!session.success) return session

  const status = response === 'accept' ? 'accepted' : 'rejected'

  const { data, error } = await supabase
    .from('challenge')
    .update({
      status,
      start_time: response === 'accept' ? new Date(Date.now() + 5000) : null,
      end_time: response === 'reject' ? new Date() : null
    })
    .eq('challenge_id', challenge_id)
    .select()
    .single()

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function cancelChallenge(challenge_id) {
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .update({ status: 'cancelled', end_time: new Date() })
    .eq('challenge_id', challenge_id)
    .select()

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function getActiveChallenges() {
  const session = await validateSession()
  if (!session.success) return session

  const id = session.data.student_id

  const { data, error } = await supabase
    .from('challenge')
    .select(`*, sheet:sheet(*)`)
    .or(`challenger_id.eq.${id},challenged_id.eq.${id}`)
    .in('status', ['pending', 'accepted', 'in_progress'])

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function getAvailableSheetsForChallenge() {
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('sheet')
    .select(`*, level:levels(*)`)
    .eq('level_id', session.data.current_level_id)
    .eq('is_active', true)

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function startChallenge(challenge_id) {
  const session = await validateSession()
  if (!session.success) return session

  const { data, error } = await supabase
    .from('challenge')
    .update({ status: 'in_progress', start_time: new Date() })
    .eq('challenge_id', challenge_id)
    .select()

  return error ? { success: false, error: error.message } : { success: true, data }
}

export async function searchStudentsForChallenge(query, excludeCurrent = true) {
  const session = await validateSession()
  if (!session.success) return session

  let q = supabase
    .from('students')
    .select(`*, levels(*)`)
    .ilike('student_name', `%${query}%`)
    .limit(10)

  if (excludeCurrent) {
    q = q.neq('student_id', session.data.student_id)
  }

  const { data, error } = await q

  return error ? { success: false, error: error.message } : { success: true, data }
}

// ***************************************************************
// 10. submitChallengeAnswer (مع الدالة المساعدة)
// ***************************************************************

export async function submitChallengeAnswer(payload) {
  try {
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
        total_correct: payload.is_correct ? result.total_correct + 1 : result.total_correct,
        total_wrong: !payload.is_correct ? result.total_wrong + 1 : result.total_wrong,
        total_time_spent: result.total_time_spent + payload.time_spent,
        accuracy
      })
      .eq('result_id', result.sheet_result_id)

    if (error) throw error

    return { success: true, message: 'تم الحفظ' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ***************************************************************
// 11. completeChallenge
// ***************************************************************

export async function completeChallenge(challenge_id, results) {
  try {
    const session = await validateSession()
    if (!session.success) return session

    const student_id = session.data.student_id

    await supabase
      .from('challenge')
      .update({ status: 'completed', end_time: new Date() })
      .eq('challenge_id', challenge_id)

    const bestStreak = await calculateBestStreak(student_id, results.score > 50)

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

// ***************************************************************
// الثوابت
// ***************************************************************

export async function getChallengeTypes() {
  return CHALLENGE_TYPES
}

export async function getChallengeStatus() {
  return CHALLENGE_STATUS
}

export async function getCHALLENGE_TYPES() {
  return CHALLENGE_TYPES
}

export async function getCHALLENGE_STATUS() {
  return CHALLENGE_STATUS
}