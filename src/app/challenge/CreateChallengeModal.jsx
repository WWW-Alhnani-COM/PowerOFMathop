// src/app/challenge/CreateChallengeModal.jsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createChallenge } from '@/actions/challenge.actions';

export default function CreateChallengeModal({ studentId, sheets }) {
  const router = useRouter();
  const [sheetId, setSheetId] = useState(
    sheets && sheets.length > 0 ? sheets[0].sheet_id : ''
  );
  const [timeLimit, setTimeLimit] = useState(
    sheets && sheets.length > 0 ? sheets[0].time_limit : 60
  );
  const [isPublic, setIsPublic] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!sheetId) {
      setErrorMsg('يجب اختيار ورقة التحدي.');
      return;
    }

    const numericStudentId =
      typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;

    if (!numericStudentId || Number.isNaN(numericStudentId)) {
      setErrorMsg('معرف الطالب غير صالح.');
      return;
    }

    startTransition(async () => {
      const res = await createChallenge({
        challengerId: numericStudentId,
        sheetId,
        timeLimit,
        isPublic,
      });

      if (!res || !res.success) {
        setErrorMsg(
          res?.error === 'SHEET_NOT_FOUND'
            ? 'ورقة التحدي غير موجودة.'
            : 'فشل إنشاء التحدي. حاول مرة أخرى.'
        );
        return;
      }

      setSuccessMsg('تم إنشاء التحدي بنجاح! سيتم نقلك لقائمة التحديات...');
      setTimeout(() => {
        router.push(`/challenge?studentId=${studentId}`);
      }, 800);
    });
  };

  return (
    <div className="card space-y-4">
      <div className="space-y-1 text-right">
        <h1 className="text-xl font-bold text-orange-700">إنشاء تحدي جديد 🎯</h1>
        <p className="text-sm text-gray-600">
          اختر ورقة التمارين، وحدد الوقت، ثم أنشئ تحدي عام لينضم إليه الآخرون.
        </p>
      </div>

      {sheets.length === 0 && (
        <p className="text-sm text-red-500">
          لا توجد أوراق مفعّلة حالياً لإنشاء تحدي. الرجاء إضافة أوراق من لوحة
          الإدارة أولاً.
        </p>
      )}

      {sheets.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار الورقة */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              ورقة التحدي
            </label>
            <select
              className="w-full rounded-xl border border-orange-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={sheetId}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setSheetId(value);
                const found = sheets.find((s) => s.sheet_id === value);
                if (found) {
                  setTimeLimit(found.time_limit);
                }
              }}
            >
              {sheets.map((sheet) => (
                <option key={sheet.sheet_id} value={sheet.sheet_id}>
                  {sheet.sheet_name} – المستوى: {sheet.level?.level_name || '-'} – القاعدة:{' '}
                  {sheet.rule?.rule_name || '-'}
                </option>
              ))}
            </select>
          </div>

          {/* الوقت */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              الوقت المحدد (بالثواني)
            </label>
            <input
              type="number"
              min={10}
              max={3600}
              className="w-full rounded-xl border border-orange-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 60)}
            />
            <p className="text-xs text-gray-500">
              يمكنك تعديل الوقت الافتراضي للورقة إذا رغبت.
            </p>
          </div>

          {/* نوع التحدي */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                className="h-4 w-4 text-orange-600 rounded border-orange-300 focus:ring-orange-400"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                تحدي عام (يمكن لأي طالب الانضمام)
              </label>
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 text-right">{errorMsg}</p>
          )}

          {successMsg && (
            <p className="text-sm text-green-600 text-right">{successMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-ghost text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending || sheets.length === 0}
              className="btn btn-primary text-sm"
            >
              {isPending ? 'جاري الإنشاء...' : 'إنشاء التحدي'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
