'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { getStudentDashboardStats } from '../../../actions/level.actions';

export default function ReportsPage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('student_id');

    if (!id) {
      router.push('/login?callbackUrl=/reports');
      return;
    }

    setStudentId(parseInt(id));
  }, [router]);

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await getStudentDashboardStats(studentId);

        if (res.success) {
          setStudentData(res.data.student);
          setStats(res.data.stats);
          setRecentResults(res.data.recentResults || []);
          setChallenges(res.data.recentChallenges || []);
        }
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header studentName="طالب" unreadCount={0} />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl font-black text-orange-600 animate-pulse">
            جاري تحميل التقارير...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">

      <Header studentName={studentData?.student_name || "طالب"} unreadCount={0} />

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* العنوان */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-gradient-animated mb-2">
            📊 تقارير الأداء
          </h1>
          <p className="text-gray-600">
            تحليل شامل لتقدمك في النظام
          </p>
        </div>

        {/* الكروت الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

          <div className="card-3d p-6">
            <p className="text-sm text-gray-500">النقاط</p>
            <p className="text-3xl font-black text-orange-600">
              {stats?.totalScore || 0}
            </p>
          </div>

          <div className="card-3d p-6">
            <p className="text-sm text-gray-500">الدقة</p>
            <p className="text-3xl font-black text-green-600">
              {stats?.completionRate || 0}%
            </p>
          </div>

          <div className="card-3d p-6">
            <p className="text-sm text-gray-500">الوقت الكلي</p>
            <p className="text-3xl font-black text-blue-600">
              {stats?.totalTimeSpent || 0}
            </p>
          </div>

          <div className="card-3d p-6">
            <p className="text-sm text-gray-500">الرسائل غير المقروءة</p>
            <p className="text-3xl font-black text-purple-600">
              {stats?.unreadMessages || 0}
            </p>
          </div>

        </div>

        {/* معلومات الطالب */}
        <div className="card-glass p-6 mb-10">
          <h2 className="text-xl font-black mb-4">👨‍🎓 معلومات الطالب</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="p-4 bg-white/50 rounded-xl">
              <p className="text-sm text-gray-500">المستوى</p>
              <p className="font-bold text-orange-600">
                {studentData?.current_level_id || 1}
              </p>
            </div>

            <div className="p-4 bg-white/50 rounded-xl">
              <p className="text-sm text-gray-500">ستريك</p>
              <p className="font-bold text-blue-600">
                {stats?.currentStreak || 0}
              </p>
            </div>

            <div className="p-4 bg-white/50 rounded-xl">
              <p className="text-sm text-gray-500">أفضل ستريك</p>
              <p className="font-bold text-green-600">
                {stats?.bestStreak || 0}
              </p>
            </div>

            <div className="p-4 bg-white/50 rounded-xl">
              <p className="text-sm text-gray-500">المجموع</p>
              <p className="font-bold text-purple-600">
                {studentData?.total_score || 0}
              </p>
            </div>

          </div>
        </div>

        {/* آخر النتائج */}
        <div className="mb-10">
          <h2 className="text-2xl font-black mb-4">📄 آخر النتائج</h2>

          <div className="grid gap-4">
            {recentResults.map((r, i) => (
              <div
                key={i}
                className="card-3d p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">
                    {r.sheet?.sheet_name || 'تمرين'}
                  </p>
                  <p className="text-sm text-gray-500">
                    الدقة: {r.accuracy}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-orange-600 font-black">
                    {r.score}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* التحديات */}
        <div>
          <h2 className="text-2xl font-black mb-4">⚔️ التحديات الأخيرة</h2>

          <div className="grid gap-4">
            {challenges.map((c, i) => (
              <div key={i} className="card-3d p-4">

                <div className="flex justify-between">
                  <p className="font-bold">
                    {c.sheet?.sheet_name || 'تحدي'}
                  </p>

                  <span className="text-sm text-gray-500">
                    {c.status}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  النقاط: {c.score || 0}
                </p>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
