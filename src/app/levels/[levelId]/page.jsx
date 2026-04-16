// src/app/levels/[levelId]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/layout/Header';
import { getRulesByLevel } from '../../../../actions/level.actions.js';

export default function LevelRulesPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params?.levelId;

  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentName, setStudentName] = useState('طالب');
  const [levelData, setLevelData] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRule, setHoveredRule] = useState(null);

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
    if (!currentStudentId || !levelId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const rulesRes = await getRulesByLevel(levelId);
        if (!rulesRes.success) {
          alert(rulesRes.error);
          router.push('/levels');
          return;
        }
        
        setLevelData(rulesRes.data);
        setRules(rulesRes.data.rules);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStudentId, levelId, router]);

  const handleSelectRule = (ruleId) => {
    router.push(`/levels/${levelId}/${ruleId}`);
  };

  // توليد ألوان مختلفة لكل قاعدة
  const getRuleColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
      'from-amber-500 to-orange-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName={studentName} unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-6 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-spin" />
            <div className="absolute inset-12 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            جارٍ تحميل القواعد...
          </h2>
        </div>
      </div>
    );
  }

  if (!levelData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header studentName={studentName} unreadCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">لم يتم العثور على المستوى</h2>
            <p className="text-gray-600 mb-6">المستوى المطلوب غير موجود أو غير نشط</p>
            <button
              onClick={() => router.push('/levels')}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              العودة للمستويات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header studentName={studentName} unreadCount={0} />
      
      <div className="container mx-auto px-4 py-8">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
            <span className="text-3xl text-white">{levelData?.level.icon || '🎯'}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            قواعد المستوى: <span className="text-blue-600">{levelData?.level.level_name}</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            اختر قاعدة لبدء التدريب التلقائي
          </p>
        </div>

        {/* شبكة القواعد */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
            اختر قاعدة للبدء ✨
          </h2>
          
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد قواعد متاحة</h3>
              <p className="text-gray-600">لم يتم إضافة قواعد لهذا المستوى بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map((rule, index) => (
                <div
                  key={rule.rule_id}
                  className="relative"
                  onMouseEnter={() => setHoveredRule(rule.rule_id)}
                  onMouseLeave={() => setHoveredRule(null)}
                >
                  {/* البطاقة الرئيسية */}
                  <div className={`
                    bg-white rounded-2xl p-5 border-2 border-white
                    shadow-lg transition-all duration-500
                    ${hoveredRule === rule.rule_id ? 'shadow-xl -translate-y-2 scale-[1.02]' : ''}
                  `}>
                    {/* شريط لوني علوي */}
                    <div 
                      className={`h-2 w-full mb-4 rounded-t-xl bg-gradient-to-r ${getRuleColor(index)} transition-all duration-500 ${
                        hoveredRule === rule.rule_id ? 'scale-x-105' : ''
                      }`}
                    />
                    
                    {/* محتوى البطاقة */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        bg-gradient-to-r ${getRuleColor(index)} text-white
                        text-xl shadow-md transition-transform duration-300
                        ${hoveredRule === rule.rule_id ? 'scale-110 rotate-12' : ''}
                      `}>
                        {rule.icon || rule.rule_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {rule.rule_name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {rule.description || 'تدريب تلقائي'}
                        </p>
                      </div>
                    </div>
                    
                    {/* مستوى الصعوبة */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">مستوى الصعوبة:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`text-sm ${i < (rule.difficulty_level || 1) ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* زر الدخول */}
                    <button
                      onClick={() => handleSelectRule(rule.rule_id)}
                      className={`
                        w-full py-3 rounded-xl text-white font-bold
                        transition-all duration-300 flex items-center justify-center gap-2
                        bg-gradient-to-r ${getRuleColor(index)}
                        ${hoveredRule === rule.rule_id ? 'scale-105 shadow-lg' : ''}
                      `}
                    >
                      <span className={`
                        transition-transform duration-300
                        ${hoveredRule === rule.rule_id ? 'scale-125' : ''}
                      `}>
                        {hoveredRule === rule.rule_id ? '🚀' : '📝'}
                      </span>
                      <span>
                        {hoveredRule === rule.rule_id ? 'انطلق!' : 'ابدأ التدريب'}
                      </span>
                    </button>
                    
                    {/* معلومات إضافية */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>⚡</span>
                        <span>تدريب تلقائي</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🎯</span>
                        <span>مسائل غير محدودة</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* مؤشر رقم القاعدة */}
                  <div className={`
                    absolute -top-2 -left-2 w-8 h-8 rounded-full
                    flex items-center justify-center text-white text-xs font-bold
                    bg-gradient-to-r ${getRuleColor(index)} shadow-md
                    transition-transform duration-300
                    ${hoveredRule === rule.rule_id ? 'scale-110' : ''}
                  `}>
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* زر العودة */}
        <div className="text-center">
          <button
            onClick={() => router.push('/levels')}
            className="
              inline-flex items-center gap-2 px-6 py-3 
              bg-white text-gray-700 font-semibold 
              rounded-xl border border-gray-200
              hover:bg-gray-50 hover:shadow-md
              transition-all duration-300
            "
          >
            <span>←</span>
            العودة لصفحة المستويات
          </button>
        </div>
      </div>
    </div>
  );
}