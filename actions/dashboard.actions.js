'use server'

import { createClient } from '@utils/supabase/server'
import { cookies } from 'next/headers'

// =====================================================
// Supabase Server Client
// =====================================================
function supabaseServer() {
  return createClient(cookies())
}

// =====================================================
// 1. إحصائيات النظام العامة
// =====================================================
export async function getSystemStats() {
  const supabase = supabaseServer()

  try {
    const [
      totalStudents,
      totalBranches,
      totalLevels,
      totalRules,
      totalSheets,
      totalChallenges,
      totalMessages,
      activeStudents
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase.from('levels').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('rules').select('*', { count: 'exact', head: true }),
      supabase.from('sheets').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('challenges').select('*', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ])

    // last 7 days results
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentResults, error } = await supabase
      .from('sheet_results')
      .select('score, accuracy, total_time_spent, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) throw error

    const averageScore =
      recentResults?.length
        ? recentResults.reduce((s, r) => s + (r.score || 0), 0) / recentResults.length
        : 0

    const averageAccuracy =
      recentResults?.length
        ? recentResults.reduce((s, r) => s + (r.accuracy || 0), 0) / recentResults.length
        : 0

    const totalTime =
      recentResults?.reduce((s, r) => s + (r.total_time_spent || 0), 0) || 0

    return {
      success: true,
      data: {
        overview: {
          totalStudents: totalStudents.count || 0,
          totalBranches: totalBranches.count || 0,
          totalLevels: totalLevels.count || 0,
          totalRules: totalRules.count || 0,
          totalSheets: totalSheets.count || 0,
          totalChallenges: totalChallenges.count || 0,
          totalMessages: totalMessages.count || 0,
          activeStudents: activeStudents.count || 0
        },
        performance: {
          averageScore: Math.round(averageScore),
          averageAccuracy: Math.round(averageAccuracy),
          totalPracticeTime: totalTime,
          recentActivities: recentResults?.length || 0
        }
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 2. إحصائيات الطالب
// =====================================================
export async function getStudentDashboardStats(studentId) {
  const supabase = supabaseServer()
  const id = parseInt(studentId)

  if (isNaN(id)) return { success: false, error: 'invalid id' }

  try {
    // student
    const { data: student } = await supabase
      .from('students')
      .select(`
        *,
        level:levels(level_name, level_order, description, color),
        branch:branches(branch_name, location)
      `)
      .eq('student_id', id)
      .single()

    if (!student) return { success: false, error: 'not found' }

    // results
    const { data: sheetResults } = await supabase
      .from('sheet_results')
      .select(`
        *,
        sheet:sheets(
          sheet_name,
          level:levels(level_name),
          rule:rules(rule_name)
        )
      `)
      .eq('student_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // challenges
    const { data: challenges } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:students!challenger_id(student_name),
        challenged:students!challenged_id(student_name),
        winner:students!winner_id(student_name),
        sheet:sheets(sheet_name)
      `)
      .or(`challenger_id.eq.${id},challenged_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(5)

    // unread messages
    const { count: unreadMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', id)
      .is('read_at', null)

    const totalAttempts = await supabase
      .from('sheet_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)

    const completedAttempts = await supabase
      .from('sheet_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'completed')

    const { data: timeAgg } = await supabase
      .from('sheet_results')
      .select('total_time_spent')
      .eq('student_id', id)

    const totalTimeSpent =
      timeAgg?.reduce((s, r) => s + (r.total_time_spent || 0), 0) || 0

    return {
      success: true,
      data: {
        student,
        stats: {
          totalAttempts: totalAttempts.count || 0,
          completedAttempts: completedAttempts.count || 0,
          completionRate:
            totalAttempts.count > 0
              ? Math.round((completedAttempts.count / totalAttempts.count) * 100)
              : 0,
          totalTimeSpent,
          currentStreak: student.current_streak,
          bestStreak: student.best_streak,
          unreadMessages: unreadMessages || 0,
          totalScore: student.total_score
        },
        recentResults: sheetResults || [],
        recentChallenges: challenges || []
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// باقي الدوال (مختصرة للحجم)
// =====================================================

// الأنشطة الحديثة
export async function getRecentActivities(studentId) {
  const supabase = supabaseServer()
  const id = parseInt(studentId)

  try {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*, sender:students(student_name)')
      .eq('receiver_id', id)
      .is('read_at', null)
      .limit(5)

    const { data: results } = await supabase
      .from('sheet_results')
      .select('*, sheet:sheets(sheet_name)')
      .eq('student_id', id)
      .order('created_at', { ascending: false })
      .limit(5)

    const activities = [
      ...(results || []).map(r => ({
        type: 'sheet',
        title: `نتيجة: ${r.sheet?.sheet_name}`,
        score: r.score,
        date: r.created_at
      })),
      ...(messages || []).map(m => ({
        type: 'message',
        title: `رسالة من ${m.sender?.student_name}`,
        text: m.message_text,
        date: m.created_at
      }))
    ]

    return { success: true, data: activities }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// التقدم الشهري (مختصر)
export async function getMonthlyProgress(studentId) {
  const supabase = supabaseServer()
  const id = parseInt(studentId)

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const { data } = await supabase
    .from('sheet_results')
    .select('*')
    .eq('student_id', id)
    .gte('created_at', oneMonthAgo.toISOString())

  return {
    success: true,
    data: data || []
  }
}

// الأهداف
export async function getStudentGoals(studentId) {
  const supabase = supabaseServer()
  const id = parseInt(studentId)

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', id)
    .single()

  return {
    success: true,
    data: {
      scoreGoal: 5000,
      current: student?.total_score || 0,
      streak: student?.current_streak || 0
    }
  }
}

// اقتراحات التعلم
export async function getLearningSuggestions(studentId) {
  const supabase = supabaseServer()
  const id = parseInt(studentId)

  const { data: weakRules } = await supabase
    .from('performance_analytics')
    .select('*, rule:rules(rule_name)')
    .eq('student_id', id)
    .gt('weakness_score', 50)
    .order('weakness_score', { ascending: false })

  return {
    success: true,
    data: weakRules || []
  }
}