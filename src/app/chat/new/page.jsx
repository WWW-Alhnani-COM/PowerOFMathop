
// src/app/chat/[chatId]/page.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/layout/Header';

// ⚠️ استبدل هذه الدوال بـ Actions الحقيقية لديك
// import { getMessages, sendMessage, markAsRead } from '@actions/chat.actions';

const ChatPage = () => {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId; // معرف الطالب الآخر

  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentStudentName, setCurrentStudentName] = useState('أنا');
  const [otherStudentName, setOtherStudentName] = useState('صديقي');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // --- جلب هوية المستخدم من localStorage ---
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

  // --- محاكاة جلب اسم الطرف الآخر (في التطبيق الحقيقي: من API) ---
  useEffect(() => {
    if (chatId) {
      // في الواقع: اطلب بيانات الطالب من الخادم
      setOtherStudentName(`طالب #${chatId}`);
      setLoading(false);
    }
  }, [chatId]);

  // --- محاكاة جلب الرسائل ---
  const fetchMessages = useCallback(async () => {
    if (!currentStudentId || !chatId) return;

    // في الواقع: const result = await getMessages(currentStudentId, chatId);
    // مؤقتًا: نستخدم رسائل تجريبية
    setTimeout(() => {
      const mockMessages = [
        { id: 1, sender_id: parseInt(chatId), message_text: 'مرحباً! هل تريد أن نلعب تحدي رياضيات؟ 😊', created_at: new Date(Date.now() - 300000) },
        { id: 2, sender_id: currentStudentId, message_text: 'أكيد! أنا مستعد 🧮', created_at: new Date(Date.now() - 240000) },
        { id: 3, sender_id: parseInt(chatId), message_text: 'رائع! ابدأ بإرسال سؤالك الأول 🎯', created_at: new Date(Date.now() - 180000) },
      ];
      setMessages(mockMessages);
      setLoading(false);
    }, 500);
  }, [currentStudentId, chatId]);

  useEffect(() => {
    if (currentStudentId && chatId) {
      fetchMessages();
    }
  }, [currentStudentId, chatId, fetchMessages]);

  // --- التمرير التلقائي لأحدث رسالة ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- إرسال رسالة ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const tempMessage = {
      id: Date.now(),
      sender_id: currentStudentId,
      message_text: newMessage,
      created_at: new Date(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    // في الواقع: await sendMessage(currentStudentId, chatId, newMessage);
    setTimeout(() => {
      setSending(false);
      // محاكاة رد تلقائي (للتجربة فقط)
      if (messages.length < 5) {
        setTimeout(() => {
          const autoReply = {
            id: Date.now() + 1,
            sender_id: parseInt(chatId),
            message_text: 'رسالتك وصلت! 👍',
            created_at: new Date(),
          };
          setMessages((prev) => [...prev, autoReply]);
        }, 1000);
      }
    }, 800);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pastel-blue/40 to-pastel-yellow/40">
      {/* الهيدر */}
      <Header studentName={currentStudentName} unreadCount={0} />

      {/* رأس المحادثة */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 py-3 px-4 text-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 font-fredoka">
          🧸 محادثة مع <span className="text-primary-600">{otherStudentName}</span>
        </h2>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentStudentId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl font-amiri text-gray-800 shadow-sm animate-float ${
                  isOwn
                    ? 'bg-gradient-to-r from-accent-400 to-amber-300 text-white rounded-br-md'
                    : 'bg-white/90 border border-white/60 rounded-bl-md'
                }`}
              >
                <p>{msg.message_text}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* حقل إرسال الرسالة */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-white/50 p-3 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا... 📝"
            className="flex-1 bg-white/80 border border-white/60 rounded-full px-4 py-3 font-amiri text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`kid-button min-w-[60px] h-[48px] ${
              (!newMessage.trim() || sending) ? 'opacity-60 scale-100' : ''
            }`}
          >
            {sending ? '...' : 'إرسال'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
