// src/app/challenge/ChallengeList.jsx
'use client';

import ChallengeCard from './ChallengeCard';

export default function ChallengeList({ challenges, studentId }) {
  if (!challenges || challenges.length === 0) {
    return (
      <div className="card text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          لا توجد تحديات بعد
        </h2>
        <p className="text-sm text-gray-600">
          يمكنك إنشاء أول تحدي لك بالضغط على زر "إنشاء تحدي جديد" في الأعلى.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.challenge_id}
          challenge={challenge}
          studentId={studentId}
        />
      ))}
    </div>
  );
}
