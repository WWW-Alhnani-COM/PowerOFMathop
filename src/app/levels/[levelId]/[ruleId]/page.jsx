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
    setStudentName(name);
  }, [router]);

  useEffect(() => {
    if (!currentStudentId || !ruleId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // محاولة جلب أوراق التمارين للقاعدة
        const sheetsRes = await getSheetsByRule(ruleId);
        
        if (sheetsRes.success) {
          setRuleData(sheetsRes.data);
          setHasSheets(sheetsRes.data.sheets.length > 0);

          const sheets = sheetsRes.data.sheets;
          
          // جلب نتائج الطالب في هذه الأوراق
          const sheetIds = sheets.map(sheet => sheet.sheet_id);
          const resultsRes = await getStudentSheetResults(currentStudentId, sheetIds);
          const results = resultsRes.success ? resultsRes.data : [];

          // دمج البيانات
          const sheetsWithData = sheets.map((sheet, index) => {
            const result = results.find(r => r.sheet_id === sheet.sheet_id);
            return {
              ...sheet,
              result: result || null,
              index: index
            };
          });

          setSheetsWithProgress(sheetsWithData);

          // حساب الإحصائيات
          const stats = sheetsWithData.reduce((acc, sheet) => ({
            totalSheets: acc.totalSheets + 1,
            completedSheets: acc.completedSheets + (sheet.result?.status === 'completed' ? 1 : 0),
            totalProblems: acc.totalProblems + (sheet.total_problems || 0),
            totalTime: acc.totalTime + (sheet.time_limit || 0),
            averageScore: acc.averageScore + (sheet.result?.score || 0)
          }), { 
            totalSheets: 0, 
            completedSheets: 0, 
            totalProblems: 0, 
            totalTime: 0, 
            averageScore: 0 
          });

          stats.averageScore = stats.completedSheets > 0 ? 
            Math.round(stats.averageScore / stats.completedSheets) : 0;

          setStudentStats(stats);
        } else {
          // إذا لم توجد أوراق، نستخدم القاعدة فقط
          setHasSheets(false);
          setRuleData({
            rule: { rule_name: 'القاعدة ' + ruleId, description: 'تدريب تلقائي' }
          });
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        // حتى مع الخطأ، نسمح بالتدريب
        setHasSheets(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStudentId, ruleId, levelId, router]);

  // بدء تمرين جديد
  const handleStartNewPractice = async () => {
    if (!ruleId) return;

    setGeneratingSession(true);
    
    try {
      // إنشاء ورقة تلقائية إذا لزم
      const sheetRes = await createAutoSheetIfNeeded(ruleId, currentStudentId);
      
      let sheetId;
      if (sheetRes.success) {
        sheetId = sheetRes.data.sheet_id;
      } else {
        // إذا فشل إنشاء ورقة، نستخدم رقم افتراضي
        sheetId = Date.now(); // رقم فريد
      }

      // توليد الجلسة
      const result = await generatePracticeSession({
        rule_id: ruleId,
        mode: practiceMode,
        language: practiceLanguage
      });

      if (result.success) {
        // حفظ الجلسة في localStorage
        localStorage.setItem('current_practice_session', JSON.stringify({
          ...result.data,
          sheet_id: sheetId,
          sheet_name: practiceMode === 'practice' ? 'تمرين تلقائي' : 'شيت تلقائي'
        }));
        
        localStorage.setItem('practice_mode', practiceMode);
        localStorage.setItem('practice_language', practiceLanguage);
        localStorage.setItem('auto_sheet_id', sheetId);
        
        // الانتقال إلى صفحة التمرين
        router.push(`/practice/${sheetId}?rule=${ruleId}&mode=${practiceMode}&lang=${practiceLanguage}`);
      } else {
        alert('فشل في إنشاء التمرين: ' + result.error);
      }
    } catch (error) {
      alert('حدث خطأ غير متوقع');
      console.error(error);
    } finally {
      setGeneratingSession(false);
      setShowPracticeOptions(false);
    }
  };

  // بدء ورقة موجودة
  const handleStartSheet = (sheetId) => {
    localStorage.setItem('current_sheet_id', sheetId);
    localStorage.setItem('practice_mode', 'practice');
    localStorage.setItem('practice_language', 'ar');
    router.push(`/practice/${sheetId}`);
  };

  // ألوان متنوعة للتمارين
  const getSheetColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
    ];
    return colors[index % colors.length];
  };

  // أيقونات متنوعة
  const getSheetIcon = (status, index) => {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '🔄';
    if (status === 'failed') return '❌';
    
    const icons = ['🧮', '📝', '🎯', '⚡', '✨', '🏆', '📊', '🎨', '💡', '🚀'];
    return icons[index % icons.length];
  };

  // الحصول على حالة التمرين
  const getSheetStatus = (result) => {
    if (!result) return 'not_started';
    if (result.status === 'completed') return 'completed';
    if (result.status === 'in_progress') return 'in_progress';
    return 'not_started';
  };

  // الحصول على نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'in_progress': return 'جاري التنفيذ';
      case 'failed': return 'غير ناجح';
      default: return 'لم يبدأ';
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // حساب نسبة النجاح الفعلية
  const calculateSuccessRate = (sheet) => {
    if (!sheet.result || sheet.result.status !== 'completed') return 0;
    return Math.round(sheet.result.score);
  };

  // تنسيق الوقت
  const formatTime = (seconds) => {
    if (!seconds) return '0 ثانية';
    if (seconds < 60) return `${seconds} ثانية`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} دقيقة ${remainingSeconds > 0 ? `${remainingSeconds} ثانية` : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
        <Header studentName={studentName} unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-6 bg-gradient-to-r from-green-300 to-blue-300 rounded-full animate-spin" />
            <div className="absolute inset-12 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            جارٍ تحضير التمارين...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
      <Header studentName={studentName} unreadCount={0} />
      
      <div className="container mx-auto px-4 py-8">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 shadow-lg">
            <span className="text-3xl text-white">📝</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            تمارين قاعدة: <span className="text-green-600">{ruleData?.rule.rule_name || 'تدريب تلقائي'}</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            اختر تمرينًا واختبر مهاراتك في هذه القاعدة
          </p>
          {!hasSheets && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <span>⚡</span>
              <span className="text-sm">سيتم توليد تمارين تلقائياً</span>
            </div>
          )}
        </div>

        {/* زر بدء تمرين جديد */}
        <div className="mb-10 text-center">
          <button
            onClick={() => setShowPracticeOptions(!showPracticeOptions)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl">✨</span>
              <span>بدء تمرين جديد</span>
              <span className="text-2xl">🎯</span>
            </span>
          </button>
          
          {/* Form اختيارات التمرين */}
          {showPracticeOptions && (
            <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                ⚙️ إعدادات التمرين
              </h3>
              
              <div className="space-y-6">
                {/* اختيار نوع التمرين */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 نوع التمرين
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPracticeMode('practice')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${practiceMode === 'practice' 
                        ? 'bg-blue-50 border-blue-500 text-blue-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="text-lg mb-1">🧮</div>
                      <div className="font-medium">تمارين (20 سؤال)</div>
                    </button>
                    
                    <button
                      onClick={() => setPracticeMode('sheet')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${practiceMode === 'sheet' 
                        ? 'bg-purple-50 border-purple-500 text-purple-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="text-lg mb-1">📄</div>
                      <div className="font-medium">شيت كامل (350 سؤال)</div>
                    </button>
                  </div>
                </div>

                {/* اختيار اللغة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌐 لغة التمرين
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPracticeLanguage('ar')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${practiceLanguage === 'ar' 
                        ? 'bg-green-50 border-green-500 text-green-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="text-lg mb-1">🇸🇦</div>
                      <div className="font-medium">العربية</div>
                    </button>
                    
                    <button
                      onClick={() => setPracticeLanguage('en')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${practiceLanguage === 'en' 
                        ? 'bg-red-50 border-red-500 text-red-600' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="text-lg mb-1">🇺🇸</div>
                      <div className="font-medium">الإنجليزية</div>
                    </button>
                  </div>
                </div>

                {/* معلومات التمرين المختار */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">النوع المختار:</span>
                    <span className="font-bold">
                      {practiceMode === 'practice' ? 'تمارين (20 سؤال)' : 'شيت كامل (350 سؤال)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">اللغة المختارة:</span>
                    <span className="font-bold">
                      {practiceLanguage === 'ar' ? 'العربية 🇸🇦' : 'الإنجليزية 🇺🇸'}
                    </span>
                  </div>
                </div>

                {/* أزرار التنفيذ */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  
                  <button
                    onClick={handleStartNewPractice}
                    disabled={generatingSession}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingSession ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري التوليد...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🚀</span>
                        بدء التمرين
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* عرض الأوراق المخزنة (إذا كانت موجودة) */}
        {hasSheets && sheetsWithProgress.length > 0 && (
          <>
            {/* إحصائيات القاعدة */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">عدد التمارين</p>
                    <p className="text-2xl font-bold text-blue-600">{studentStats.totalSheets}</p>
                  </div>
                  <div className="text-2xl">📚</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">المكتملة</p>
                    <p className="text-2xl font-bold text-green-600">{studentStats.completedSheets}</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">المسائل الإجمالية</p>
                    <p className="text-2xl font-bold text-purple-600">{studentStats.totalProblems}</p>
                  </div>
                  <div className="text-2xl">🔢</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">متوسط الوقت</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatTime(Math.round(studentStats.totalTime / studentStats.totalSheets))}
                    </p>
                  </div>
                  <div className="text-2xl">⏱️</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">متوسط النقاط</p>
                    <p className="text-2xl font-bold text-red-600">{studentStats.averageScore}%</p>
                  </div>
                  <div className="text-2xl">⭐</div>
                </div>
              </div>
            </div>

            {/* عنوان الأوراق المخزنة */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-700 mb-2">
                📂 الأوراق المخزنة
              </h2>
              <p className="text-gray-600 text-sm">
                أوراق تمارين جاهزة يمكنك البدء بها مباشرة
              </p>
            </div>

            {/* شبكة التمارين المخزنة */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sheetsWithProgress.map((sheet) => {
                  const status = getSheetStatus(sheet.result);
                  const statusText = getStatusText(status);
                  const statusColor = getStatusColor(status);
                  const successRate = calculateSuccessRate(sheet);
                  
                  return (
                    <div
                      key={sheet.sheet_id}
                      className="relative"
                      onMouseEnter={() => setHoveredSheet(sheet.sheet_id)}
                      onMouseLeave={() => setHoveredSheet(null)}
                    >
                      {/* البطاقة الرئيسية */}
                      <div className={`
                        bg-white rounded-2xl p-6 border-2 border-white
                        shadow-lg transition-all duration-500
                        ${hoveredSheet === sheet.sheet_id ? 'shadow-xl -translate-y-2 scale-[1.02]' : ''}
                      `}>
                        {/* شريط لوني علوي */}
                        <div 
                          className={`h-3 w-full mb-6 rounded-t-xl bg-gradient-to-r ${getSheetColor(sheet.index)} transition-all duration-500 ${
                            hoveredSheet === sheet.sheet_id ? 'scale-x-105' : ''
                          }`}
                        />
                        
                        {/* العنوان والرمز */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`
                            w-14 h-14 rounded-xl flex items-center justify-center
                            bg-gradient-to-r ${getSheetColor(sheet.index)} text-white
                            text-2xl shadow-md transition-transform duration-300
                            ${hoveredSheet === sheet.sheet_id ? 'scale-110 rotate-12' : ''}
                          `}>
                            {getSheetIcon(status, sheet.index)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                  {sheet.sheet_name}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  تمرين رقم {sheet.index + 1}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* الإحصائيات */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                            <div className="text-lg font-bold text-blue-600">{sheet.total_problems || 0}</div>
                            <div className="text-xs text-gray-600">مسألة</div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                            <div className="text-lg font-bold text-purple-600">{formatTime(sheet.time_limit || 0)}</div>
                            <div className="text-xs text-gray-600">الوقت المحدد</div>
                          </div>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                            <div className="text-lg font-bold text-green-600">{sheet.required_score || 70}%</div>
                            <div className="text-xs text-gray-600">للنجاح</div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border border-orange-100">
                            <div className="text-lg font-bold text-orange-600">{successRate}%</div>
                            <div className="text-xs text-gray-600">نتيجتك</div>
                          </div>
                        </div>
                        
                        {/* زر البدء */}
                        <button
                          onClick={() => handleStartSheet(sheet.sheet_id)}
                          className={`
                            w-full py-3 rounded-xl text-white font-bold
                            transition-all duration-300 flex items-center justify-center gap-3
                            bg-gradient-to-r ${getSheetColor(sheet.index)}
                            ${hoveredSheet === sheet.sheet_id ? 'scale-105 shadow-lg' : ''}
                          `}
                        >
                          <span className={`
                            text-xl transition-transform duration-300
                            ${hoveredSheet === sheet.sheet_id ? 'scale-125' : ''}
                          `}>
                            {hoveredSheet === sheet.sheet_id ? '🚀' : '🎯'}
                          </span>
                          <span>
                            {hoveredSheet === sheet.sheet_id ? 'انطلق!' : 'ابدأ التمرين'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* إذا لم تكن هناك أوراق */}
        {!hasSheets && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold text-blue-800 mb-4">
                نظام التدريب التلقائي
              </h3>
              <p className="text-blue-600 mb-6">
                لا تحتاج لوجود أوراق مسبقة! النظام سيولد تمارين تلقائياً 
                بناءً على قوالب القواعد الرياضية المخزنة.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-bold text-gray-800">توليد ذكي</div>
                  <div className="text-sm text-gray-600">مسائل مختلفة كل مرة</div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-gray-800">سرعة فائقة</div>
                  <div className="text-sm text-gray-600">توليد فوري للمسائل</div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-bold text-gray-800">تحليل أداء</div>
                  <div className="text-sm text-gray-600">تتبع التقدم تلقائياً</div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                اضغط على "بدء تمرين جديد" لبدء التدريب التلقائي
              </p>
            </div>
          </div>
        )}

        {/* نصائح للنجاح */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="text-3xl text-green-500 animate-pulse">💡</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  نصائح للنجاح في التمارين
                </h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    ابدأ بتمرين جديد لتنوع الأسئلة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    اختر اللغة التي تناسب مستواك
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    الشيت الكامل مناسب للمراجعة النهائية
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    التمارين القصيرة مناسبة للممارسة اليومية
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التنقل */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push(`/levels/${levelId}`)}
            className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-300"
          >
            ← العودة للقواعد
          </button>
          <button
            onClick={() => router.push('/levels')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            🏠 جميع المستويات
          </button>
        </div>
      </div>
    </div>
  );
}