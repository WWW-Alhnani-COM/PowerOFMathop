// src/app/levels/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { 
  getActiveLevelsWithStats, 
  getStudentProgress 
} from '../../../actions/level.actions';

export default function LevelsPage() {
  const router = useRouter();
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [stats, setStats] = useState({
    totalLevels: 0,
    totalStudents: 0,
    totalSheets: 0,
    totalRules: 0
  });

  useEffect(() => {
    const id = localStorage.getItem('student_id');
    const name = localStorage.getItem('student_name');
    
    if (!id) {
      router.push('/login?callbackUrl=/levels');
      return;
    }
    
    setCurrentStudentId(parseInt(id));
  }, [router]);

  useEffect(() => {
    if (!currentStudentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // جلب البيانات بشكل متوازي
        const [levelsRes, studentRes] = await Promise.all([
          getActiveLevelsWithStats(currentStudentId),
          getStudentProgress(currentStudentId)
        ]);

        if (levelsRes.success) {
          setLevels(levelsRes.data);
          
          // حساب الإحصائيات الكلية
          const totalStats = levelsRes.data.reduce((acc, level) => ({
            totalLevels: levelsRes.totalLevels || levelsRes.data.length,
            totalStudents: acc.totalStudents + (level.stats?.total_students || 0),
            totalSheets: acc.totalSheets + (level.stats?.total_sheets || 0),
            totalRules: acc.totalRules + (level.stats?.total_rules || 0)
          }), {
            totalLevels: levelsRes.totalLevels || levelsRes.data.length,
            totalStudents: 0,
            totalSheets: 0,
            totalRules: 0
          });
          
          setStats(totalStats);
        }

        if (studentRes.success) {
          setStudentData(studentRes.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStudentId]);

  const handleEnterLevel = (levelId) => {
    localStorage.setItem('current_level_id', levelId);
    router.push(`/levels/${levelId}`);
  };

  const getLevelEmoji = (order) => {
    const emojis = ['🌟', '🚀', '🎯', '🏆', '⚡', '✨', '💡', '🎓', '📘', '🔢'];
    return emojis[order % emojis.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Header studentName={studentData?.student_name || "طالب"} unreadCount={0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-8 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-spin" />
            <div className="absolute inset-16 bg-white rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">📚</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gradient-animated mb-4">
            جارٍ تحميل المستويات...
          </h2>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-yellow-300/10 to-orange-300/10 rounded-full blur-3xl" />
      </div>

      <Header 
        studentName={studentData?.student_name || "طالب"} 
        unreadCount={0} 
      />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-gradient-animated">
            📚 رحلة التعلم
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            اختر مستواك وابدأ رحلتك التعليمية الممتعة معنا
          </p>
        </div>

        {/* إحصاءات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card-3d p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">المستويات المتاحة</p>
                <p className="text-3xl font-black text-orange-600">{stats.totalLevels}</p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
          
          <div className="card-3d p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">عدد الطلاب</p>
                <p className="text-3xl font-black text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="text-3xl">👨‍🎓</div>
            </div>
          </div>
          
          <div className="card-3d p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">أوراق التمارين</p>
                <p className="text-3xl font-black text-green-600">{stats.totalSheets}</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </div>
          
          <div className="card-3d p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">القواعد المتاحة</p>
                <p className="text-3xl font-black text-purple-600">{stats.totalRules}</p>
              </div>
              <div className="text-3xl">🔢</div>
            </div>
          </div>
        </div>

        {/* إحصائيات الطالب */}
        {studentData && (
          <div className="mb-12">
            <div className="card-glass p-6">
              <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span>
                تقدمك الشخصي
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">المستوى الحالي</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {studentData.level?.level_name || "غير محدد"}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">مجموع النقاط</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {studentData.total_score?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">دقة الإجابات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {studentData.stats?.accuracy || 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">التحدي اليومي</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {studentData.current_streak || 0} يوم
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* شبكة المستويات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {levels.map((level, index) => (
            <div
              key={level.level_id}
              className="relative group"
              onMouseEnter={() => setHoveredCard(level.level_id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* تأثير خلفي متحرك */}
              <div 
                className={`absolute inset-0 bg-gradient-to-r ${hoveredCard === level.level_id ? 'from-orange-400/20 to-yellow-400/20' : 'from-orange-200/10 to-yellow-200/10'} rounded-3xl blur-xl transition-all duration-500 ${
                  hoveredCard === level.level_id ? 'scale-110 opacity-100' : 'scale-100 opacity-50'
                }`}
              />
              
              {/* البطاقة الرئيسية */}
              <div className={`card-3d relative overflow-hidden transform-gpu transition-all duration-700 ${
                hoveredCard === level.level_id ? 'rotate-1' : ''
              }`}>
                {/* شريط لوني علوي */}
                <div 
                  className="h-2 w-full mb-6 rounded-t-3xl transition-all duration-500"
                  style={{ 
                    background: level.color || 'linear-gradient(135deg, #ff6b35 0%, #ffeb3b 100%)',
                    transform: hoveredCard === level.level_id ? 'scaleX(1.1)' : 'scaleX(1)'
                  }}
                />
                
                {/* محتوى البطاقة */}
                <div className="p-6">
                  {/* الرقم والرمز */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full blur-md opacity-50" />
                      <div 
                        className="relative w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg"
                        style={{ background: level.color || 'linear-gradient(135deg, #ff6b35 0%, #ffeb3b 100%)' }}
                      >
                        {level.level_order}
                      </div>
                    </div>
                    <span className="text-4xl animate-bounce">
                      {level.icon || getLevelEmoji(level.level_order)}
                    </span>
                  </div>
                  
                  {/* العنوان والوصف */}
                  <h2 className="text-2xl font-black text-gray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                    {level.level_name}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {level.description || 'ابدأ رحلة التعلم الممتعة الآن!'}
                  </p>
                  
                  {/* إحصائيات المستوى */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">القواعد</p>
                      <p className="font-bold text-blue-600">{level.stats?.total_rules || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">التمارين</p>
                      <p className="font-bold text-green-600">{level.stats?.total_sheets || 0}</p>
                    </div>
                  </div>
                  
                  {/* مؤشر التقدم الحقيقي */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>تقدمك</span>
                      <span className="font-bold text-orange-600">
                        {level.stats?.progress_percentage || 0}%
                      </span>
                    </div>
                    <div className="progress-3d">
                      <div 
                        className="progress-bar-glow transition-all duration-1000"
                        style={{ width: `${level.stats?.progress_percentage || 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {level.stats?.student_completed_sheets || 0} من {level.stats?.total_sheets || 0} تمرين
                    </div>
                  </div>
                  
                  {/* زر الدخول */}
                  <button
                    onClick={() => handleEnterLevel(level.level_id)}
                    disabled={level.stats?.total_sheets === 0}
                    className={`btn-magic w-full relative overflow-hidden ${level.stats?.total_sheets === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span className="text-xl transition-transform duration-300 group-hover:scale-125">
                        {hoveredCard === level.level_id ? '🚀' : (level.stats?.total_sheets > 0 ? '➡️' : '⏳')}
                      </span>
                      <span className="font-black">
                        {level.stats?.total_sheets > 0 ? 
                          (hoveredCard === level.level_id ? 'انطلق!' : 'ابدأ المستوى') : 
                          'قريباً'
                        }
                      </span>
                    </span>
                    
                    {/* تأثير الجسيمات على hover */}
                    {hoveredCard === level.level_id && level.stats?.total_sheets > 0 && (
                      <div className="absolute inset-0">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full animate-confetti"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                  
                  {/* معلومات إضافية */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>👥</span>
                      <span>{level.stats?.total_students || 0} طالب</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📊</span>
                      <span>{level.stats?.total_sheets || 0} تمرين</span>
                    </span>
                  </div>
                </div>
                
                {/* زوايا زخرفية */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-orange-400/30 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-orange-400/30 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-orange-400/30 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-orange-400/30 rounded-br-3xl" />
              </div>
              
              {/* مؤشر ترتيب */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* رسالة إذا لم توجد مستويات */}
        {levels.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-2xl font-black text-gray-800 mb-4">
              لا توجد مستويات متاحة حالياً
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              سيتم إضافة المستويات قريباً. تواصل مع المسؤول للمزيد من المعلومات.
            </p>
          </div>
        )}

        {/* رسالة توجيهية */}
        <div className="mt-16 text-center">
          <div className="card-glass max-w-2xl mx-auto p-8">
            <div className="text-5xl mb-6 animate-bounce">🎯</div>
            <h3 className="text-2xl font-black text-gray-800 mb-4">
              نصائح للنجاح في رحلتك
            </h3>
            <p className="text-gray-600 mb-6">
              ابدأ من المستوى الأول وتقدم بشكل تدريجي. كل مستوى يبني على ما سبقه.
              لا تنسَ الممارسة اليومية لتحقيق أفضل النتائج!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="badge-glow">⚡ تعلم يومي</div>
              <div className="badge-glow">🎮 تعلم ممتع</div>
              <div className="badge-glow">📈 تقدم مستمر</div>
              <div className="badge-glow">🏆 تحقيق الأهداف</div>
            </div>
          </div>
        </div>
      </div>

      {/* فقاعات متحركة في الخلفية */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-0">
        <div className="flex justify-between">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-32 h-32 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full animate-float"
              style={{
                animationDelay: `${i * 2}s`,
                animationDuration: `${Math.random() * 10 + 15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}