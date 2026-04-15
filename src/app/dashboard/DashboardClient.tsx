"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/layout/Header.tsx";

type AnyRecord = Record<string, any>;

interface DashboardClientProps {
  stats: AnyRecord | null;
  activitiesCount: number;
  progress: AnyRecord | null;
  goals: AnyRecord | null;
  suggestionsCount: number;
}

export default function DashboardClient({
  stats,
  activitiesCount,
  progress,
  goals,
  suggestionsCount,
}: DashboardClientProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ====== استخراج البيانات بأمان ======
  const student = stats?.student ?? null;
  const quickStats = stats?.stats ?? null;
  const recentResults: AnyRecord[] = stats?.recentResults ?? [];
  const recentChallenges: AnyRecord[] = stats?.recentChallenges ?? [];
  const weeklyProgress: AnyRecord[] = stats?.weeklyProgress ?? [];

  const monthlyStats = progress?.monthlyStats ?? null;
  const bestPerformance = progress?.bestPerformance ?? null;

  const generalGoals: AnyRecord[] = goals?.generalGoals ?? [];
  const completedGoals: AnyRecord[] = goals?.completedGoals ?? [];
  const totalGoals = goals?.totalGoals ?? generalGoals.length ?? 0;
  const completedCount = goals?.completedCount ?? completedGoals.length ?? 0;

  const toNumber = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    const parsed = parseFloat(String(v));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatDate = (value?: string | Date | null): string => {
    if (!isHydrated || !value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (secondsValue?: number | string | null): string => {
    const seconds = toNumber(secondsValue);
    if (seconds <= 0) return "0 ثانية";
    if (seconds < 60) return `${seconds} ثانية`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return `${minutes} دقيقة${
        remainingSeconds > 0 ? ` ${remainingSeconds} ثانية` : ""
      }`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours} ساعة${
      remainingMinutes > 0 ? ` ${remainingMinutes} دقيقة` : ""
    }`;
  };

  const currentLevelName =
    student?.level?.level_name ?? "المستوى غير محدّد";
  const currentLevelOrder = student?.level?.level_order ?? 1;
  const branchName = student?.branch?.branch_name ?? "غير محدد";

  const totalScore = toNumber(quickStats?.totalScore);
  const accuracy = toNumber(quickStats?.accuracy);
  const currentStreak = toNumber(quickStats?.currentStreak);
  const bestStreak = toNumber(quickStats?.bestStreak);
  const unreadMessages = toNumber(quickStats?.unreadMessages);

  const totalAttempts = toNumber(quickStats?.totalAttempts);
  const completionRate = toNumber(quickStats?.completionRate);

  const monthlyTotalAttempts = toNumber(monthlyStats?.totalAttempts);
  const monthlyAverageScore = toNumber(monthlyStats?.averageScore);
  const monthlyAccuracyRate = toNumber(monthlyStats?.accuracyRate);
  const monthlyTotalTime = toNumber(monthlyStats?.totalTime);

  return (
    <div className="min-h-screen bg-radial-gradient">
      {/* 🧭 الهيدر مع اسم الطالب وعدد الرسائل */}
      <Header
        studentName={student?.student_name ?? "طالب"}
        unreadCount={unreadMessages}
      />

      {/* main أقل padding و spacing أهدأ */}
<main className="pt-24 pb-10 px-2 sm:px-4 lg:px-6 w-full space-y-6 md:space-y-8 animate-fade-in">
        {/* 🎯 هيرو ترحيبي – حجم أهدأ */}
        <section className="card-glass relative overflow-hidden hover-lift p-4 sm:p-5 md:p-6">
          {/* دوائر خلفية خفيفة */}
          <div className="pointer-events-none absolute -top-24 -left-16 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 md:gap-8">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 badge-glow mb-1 text-[11px]">
                <span className="text-lg">🧮</span>
                <span>Power Of Math Dashboard</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-gradient-animated">
                مرحباً {student?.student_name ?? "صديقنا الصغير"} 👋
              </h1>

              <p className="text-gray-600 text-sm md:text-base max-w-xl">
                هذه لوحة التحكم الخاصة بك. هنا يمكنك متابعة تقدمك في الرياضيات،
                رؤية إنجازاتك، وأهدافك، وآخر التحديات التي شاركت فيها. استمر،
                أنت تصنع شيئاً رائعاً! 🚀
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                <div className="badge-glow text-[11px]">
                  <span>المستوى:</span>
                  <span className="ml-1 font-bold">{currentLevelName}</span>
                </div>
                <div className="badge-glow text-[11px]">
                  <span>الترتيب:</span>
                  <span className="ml-1 font-bold">#{currentLevelOrder}</span>
                </div>
                <div className="badge-glow text-[11px]">
                  <span>الفرع:</span>
                  <span className="ml-1 font-bold">{branchName}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button className="btn-magic text-sm py-3 px-6">
                  ابدأ تدريباً جديداً الآن ✨
                </button>
                <button className="btn-glass text-sm py-3 px-5">
                  شاهد تقدمك هذا الشهر 📈
                </button>
              </div>
            </div>

            {/* دائرة النقاط أصغر */}
            <div className="w-full md:w-56 flex justify-center">
              <div className="relative perspective-1000">
                <div className="transform-3d animate-float">
                  <div className="w-40 h-40 rounded-full bg-radial-gradient shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex flex-col items-center justify-center text-white shadow-2xl">
                      <div className="text-3xl mb-1">⭐</div>
                      <div className="text-[10px] opacity-80 mb-1">
                        مجموع نقاطك
                      </div>
                      <div className="text-xl font-black">
                        {totalScore.toLocaleString("ar-EG")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
                  استمر في جمع النجوم 👑
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔢 كروت إحصائيات سريعة – ارتفاعات متساوية وأحجام أهدأ */}
        <section className="grid gap-3 md:gap-4 lg:gap-5 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {/* المستوى */}
          <div className="card-3d hover-lift h-full p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">المستوى الحالي</p>
                <div className="text-base font-black text-orange-600">
                  {currentLevelName}
                </div>
              </div>
              <div className="icon-3d text-xl">🏅</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">
                ترتيب المستوى
              </div>
              <div className="font-bold text-gray-800 text-sm">
                #{currentLevelOrder}
              </div>
            </div>
          </div>

          {/* مجموع النقاط + الدقة */}
          <div className="card-3d hover-lift h-full p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">مجموع النقاط</p>
                <div className="text-base font-black text-amber-600">
                  {totalScore.toLocaleString("ar-EG")}
                </div>
              </div>
              <div className="icon-3d text-xl">🎖️</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">
                دقة الإجابات
              </div>
              <div className="font-bold text-gray-800 text-sm">
                {Math.round(accuracy)}%
              </div>
            </div>
          </div>

          {/* الشريط */}
          <div className="card-3d hover-lift h-full p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">الشريط اليومي</p>
                <div className="text-base font-black text-red-500">
                  {currentStreak} يوم
                </div>
              </div>
              <div className="icon-3d text-xl">🔥</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">أفضل شريط</div>
              <div className="font-bold text-gray-800 text-sm">
                {bestStreak} يوم
              </div>
            </div>
          </div>

          {/* النشاط والرسائل */}
          <div className="card-3d hover-lift h-full p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">
                  نشاط هذا الأسبوع
                </p>
                <div className="text-base font-black text-green-600">
                  {totalAttempts} محاولة
                </div>
              </div>
              <div className="icon-3d text-xl">📊</div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-600">
              <span>إنجاز التمارين: {Math.round(completionRate)}%</span>
              <span className="badge-glow text-[10px]">
                💬 {unreadMessages} رسائل غير مقروءة
              </span>
            </div>
          </div>
        </section>

        {/* 🧩 باقي المحتوى: يسار + يمين */}
        <section className="grid gap-5 lg:grid-cols-3 items-start">
          {/* العمود الأيسر (2 أعمدة) */}
          <div className="space-y-5 lg:col-span-2">
            {/* آخر التمارين */}
            <div className="card-glass hover-lift p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  آخر التمارين
                </h2>
                <span className="badge-glow text-[11px]">
                  {recentResults.length} تمرين
                </span>
              </div>

              {recentResults.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-sm">
                  لا توجد تمارين مكتملة بعد. ابدأ بأول تدريب لك اليوم! ✨
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-orange-50 text-[11px] text-gray-600">
                        <th className="p-2 text-right">التدريب</th>
                        <th className="p-2 text-right">المستوى</th>
                        <th className="p-2 text-right">القاعدة</th>
                        <th className="p-2 text-right">الدرجة</th>
                        <th className="p-2 text-right">الدقة</th>
                        <th className="p-2 text-right">الوقت</th>
                        <th className="p-2 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map((r) => {
                        const scoreNum = toNumber(r.score);
                        const accuracyNum = toNumber(r.accuracy);
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-gray-100 hover:bg-orange-50/40"
                          >
                            <td className="p-2 font-medium text-gray-800">
                              {r.sheetName ?? "غير معروف"}
                            </td>
                            <td className="p-2 text-gray-600">
                              {r.level ?? "غير معروف"}
                            </td>
                            <td className="p-2 text-gray-600">
                              {r.rule ?? "غير معروف"}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  scoreNum >= 90
                                    ? "bg-green-100 text-green-800"
                                    : scoreNum >= 70
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {scoreNum}%
                              </span>
                            </td>
                            <td className="p-2 text-gray-600">
                              {Math.round(accuracyNum)}%
                            </td>
                            <td className="p-2 text-gray-600">
                              {formatTime(r.timeSpent)}
                            </td>
                            <td className="p-2 text-gray-500">
                              {formatDate(r.date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* التحديات الأخيرة */}
            <div className="card-glass hover-lift p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  التحديات الأخيرة
                </h2>
                <span className="badge-glow text-[11px]">
                  {recentChallenges.length} تحدي
                </span>
              </div>

              {recentChallenges.length === 0 ? (
                <div className="py-5 text-center text-gray-500 text-sm">
                  لم تشارك في أي تحديات بعد، جرّب دعوة صديقك لأول تحدي! ⚔️
                </div>
              ) : (
                <div className="space-y-3">
                  {recentChallenges.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-2xl bg-white/70 border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-800">
                          تحدي {c.code} – {c.sheet}
                        </div>
                        <div className="text-gray-600">
                          {c.challenger} ضد {c.challenged}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`badge-3d text-[10px] ${
                            c.status === "completed"
                              ? "bg-gradient-to-b from-green-500 to-emerald-600"
                              : c.status === "active"
                              ? "bg-gradient-to-b from-amber-500 to-orange-600"
                              : "bg-gradient-to-b from-gray-400 to-gray-600"
                          }`}
                        >
                          {c.status === "completed"
                            ? "منتهٍ"
                            : c.status === "active"
                            ? "قيد التنفيذ"
                            : "معلّق"}
                        </span>
                        <span className="text-gray-500">
                          {formatDate(c.startTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* العمود الأيمن */}
          <div className="space-y-5">
            {/* الأهداف */}
            <div className="card-glass hover-lift p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  أهدافك
                </h2>
                <span className="badge-glow text-[11px]">
                  {completedCount}/{totalGoals} هدف مكتمل
                </span>
              </div>

              {generalGoals.length === 0 ? (
                <div className="text-sm text-gray-500">
                  لم يتم تعريف أهداف بعد، سيتم إنشاء أهداف افتراضية لك قريباً.
                </div>
              ) : (
                <div className="space-y-3">
                  {generalGoals.map((g) => {
                    const progressPercent = toNumber(g.progress);
                    return (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-700">
                            {g.icon} {g.title}
                          </span>
                          <span className="text-gray-500">
                            {g.current}/{g.target}
                          </span>
                        </div>
                        <div className="progress-3d h-3">
                          <div
                            className="progress-bar-glow"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, progressPercent)
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{g.description}</span>
                          <span
                            className={`font-bold ${
                              progressPercent >= 100
                                ? "text-green-600"
                                : "text-gray-700"
                            }`}
                          >
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {completedGoals.length > 0 && (
                <div className="mt-4 pt-3 border-t border-orange-100">
                  <h3 className="text-[11px] font-bold text-gray-800 mb-2 flex items-center gap-1">
                    <span className="text-lg">🏆</span>
                    الإنجازات الأخيرة
                  </h3>
                  <div className="space-y-2">
                    {completedGoals.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-green-50 border border-green-100 text-[11px]"
                      >
                        <div className="text-xl">{g.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {g.title}
                          </div>
                          <div className="text-gray-600">
                            {g.description}
                          </div>
                        </div>
                        <div className="text-gray-500">
                          {formatDate(g.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* التقدم الشهري */}
            <div className="card-glass hover-lift p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">📆</span>
                  التقدم هذا الشهر
                </h2>
                <span className="badge-glow text-[11px]">
                  {monthlyTotalAttempts} تمرين
                </span>
              </div>

              {monthlyTotalAttempts === 0 ? (
                <div className="text-sm text-gray-500">
                  لم تبدأ تمارين هذا الشهر بعد. جرّب اليوم أول تدريب لك ✨
                </div>
              ) : (
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>متوسط الدرجة</span>
                    <span className="font-bold text-amber-600">
                      {Math.round(monthlyAverageScore)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>دقة الإجابات</span>
                    <span className="font-bold text-green-600">
                      {Math.round(monthlyAccuracyRate)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>إجمالي الوقت</span>
                    <span className="font-bold text-purple-600">
                      {formatTime(monthlyTotalTime)}
                    </span>
                  </div>

                  {bestPerformance && (
                    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-[11px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🏅</span>
                        <div>
                          <div className="font-bold text-gray-800">
                            أفضل أداء هذا الشهر
                          </div>
                          <div className="text-gray-600">
                            {bestPerformance.sheetName ?? "غير معروف"}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-gray-700">
                        <div>
                          <div className="text-gray-500 mb-1">الدرجة</div>
                          <div className="font-bold text-green-600">
                            {toNumber(bestPerformance.score)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">الدقة</div>
                          <div className="font-bold text-blue-600">
                            {toNumber(bestPerformance.accuracy)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">الوقت</div>
                          <div className="font-bold text-purple-600">
                            {formatTime(bestPerformance.timeSpent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ملخص الاقتراحات والأنشطة */}
            <div className="card-glass hover-lift p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  ملخص النشاط و الاقتراحات
                </h2>
              </div>
              <div className="space-y-2 text-[11px] text-gray-700">
                <div className="flex items-center justify-between">
                  <span>عدد الأنشطة المسجلة</span>
                  <span className="badge-glow">{activitiesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>عدد الاقتراحات التعليمية</span>
                  <span className="badge-glow">{suggestionsCount}</span>
                </div>
                <p className="mt-1 text-gray-500">
                  اقتراحات التعلم يتم بناؤها اعتماداً على أدائك في التمارين
                  والتحديات. كلما تدربت أكثر، أصبحت الاقتراحات أذكى 🤖✨
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* نصيحة اليوم */}
        <section className="mt-2">
          <div className="card-glass text-center py-6 px-4 sm:px-6 hover-lift">
            <div className="text-3xl mb-2 animate-bounce">💡</div>
            <h3 className="text-lg font-black text-gray-800 mb-2">
              نصيحة اليوم للتعلم الفعّال
            </h3>
            <p className="text-gray-600 mb-3 text-sm max-w-2xl mx-auto">
              "10 دقائق من التمرين يومياً أفضل من ساعة واحدة في الأسبوع. اجعل
              الرياضيات عادة يومية، وسترى كيف سيتحسن مستواك بسرعة!" 💪
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-[10px]">
              <span className="badge-glow">⏰ الاستمرار أهم من الكثرة</span>
              <span className="badge-glow">🎯 هدف واضح</span>
              <span className="badge-glow">📈 متابعة التقدم</span>
              <span className="badge-glow">💬 اسأل عند الصعوبة</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
