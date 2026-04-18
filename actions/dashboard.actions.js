'use server'

import { createClient } from '../lib/supabaseServer'

// =====================================================
// Helper (موحد وصحيح)
// =====================================================
function getSupabase() {
  return createClient()
}

// =====================================================
// 1. إحصائيات النظام العامة
// =====================================================
export async function getSystemStats() {
  const supabase = getSupabase()

  try {
    const [
      { count: totalStudents },
      { count: totalBranches },
      { count: totalLevels },
      { count: totalRules },
      { count: totalSheets },
      { count: totalChallenges },
      { count: totalMessages },
      { count: activeStudents }
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

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentResults, error } = await supabase
      .from('sheet_results')
      .select('score, accuracy, total_time_spent, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) throw error

    const total = recentResults?.length || 0

    const averageScore = total
      ? recentResults.reduce((s, r) => s + (r.score || 0), 0) / total
      : 0

    const averageAccuracy = total
      ? recentResults.reduce((s, r) => s + (r.accuracy || 0), 0) / total
      : 0

    const totalTime = recentResults
      ? recentResults.reduce((s, r) => s + (r.total_time_spent || 0), 0)
      : 0

    return {
      success: true,
      data: {
        overview: {
          totalStudents: totalStudents || 0,
          totalBranches: totalBranches || 0,
          totalLevels: totalLevels || 0,
          totalRules: totalRules || 0,
          totalSheets: totalSheets || 0,
          totalChallenges: totalChallenges || 0,
          totalMessages: totalMessages || 0,
          activeStudents: activeStudents || 0
        },
        performance: {
          averageScore: Math.round(averageScore),
          averageAccuracy: Math.round(averageAccuracy),
          totalPracticeTime: totalTime,
          recentActivities: total
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
  const supabase = getSupabase()
  const id = Number(studentId)

  if (!id || isNaN(id)) {
    return { success: false, error: 'invalid id' }
  }

  try {
    const { data: student } = await supabase
      .from('students')
      .select(`
        *,
        level:levels(level_name, level_order, description, color),
        branch:branches(branch_name, location)
      `)
      .eq('student_id', id)
      .single()

    if (!student) {
      return { success: false, error: 'not found' }
    }

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

    const { count: unreadMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', id)
      .is('read_at', null)

    const { count: totalAttempts } = await supabase
      .from('sheet_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)

    const { count: completedAttempts } = await supabase
      .from('sheet_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', id)
      .eq('status', 'completed')

    const { data: timeAgg } = await supabase
      .from('sheet_results')
      .select('total_time_spent')
      .eq('student_id', id)

    const totalTimeSpent = timeAgg?.reduce(
      (s, r) => s + (r.total_time_spent || 0),
      0
    ) || 0

    return {
      success: true,
      data: {
        student,
        stats: {
          totalAttempts: totalAttempts || 0,
          completedAttempts: completedAttempts || 0,
          completionRate: totalAttempts
            ? Math.round((completedAttempts / totalAttempts) * 100)
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
// 3. الأنشطة الحديثة
// =====================================================
export async function getRecentActivities(studentId) {
  const supabase = getSupabase()
  const id = Number(studentId)

  if (!id || isNaN(id)) {
    return { success: false, error: 'invalid id' }
  }

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
