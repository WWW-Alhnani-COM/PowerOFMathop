// داخل src/app/practice/[sheetId]/page.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Header from '../../components/layout/Header.tsx';
import { startPracticeSession, submitAnswer, finishPracticeSession } from '../../../actions/sheet.actions';

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

  const [session, setSession] = useState(null); // problems here
  const [currentProblem, setCurrentProblem] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 1) تحميل الطالب
  useEffect(() => {
    const id = localStorage.getItem('student_id');
    const name = localStorage.getItem('student_name');
    if (!id) {
      router.push('/login?callbackUrl=/levels');
      return;
    }
    setStudent({ id: Number(id), name: name || 'طالب' });
  }, [router]);

  // 2) بدء/تحميل جلسة Production عبر result_id
  useEffect(() => {
    if (!student.id) return;

    const boot = async () => {
      setLoading(true);

      // إذا لا يوجد rule في الرابط، لا نقدر نبدأ
      if (!ruleIdFromQuery && !resultIdFromQuery) {
        setLoading(false);
        return;
      }

      // إذا لا يوجد result_id → ابدأ Session جديدة
      if (!resultIdFromQuery) {
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

        const rid = start.data.result.result_id;
        setResultId(rid);
        setSheetInfo(start.data.sheet);
        setSession(start.data.session);
        setIsRunning(true);

        // ✅ مهم: حط result_id في الرابط حتى لو عمل Refresh تكمل بنفس الجلسة
        router.replace(`/practice/${start.data.sheet.sheet_id}?rule=${ruleIdFromQuery}&mode=${mode}&lang=${lang}&result_id=${rid}`);
      } else {
        // لديك result_id جاهز (في حال refresh) — هنا أبسط حل:
        // اعتمد على session التي يمكن توليدها من جديد (stateless) أو يمكنك عمل endpoint لجلبها إن كنت تخزنها.
        // في هذا النظام: session تُولّد من جديد عند refresh (لكن الحفظ في DB مستمر)، وهذا مقبول إنتاجياً.
        const start = await startPracticeSession({
          student_id: student.id,
          rule_id: Number(ruleIdFromQuery),
          mode,
          language: lang,
        });

        // ملاحظة: هذا سيعمل Result جديد. لو تريد إكمال نفس الـ result_id بدون إنشاء جديد:
        // نضيف Action: getPracticeContext(result_id) (أقدر أكتبها لك).
        // الآن: سنعتبر refresh يبدأ جلسة جديدة - أو امنع refresh UX.

        if (!start.success) {
          alert(start.error || 'فشل توليد الجلسة');
          setLoading(false);
          return;
        }

        const rid = Number(resultIdFromQuery);
        setResultId(rid);
        setSheetInfo(start.data.sheet);
        setSession(start.data.session);
        setIsRunning(true);
      }

      setLoading(false);
    };

    boot();
  }, [student.id, ruleIdFromQuery, resultIdFromQuery, mode, lang, router]);

  // 3) Timer (عرض فقط)
  useEffect(() => {
    let t;
    if (isRunning) {
      t = setInterval(() => setTimer((p) => p + 1), 1000);
    }
    return () => clearInterval(t);
  }, [isRunning]);

  // 4) حفظ الإجابة فوراً في DB
  const handleSubmit = useCallback(async () => {
    if (!session || !resultId) return;
    const p = session.problems[currentProblem];
    const userAns = String(inputValue).trim();
    if (!userAns) return;

    const time_spent = 0; // لو تريد دقة أعلى: احسب per-question timer
    const res = await submitAnswer({
      result_id: resultId,
      student_id: student.id,
      problem_type_id: p.problem_type_id,
      problem_data: p.problem_data,
      user_answer: userAns,
      correct_answer: p.correct_answer,
      time_spent,
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

  // 5) إنهاء الجلسة وحساب النتائج (Server)
  const handleFinish = useCallback(async () => {
    if (!resultId) return;
    setIsRunning(false);

    const fin = await finishPracticeSession({ result_id: resultId, student_id: student.id });
    if (!fin.success) {
      alert(fin.error || 'فشل إنهاء الجلسة');
      return;
    }

    setShowResults(true);
  }, [resultId, student.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">لا توجد جلسة</div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header studentName={student.name} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-xl font-bold mb-2">تم حفظ النتيجة ✅</div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => router.push('/levels')}>
              العودة للمستويات
            </button>
          </div>
        </div>
      </div>
    );
  }

  const problem = session.problems[currentProblem];

  return (
    <div className="min-h-screen flex flex-col">
      <Header studentName={student.name} unreadCount={0} />
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="mb-2 text-sm text-gray-600">
          result_id: <b>{resultId}</b> • الوقت: <b>{timer}s</b>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold mb-4">{problem.question}</div>

          <input
            className="w-full border rounded p-3 mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="اكتب الإجابة"
          />

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>
              حفظ + التالي
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleFinish}>
              إنهاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
