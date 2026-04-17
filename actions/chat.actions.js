'use server'

import { supabaseAdmin } from './supabaseAdmin'
  import { cookies } from 'next/headers'


// =====================================================
// Helper: Supabase Server Client
// =====================================================

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
// =====================================================
// 1. جلب قائمة المحادثات
// =====================================================
export async function getChatList(studentId) {
const supabase = supabaseAdmin

  const studentIdInt = parseInt(studentId)
  if (isNaN(studentIdInt)) {
    return { success: false, error: 'معرف طالب غير صالح.' }
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:students!chat_messages_sender_id_fkey(student_id, student_name),
        receiver:students!chat_messages_receiver_id_fkey(student_id, student_name)
      `)
      .or(`sender_id.eq.${studentIdInt},receiver_id.eq.${studentIdInt}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    const chatMap = new Map()

    data.forEach((message) => {
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
          unreadCount: 0
        })
      }

      // unread messages
      if (message.receiver_id === studentIdInt && message.read_at === null) {
        chatMap.get(otherParticipantId).unreadCount++
      }
    })

    return {
      success: true,
      data: Array.from(chatMap.values())
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'فشل في جلب المحادثات'
    }
  }
}

// =====================================================
// 2. عدد الرسائل غير المقروءة
// =====================================================
export async function getUnreadCount(studentId) {
const supabase = supabaseAdmin

  const studentIdInt = parseInt(studentId)
  if (isNaN(studentIdInt)) {
    return { success: false, error: 'معرف طالب غير صالح.' }
  }

  try {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', studentIdInt)
      .is('read_at', null)

    if (error) throw error

    return { success: true, data: count || 0 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 3. جلب الرسائل بين طالبين
// =====================================================
export async function getMessagesBetweenStudents(studentId, otherId) {
const supabase = supabaseAdmin

  const studentIdInt = parseInt(studentId)
  const otherIdInt = parseInt(otherId)

  if (isNaN(studentIdInt) || isNaN(otherIdInt)) {
    return { success: false, error: 'معرفات غير صالحة' }
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${studentIdInt},receiver_id.eq.${otherIdInt}),and(sender_id.eq.${otherIdInt},receiver_id.eq.${studentIdInt})`
      )
      .order('created_at', { ascending: true })

    if (error) throw error

    // mark as read
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', studentIdInt)
      .eq('sender_id', otherIdInt)
      .is('read_at', null)

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 4. إرسال رسالة
// =====================================================
export async function sendMessage(senderId, receiverId, messageText) {
const supabase = supabaseAdmin

  const senderIdInt = parseInt(senderId)
  const receiverIdInt = parseInt(receiverId)

  if (!messageText?.trim() || isNaN(senderIdInt) || isNaN(receiverIdInt)) {
    return { success: false, error: 'بيانات غير صالحة' }
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: senderIdInt,
        receiver_id: receiverIdInt,
        message_text: messageText,
        is_approved: true,
        is_flagged: false,
        read_at: null
      })
      .select('message_id, created_at')
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 5. جلب الطلاب النشطين
// =====================================================
export async function getActiveStudentsForChat(currentStudentId) {
const supabase = supabaseAdmin

  const id = parseInt(currentStudentId)
  if (isNaN(id)) {
    return { success: false, error: 'معرف غير صالح' }
  }

  try {
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

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 6. تحديد رسالة كمقروءة
// =====================================================
export async function markMessageAsRead(messageId, studentId) {
const supabase = supabaseAdmin

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('message_id', messageId)
      .eq('receiver_id', studentId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// 7. حذف رسالة
// =====================================================
export async function deleteMessage(messageId, senderId) {
const supabase = supabaseAdmin

  try {
    // تحقق أولاً
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('message_id', messageId)
      .single()

    if (fetchError) throw fetchError

    if (!message || message.sender_id !== parseInt(senderId)) {
      return { success: false, error: 'غير مصرح' }
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('message_id', messageId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
