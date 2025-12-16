// src/app/challenge/[id]/page.jsx - الإصدار المصحح
import ChallengeDetailsClient from './ChallengeDetailsClient'
import { getChallengeDetails } from '@/actions/challenge.actions'
import { getCurrentStudent } from '@/actions/auth.actions'

export default async function ChallengeDetailsPage({ params }) {
  try {
    // ⬅️ استخدم await مع params
    const { id } = await params
    
    // جلب بيانات الطالب أولاً للتحقق من الجلسة
    const studentResult = await getCurrentStudent()
    
    if (!studentResult.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="text-red-500 text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-6">{studentResult.error}</p>
            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                تسجيل الدخول
              </a>
              <a
                href="/"
                className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                العودة إلى الرئيسية
              </a>
            </div>
          </div>
        </div>
      )
    }
    
    // التحقق من وجود ID
    if (!id) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">معرف تحدي غير صالح</h2>
            <p className="text-gray-600 mb-6">لم يتم تحديد معرف التحدي</p>
            <a
              href="/challenge"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              العودة للتحديات
            </a>
          </div>
        </div>
      )
    }
    
    // تحويل ID إلى رقم
    const challengeId = parseInt(id)
    
    if (isNaN(challengeId)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">معرف تحدي غير صالح</h2>
            <p className="text-gray-600 mb-6">معرف التحدي يجب أن يكون رقماً</p>
            <a
              href="/challenge"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              العودة للتحديات
            </a>
          </div>
        </div>
      )
    }
    
    // جلب تفاصيل التحدي
    const challengeResult = await getChallengeDetails(challengeId)
    
    if (!challengeResult.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">التحدي غير موجود</h2>
            <p className="text-gray-600 mb-6">{challengeResult.error}</p>
            <a
              href="/challenge"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              العودة للتحديات
            </a>
          </div>
        </div>
      )
    }
    
    return (
      <ChallengeDetailsClient 
        challenge={challengeResult.data}
        currentStudent={studentResult.data}
      />
    )
    
  } catch (error) {
    console.error('❌ خطأ في تحميل صفحة التحدي:', error)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-gray-600 mb-6">تعذر تحميل صفحة التحدي. يرجى المحاولة مرة أخرى.</p>
          <div className="space-y-3">
            <a
              href="/challenge"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              العودة للتحديات
            </a>
            <a
              href="/dashboard"
              className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              لوحة التحكم
            </a>
          </div>
        </div>
      </div>
    )
  }
}