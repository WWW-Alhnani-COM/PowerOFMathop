// src/app/dashboard/page.tsx
import {
  getStudentDashboardStats,
  getRecentActivities,
  getMonthlyProgress,
  getStudentGoals,
  getLearningSuggestions,
} from "@actions/dashboard.actions";
import { getSessionStudentId } from "@actions/auth.actions";
import DashboardClient from "./DashboardClient";

// (اختياري لكن يجمّل الـ types)
interface DashboardServerProps {
  stats: any | null;
  activitiesCount: number;
  progress: any | null;
  goals: any | null;
  suggestionsCount: number;
}

export default async function DashboardPage() {
  // 1️⃣ جلب الطالب من الكوكيز
  const studentId = await getSessionStudentId();

  if (!studentId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-orange">
        <div className="card max-w-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black mb-2">لا يوجد طالب محدّد</h1>
          <p className="text-gray-600 mb-6">
            يرجى فتح لوحة التحكم من خلال صفحة تسجيل الطالب أو تسجيل الدخول، حتى نعرف من هو الطالب.
          </p>
          <a href="/login" className="btn btn-primary">
            العودة لصفحة تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  // 2️⃣ جلب كل بيانات لوحة التحكم من الـ actions
  const [statsRes, activitiesRes, progressRes, goalsRes, suggestionsRes] =
    await Promise.all([
      getStudentDashboardStats(studentId),
      getRecentActivities(studentId),
      getMonthlyProgress(studentId),
      getStudentGoals(studentId),
      getLearningSuggestions(studentId),
    ]);

  // 3️⃣ حساب الأعداد بشكل آمن (بدون تحذير TypeScript)
  const activitiesCount =
    activitiesRes.success && Array.isArray(activitiesRes.data)
      ? activitiesRes.data.length
      : 0;

  const suggestionsCount =
    suggestionsRes.success && Array.isArray(suggestionsRes.data)
      ? suggestionsRes.data.length
      : 0;

  // 4️⃣ بناء الـ props الخام
  const rawProps: DashboardServerProps = {
    stats: statsRes.success ? statsRes.data : null,
    activitiesCount,
    progress: progressRes.success ? progressRes.data : null,
    goals: goalsRes.success ? goalsRes.data : null,
    suggestionsCount,
  };

  // ⭐ 5️⃣ تنظيف البيانات من Prisma Decimal وتحويلها لكائنات عادية
  const props = JSON.parse(JSON.stringify(rawProps)) as DashboardServerProps;

  // 6️⃣ تمرير البيانات النظيفه للـ Client Component
  return <DashboardClient {...props} />;
}
