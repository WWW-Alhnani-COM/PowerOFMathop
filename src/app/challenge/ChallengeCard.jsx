// src/app/challenge/ChallengeCard.jsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { joinChallenge } from '../../actions/challenge.actions';

export default function ChallengeCard({ challenge, studentId, showDetails = false }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState(null);

  const numericStudentId =
    typeof studentId === 'string' ? parseInt(studentId, 10) : studentId || null;

  const isOwner = numericStudentId && challenge.challenger_id === numericStudentId;
  const isOpponent = numericStudentId && challenge.challenged_id === numericStudentId;
  const hasOpponent = !!challenge.challenged_id;

  const canJoin =
    numericStudentId &&
    !isOwner &&
    !isOpponent &&
    !hasOpponent &&
    challenge.status === 'pending' &&
    challenge.is_public;

  const handleJoin = () => {
    if (!numericStudentId) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await joinChallenge({
        challengeId: challenge.challenge_id,
        studentId: numericStudentId,
      });
      if (!res || !res.success) {
        setErrorMsg(res?.error || 'فشل الانضمام للتحدي.');
        return;
      }
      router.refresh();
    });
  };

  const statusLabel = (() => {
    switch (challenge.status) {
      case 'pending':
        return 'في انتظار المنافس';
      case 'active':
        return 'قيد اللعب';
      case 'completed':
        return 'منتهي';
      default:
        return challenge.status || 'غير معروف';
    }
  })();

  return (
    <div className="card hover-lift">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-1 text-right">
          <p className="text-xs text-gray-500">ورقة التحدي</p>
          <h2 className="text-base font-bold text-gray-800">
            {challenge.sheet?.sheet_name || 'ورقة بدون اسم'}
          </h2>
          <p className="text-xs text-gray-500">
            الوقت المحدد: {challenge.time_limit} ثانية
          </p>
        </div>
        <div className="text-left">
          <span className="badge mb-1">
            {challenge.is_public ? 'تحدي عام' : 'تحدي خاص'}
          </span>
          {challenge.challenge_code && (
            <p className="text-[11px] text-gray-500">
              كود التحدي: <span className="font-mono">{challenge.challenge_code}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 mb-3">
        <div className="text-right text-xs">
          <p className="text-gray-500">اللاعب الأول</p>
          <p className="font-bold text-orange-700">
            {challenge.challenger?.student_name || 'غير معروف'}
            {isOwner && ' (أنت)'}
          </p>
        </div>
        <div className="text-left text-xs">
          <p className="text-gray-500">اللاعب الثاني</p>
          <p className="font-bold text-blue-700">
            {challenge.challenged
              ? `${challenge.challenged.student_name}${isOpponent ? ' (أنت)' : ''}`
              : 'في انتظار منافس'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-gray-500">{statusLabel}</span>
        <div className="flex items-center gap-2">
          {canJoin && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              className="btn btn-primary text-xs px-3 py-2"
            >
              {isPending ? 'جاري الانضمام...' : 'انضم للتحدي'}
            </button>
          )}

          <Link
            href={
              studentId
                ? `/challenge/${challenge.challenge_id}?studentId=${studentId}`
                : `/challenge/${challenge.challenge_id}`
            }
            className="btn btn-ghost text-xs px-3 py-2"
          >
            تفاصيل التحدي
          </Link>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 mt-1 text-right">{errorMsg}</p>
      )}

      {showDetails && (
        <div className="mt-3 border-t border-orange-100 pt-2 text-xs text-gray-600">
          <p>
            تم إنشاء التحدي في:{' '}
            {new Date(challenge.created_at).toLocaleString('ar-EG')}
          </p>
          {challenge.start_time && (
            <p>
              وقت بدء التحدي:{' '}
              {new Date(challenge.start_time).toLocaleString('ar-EG')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
