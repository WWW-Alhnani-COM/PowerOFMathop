import { createClient } from '@supabase/supabase-js'

// ⚠️ استخدم SERVICE ROLE (ليس anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { studentId, senderId } = await req.json()

    if (!studentId || !senderId) {
      return Response.json(
        { success: false, error: 'بيانات غير مكتملة' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({
        read_at: new Date().toISOString()
      })
      .eq('receiver_id', studentId)
      .eq('sender_id', senderId)
      .is('read_at', null)

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'تم تعليم الرسائل كمقروءة'
    })

  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
