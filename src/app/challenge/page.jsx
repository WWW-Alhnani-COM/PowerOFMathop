// src/app/challenge/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import {
  getStudentChallenges,
  getPublicChallenges,
  getActiveChallenges,
  cancelChallenge,
  respondToChallenge
} from '@/actions/challenge.actions'

import { getCurrentStudent, logoutStudent } from '@/actions/auth.actions'
// ثوابت حالة التحدي
const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState([])
  const [publicChallenges, setPublicChallenges] = useState([])
  const [activeChallenges, setActiveChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentInfo, setStudentInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('my-challenges')
  const [cancellingId, setCancellingId] = useState(null)
  const [respondingId, setRespondingId] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      // جلب بيانات الطالب
      const studentResult = await getCurrentStudent()
      if (!studentResult.success) {
        if (studentResult.error?.includes('تسجيل الدخول') || studentResult.redirect) {
          router.push('/login')
          return
        }
        setError(studentResult.error)
        return
      }
      setStudentInfo(studentResult.data)

      // جلب البيانات
      await Promise.all([
        loadMyChallenges(),
        loadPublicChallenges(),
        loadActiveChallenges()
      ])

    } catch (err) {
      console.error('❌ خطأ في تحميل البيانات:', err)
      setError('حدث خطأ غير متوقع في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  async function loadMyChallenges() {
    try {
      const result = await getStudentChallenges('all')
      if (result.success) {
        setChallenges(result.data?.challenges || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل تحدياتي:', err)
    }
  }

  async function loadPublicChallenges() {
    try {
      const result = await getPublicChallenges()
      if (result.success) {
        setPublicChallenges(result.data || [])
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل التحديات العامة:', err)
    }
  }

  async function loadActiveChallenges() {
    try {
      const result = await getActiveChallenges()
      if (result.success) {
        setActiveChallenges(result.data || [])
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل التحديات النشطة:', err)
    }
  }

  const handleCancelChallenge = async (challengeId) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التحدي؟')) return
    
    try {
      setCancellingId(challengeId)
      const result = await cancelChallenge(challengeId)
      
      if (result.success) {
        await loadMyChallenges()
        await loadActiveChallenges()
        alert('تم إلغاء التحدي بنجاح')
      } else {
        alert(result.error)
      }
    } catch (err) {
      console.error('❌ خطأ في إلغاء التحدي:', err)
      alert('حدث خطأ أثناء إلغاء التحدي')
    } finally {
      setCancellingId(null)
    }
  }

  const handleRespondToChallenge = async (challengeId, response) => {
    if (!confirm(`هل أنت متأكد من ${response === 'accept' ? 'قبول' : 'رفض'} هذا التحدي؟`)) return
    
    try {
      setRespondingId(challengeId)
      const result = await respondToChallenge(challengeId, response)
      
      if (result.success) {
        await loadMyChallenges()
        await loadPublicChallenges()
        await loadActiveChallenges()
        
        if (response === 'accept') {
          alert('تم قبول التحدي! سيبدأ التحدي قريباً')
        } else {
          alert('تم رفض التحدي')
        }
      } else {
        alert(result.error)
      }
    } catch (err) {
      console.error('❌ خطأ في الرد على التحدي:', err)
      alert('حدث خطأ أثناء الرد على التحدي')
    } finally {
      setRespondingId(null)
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case CHALLENGE_STATUS.PENDING: return '⏳ في الانتظار'
      case CHALLENGE_STATUS.ACCEPTED: return '✅ مقبول'
      case CHALLENGE_STATUS.IN_PROGRESS: return '⚡ جاري التنفيذ'
      case CHALLENGE_STATUS.COMPLETED: return '🏆 مكتمل'
      case CHALLENGE_STATUS.EXPIRED: return '⌛ منتهي'
      case CHALLENGE_STATUS.REJECTED: return '❌ مرفوض'
      case CHALLENGE_STATUS.CANCELLED: return '🗑️ ملغي'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case CHALLENGE_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case CHALLENGE_STATUS.ACCEPTED: return 'bg-blue-100 text-blue-800 border border-blue-200'
      case CHALLENGE_STATUS.IN_PROGRESS: return 'bg-purple-100 text-purple-800 border border-purple-200'
      case CHALLENGE_STATUS.COMPLETED: return 'bg-green-100 text-green-800 border border-green-200'
      case CHALLENGE_STATUS.EXPIRED: return 'bg-gray-100 text-gray-800 border border-gray-200'
      case CHALLENGE_STATUS.REJECTED: return 'bg-red-100 text-red-800 border border-red-200'
      case CHALLENGE_STATUS.CANCELLED: return 'bg-gray-100 text-gray-800 border border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getChallengeColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName="..." unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-6 bg-gradient-to-r from-orange-300 to-yellow-300 rounded-full animate-spin" />
            <div className="absolute inset-12 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">⚔️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            جارٍ تحميل التحديات...
          </h2>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && error.includes('تسجيل الدخول')) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName="زائر" unreadCount={0} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-gray-200">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-6">يجب أن تكون مسجلاً للدخول لصفحة التحديات</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header studentName={studentInfo?.student_name || 'طالب'} unreadCount={0} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* عنوان الصفحة */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full mb-4 shadow-lg">
            <span className="text-3xl text-white">⚔️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">ساحة التحديات</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            تحدى زملائك واختبر مهاراتك في الرياضيات
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">تحدياتي</p>
                <p className="text-2xl font-bold text-blue-600">{challenges.length}</p>
              </div>
              <div className="text-2xl">📋</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">عامة</p>
                <p className="text-2xl font-bold text-purple-600">{publicChallenges.length}</p>
              </div>
              <div className="text-2xl">🌍</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">نشطة</p>
                <p className="text-2xl font-bold text-green-600">{activeChallenges.length}</p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </div>
        </div>

        {/* تبويبات التحديات */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setActiveTab('my-challenges')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'my-challenges'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              📋 تحدياتي
              {challenges.length > 0 && (
                <span className="mr-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {challenges.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('public-challenges')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'public-challenges'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              🌍 تحديات عامة
              {publicChallenges.length > 0 && (
                <span className="mr-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {publicChallenges.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('active-challenges')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'active-challenges'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              ⚡ تحديات نشطة
              {activeChallenges.length > 0 && (
                <span className="mr-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {activeChallenges.length}
                </span>
              )}
            </button>
          </div>

          {/* زر إنشاء تحد جديد */}
          <div className="text-center mb-8">
            <Link
              href="/challenge/create"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all shadow-lg"
            >
              <span className="text-xl">➕</span>
              <span>إنشاء تحد جديد</span>
            </Link>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* تحدياتي */}
          {activeTab === 'my-challenges' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span>📋</span>
                تحدياتي الشخصية
              </h2>
              
              {challenges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">لا توجد تحديات حالياً</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    ابدأ بإنشاء تحديك الأول أو انضم إلى تحديات عامة لبدء التنافس
                  </p>
                  <Link
                    href="/challenge/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg"
                  >
                    <span>➕</span>
                    <span>إنشاء تحد جديد</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {challenges.map((challenge, index) => (
                    <div key={challenge.challenge_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white">
                      {/* شريط لوني علوي */}
                      <div className={`h-2 w-full mb-4 rounded-t-xl bg-gradient-to-r ${getChallengeColor(index)}`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {challenge.sheet?.sheet_name || 'تحدي غير معروف'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {challenge.challenger?.student_name} 
                            {challenge.challenged ? 
                              ` ضد ${challenge.challenged.student_name}` : 
                              ' (تحدي عام)'
                            }
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(challenge.status)}`}>
                          {getStatusText(challenge.status)}
                        </span>
                      </div>
                      
                      {/* معلومات التحدي */}
                      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">الأسئلة:</span>
                          <span className="font-bold mr-2">{challenge.sheet?.total_problems || 0}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">المستوى:</span>
                          <span className="font-bold mr-2">{challenge.sheet?.level?.level_name || 'غير معروف'}</span>
                        </div>
                      </div>
                      
                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2">
                        <Link
                          href={`/challenge/${challenge.challenge_id}`}
                          className="flex-1 text-center py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 rounded-lg hover:shadow-sm transition-all border border-blue-100"
                        >
                          عرض التفاصيل
                        </Link>
                        
                        {challenge.status === CHALLENGE_STATUS.PENDING && 
                         challenge.challenger_id === studentInfo?.student_id && (
                          <button
                            onClick={() => handleCancelChallenge(challenge.challenge_id)}
                            disabled={cancellingId === challenge.challenge_id}
                            className="px-4 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-lg hover:shadow-sm transition-all border border-red-100 disabled:opacity-50"
                          >
                            {cancellingId === challenge.challenge_id ? 'جاري...' : 'إلغاء'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* تحديات عامة */}
          {activeTab === 'public-challenges' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span>🌍</span>
                التحديات العامة
              </h2>
              
              {publicChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🌐</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">لا توجد تحديات عامة حالياً</h3>
                  <p className="text-gray-500">كن أول من ينشئ تحدياً عاماً!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicChallenges.map((challenge, index) => (
                    <div key={challenge.challenge_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white">
                      {/* شريط لوني علوي */}
                      <div className={`h-2 w-full mb-4 rounded-t-xl bg-gradient-to-r ${getChallengeColor(index)}`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {challenge.sheet?.sheet_name || 'تحدي عام'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            من: {challenge.challenger?.student_name}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                          🌍 عام
                        </span>
                      </div>
                      
                      {/* معلومات التحدي */}
                      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">الأسئلة:</span>
                          <span className="font-bold mr-2">{challenge.sheet?.total_problems || 0}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">المستوى:</span>
                          <span className="font-bold mr-2">{challenge.sheet?.level?.level_name || 'غير معروف'}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">الصعوبة:</span>
                          <span className="font-bold mr-2">{challenge.sheet?.difficulty_level || 1}/5</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-gray-500">الوقت:</span>
                          <span className="font-bold mr-2">{Math.floor((challenge.sheet?.time_limit || 0) / 60)} د</span>
                        </div>
                      </div>
                      
                      {/* زر الانضمام */}
                      <button
                        onClick={() => handleRespondToChallenge(challenge.challenge_id, 'accept')}
                        disabled={respondingId === challenge.challenge_id}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {respondingId === challenge.challenge_id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري الانضمام...</span>
                          </>
                        ) : (
                          <>
                            <span>🤝</span>
                            <span>الانضمام إلى التحدي</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* تحديات نشطة */}
          {activeTab === 'active-challenges' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span>⚡</span>
                التحديات النشطة
              </h2>
              
              {activeChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">لا توجد تحديات نشطة حالياً</h3>
                  <p className="text-gray-500">ابدأ تحدي جديد أو انتظر رد على تحدياتك</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeChallenges.map((challenge, index) => (
                    <div key={challenge.challenge_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5">
                        <div className="flex items-start gap-4 mb-4 md:mb-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg bg-gradient-to-r ${getChallengeColor(index)}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">
                              {challenge.sheet?.sheet_name || 'تحدي نشط'}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span>🎮</span>
                                <span>{challenge.challenger?.student_name}</span>
                              </span>
                              <span>⚔️</span>
                              <span className="flex items-center gap-1">
                                <span>🎯</span>
                                <span>{challenge.challenged?.student_name || 'مفتوح'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(challenge.status)}`}>
                            {getStatusText(challenge.status)}
                          </span>
                          
                          {challenge.status === CHALLENGE_STATUS.IN_PROGRESS && (
                            <Link
                              href={`/challenge/${challenge.challenge_id}/play`}
                              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-bold"
                            >
                              استمر في اللعب
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      {/* إحصائيات التحدي */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                          <div className="text-gray-500 text-sm mb-1">عدد الأسئلة</div>
                          <div className="font-bold text-xl text-blue-600">{challenge.sheet?.total_problems || 0}</div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                          <div className="text-gray-500 text-sm mb-1">مستوى الصعوبة</div>
                          <div className="font-bold text-xl text-purple-600">{challenge.sheet?.difficulty_level || 1}/5</div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                          <div className="text-gray-500 text-sm mb-1">المستوى</div>
                          <div className="font-bold text-xl text-green-600">{challenge.sheet?.level?.level_name || 'غير معروف'}</div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-100">
                          <div className="text-gray-500 text-sm mb-1">الوقت المتبقي</div>
                          <div className="font-bold text-xl text-orange-600">
                            {challenge.status === CHALLENGE_STATUS.IN_PROGRESS && challenge.start_time ? (
                              <CountdownTimer startTime={challenge.start_time} timeLimit={challenge.time_limit} />
                            ) : (
                              '--:--'
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* زر التفاصيل */}
                      <div className="flex justify-end">
                        <Link
                          href={`/challenge/${challenge.challenge_id}`}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all font-bold flex items-center gap-2"
                        >
                          <span>🔍</span>
                          <span>عرض التفاصيل</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// مكون العداد التنازلي
function CountdownTimer({ startTime, timeLimit }) {
  const [timeLeft, setTimeLeft] = useState('--:--')
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    if (!isClient || !startTime || !timeLimit) return
    
    const start = new Date(startTime).getTime()
    const totalTime = timeLimit * 1000
    
    const updateTimer = () => {
      const now = Date.now()
      const elapsed = now - start
      const remaining = Math.max(totalTime - elapsed, 0)
      
      const minutes = Math.floor(remaining / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
      
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [isClient, startTime, timeLimit])
  
  return <span>{timeLeft}</span>
}