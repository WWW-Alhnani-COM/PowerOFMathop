// src/app/chat/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { 
  getChatList, 
  getUnreadCount, 
  sendMessage,
  getActiveStudentsForChat
} from '@actions/chat.actions';

const ChatListPage = () => {
  const router = useRouter();
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentName, setStudentName] = useState('طالب');
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔑 جلب هوية المستخدم
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('student_id');
      const storedName = localStorage.getItem('student_name');
      
      if (storedId) {
        setCurrentStudentId(parseInt(storedId));
        setStudentName(storedName || 'طالب');
      } else {
        setLoading(false);
        router.push('/login?callbackUrl=/chat');
      }
    }
  }, [router]);

  // جلب بيانات الدردشة
  const fetchChatData = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const listResult = await getChatList(id);
      const countResult = await getUnreadCount(id);

      if (listResult.success && listResult.data) {
        setChatList(listResult.data);
      } else {
        setError(listResult.error || 'فشل في جلب قائمة المحادثات.');
      }

      if (countResult.success) {
        setTotalUnreadCount(countResult.data);
      } else {
        setTotalUnreadCount(0);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع أثناء جلب البيانات.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ جلب قائمة الطلاب الحقيقيين
  const fetchAvailableStudents = async () => {
    if (!currentStudentId) return;
    
    setStudentsLoading(true);
    try {
      const result = await getActiveStudentsForChat(currentStudentId);
      if (result.success) {
        setAvailableStudents(result.data);
      } else {
        setError(result.error || 'فشل جلب قائمة الطلاب.');
      }
    } catch (err) {
  console.log("STUDENTS ERROR:", err)
  setError(err.message || 'فشل جلب قائمة الطلاب.')
}
    finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStudentId) {
      fetchChatData(currentStudentId);
      fetchAvailableStudents();
    }
  }, [currentStudentId, fetchChatData]);


  // 👇 هنا تضيفه
useEffect(() => {
  const handleFocus = async () => {
    if (!currentStudentId) return;

    const countResult = await getUnreadCount(currentStudentId);

    if (countResult.success) {
      setTotalUnreadCount(countResult.data);
    }
  };

  window.addEventListener('focus', handleFocus);

  return () => window.removeEventListener('focus', handleFocus);
}, [currentStudentId]);

  // 💡 دالة لتوليد ألوان متدرجة
  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // ✅ إنشاء محادثة جديدة
  const handleCreateChat = async (otherStudentId) => {
    if (!currentStudentId || !otherStudentId) return;
    
    const welcomeMessage = `مرحباً! أنا ${studentName}، دعنا نبدأ محادثة ممتعة! 🧸`;
    const result = await sendMessage(currentStudentId, otherStudentId, welcomeMessage);
    
    if (result.success) {
      setShowCreateModal(false);
      await fetchChatData(currentStudentId);
      router.push(`/chat/${otherStudentId}`);
    } else {
      alert(result.error || 'فشل إنشاء المحادثة.');
    }
  };

  // فلترة المحادثات
  const filteredChats = chatList.filter(chat =>
    chat.student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⏳ عرض التحميل
  if (loading || !currentStudentId) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName="..." unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-6 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-spin" />
            <div className="absolute inset-12 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">💬</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            جارٍ تحميل المحادثات...
          </h2>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName={studentName} unreadCount={totalUnreadCount} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-red-500 font-bold text-lg mb-2">عفوًا!</p>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header studentName={studentName} unreadCount={totalUnreadCount} />

      <div className="flex-1 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* العنوان والإحصائيات */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
              <span className="text-3xl text-white">💬</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              صندوق الرسائل
            </h1>
            <p className="text-gray-600 mb-6">
              تواصل مع أصدقائك وناقش التحديات
            </p>
            
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="text-2xl font-bold text-blue-600">{chatList.length}</div>
                <div className="text-sm text-gray-500">محادثة</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="text-2xl font-bold text-purple-600">{totalUnreadCount}</div>
                <div className="text-sm text-gray-500">جديد</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="text-2xl font-bold text-green-600">{availableStudents.length}</div>
                <div className="text-sm text-gray-500">متاح</div>
              </div>
            </div>
          </div>

          {/* شريط البحث وزر الإنشاء */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 ابحث عن محادثة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                🔍
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>➕</span>
              <span>جديد</span>
            </button>
          </div>

          {/* قائمة المحادثات */}
          <div className="space-y-4">
            {filteredChats.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg text-gray-700 font-bold mb-2">لا توجد محادثات بعد!</p>
                <p className="text-gray-600 mb-6">ابدأ محادثة جديدة مع صديق</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg"
                >
                  ابدأ محادثة الآن
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Link
                  key={chat.student.student_id}
                  href={`/chat/${chat.student.student_id}`}
                  className="block"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center">
                      {/* صورة المستخدم */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-r ${getAvatarColor(chat.student.student_name)} shadow-md`}>
                        {chat.student.student_name[0]?.toUpperCase() || '?'}
                      </div>
                      
                      {/* معلومات المحادثة */}
                      <div className="flex-1 ml-4 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 text-lg truncate">
                              {chat.student.student_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {chat.student.branch?.branch_name || 'بدون فرع'}
                            </p>
                          </div>
                          {chat.lastMessage?.created_at && (
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(chat.lastMessage.created_at).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        
                        {/* آخر رسالة */}
                        <p className={`mt-2 text-gray-600 truncate ${chat.unreadCount > 0 ? 'font-bold text-blue-600' : ''}`}>
                          {chat.lastMessage?.message_text || "ابدأ محادثة جديدة..."}
                        </p>
                      </div>
                      
                      {/* عدد الرسائل غير المقروءة */}
                      {chat.unreadCount > 0 && (
                        <div className="ml-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full animate-pulse">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* حالة النشاط */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className={`w-2 h-2 rounded-full ${Math.random() > 0.5 ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-500">
                        {Math.random() > 0.5 ? 'نشط الآن' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* رسالة توجيهية */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="text-3xl text-blue-500">💡</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">نصائح للمحادثة</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    حافظ على الود والاحترام في المحادثات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    استخدم الرموز التعبيرية لجعل المحادثة ممتعة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    شارك تجاربك في حل المسائل مع الأصدقاء
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة اختيار الطالب */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">اختر صديقًا للمحادثة</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {studentsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">جارٍ تحميل القائمة...</p>
              </div>
            ) : availableStudents.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {availableStudents.map(student => (
                  <button
                    key={student.student_id}
                    onClick={() => handleCreateChat(student.student_id)}
                    className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-r ${getAvatarColor(student.student_name)}`}>
                        {student.student_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <span className="text-lg font-bold text-gray-800 block">{student.student_name}</span>
                        {student.branch?.branch_name && (
                          <span className="text-sm text-gray-500">{student.branch.branch_name}</span>
                        )}
                      </div>
                      <div className="text-blue-500 text-2xl">💬</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-600">لا توجد طلاب متاحون للمحادثة</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatListPage;
