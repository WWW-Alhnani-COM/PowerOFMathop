'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// =====================================================
// Supabase SSR Client (مثل auth.actions.js)
// =====================================================
export const createClient = async (cookieStore) => {
  const store = cookieStore || await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            )
          } catch {}
        }
      }
    }
  )
}

// =====================================================
// Supabase SERVICE ROLE (للكتابة بدون RLS مشاكل)
// =====================================================
const serviceClient = () => {
  const { createClient } = require('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// =====================================================
// 1. جلب قائمة المحادثات
// =====================================================
export async function getChatList(studentId) {
  const supabase = serviceClient()

  const studentIdInt = parseInt(studentId)
  if (isNaN(studentIdInt)) {
    return { success: false, error: 'Invalid student id' }
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

  if (error) return { success: false, error: error.message }

  const chatMap = new Map()

  data.forEach((msg) => {
    const otherId =
      msg.sender_id === studentIdInt ? msg.receiver_id : msg.sender_id

    const otherUser =
      msg.sender_id === studentIdInt ? msg.receiver : msg.sender

    if (!chatMap.has(otherId)) {
      chatMap.set(otherId, {
        student: otherUser,
        lastMessage: msg,
        unreadCount: 0
      })
    }

    if (msg.receiver_id === studentIdInt && msg.read_at === null) {
      chatMap.get(otherId).unreadCount++
    }
  })

  return {
    success: true,
    data: Array.from(chatMap.values())
  }
}

// =====================================================
// 2. جلب الرسائل بين طالبين
// =====================================================
export async function getMessagesBetweenStudents(studentId, otherId) {
  const supabase = serviceClient()

  const a = parseInt(studentId)
  const b = parseInt(otherId)

  if (isNaN(a) || isNaN(b)) {
    return { success: false, error: 'Invalid ids' }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`
    )
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  // mark as read
  await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', a)
    .eq('sender_id', b)
    .is('read_at', null)

  return { success: true, data }
}

// =====================================================
// 3. إرسال رسالة (حل permission denied)
// =====================================================
export async function sendMessage(senderId, receiverId, messageText) {
  const supabase = serviceClient()

  const s = parseInt(senderId)
  const r = parseInt(receiverId)

  if (!messageText?.trim() || isNaN(s) || isNaN(r)) {
    return { success: false, error: 'Invalid data' }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: s,
      receiver_id: r,
      message_text: messageText,
      is_approved: true,
      is_flagged: false,
      read_at: null
    })
    .select('message_id, created_at')
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

// =====================================================
// 4. عدد غير المقروء
// =====================================================
export async function getUnreadCount(studentId) {
  const supabase = serviceClient()

  const id = parseInt(studentId)
  if (isNaN(id)) {
    return { success: false, error: 'Invalid id' }
  }

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', id)
    .is('read_at', null)

  if (error) return { success: false, error: error.message }

  return { success: true, data: count || 0 }
}

// =====================================================
// 5. تحديد رسالة كمقروءة
// =====================================================
export async function markMessageAsRead(messageId, studentId) {
  const supabase = serviceClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('receiver_id', studentId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

// =====================================================
// 6. حذف رسالة
// =====================================================
export async function deleteMessage(messageId, senderId) {
  const supabase = serviceClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .select('sender_id')
    .eq('message_id', messageId)
    .single()

  if (error) return { success: false, error: error.message }

  if (data.sender_id !== parseInt(senderId)) {
    return { success: false, error: 'Not allowed' }
  }

  const { error: delError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('message_id', messageId)

  if (delError) return { success: false, error: delError.message }

  return { success: true }
}
