// src/app/challenge/create/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../components/layout/Header.tsx'
import { createChallenge, getAvailableSheetsForChallenge, searchStudentsForChallenge } from '../../../actions/challenge.actions'
import { getCurrentStudent } from '../../../actions/auth.actions'

export default function CreateChallengePage() {
  const [formData, setFormData] = useState({
    sheet_id: '',
    challenged_id: '',
    challenge_type: 'full_sheet',
    is_public: false,
    time_limit: 10
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [studentInfo, setStudentInfo] = useState(null)
  const [availableSheets, setAvailableSheets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // تحميل بيانات الطالب والورقات المتاحة
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
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
        
        // جلب الورقات المتاحة
        const sheetsResult = await getAvailableSheetsForChallenge()
        if (sheetsResult.success) {
          setAvailableSheets(sheetsResult.data)
          if (sheetsResult.data.length > 0) {
            setFormData(prev => ({ ...prev, sheet_id: sheetsResult.data[0].sheet_id }))
          }
        } else {
          setError(sheetsResult.error)
        }
        
      } catch (err) {
        console.error('❌ خطأ في تحميل البيانات:', err)
        setError('حدث خطأ غير متوقع في تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [router])

  // البحث عن طلاب عند تغيير الاستعلام
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }
      
      try {
        setSearching(true)
        const result = await searchStudentsForChallenge(searchQuery.trim(), true)
        if (result.success) {
          setSearchResults(result.data || [])
        }
      } catch (err) {
        console.error('❌ خطأ في البحث:', err)
      } finally {
        setSearching(false)
      }
    }, 500)
    
    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectStudent = (student) => {
    setFormData(prev => ({
      ...prev,
      challenged_id: student.student_id
    }))
    setSearchQuery(student.student_name)
    setSearchResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.sheet_id) {
      setError('الرجاء اختيار ورقة للتحدي')
      return
    }
    
    if (!formData.is_public && !formData.challenged_id) {
      setError('الرجاء اختيار طالب للتحدي الخاص')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const result = await createChallenge({
        sheet_id: parseInt(formData.sheet_id),
        challenged_id: formData.challenged_id ? parseInt(formData.challenged_id) : null,
        challenge_type: formData.challenge_type,
        is_public: formData.is_public,
        time_limit: parseInt(formData.time_limit)
      })
      
      if (result.success) {
        setSuccess('تم إنشاء التحدي بنجاح!')
        
        setTimeout(() => {
          router.push('/challenge')
        }, 2000)
      } else {
        setError(result.error)
      }
      
    } catch (err) {
      console.error('❌ خطأ في إنشاء التحدي:', err)
      setError('حدث خطأ غير متوقع في إنشاء التحدي')
    } finally {
      setLoading(false)
    }
  }

  const getSheetColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
    ];
    return colors[index % colors.length];
  };

  if (loading && !availableSheets.length) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName="..." unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-6 bg-gradient-to-r from-orange-300 to-yellow-300 rounded-full animate-spin" />
            <div className="absolute inset-12 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🏗️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            جاري تحضير صفحة إنشاء التحدي...
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
            <p className="text-gray-600 mb-6">{error}</p>
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
            <span className="text-3xl text-white">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">إنشاء تحدي جديد</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            اختر الورقة والخصم وابدأ تحدي ممتع!
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">الورقات المتاحة</p>
                <p className="text-2xl font-bold text-blue-600">{availableSheets.length}</p>
              </div>
              <div className="text-2xl">📄</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">مدة التحدي</p>
                <p className="text-2xl font-bold text-purple-600">{formData.time_limit} د</p>
              </div>
              <div className="text-2xl">⏱️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">نوع التحدي</p>
                <p className="text-2xl font-bold text-green-600">
                  {formData.is_public ? '🌍 عام' : '👤 خاص'}
                </p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </div>
        </div>

        {/* محتوى الصفحة */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* رسائل النجاح/الخطأ */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4">
              <div className="flex items-center">
                <span className="text-xl mr-2">✅</span>
                <span>{success}</span>
                <span className="mr-2 text-sm">سيتم تحويلك خلال ثانيتين...</span>
              </div>
            </div>
          )}

          {/* نموذج إنشاء التحدي */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* قسم الورقة */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <span>📄</span>
                  اختر الورقة
                </h2>
                
                {availableSheets.length === 0 ? (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl">
                    <p className="font-medium">لا توجد ورقات متاحة لمستواك الحالي.</p>
                    <p className="text-sm mt-2">يجب أن تتقدم في المستوى لفتح ورقات جديدة.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableSheets.map((sheet, index) => (
                      <label 
                        key={sheet.sheet_id}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                          formData.sheet_id === sheet.sheet_id.toString() 
                            ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sheet_id"
                          value={sheet.sheet_id}
                          checked={formData.sheet_id === sheet.sheet_id.toString()}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        
                        <div className="flex items-start">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg bg-gradient-to-r ${getSheetColor(index)} shadow-md`}>
                            {sheet.rule?.icon || '📝'}
                          </div>
                          
                          <div className="flex-1 mr-3">
                            <h3 className="font-bold text-gray-800 text-base">{sheet.sheet_name}</h3>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">المستوى:</span>
                                <span className="font-medium text-gray-800">{sheet.level?.level_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">القاعدة:</span>
                                <span className="font-medium text-gray-800">{sheet.rule?.rule_name || 'عام'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">الأسئلة:</span>
                                <span className="font-medium text-gray-800">{sheet.total_problems}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">الصعوبة:</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span 
                                      key={i}
                                      className={`text-lg ${i < sheet.difficulty_level ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* قسم نوع التحدي */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <span>⚙️</span>
                  إعدادات التحدي
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      نوع التحدي
                    </label>
                    <select
                      name="challenge_type"
                      value={formData.challenge_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="full_sheet">ورقة كاملة</option>
                      <option value="quick">تحدي سريع</option>
                      <option value="rule_based">بناءً على قاعدة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      مدة التحدي (دقائق)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="time_limit"
                        min="1"
                        max="60"
                        value={formData.time_limit}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                      <div className="absolute left-3 top-3 text-gray-400">⏱️</div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">اختر مدة التحدي من 1 إلى 60 دقيقة</p>
                  </div>
                </div>
              </div>

              {/* قسم الخصم */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <span>👥</span>
                  اختيار الخصم
                </h2>
                
                <div className="space-y-6">
                  {/* خيار التحدي العام */}
                  <label className="flex items-center p-5 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-all bg-white">
                    <input
                      type="radio"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={() => setFormData(prev => ({ ...prev, is_public: true, challenged_id: '' }))}
                      className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <div className="mr-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">🌍</span>
                        تحدي عام
                      </div>
                      <div className="text-sm text-gray-600 mt-1">سيظهر التحدي للجميع ويمكن لأي طالب الانضمام</div>
                    </div>
                  </label>
                  
                  {/* خيار التحدي الخاص */}
                  <label className="flex items-center p-5 border-2 border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-all bg-white">
                    <input
                      type="radio"
                      name="is_public"
                      checked={!formData.is_public}
                      onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                      className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <div className="mr-4">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        تحدي خاص
                      </div>
                      <div className="text-sm text-gray-600 mt-1">تحدي مع طالب محدد</div>
                    </div>
                  </label>
                  
                  {/* بحث عن طلاب (فقط للتحدي الخاص) */}
                  {!formData.is_public && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ابحث عن طالب
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="🔍 اكتب اسم الطالب للبحث..."
                          className="w-full px-12 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                        {searching && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* نتائج البحث */}
                      {searchResults.length > 0 && (
                        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                          {searchResults.map((student) => (
                            <div
                              key={student.student_id}
                              onClick={() => handleSelectStudent(student)}
                              className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all ${
                                formData.challenged_id === student.student_id.toString()
                                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-r-4 border-blue-500'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold">
                                    {student.student_name[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-800">{student.student_name}</div>
                                    <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                                      <span>🏆 {student.total_score}</span>
                                      <span>🔥 {student.current_streak}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  student.level?.color === 'green' ? 'bg-green-100 text-green-800' :
                                  student.level?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  student.level?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {student.level?.level_name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* إذا تم اختيار طالب */}
                      {formData.challenged_id && !searchResults.length && searchQuery && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                                {searchQuery[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{searchQuery}</div>
                                <div className="text-sm text-gray-600">الطالب المحدد</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, challenged_id: '' }))
                                setSearchQuery('')
                              }}
                              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              إزالة
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && !searching && (
                        <p className="text-sm text-gray-500 mt-2">اكتب حرفين على الأقل للبحث</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                  <Link
                    href="/challenge"
                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-center font-medium"
                  >
                    إلغاء والعودة
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={loading || availableSheets.length === 0 || (!formData.is_public && !formData.challenged_id)}
                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      loading || availableSheets.length === 0 || (!formData.is_public && !formData.challenged_id)
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:shadow-xl hover:scale-105 shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        <span>جاري الإنشاء...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">🚀</span>
                        <span>إنشاء التحدي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* معلومات إضافية */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="font-bold text-gray-800">نصائح</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>اختر ورقة مناسبة لمستواك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>التحدي العام يظهر للجميع</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span>يمكنك إلغاء التحدي قبل قبوله</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-bold text-gray-800">المزايا</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 text-lg">🏆</span>
                <span>ربح نقاط إضافية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 text-lg">⚡</span>
                <span>تحسين سرعة الحل</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 text-lg">📈</span>
                <span>زيادة سلسلة النجاح</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="font-bold text-gray-800">الوقت</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              كل تحد له وقت محدد. حاول حل أكبر عدد ممكن من الأسئلة بدقة وسرعة.
            </p>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {formData.time_limit}
              </div>
              <div className="text-sm text-gray-500">دقيقة</div>
            </div>
          </div>
        </div>

        {/* زر العودة */}
        <div className="mt-8 text-center">
          <Link
            href="/challenge"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all"
          >
            <span>←</span>
            العودة لصفحة التحديات
          </Link>
        </div>
      </main>
    </div>
  )
}