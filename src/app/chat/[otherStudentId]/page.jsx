// src/app/chat/[otherStudentId]/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '../../../../components/layout/Header'
import ChatClient from './ChatClient'
import { getStudentById } from '../../../../actions/student.actions'

export default function ChatPage() {

  const router = useRouter()
  const params = useParams()

  const otherStudentId = params?.otherStudentId

  const [currentStudentId, setCurrentStudentId] = useState(null)
  const [currentStudentName, setCurrentStudentName] = useState('أنا')

  const [otherStudentName, setOtherStudentName] = useState('...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)



  

  // =========================================
  // جلب المستخدم الحالي من localStorage
  // =========================================
  useEffect(() => {
    const id = localStorage.getItem('student_id')
    const name = localStorage.getItem('student_name')

    if (!id) {
      router.push('/login')
      return
    }

    setCurrentStudentId(Number(id))
    setCurrentStudentName(name || 'أنا')
  }, [])


useEffect(() => {
  if (!currentStudentId || !otherStudentId) return;

  const markAsRead = async () => {
    try {
      await fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          senderId: Number(otherStudentId),
        }),
      });
    } catch (err) {
      console.log('markAsRead error:', err);
    }
  };

  markAsRead();
}, [currentStudentId, otherStudentId]);
  // =========================================
  // جلب الطالب الآخر من Supabase
  // =========================================
  useEffect(() => {

    const fetchStudent = async () => {

      if (!otherStudentId) {
        setError('معرف الطالب غير موجود')
        setLoading(false)
        return
      }

      const id = Number(otherStudentId)

      if (!Number.isInteger(id)) {
        setError('معرف غير صالح')
        setLoading(false)
        return
      }

      const result = await getStudentById(id)

      if (result.success && result.data) {
        setOtherStudentName(result.data.student_name)
      } else {
        setError(result.error || 'الطالب غير موجود')
      }

      setLoading(false)
    }

    fetchStudent()

  }, [otherStudentId])

  // =========================================
  // حالة التحميل
  // =========================================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={currentStudentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <p>جارٍ تحميل المحادثة...</p>
        </div>
      </div>
    )
  }

  // =========================================
  // حالة الخطأ
  // =========================================
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={currentStudentName} unreadCount={0} />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error}</p>

            <button
              onClick={() => router.push('/chat')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================
  // عرض المحادثة
  // =========================================
  return (
    <div className="min-h-screen flex flex-col">

      <Header
        studentName={currentStudentName}
        unreadCount={0}
      />

      <div className="p-4 border-b">
        <h2>محادثة مع {otherStudentName}</h2>
      </div>

      <ChatClient
        currentStudentId={currentStudentId}
        otherStudentId={Number(otherStudentId)}
        otherStudentName={otherStudentName}
      />

    </div>
  )
}
