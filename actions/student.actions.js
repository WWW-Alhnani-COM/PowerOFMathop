'use server'

import { createClient } from '../lib/supabaseServer'

// ==========================
// Helper
// ==========================
function getSupabase() {
  return createClient()
}

function toPlain(data) {
  return data == null ? data : JSON.parse(JSON.stringify(data))
}

// ============================================================
// 1. تسجيل طالب جديد
// ============================================================
export async function registerStudent(studentName, branchId = null) {
  if (!studentName || studentName.trim().length < 2) {
    return {
      success: false,
      error: 'يجب أن يكون اسم الطالب صالحاً ويتكون من حرفين على الأقل.',
    }
  }

  const name = studentName.trim()
  const sb = getSupabase()

  try {
    const { data: existing } = await sb
      .from('students')
      .select('student_id')
      .eq('student_name', name)
      .eq('branch_id', branchId)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: 'هذا الاسم مستخدم مسبقاً في نفس الفرع.',
      }
    }

    const { data, error } = await sb
      .from('students')
      .insert({
        student_name: name,
        branch_id: branchId ? Number(branchId) : null,
        current_level_id: 1,
        preferred_language: 'ar',
        status: 'active',
      })
      .select('student_id, student_name, branch_id, current_level_id, created_at')
      .single()

    if (error) throw error

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// 2. جلب طالب
// ============================================================
export async function getStudentById(studentId) {
  const id = Number(studentId)
  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' }
  }

  const sb = getSupabase()

  try {
    const { data, error } = await sb
      .from('students')
      .select(`
        student_id,
        student_name,
        branch_id,
        current_level_id,
        preferred_language,
        total_score,
        current_streak,
        best_streak,
        status,
        created_at,
        updated_at,
        branches:branches(branch_name),
        levels:levels(level_name, color, icon)
      `)
      .eq('student_id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'الطالب غير موجود.' }
    }

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// 3. تحديث اسم الطالب
// ============================================================
export async function updateStudentName(studentId, newName) {
  const id = Number(studentId)

  if (isNaN(id)) {
    return { success: false, error: 'معرف طالب غير صالح.' }
  }

  if (!newName || newName.trim().length < 2) {
    return { success: false, error: 'الاسم غير صالح.' }
  }

  const name = newName.trim()
  const sb = getSupabase()

  try {
    const { data: current } = await sb
      .from('students')
      .select('branch_id')
      .eq('student_id', id)
      .single()

    const { data: existing } = await sb
      .from('students')
      .select('student_id')
      .eq('student_name', name)
      .eq('branch_id', current?.branch_id)
      .neq('student_id', id)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: 'هذا الاسم مستخدم مسبقاً في نفس الفرع.',
      }
    }

    const { data, error } = await sb
      .from('students')
      .update({ student_name: name })
      .eq('student_id', id)
      .select('student_id, student_name')
      .single()

    if (error) throw error

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// 4. تحديث الفرع
// ============================================================
export async function updateStudentBranch(studentId, branchId) {
  const id = Number(studentId)
  const branch = branchId ? Number(branchId) : null

  if (isNaN(id)) {
    return { success: false, error: 'معرف الطالب غير صالح.' }
  }

  const sb = getSupabase()

  try {
    if (branch) {
      const { data: branchExists } = await sb
        .from('branches')
        .select('branch_id')
        .eq('branch_id', branch)
        .maybeSingle()

      if (!branchExists) {
        return { success: false, error: 'الفرع غير موجود.' }
      }
    }

    const { data, error } = await sb
      .from('students')
      .update({ branch_id: branch })
      .eq('student_id', id)
      .select(`
        student_id,
        student_name,
        branch_id,
        branches:branches(branch_name)
      `)
      .single()

    if (error) throw error

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// 5. تحديث المستوى
// ============================================================
export async function updateStudentLevel(studentId, levelId) {
  const id = Number(studentId)
  const level = Number(levelId)

  if (isNaN(id) || isNaN(level)) {
    return { success: false, error: 'بيانات غير صالحة.' }
  }

  const sb = getSupabase()

  try {
    const { data: levelData } = await sb
      .from('levels')
      .select('level_id, is_active')
      .eq('level_id', level)
      .single()

    if (!levelData || !levelData.is_active) {
      return { success: false, error: 'المستوى غير متاح.' }
    }

    const { data, error } = await sb
      .from('students')
      .update({ current_level_id: level })
      .eq('student_id', id)
      .select(`
        student_id,
        student_name,
        current_level_id,
        levels:levels(level_name)
      `)
      .single()

    if (error) throw error

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// 6. إحصائيات الطالب
// ============================================================
export async function getStudentStats(studentId) {
  const id = Number(studentId)

  if (isNaN(id)) {
    return { success: false, error: 'معرف غير صالح.' }
  }

  const sb = getSupabase()

  try {
    const { data, error } = await sb
      .from('students')
      .select(`
        student_name,
        total_score,
        current_streak,
        best_streak,
        total_correct_answers,
        total_wrong_answers,
        total_time_spent
      `)
      .eq('student_id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'الطالب غير موجود.' }
    }

    return { success: true, data: toPlain(data) }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
