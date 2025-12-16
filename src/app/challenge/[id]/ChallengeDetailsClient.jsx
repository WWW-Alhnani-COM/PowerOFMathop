// src/app/challenge/[id]/ChallengeDetailsClient.jsx - الإصدار المصحح
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { respondToChallenge, cancelChallenge, startChallenge } from '@/actions/challenge.actions'

// تعريف محلي للثوابت
const CHALLENGE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
}

export default function ChallengeDetailsClient({ challenge, currentStudent }) {
  // التحقق من وجود البيانات
  if (!challenge || !currentStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات التحدي...</p>
        </div>
      </div>
    )
  }

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState('--:--')
  const router = useRouter()
  
  // استخدام useRef لحفظ مرجع المؤقت
  const intervalRef = useRef(null)

  // حساب الوقت المتبقي للتحديات النشطة
  useEffect(() => {
    if (challenge?.status === CHALLENGE_STATUS.IN_PROGRESS && challenge?.start_time) {
      const updateTimer = () => {
        const startTime = new Date(challenge.start_time).getTime()
        const totalTime = (challenge.time_limit || 0) * 1000
        const now = Date.now()
        const elapsed = now - startTime
        const remaining = Math.max(totalTime - elapsed, 0)
        
        const minutes = Math.floor(remaining / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
        
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        
        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }
      
      // تنظيف أي مؤقت سابق
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      updateTimer()
      intervalRef.current = setInterval(updateTimer, 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // تنظيف المؤقت إذا لم يكن التحدي نشطاً
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [challenge])

  const getStatusText = (status) => {
    if (!status) return 'غير معروف'
    
    switch (status) {
      case CHALLENGE_STATUS.PENDING: return 'في الانتظار'
      case CHALLENGE_STATUS.ACCEPTED: return 'مقبول'
      case CHALLENGE_STATUS.IN_PROGRESS: return 'جاري التنفيذ'
      case CHALLENGE_STATUS.COMPLETED: return 'مكتمل'
      case CHALLENGE_STATUS.EXPIRED: return 'منتهي'
      case CHALLENGE_STATUS.REJECTED: return 'مرفوض'
      case CHALLENGE_STATUS.CANCELLED: return 'ملغي'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status) {
      case CHALLENGE_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800'
      case CHALLENGE_STATUS.ACCEPTED: return 'bg-blue-100 text-blue-800'
      case CHALLENGE_STATUS.IN_PROGRESS: return 'bg-purple-100 text-purple-800'
      case CHALLENGE_STATUS.COMPLETED: return 'bg-green-100 text-green-800'
      case CHALLENGE_STATUS.EXPIRED: return 'bg-gray-100 text-gray-800'
      case CHALLENGE_STATUS.REJECTED: return 'bg-red-100 text-red-800'
      case CHALLENGE_STATUS.CANCELLED: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChallengeTypeText = (type) => {
    if (!type) return 'غير معروف'
    
    switch (type) {
      case 'full_sheet': return 'ورقة كاملة'
      case 'quick': return 'تحدي سريع'
      case 'rule_based': return 'بناءً على قاعدة'
      case 'custom': return 'مخصص'
      default: return type
    }
  }

  const handleAction = async (action, params = {}) => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')
      
      let result
      
      switch (action) {
        case 'accept':
          if (!confirm('هل أنت متأكد من قبول هذا التحدي؟')) return
          result = await respondToChallenge(challenge.challenge_id, 'accept')
          break
          
        case 'reject':
          if (!confirm('هل أنت متأكد من رفض هذا التحدي؟')) return
          result = await respondToChallenge(challenge.challenge_id, 'reject')
          break
          
        case 'cancel':
          if (!confirm('هل أنت متأكد من إلغاء هذا التحدي؟')) return
          result = await cancelChallenge(challenge.challenge_id)
          break
          
        case 'start':
          if (!confirm('هل أنت مستعد لبدء التحدي؟')) return
          result = await startChallenge(challenge.challenge_id)
          break
          
        default:
          return
      }
      
      if (result.success) {
        setSuccess(result.message || 'تم تنفيذ العملية بنجاح')
        // تحديث الصفحة بعد 2 ثانية
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setError(result.error)
      }
      
    } catch (err) {
      console.error('❌ خطأ في تنفيذ العملية:', err)
      setError('حدث خطأ غير متوقع')
    } finally {
      setActionLoading(false)
    }
  }

  // ⚠️ التحقق من وجود البيانات قبل استخدامها
  const isChallenger = currentStudent?.student_id === challenge?.challenger_id
  const isChallenged = currentStudent?.student_id === challenge?.challenged_id
  const isParticipant = isChallenger || isChallenged

  // قيمة افتراضية للتحدي إذا كانت غير موجودة
  const safeChallenge = challenge || {
    challenge_code: 'N/A',
    sheet: { sheet_name: 'غير معروف' },
    status: 'unknown',
    challenge_type: 'unknown'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/challenge" className="text-2xl font-bold text-blue-600">
                Power of Math
              </Link>
              <span className="mx-3 text-gray-300">|</span>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">تفاصيل التحدي</h1>
                <p className="text-sm text-gray-500">كود التحدي: {safeChallenge.challenge_code || 'غير معروف'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentStudent && (
                <div className="text-right">
                  <p className="font-medium text-gray-800">{currentStudent.student_name}</p>
                  <p className="text-sm text-gray-500">
                    النقاط: {currentStudent.total_score || 0}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Link
                  href="/challenge"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  جميع التحديات
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  لوحة التحكم
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* رسائل التبليغ */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* بطاقة التحدي الرئيسية */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* المعلومات الأساسية */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {safeChallenge.sheet?.sheet_name || 'تحدي'}
                    </h2>
                    <p className="text-gray-600">
                      {getChallengeTypeText(safeChallenge.challenge_type)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(safeChallenge.status)}`}>
                    {getStatusText(safeChallenge.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">عدد الأسئلة</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {safeChallenge.sheet?.total_problems || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">مدة التحدي</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.floor((safeChallenge.time_limit || 0) / 60)} دقيقة
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">المستوى</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {safeChallenge.sheet?.level?.level_name || 'غير معروف'}
                    </div>
                  </div>
                </div>
                
                {/* المعلومات الإضافية */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>المنشئ: </span>
                    <span className="font-medium mr-2">{safeChallenge.challenger?.student_name || 'غير معروف'}</span>
                  </div>
                  
                  {safeChallenge.challenged && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      <span>الخصم: </span>
                      <span className="font-medium mr-2">{safeChallenge.challenged?.student_name}</span>
                    </div>
                  )}
                  
                  {safeChallenge.is_public && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-blue-600 font-medium">تحدي عام</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>تاريخ الإنشاء: </span>
                    <span className="font-medium mr-2">
                      {safeChallenge.created_at ? 
                        new Date(safeChallenge.created_at).toLocaleDateString('ar-SA') : 
                        'غير معروف'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* قسم الإجراءات */}
              <div className="lg:w-80">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">الإجراءات</h3>
                  
                  <div className="space-y-3">
                    {/* زمن البدء للتحديات النشطة */}
                    {safeChallenge.status === CHALLENGE_STATUS.IN_PROGRESS && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">الوقت المتبقي</div>
                        <div className="text-2xl font-bold text-purple-600 text-center">
                          {timeLeft}
                        </div>
                      </div>
                    )}
                    
                    {/* أزرار الإجراء حسب الحالة */}
                    {safeChallenge.status === CHALLENGE_STATUS.PENDING && (
                      <>
                        {isChallenger && (
                          <button
                            onClick={() => handleAction('cancel')}
                            disabled={actionLoading}
                            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? 'جاري...' : 'إلغاء التحدي'}
                          </button>
                        )}
                        
                        {isChallenged && (
                          <div className="space-y-3">
                            <button
                              onClick={() => handleAction('accept')}
                              disabled={actionLoading}
                              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading ? 'جاري...' : 'قبول التحدي'}
                            </button>
                            <button
                              onClick={() => handleAction('reject')}
                              disabled={actionLoading}
                              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading ? 'جاري...' : 'رفض التحدي'}
                            </button>
                          </div>
                        )}
                        
                        {!isChallenger && !isChallenged && safeChallenge.is_public && (
                          <button
                            onClick={() => handleAction('accept')}
                            disabled={actionLoading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? 'جاري...' : 'الانضمام إلى التحدي'}
                          </button>
                        )}
                      </>
                    )}
                    
                    {safeChallenge.status === CHALLENGE_STATUS.ACCEPTED && isParticipant && (
                      <button
                        onClick={() => handleAction('start')}
                        disabled={actionLoading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? 'جاري...' : 'بدء التحدي'}
                      </button>
                    )}
                    
                    {safeChallenge.status === CHALLENGE_STATUS.IN_PROGRESS && isParticipant && (
                      <Link
                        href={`/challenge/${safeChallenge.challenge_id}/play`}
                        className="block w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                      >
                        استمر في اللعب
                      </Link>
                    )}
                    
                    {safeChallenge.status === CHALLENGE_STATUS.COMPLETED && (
                      <div className="text-center">
                        <div className="text-green-600 font-semibold mb-2">✓ التحدي مكتمل</div>
                        {safeChallenge.winner && (
                          <div className="text-gray-700">
                            الفائز: <span className="font-bold">{safeChallenge.winner?.student_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Link
                      href="/challenge"
                      className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                    >
                      العودة للتحديات
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم النتائج */}
        {safeChallenge.challengeResults && safeChallenge.challengeResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">نتائج التحدي</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {safeChallenge.challengeResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">
                            {result.student?.student_name?.charAt(0) || 'ط'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {result.student?.student_name || 'لاعب'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {result.student?.student_id === safeChallenge.challenger_id ? 'منشئ التحدي' : 'الخصم'}
                          </p>
                        </div>
                      </div>
                      
                      {safeChallenge.winner_id === result.student_id && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          🏆 الفائز
                        </span>
                      )}
                    </div>
                    
                    {result.sheetResult && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">النقاط</div>
                          <div className="text-2xl font-bold text-gray-800">
                            {Math.round(result.sheetResult.score || 0)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">الدقة</div>
                          <div className="text-2xl font-bold text-gray-800">
                            {Math.round(result.sheetResult.accuracy || 0)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">الإجابات الصحيحة</div>
                          <div className="text-2xl font-bold text-green-600">
                            {result.sheetResult.total_correct || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">الإجابات الخاطئة</div>
                          <div className="text-2xl font-bold text-red-600">
                            {result.sheetResult.total_wrong || 0}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">الوقت المستغرق</div>
                      <div className="font-medium">
                        {result.sheetResult?.total_time_spent 
                          ? `${Math.floor(result.sheetResult.total_time_spent / 60)}:${(result.sheetResult.total_time_spent % 60).toString().padStart(2, '0')}`
                          : '--:--'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* تفاصيل الورقة */}
        {safeChallenge.sheet && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">تفاصيل الورقة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">معلومات الورقة</h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>الاسم:</span>
                      <span className="font-medium">{safeChallenge.sheet.sheet_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الأسئلة:</span>
                      <span className="font-medium">{safeChallenge.sheet.total_problems}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">المستوى</h4>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-3 ${
                      safeChallenge.sheet.level?.color === 'green' ? 'bg-green-100 text-green-600' :
                      safeChallenge.sheet.level?.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      safeChallenge.sheet.level?.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      safeChallenge.sheet.level?.color === 'red' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {safeChallenge.sheet.level?.icon || '📊'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{safeChallenge.sheet.level?.level_name}</div>
                      <div className="text-sm text-gray-500">المستوى الحالي</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">القاعدة</h4>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-3 bg-purple-100 text-purple-600">
                      {safeChallenge.sheet.rule?.icon || '🧮'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{safeChallenge.sheet.rule?.rule_name || 'قاعدة عامة'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* الفوتر */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>© 2025 Power of Math. تفاصيل التحدي.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}