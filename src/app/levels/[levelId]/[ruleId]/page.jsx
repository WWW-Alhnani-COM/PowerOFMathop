// src/app/levels/[levelId]/[ruleId]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../../components/layout/Header';
import { getSheetsByRule } from '../../../../../actions/level.actions';
import { generatePracticeSession } from '../../../../../actions/generator.actions';
import { getStudentSheetResults, createAutoSheetIfNeeded } from '../../../../../actions/sheet.actions';

export default function RuleSheetsPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params?.levelId;
  const ruleId = params?.ruleId;

  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentName, setStudentName] = useState('طالب');
  const [ruleData, setRuleData] = useState(null);
  const [sheetsWithProgress, setSheetsWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSheet, setHoveredSheet] = useState(null);
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [practiceMode, setPracticeMode] = useState('practice');
  const [practiceLanguage, setPracticeLanguage] = useState('ar');
  const [generatingSession, setGeneratingSession] = useState(false);
  const [hasSheets, setHasSheets] = useState(true);

  const [studentStats, setStudentStats] = useState({
    totalSheets: 0,
    completedSheets: 0,
    totalProblems: 0,
    totalTime: 0,
    averageScore: 0
  });

  useEffect(() => {
    const id = localStorage.getItem('student_id');
    const name = localStorage.getItem('student_name');

    if (!id) {
      router.push('/login?callbackUrl=/levels');
      return;
    }

    setCurrentStudentId(parseInt(id));
    setStudentName(name || 'طالب');
  }, [router]);

  useEffect(() => {
    if (!currentStudentId || !ruleId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const sheetsRes = await getSheetsByRule(ruleId);

        if (sheetsRes.success) {
          setRuleData(sheetsRes.data);
          setHasSheets(sheetsRes.data.sheets.length > 0);

          const sheets = sheetsRes.data.sheets;

          const sheetIds = sheets.map(s => s.sheet_id);
          const resultsRes = await getStudentSheetResults(currentStudentId, sheetIds);
          const results = resultsRes.success ? resultsRes.data : [];

          const merged = sheets.map((sheet, index) => {
            const result = results.find(r => r.sheet_id === sheet.sheet_id);
            return { ...sheet, result, index };
          });

          setSheetsWithProgress(merged);

          const stats = merged.reduce(
            (acc, sheet) => {
              acc.totalSheets += 1;
              acc.completedSheets += sheet.result?.status === 'completed' ? 1 : 0;
              acc.totalProblems += sheet.total_problems || 0;
              acc.totalTime += sheet.time_limit || 0;
              acc.averageScore += sheet.result?.score || 0;
              return acc;
            },
            {
              totalSheets: 0,
              completedSheets: 0,
              totalProblems: 0,
              totalTime: 0,
              averageScore: 0
            }
          );

          stats.averageScore =
            stats.completedSheets > 0
              ? Math.round(stats.averageScore / stats.completedSheets)
              : 0;

          setStudentStats(stats);
        } else {
          setHasSheets(false);
        }
      } catch (err) {
        console.error(err);
        setHasSheets(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStudentId, ruleId]);

  const handleStartNewPractice = async () => {
    setGeneratingSession(true);

    try {
      const sheetRes = await createAutoSheetIfNeeded(ruleId, currentStudentId);

      const sheetId = sheetRes.success ? sheetRes.data.sheet_id : Date.now();

      const result = await generatePracticeSession({
        rule_id: ruleId,
        mode: practiceMode,
        language: practiceLanguage
      });

      if (result.success) {
        localStorage.setItem(
          'current_practice_session',
          JSON.stringify({
            ...result.data,
            sheet_id: sheetId
          })
        );

        router.push(
          `/practice/${sheetId}?rule=${ruleId}&mode=${practiceMode}&lang=${practiceLanguage}`
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSession(false);
      setShowPracticeOptions(false);
    }
  };

  const handleStartSheet = (sheetId) => {
    router.push(`/practice/${sheetId}`);
  };

  const getColor = (i) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500'
    ];
    return colors[i % colors.length];
  };

  const getIcon = (status) => {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '🔄';
    return '🧮';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header studentName={studentName} />
        <div className="flex-1 flex items-center justify-center text-2xl font-bold">
          جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">

      {/* خلفية */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
      </div>

      <Header studentName={studentName} />

      <div className="relative z-10 container mx-auto px-4 py-10">

        {/* العنوان */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-gradient-animated mb-3">
            🧮 تمارين القاعدة
          </h1>
          <p className="text-gray-600 text-lg">
            اختر تمرينك وابدأ التدريب
          </p>
        </div>

        {/* زر بدء */}
        <div className="text-center mb-10">
          <button
            onClick={() => setShowPracticeOptions(!showPracticeOptions)}
            className="btn-magic px-10 py-4 text-lg"
          >
            ✨ بدء تمرين جديد 🚀
          </button>

          {showPracticeOptions && (
            <div className="card-glass mt-6 p-6 max-w-md mx-auto">

              <div className="space-y-4">

                <button
                  onClick={() => setPracticeMode('practice')}
                  className={`w-full p-3 rounded-xl border ${
                    practiceMode === 'practice'
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50'
                  }`}
                >
                  🧮 20 سؤال
                </button>

                <button
                  onClick={() => setPracticeMode('sheet')}
                  className={`w-full p-3 rounded-xl border ${
                    practiceMode === 'sheet'
                      ? 'bg-purple-100 border-purple-500'
                      : 'bg-gray-50'
                  }`}
                >
                  📄 350 سؤال
                </button>

                <button
                  onClick={handleStartNewPractice}
                  className="btn-magic w-full"
                >
                  🚀 بدء
                </button>

              </div>
            </div>
          )}
        </div>

        {/* الشبكة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {sheetsWithProgress.map((sheet) => (
            <div
              key={sheet.sheet_id}
              className="card-3d p-6 relative overflow-hidden"
              onMouseEnter={() => setHoveredSheet(sheet.sheet_id)}
              onMouseLeave={() => setHoveredSheet(null)}
            >

              <div className={`h-2 w-full mb-4 rounded-xl bg-gradient-to-r ${getColor(sheet.index)}`} />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl">
                  {sheet.sheet_name}
                </h3>
                <span>{getIcon(sheet.result?.status)}</span>
              </div>

              <p className="text-gray-600 mb-4">
                {sheet.total_problems} سؤال
              </p>

              <button
                onClick={() => handleStartSheet(sheet.sheet_id)}
                className={`btn-magic w-full`}
              >
                🚀 ابدأ
              </button>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
