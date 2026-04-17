'use server'

import { createClient } from "../lib/supabaseClient"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// =====================================================
// Admin Client (bypasses RLS)
// =====================================================
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
)

// =====================================================
// 1. جلب قائمة المحادثات
// =====================================================
export async function getChatList(studentId) {
  const supabase = createClient()

  const studentIdInt = parseInt(studentId)
  if (isNaN(studentIdInt)) {
    return { success: false, error: 'معرف طالب غير صالح' }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:students!chat_messages_sender_id_fkey(student_id, student_name),
      receiver:students!chat_messages_receiver_id_fkey(student_id, student_name)
    `)
    .or(`sender_id.eq.${studentIdInt},receiver_id.eq.${studentIdInt}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const chatMap = new Map()

  data?.forEach((message) => {
    const otherParticipantId =
      message.sender_id === studentIdInt
        ? message.receiver_id
        : message.sender_id

    if (!otherParticipantId) return

    const otherStudent =
      message.sender_id === studentIdInt
        ? message.receiver
        : message.sender

    if (!chatMap.has(otherParticipantId)) {
      chatMap.set(otherParticipantId, {
        student: otherStudent,
        lastMessage: message,
        unreadCount: 0,
      })
    }

    if (
      message.receiver_id === studentIdInt &&
      message.read_at === null
    ) {
      chatMap.get(otherParticipantId).unreadCount++
    }
  })

  return {
    success: true,
    data: Array.from(chatMap.values()),
  }
}

// =====================================================
// 2. عدد الرسائل غير المقروءة
// =====================================================
export async function getUnreadCount(studentId) {
  const supabase = createClient()

  const id = parseInt(studentId)
  if (isNaN(id)) {
    return { success: false, error: 'معرف غير صالح' }
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
// 3. جلب الرسائل بين طالبين
// =====================================================
export async function getMessagesBetweenStudents(studentId, otherId) {
  const supabase = createClient()

  const studentIdInt = parseInt(studentId)
  const otherIdInt = parseInt(otherId)

  if (isNaN(studentIdInt) || isNaN(otherIdInt)) {
    return { success: false, error: 'معرفات غير صالحة' }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${studentIdInt},receiver_id.eq.${otherIdInt}),and(sender_id.eq.${otherIdInt},receiver_id.eq.${studentIdInt})`
    )
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  // mark as read (admin)
  await supabaseAdmin
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', studentIdInt)
    .eq('sender_id', otherIdInt)
    .is('read_at', null)

  return {
    success: true,
    data,
  }
}

// =====================================================
// 4. إرسال رسالة (Secure)
// =====================================================
export async function sendMessage(senderId, receiverId, messageText) {
  const supabase = createClient()

  const s = parseInt(senderId)
  const r = parseInt(receiverId)

  if (!messageText?.trim() || isNaN(s) || isNaN(r)) {
    return { success: false, error: 'بيانات غير صالحة' }
  }

  // التحقق من المستخدم الحالي (من الجلسة)
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'غير مصرح' }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: s,
      receiver_id: r,
      message_text: messageText,
      is_approved: true,
      is_flagged: false,
      read_at: null,
    })
    .select('message_id, created_at')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// =====================================================
// 5. جلب الطلاب النشطين
// =====================================================
export async function getActiveStudentsForChat(currentStudentId) {
  const supabase = createClient()

  const id = parseInt(currentStudentId)
  if (isNaN(id)) {
    return { success: false, error: 'معرف غير صالح' }
  }

  const { data, error } = await supabase
    .from('students')
    .select(`
      student_id,
      student_name,
      branch:branches(branch_name)
    `)
    .eq('status', 'active')
    .neq('student_id', id)
    .order('student_name', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// =====================================================
// 6. تحديد رسالة كمقروءة
// =====================================================
export async function markMessageAsRead(messageId, studentId) {
  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('receiver_id', studentId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// =====================================================
// 7. حذف رسالة
// =====================================================
export async function deleteMessage(messageId, senderId) {
  const { data: message, error: fetchError } = await supabaseAdmin
    .from('chat_messages')
    .select('sender_id')
    .eq('message_id', messageId)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  if (!message || message.sender_id !== parseInt(senderId)) {
    return { success: false, error: 'غير مصرح' }
  }

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .delete()
    .eq('message_id', messageId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
