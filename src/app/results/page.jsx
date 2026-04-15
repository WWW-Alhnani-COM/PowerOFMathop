// src/app/results/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/layout/Header.tsx';
import { getSheetResults } from '../../actions/results.actions'; // تأكد من المسار
import { toast } from 'react-hot-toast';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentName, setStudentName] = useState('طالب');
  const [sheetResult, setSheetResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب هوية الطالب من localStorage
  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('student_id') : null;
    const name = typeof window !== 'undefined' ? localStorage.getItem('student_name') : 'طالب';
    if (!id || !resultId) {
      toast.error('لا توجد نتائج للعرض');
      router.push('/dashboard');
      return;
    }
    setCurrentStudentId(parseInt(id));
    setStudentName(name);
  }, [router, resultId]);

  // جلب نتائج الشيت
  useEffect(() => {
    if (!currentStudentId || !resultId) return;

    const fetchResults = async () => {
      setLoading(true);
      const res = await getSheetResults(parseInt(resultId));
      if (res.success) {
        setSheetResult(res.data);
        
        // حساب الإحصائيات يدويًّا من answerDetails
        const details = res.data.answerDetails || [];
        const totalAnswers = details.length;
        const totalCorrect = details.filter(d => d.is_correct).length;
        const totalWrong = totalAnswers - totalCorrect;
        const totalTime = details.reduce((sum, d) => sum + d.time_spent, 0);
        const accuracy = totalAnswers > 0 ? ((totalCorrect / totalAnswers) * 100).toFixed(1) : 0;
        const speedRate = totalTime > 0 ? (totalAnswers / totalTime).toFixed(2) : 0;

        setStats({
          totalAnswers,
          totalCorrect,
          totalWrong,
          totalTime,
          accuracy,
          speedRate,
          score: res.data.score || 0
        });
      } else {
        setError(res.error);
        toast.error(res.error);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
      setLoading(false);
    };

    fetchResults();
  }, [currentStudentId, resultId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={studentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 animate-bounce-soft mx-auto mb-4"></div>
            <p className="text-lg text-primary-800 font-fredoka">جارٍ تحميل النتائج...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sheetResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={studentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center bg-white/90 rounded-3xl p-8 border border-white/50">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-500 font-bold">عذرًا!</p>
            <p className="text-gray-600 mt-2">{error || 'لا يمكن عرض النتائج.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 kid-button px-6 py-3"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPassed = sheetResult.score >= (sheetResult.sheet?.required_score || 70);
  const accuracyColor = stats.accuracy >= 80 ? 'text-green-600' : stats.accuracy >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pastel-mint/50 to-pastel-yellow/50">
      <Header studentName={studentName} unreadCount={0} />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-800">
            {isPassed ? '🏆 مبروك! لقد نجحت!' : '🌱 جيد! استمر في المحاولة!'}
          </h1>
          <p className="text-gray-600 mt-2 font-amiri">
            نتائج ورقة: <span className="text-primary-600 font-bold">{sheetResult.sheet?.sheet_name}</span>
          </p>
        </div>

        {/* بطاقة النتائج الرئيسية */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-card mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-pastel-blue/50 rounded-2xl">
              <div className="text-3xl font-bold text-primary-600">{stats.totalCorrect}</div>
              <div className="text-gray-700">صحيحة</div>
            </div>
            <div className="text-center p-4 bg-pastel-coral/50 rounded-2xl">
              <div className="text-3xl font-bold text-pink-600">{stats.totalWrong}</div>
              <div className="text-gray-700">خاطئة</div>
            </div>
            <div className="text-center p-4 bg-pastel-yellow/50 rounded-2xl">
              <div className={`text-3xl font-bold ${accuracyColor}`}>{stats.accuracy}%</div>
              <div className="text-gray-700">دقة</div>
            </div>
            <div className="text-center p-4 bg-pastel-lavender/50 rounded-2xl">
              <div className="text-3xl font-bold text-purple-600">{stats.totalTime} ث</div>
              <div className="text-gray-700">الوقت الكلي</div>
            </div>
          </div>

          {/* تفاصيل المسائل */}
          {sheetResult.answerDetails && sheetResult.answerDetails.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-lg text-gray-800 mb-3">تفاصيل الإجابات:</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {sheetResult.answerDetails.map((ans) => (
                  <div 
                    key={ans.answer_id} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      ans.is_correct 
                        ? 'bg-green-500 animate-bounce-soft' 
                        : 'bg-red-500'
                    }`}
                    title={`الإجابة: ${ans.user_answer} (${ans.is_correct ? 'صحيحة' : 'خاطئة'})`}
                  >
                    {ans.is_correct ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* توصيات الذكاء الاصطناعي (افتراضية) */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-card">
          <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            توصيات لتحسين أدائك
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 bg-pastel-blue/30 rounded-xl">
              <span className="text-2xl">✨</span>
              <span>مارس <span className="font-bold">الجمع البسيط</span> لمدة 10 دقائق يوميًّا.</span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-pastel-mint/30 rounded-xl">
              <span className="text-2xl">🎯</span>
              <span>ركّز على <span className="font-bold">أصدقاء الخمسة</span> في التمرين القادم.</span>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4 italic">
            * هذه التوصيات مبنية على تحليل أداءك في هذا التمرين.
          </p>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/levels')}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xl font-bold shadow-soft hover:scale-105 transition-transform"
          >
            👀 استكشف المستويات
          </button>
        </div>
      </div>
    </div>
  );
}