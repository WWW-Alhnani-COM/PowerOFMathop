// src/app/chat/[otherStudentId]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/layout/Header';
import ChatClient from './ChatClient';

// استيراد إجراء جلب بيانات الطالب
import { getStudentById } from '../../../../actions/student.actions';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherStudentId = params?.otherStudentId;

  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentStudentName, setCurrentStudentName] = useState('أنا');
  const [otherStudentName, setOtherStudentName] = useState('...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب هوية المستخدم الحالي من localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('student_id');
      const name = localStorage.getItem('student_name');
      if (!id) {
        router.push('/login?callbackUrl=/chat');
        return;
      }
      setCurrentStudentId(parseInt(id));
      setCurrentStudentName(name || 'أنا');
    }
  }, [router]);

  // جلب اسم الطالب الآخر من قاعدة البيانات
  useEffect(() => {
    const fetchOtherStudent = async () => {
      if (!otherStudentId) {
        setError('معرف الطالب غير موجود');
        setLoading(false);
        return;
      }

      try {
        const studentIdInt = parseInt(otherStudentId);
        if (isNaN(studentIdInt)) {
          setError('معرف الطالب غير صالح');
          setLoading(false);
          return;
        }

        const result = await getStudentById(studentIdInt);
        if (result.success && result.data) {
          setOtherStudentName(result.data.student_name);
        } else {
          setError(result.error || 'تعذر تحميل بيانات الصديق');
          setOtherStudentName(`طالب #${otherStudentId}`);
        }
      } catch (err) {
        console.error('خطأ في جلب بيانات الطالب:', err);
        setError('حدث خطأ أثناء تحميل بيانات الصديق');
        setOtherStudentName(`طالب #${otherStudentId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherStudent();
  }, [otherStudentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={currentStudentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 animate-bounce-soft mx-auto mb-4"></div>
            <p className="text-lg text-primary-800 font-fredoka">جارٍ تحميل المحادثة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={currentStudentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="bg-white/80 p-6 rounded-2xl shadow-card max-w-md">
            <div className="text-5xl mb-3">⚠️</div>
            <p className="text-red-500 font-bold">{error}</p>
            <button
              onClick={() => router.push('/chat')}
              className="mt-4 kid-button px-6 py-2 text-base"
            >
              العودة إلى الدردشات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pastel-blue/40 to-pastel-yellow/40">
      <Header 
        studentName={currentStudentName} 
        unreadCount={0} 
      />
      <div className="flex-1">
        {currentStudentId && otherStudentId ? (
          <ChatClient
            currentStudentId={currentStudentId}
            currentStudentName={currentStudentName}
            otherStudentId={parseInt(otherStudentId)}
            otherStudentName={otherStudentName}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600">جارٍ التحميل...</p>
          </div>
        )}
      </div>
    </div>
  );
}