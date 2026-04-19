// src/app/chat/[otherStudentId]/ChatClient.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage, getMessagesBetweenStudents } from '../../../../actions/chat.actions';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const ChatClient = ({ currentStudentId, currentStudentName, otherStudentId, otherStudentName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const messagesEndRef = useRef(null);

  // =====================================================
  // جلب الرسائل عند التحميل
  // =====================================================
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      const result = await getMessagesBetweenStudents(currentStudentId, otherStudentId);
      if (result.success) {
        setMessages(result.data);
      }
      setIsLoading(false);
    };
    fetchMessages();
  }, [currentStudentId, otherStudentId]);

  // =====================================================
  // 🔥 REALTIME (ADDED ONLY)
  // =====================================================
useEffect(() => {
  const channel = supabase
    .channel('chat_room')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      (payload) => {
        const newMsg = payload.new;

        const isRelevant =
          (newMsg.sender_id === Number(currentStudentId) &&
            newMsg.receiver_id === Number(otherStudentId)) ||
          (newMsg.sender_id === Number(otherStudentId) &&
            newMsg.receiver_id === Number(currentStudentId));

        if (isRelevant) {
          setMessages((prev) => {
            const exists = prev.some(m => m.message_id === newMsg.message_id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentStudentId, otherStudentId]);

  // =====================================================
  // محاكاة حالة الاتصال
  // =====================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineStatus(Math.random() > 0.3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // التمرير للأسفل
  // =====================================================
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // =====================================================
  // إرسال رسالة
  // =====================================================
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const trimmedMessage = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const result = await sendMessage(currentStudentId, otherStudentId, trimmedMessage);

    if (result.success) {
      const newMsg = {
        message_id: result.data.message_id,
        sender_id: currentStudentId,
        receiver_id: otherStudentId,
        message_text: trimmedMessage,
        created_at: result.data.created_at,
        read_at: null,
      };
      setMessages(prev => [...prev, newMsg]);
    }

    setIsSending(false);
  };

  const isOwnMessage = (msg) => msg.sender_id === currentStudentId;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffMins < 1440) return `قبل ${Math.floor(diffMins / 60)} ساعة`;
    return date.toLocaleDateString('ar-EG');
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const quickReplies = ['مرحباً! 👋', 'كيف الحال؟ 😊', 'أحتاج مساعدة 🆘', 'رائع! 👍', 'شكراً لك 🙏'];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

      {/* HEADER */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r ${getAvatarColor(otherStudentName)} shadow-md`}>
                {otherStudentName[0]?.toUpperCase() || '?'}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">{otherStudentName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${onlineStatus ? 'text-green-600' : 'text-gray-500'}`}>
                  {onlineStatus ? '🟢 متصل الآن' : '⚫ غير متصل'}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{messages.length} رسالة</span>
              </div>
            </div>
          </div>

          <button onClick={() => window.history.back()} className="p-2 bg-gray-100 rounded">
            ✕
          </button>

        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">لا توجد رسائل</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`px-4 py-3 rounded-2xl max-w-xs ${
                isOwnMessage(msg)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}>
                <p>{msg.message_text}</p>
                <div className="text-xs mt-1 opacity-70">
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border px-3 py-2 rounded"
          placeholder="اكتب رسالة..."
        />
        <button disabled={isSending} className="bg-blue-500 text-white px-4 rounded">
          إرسال
        </button>
      </form>

    </div>
  );
};

export default ChatClient;
