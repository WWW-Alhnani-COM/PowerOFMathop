'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import {
  getStudentReport,
  getProgressReport,
  getErrorPatterns,
  getAiRecommendations
} from '../../../actions/report.actions';

export default function ResultsPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState(null);
  const [report, setReport] = useState(null);
  const [progress, setProgress] = useState([]);
  const [errors, setErrors] = useState([]);
  const [ai, setAi] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الطالب من التخزين
  useEffect(() => {
    const id = localStorage.getItem('student_id');

    if (!id) {
      router.push('/login?callbackUrl=/results');
      return;
    }

    setStudentId(Number(id));
  }, [router]);

  // جلب البيانات
  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [reportRes, progressRes, errorRes, aiRes] =
          await Promise.all([
            getStudentReport(studentId, 'month'),
            getProgressReport(studentId),
            getErrorPatterns(studentId),
            getAiRecommendations(studentId)
          ]);

        if (reportRes.success) setReport(reportRes.data);
        if (progressRes.success) setProgress(progressRes.data);
        if (errorRes.success) setErrors(errorRes.data);
        if (aiRes.success) setAi(aiRes.data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header studentName="طالب" unreadCount={0} />

        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl font-bold text-gray-600">
            جاري تحميل النتائج...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <Header
        studentName={report?.studentName || 'طالب'}
        unreadCount={0}
      />

      <div className="container mx-auto px-4 py-8">

        {/* العنوان */}
        <h1 className="text-3xl font-black mb-6">
          📊 نتائج الطالب
        </h1>

        {/* 📌 ملخص التقرير */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">

          <div className="bg-white p-4 rounded-xl shadow">
            <p>المجموع</p>
            <p className="text-2xl font-bold text-orange-600">
              {report?.totalScore || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p>الشيتات</p>
            <p className="text-2xl font-bold text-blue-600">
              {report?.totalSheets || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p>متوسط الدقة</p>
            <p className="text-2xl font-bold text-green-600">
              {report?.avgAccuracy || 0}%
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <p>متوسط النقاط</p>
            <p className="text-2xl font-bold text-purple-600">
              {report?.avgScore || 0}
            </p>
          </div>

        </div>

        {/* 📌 الأخطاء */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">❌ أنماط الأخطاء</h2>

          <div className="space-y-2">
            {errors.length > 0 ? errors.map((e, i) => (
              <div key={i} className="bg-white p-3 rounded shadow">
                {e.ruleName} - {e.count} أخطاء
              </div>
            )) : (
              <p className="text-gray-500">لا توجد أخطاء</p>
            )}
          </div>
        </div>

        {/* 📌 التوصيات */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3">🧠 توصيات الذكاء الاصطناعي</h2>

          <div className="space-y-2">
            {ai.length > 0 ? ai.map((a, i) => (
              <div key={i} className="bg-white p-3 rounded shadow">
                {a.reason}
              </div>
            )) : (
              <p className="text-gray-500">لا توجد توصيات</p>
            )}
          </div>
        </div>

        {/* 📌 التقدم */}
        <div>
          <h2 className="text-xl font-bold mb-3">📈 التقدم</h2>

          <div className="space-y-2">
            {progress.length > 0 ? progress.map((p, i) => (
              <div key={i} className="bg-white p-3 rounded shadow">
                {p.rule?.rule_name} - صعوبة: {p.weakness_score}
              </div>
            )) : (
              <p className="text-gray-500">لا يوجد بيانات</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
