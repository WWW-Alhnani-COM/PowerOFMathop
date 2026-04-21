'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '../../../components/layout/Header';

export default function PracticeIndexPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  const options = [
    {
      id: 1,
      title: 'التدريب عبر المستويات',
      description: 'ابدأ بحل التمارين حسب مستواك التعليمي وتدرّج خطوة بخطوة',
      icon: '📚',
      color: 'from-orange-500 to-yellow-500',
      action: () => router.push('/levels')
    },
    {
      id: 2,
      title: 'التحديات',
      description: 'اختبر نفسك في تحديات سريعة ونافس الآخرين',
      icon: '🔥',
      color: 'from-blue-500 to-indigo-500',
      action: () => router.push('/challenge')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      
      {/* خلفية */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/10 to-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-yellow-300/10 to-orange-300/10 rounded-full blur-3xl" />
      </div>

      <Header studentName={"طالب"} unreadCount={0} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        
        {/* العنوان */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black mb-4 text-gradient-animated">
            🎯 اختر نمط التدريب
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            يمكنك التعلم عبر المستويات أو الدخول في تحديات مباشرة
          </p>
        </div>

        {/* الكروت */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {options.map((item) => (
            <div
              key={item.id}
              className="relative group"
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              
              {/* خلفية متحركة */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-3xl blur-xl transition-all duration-500 ${
                hoveredCard === item.id ? 'scale-110 opacity-30' : 'scale-100 opacity-10'
              }`} />

              {/* الكرت */}
              <div className="card-3d relative p-10 text-center cursor-pointer"
                   onClick={item.action}>
                
                {/* الأيقونة */}
                <div className="text-6xl mb-6 animate-bounce">
                  {item.icon}
                </div>

                {/* العنوان */}
                <h2 className="text-3xl font-black text-gray-800 mb-4 group-hover:text-orange-600 transition">
                  {item.title}
                </h2>

                {/* الوصف */}
                <p className="text-gray-600 mb-8">
                  {item.description}
                </p>

                {/* زر */}
                <button className="btn-magic w-full">
                  <span className="flex items-center justify-center gap-2">
                    <span>ابدأ الآن</span>
                    <span className="text-xl">
                      {hoveredCard === item.id ? '🚀' : '➡️'}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* رسالة توجيه */}
        <div className="mt-20 text-center">
          <div className="card-glass max-w-2xl mx-auto p-8">
            <div className="text-5xl mb-6 animate-bounce">💡</div>
            <h3 className="text-2xl font-black text-gray-800 mb-4">
              كيف تختار؟
            </h3>
            <p className="text-gray-600 mb-6">
              إذا كنت تريد التعلم المنظم ابدأ بالمستويات، وإذا أردت اختبار نفسك بسرعة جرب التحديات.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="badge-glow">📚 تعلم تدريجي</div>
              <div className="badge-glow">🔥 تحديات سريعة</div>
              <div className="badge-glow">🎯 أهداف واضحة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
