// src/app/dashboard/page.tsx
import {
  getStudentDashboardStats,
  getRecentActivities,
  getMonthlyProgress,
  getStudentGoals,
  getLearningSuggestions,
} from "@/actions/dashboard.actions";
import { getSessionStudentId } from "@/actions/auth.actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // ✅ نجيب student_id من الكوكيز (جلسة حقيقية)
  const studentId = await getSessionStudentId();

  if (!studentId || !Number.isInteger(studentId) || studentId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            ⚠️ لا يوجد طالب محدّد
          </h1>
          <p className="text-gray-600 mb-4">
            يرجى تسجيل الدخول أولاً، ثم فتح لوحة التحكم من حساب الطالب.
          </p>
          <a href="/login" className="btn btn-primary w-full justify-center">
            الذهاب إلى صفحة الدخول
          </a>
        </div>
      </div>
    );
  }

  // ✅ كل النداءات للسيرفر هنا (وليس في client)
  const [statsRes, activitiesRes, progressRes, goalsRes, suggestionsRes] =
    await Promise.all([
      getStudentDashboardStats(studentId),
      getRecentActivities(studentId),
      getMonthlyProgress(studentId),
      getStudentGoals(studentId),
      getLearningSuggestions(studentId),
    ]);

  // نكوّن شكل بيانات موحد نمرره للـ Client
  const props = {
    studentId,
    stats: statsRes?.success ? statsRes.data : null,
    activities: activitiesRes?.success ? activitiesRes.data || [] : [],
    progress: progressRes?.success ? progressRes.data : null,
    goals: goalsRes?.success ? goalsRes.data : null,
    suggestions: suggestionsRes?.success ? suggestionsRes.data || [] : [],
  };

  // 🎨 كل الـ UI في Component عميل
  return <DashboardClient {...props} />;
}
