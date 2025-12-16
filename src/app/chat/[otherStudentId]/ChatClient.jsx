// src/app/chat/[otherStudentId]/ChatClient.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage, getMessagesBetweenStudents } from '../../../../actions/chat.actions';

const ChatClient = ({ currentStudentId, currentStudentName, otherStudentId, otherStudentName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const messagesEndRef = useRef(null);

  // جلب الرسائل عند التحميل
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

  // محاكاة حالة الاتصال (نشط/غير نشط)
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineStatus(Math.random() > 0.3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // التمرير إلى آخر رسالة
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // إرسال رسالة جديدة
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

  // دالة لتنسيق الوقت
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

  // دالة للحصول على لون الصورة
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

  // إضافة رد سريع
  const quickReplies = ['مرحباً! 👋', 'كيف الحال؟ 😊', 'أحتاج مساعدة 🆘', 'رائع! 👍', 'شكراً لك 🙏'];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* شريط المعلومات العلوي */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* صورة المستخدم */}
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r ${getAvatarColor(otherStudentName)} shadow-md`}>
                {otherStudentName[0]?.toUpperCase() || '?'}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineStatus ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {otherStudentName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs ${onlineStatus ? 'text-green-600' : 'text-gray-500'}`}>
                  {onlineStatus ? '🟢 متصل الآن' : '⚫ غير متصل'}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{messages.length} رسالة</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-gray-600">✕</span>
          </button>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-20" />
              <div className="absolute inset-5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
            </div>
            <p className="text-gray-600">جارٍ تحميل المحادثة...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد رسائل بعد</h3>
            <p className="text-gray-600 max-w-md">
              هذه بداية المحادثة مع {otherStudentName}. ابدأ بإرسال رسالة ودية! 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl relative shadow-sm ${
                  isOwnMessage(msg)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-8'
                    : 'bg-white text-gray-800 mr-8 border border-gray-100'
                }`}
              >
                {/* محتوى الرسالة */}
                <p className="text-base leading-relaxed">{msg.message_text}</p>
                
                {/* تذييل الرسالة */}
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${isOwnMessage(msg) ? 'text-white/80' : 'text-gray-500'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                  
                  {/* حالة القراءة */}
                  {isOwnMessage(msg) && (
                    <span className={`text-xs ml-2 ${
                      msg.read_at ? 'text-green-300' : 'text-white/60'
                    }`}>
                      {msg.read_at ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
                
                {/* زاوية مثلثة */}
                <div className={`absolute top-3 w-3 h-3 transform rotate-45 ${
                  isOwnMessage(msg)
                    ? '-right-1.5 bg-gradient-to-r from-blue-500 to-purple-500'
                    : '-left-1.5 bg-white border-l border-b border-gray-100'
                }`} />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* الردود السريعة */}
      <div className="px-4 pb-2 overflow-x-auto">
        <div className="flex gap-2">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => setNewMessage(reply)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* نموذج إرسال الرسالة */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 sticky bottom-0">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالة هنا..."
              className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 
                       rounded-xl focus:outline-none focus:border-blue-400 
                       focus:ring-2 focus:ring-blue-100 text-gray-800
                       placeholder:text-gray-400 transition-all"
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <div className="absolute right-4 top-3.5 text-gray-400">
              ✏️
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              newMessage.trim() && !isSending
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الإرسال...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>إرسال</span>
                <span>🚀</span>
              </div>
            )}
          </button>
        </form>
        
        {/* معلومات إضافية */}
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↵ Enter للإرسال</span>
            <span>Shift + ↵ للسطر الجديد</span>
          </div>
          <span>{newMessage.length}/500</span>
        </div>
      </div>

      {/* رسالة توجيهية */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100 p-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>💡</span>
          <span>حافظ على المحادثة ودية ومحترمة</span>
        </div>
      </div>
    </div>
  );
};

export default ChatClient;