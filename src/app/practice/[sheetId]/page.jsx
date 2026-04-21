'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '../../../../components/layout/Header';
import { startPracticeSession, submitAnswer, finishPracticeSession } from '../../../../actions/sheet.actions';

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const ruleIdFromQuery = searchParams.get('rule');
  const mode = searchParams.get('mode') || 'practice';
  const lang = searchParams.get('lang') || 'ar';
  const resultIdFromQuery = searchParams.get('result_id');

  const [student, setStudent] = useState({ id: null, name: 'طالب' });
  const [loading, setLoading] = useState(true);

  const [resultId, setResultId] = useState(resultIdFromQuery ? Number(resultIdFromQuery) : null);
  const [sheetInfo, setSheetInfo] = useState(null);

  const [session, setSession] = useState(null);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // تحميل الطالب
  useEffect(() => {
    const id = localStorage.getItem('student_id');
    const name = localStorage.getItem('student_name');
    if (!id) {
      router.push('/login?callbackUrl=/levels');
      return;
    }
    setStudent({ id: Number(id), name: name || 'طالب' });
  }, [router]);

  // بدء الجلسة
  useEffect(() => {
    if (!student.id) return;

    const boot = async () => {
      setLoading(true);

      if (!ruleIdFromQuery && !resultIdFromQuery) {
        setLoading(false);
        return;
      }

      const start = await startPracticeSession({
        student_id: student.id,
        rule_id: Number(ruleIdFromQuery),
        mode,
        language: lang,
      });

      if (!start.success) {
        alert(start.error || 'فشل بدء الجلسة');
        setLoading(false);
        return;
      }

      const rid = resultIdFromQuery
        ? Number(resultIdFromQuery)
        : start.data.result.result_id;

      setResultId(rid);
      setSheetInfo(start.data.sheet);
      setSession(start.data.session);
      setIsRunning(true);

      if (!resultIdFromQuery) {
        router.replace(`/practice/${start.data.sheet.sheet_id}?rule=${ruleIdFromQuery}&mode=${mode}&lang=${lang}&result_id=${rid}`);
      }

      setLoading(false);
    };

    boot();
  }, [student.id, ruleIdFromQuery, resultIdFromQuery, mode, lang, router]);

  // Timer
  useEffect(() => {
    let t;
    if (isRunning) {
      t = setInterval(() => setTimer((p) => p + 1), 1000);
    }
    return () => clearInterval(t);
  }, [isRunning]);

  // إرسال الإجابة
  const handleSubmit = useCallback(async () => {
    if (!session || !resultId) return;

    const p = session.problems[currentProblem];
    const userAns = String(inputValue).trim();
    if (!userAns) return;

    const res = await submitAnswer({
      result_id: resultId,
      student_id: student.id,
      problem_type_id: p.problem_type_id,
      problem_data: p.problem_data,
      user_answer: userAns,
      correct_answer: p.correct_answer,
      time_spent: 0,
      sequence_number: currentProblem + 1,
    });

    if (!res.success) {
      alert(res.error || 'فشل حفظ الإجابة');
      return;
    }

    setInputValue('');

    if (currentProblem < session.problems.length - 1) {
      setCurrentProblem((x) => x + 1);
    } else {
      await handleFinish();
    }
  }, [session, resultId, currentProblem, inputValue, student.id]);

  // إنهاء
  const handleFinish = useCallback(async () => {
    if (!resultId) return;

    setIsRunning(false);

    const fin = await finishPracticeSession({
      result_id: resultId,
      student_id: student.id,
    });

    if (!fin.success) {
      alert(fin.error || 'فشل إنهاء الجلسة');
      return;
    }

    setShowResults(true);
  }, [resultId, student.id]);

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-yellow-50">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl animate-bounce mb-4">🧠</div>
          <h2 className="text-2xl font-bold">جارٍ تحميل الجلسة...</h2>
        </div>
      </div>
    );
  }

  // لا توجد جلسة
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          لا توجد جلسة
        </div>
      </div>
    );
  }

  // النتائج
  if (showResults) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-yellow-50">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="card-glass p-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black mb-4">تم إنهاء الجلسة</h2>
            <button
              onClick={() => router.push('/levels')}
              className="btn-magic px-6 py-3"
            >
              العودة للمستويات
            </button>
          </div>
        </div>
      </div>
    );
  }

  const problem = session.problems[currentProblem];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">

      {/* خلفية */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-yellow-300/10 to-orange-300/10 rounded-full blur-3xl" />
      </div>

      <Header studentName={student.name} unreadCount={0} />

      <div className="container mx-auto px-4 py-10 relative z-10 max-w-3xl">

        {/* عنوان */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gradient-animated mb-4">
            🧠 جلسة التدريب
          </h1>
        </div>

        {/* معلومات */}
        <div className="card-glass p-4 mb-6 flex justify-between text-sm">
          <span>🆔 {resultId}</span>
          <span>⏱ {timer}s</span>
          <span>📊 {currentProblem + 1}/{session.problems.length}</span>
        </div>

        {/* السؤال */}
        <div className="card-3d p-8 mb-6 text-center">
          <div className="text-3xl font-black mb-6">
            {problem.question}
          </div>

          <input
            className="w-full p-4 rounded-xl border text-center text-xl mb-6"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="اكتب الإجابة"
          />

          <div className="flex gap-4">
            <button onClick={handleSubmit} className="btn-magic flex-1">
              {currentProblem === session.problems.length - 1 ? 'إنهاء' : 'التالي'}
            </button>

            <button onClick={handleFinish} className="bg-red-500 text-white px-4 py-2 rounded-xl flex-1">
              إنهاء
            </button>
          </div>
        </div>

        {/* تقدم */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>التقدم</span>
            <span>
              {Math.round(((currentProblem + 1) / session.problems.length) * 100)}%
            </span>
          </div>

          <div className="progress-3d">
            <div
              className="progress-bar-glow"
              style={{
                width: `${((currentProblem + 1) / session.problems.length) * 100}%`
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
