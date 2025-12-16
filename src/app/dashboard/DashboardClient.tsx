// src/app/dashboard/DashboardClient.tsx
"use client";

type DashboardClientProps = {
  studentId: number;
  stats: any | null;
  activities: any[];
  progress: any | null;
  goals: any | null;
  suggestions: any[];
};

export default function DashboardClient({
  studentId,
  stats,
  activities,
  progress,
  goals,
  suggestions,
}: DashboardClientProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black mb-4">لوحة التحكم 🧮</h1>
        <p className="mb-2">معرّف الطالب: {studentId}</p>
        <p className="text-gray-600 mb-6">
          (هذه نسخة تجريبية من الواجهة، فقط للتأكد أن الربط يعمل بدون أخطاء)
        </p>

        <pre className="bg-white rounded-xl p-4 shadow border text-xs overflow-x-auto">
          {JSON.stringify(
            { stats, activitiesCount: activities.length, progress, goals, suggestionsCount: suggestions.length },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
