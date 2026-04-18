'use server'

import { supabaseAdmin } from '../lib/supabaseAdmin'
import { createClient } from '../lib/supabaseServer'

// =====================================================
// إرسال رسالة
// =====================================================
export async function sendMessage(senderId, receiverId, messageText) {
  const supabase = supabaseAdmin

  const s = Number(senderId)
  const r = Number(receiverId)

  console.log("🔥 sendMessage CALLED", { s, r, messageText })

  if (!messageText?.trim() || !Number.isInteger(s) || !Number.isInteger(r)) {
    return { success: false, error: "بيانات غير صالحة" }
  }

  if (s === r) {
    return { success: false, error: "لا يمكن إرسال رسالة لنفسك" }
  }

  // ✅ تحقق الكوكي
  const cookieStudentId = cookies().get('student_id')?.value

  if (s !== Number(cookieStudentId)) {
    console.log("❌ UNAUTHORIZED:", { s, cookieStudentId })
    return { success: false, error: "غير مصرح" }
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id')
    .in('student_id', [s, r])

  if (studentsError) {
    console.log("❌ STUDENTS ERROR:", studentsError)
    return { success: false, error: studentsError.message }
  }

  if (!students || students.length !== 2) {
    console.log("❌ STUDENTS NOT FOUND:", students)
    return { success: false, error: "أحد الطلاب غير موجود" }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: s,
      receiver_id: r,
      message_text: messageText.trim(),
    })
    .select()

  console.log("INSERT RESULT:", data)
  console.log("INSERT ERROR:", error)

  if (error) {
    console.log("❌ INSERT ERROR:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// =====================================================
// جلب الرسائل بين طالبين
// =====================================================
export async function getMessagesBetweenStudents(studentId, otherId) {
  const supabase = createClient()

  const s = Number(studentId)
  const o = Number(otherId)

  if (!Number.isInteger(s) || !Number.isInteger(o)) {
    return { success: false, error: "معرفات غير صالحة" }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${s},receiver_id.eq.${o}),and(sender_id.eq.${o},receiver_id.eq.${s})`
    )
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  // mark as read
  await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', s)
    .eq('sender_id', o)
    .is('read_at', null)

  return { success: true, data }
}

// =====================================================
// جلب المحادثات (Chat List)
// =====================================================
export async function getChatList(studentId) {
  const supabase = createClient()

  const id = Number(studentId)

  if (!Number.isInteger(id)) {
    return { success: false, error: "معرف غير صالح" }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:students!chat_messages_sender_id_fkey(student_id, student_name),
      receiver:students!chat_messages_receiver_id_fkey(student_id, student_name)
    `)
    .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const map = new Map()

  for (const msg of data || []) {
    const otherId = msg.sender_id === id ? msg.receiver_id : msg.sender_id
    if (!otherId) continue

    const otherStudent = msg.sender_id === id ? msg.receiver : msg.sender

    if (!map.has(otherId)) {
      map.set(otherId, {
        student: otherStudent ?? {
          student_id: otherId,
          student_name: "مستخدم محذوف"
        },
        lastMessage: msg,
        unreadCount: 0,
      })
    }

    if (msg.receiver_id === id && msg.read_at === null) {
      map.get(otherId).unreadCount++
    }
  }

  return {
    success: true,
    data: Array.from(map.values()),
  }
}

// =====================================================
// عدد الرسائل غير المقروءة
// =====================================================
export async function getUnreadCount(studentId) {
  const supabase = createClient()

  const id = Number(studentId)

  if (!Number.isInteger(id)) {
    return { success: false, error: "معرف غير صالح" }
  }

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', id)
    .is('read_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: count || 0 }
}

// =====================================================
// الطلاب النشطين
// =====================================================
export async function getActiveStudentsForChat(currentStudentId) {
  const supabase = createClient()

  const id = Number(currentStudentId)

  if (!Number.isInteger(id)) {
    return { success: false, error: "معرف غير صالح" }
  }

  try {
   const { data, error } = await supabase
  .from('students')
  .select(`
    student_id,
    student_name,
    branch_id,
   branch:branches (
  branch_name
)
  `)
  .eq('status', 'active')
  .neq('student_id', id)
  .order('student_name', { ascending: true })
  console.log("📦 STUDENTS DATA:", data)
console.log("❌ STUDENTS ERROR:", error)

    // 🔴 طباعة الخطأ الحقيقي
    if (error) {
      console.log("❌ SUPABASE ERROR (students):", error)
      return { success: false, error: error.message }
    }

    // 🔵 طباعة البيانات
    console.log("✅ STUDENTS LOADED:", data)

    return { success: true, data }

  } catch (err) {
    console.log("❌ UNEXPECTED ERROR:", err)

    return {
      success: false,
      error: err?.message || "خطأ غير متوقع"
    }
  }
}

// =====================================================
// حذف رسالة
// =====================================================
export async function deleteMessage(messageId, senderId) {
  const supabase = createClient()

  const msgId = Number(messageId)
  const sId = Number(senderId)

  if (!Number.isInteger(msgId) || !Number.isInteger(sId)) {
    return { success: false, error: "بيانات غير صالحة" }
  }

  const { data: msg, error } = await supabase
    .from('chat_messages')
    .select('sender_id')
    .eq('message_id', msgId)
    .single()

  if (error || !msg) {
    return { success: false, error: "الرسالة غير موجودة" }
  }

  if (msg.sender_id !== sId) {
    return { success: false, error: "غير مصرح" }
  }

  const { error: deleteError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('message_id', msgId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
