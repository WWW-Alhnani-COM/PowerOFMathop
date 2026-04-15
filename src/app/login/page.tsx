// src/app/login/page.tsx
// هذا الملف هو مكون خادم (Server Component)

// 1. الاستيرادات الضرورية
import { loginStudent, getBranches } from '@actions/auth.actions'; 
import LoginFormClient from './loginFormClient';
import MathBackground from './MathBackground';

// 2. الأنواع
interface Branch {
    branch_id: number;
    branch_name: string;
}

// 3. المكون الخادم الرئيسي
export default async function LoginPage() {
    // جلب البيانات من الخادم
    const branchesResult = await getBranches();
    
    if (!branchesResult.success) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-gray-200">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">خطأ في النظام</h2>
                        <p className="text-gray-600 mb-6">فشل في تحميل بيانات الفروع</p>
                        <p className="text-sm text-gray-500">الخطأ: {branchesResult.error}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const branches: Branch[] = branchesResult.data || [];

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex justify-center items-center p-4 overflow-hidden">
            {/* خلفية متحركة */}
            <MathBackground />
            
            {/* المحتوى الأمامي */}
            <div className="flex flex-col lg:flex-row w-full max-w-6xl items-center lg:items-stretch z-10">
                {/* قسم المعلومات والترحيب */}
                <div className="text-center lg:text-right lg:ml-12 text-white p-6 lg:p-12 flex flex-col justify-center lg:w-2/3">
                    <div className="mb-8">
                     
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                            مرحباً في
                            <br />
                            <br />
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                Power Of Math
                            </span>
                        </h1>
                        <p className="font-bold lg:text-xl text-orange-400 mb-8 leading-relaxed">
                            سجل دخولك لتبدأ رحلة التحدي والتعلم. اختبر مهاراتك في مستويات متدرجة صممت لتطوير قدراتك الحسابية.
                        </p>
                    </div>
                    
                    {/* مميزات النظام */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-2xl mb-2">🎯</div>
                            <div className="font-bold text-orange-400">تحديات ممتعة</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="font-bold text-orange-400">تتبع التقدم</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-2xl mb-2">👥</div>
                            <div className="font-bold text-orange-400">منافسة الأصدقاء</div>
                        </div>
                    </div>
                </div>
                
                {/* قسم بطاقة تسجيل الدخول */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-md lg:w-1/3 transform hover:shadow-2xl transition-all duration-300">
                    <LoginFormClient branches={branches} loginAction={loginStudent} />
                </div>
            </div>
        </div>
    );
}