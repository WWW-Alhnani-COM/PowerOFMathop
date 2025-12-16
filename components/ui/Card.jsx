import { Award, Zap, Clock, TrendingUp, Check, TrendingDown } from 'lucide-react';
import React from 'react';

// يمكنك إضافة أي أيقونات أخرى تحتاجها هنا.
// نستخدم هنا أيقونة واحدة مجهولة (Icon) كقيمة افتراضية إذا لم يتم تمرير أيقونة.
const defaultIcon = (props) => <div {...props} />;

const iconMap = { points: Award, accuracy: Check, streak: Zap, time: Clock };
const colorMap = { points: 'primary', accuracy: 'success', streak: 'warning', time: 'info' };

// تعريف الفئات المخصصة للاستخدام في التصميم
const baseClasses = 'p-6 rounded-xl shadow-lg transition-all duration-300';
const variantStyles = {
    // الألوان الافتراضية للبطاقة
    primary: 'bg-primary text-white hover:shadow-xl',
    success: 'bg-success/10 text-success border border-success/30 hover:shadow-success-md',
    error: 'bg-error/10 text-error border border-error/30 hover:shadow-error-md',
    warning: 'bg-warning/10 text-warning border border-warning/30 hover:shadow-warning-md',
    info: 'bg-blue-100 text-blue-700 border border-blue-300 hover:shadow-blue-md',
};

const StatsCard = ({ title, value, unit, type, change = 0 }) => {
    // تحديد الأيقونة واللون بناءً على النوع (type)
    const Icon = iconMap[type] || defaultIcon;
    const variant = colorMap[type] || 'primary';
    const isPositive = change >= 0;

    // تحديد فئات اللون لـ variantStyles
    const variantClasses = variantStyles[variant];

    return (
        // استخدام الأنماط الأساسية والأنماط الخاصة بالنوع
        <div className={`${baseClasses} ${variantClasses}`}>
            {/* أيقونة البطاقة */}
            <div className='flex items-center justify-between'>
                <div className={`
                    p-3 rounded-full 
                    ${variant === 'primary' 
                        ? 'bg-white/20 text-white' 
                        // 👇👇👇 هذا هو خطأ الإصلاح الأساسي 👇👇👇
                        : variantClasses 
                          ? variantClasses.split(' ')[0].replace('/10', '') // نستخدم فقط أول جزء من الفئة (مثل bg-success/10) ونزيل /10
                          : 'bg-gray-200 text-gray-700' // قيمة احتياطية إذا كانت variantClasses غير معرفة
                    }`}
                >
                    <Icon className="w-6 h-6" />
                </div>

                <div className='text-sm font-semibold opacity-75'>
                    {title}
                </div>
            </div>

            {/* القيمة والتغير */}
            <div className="mt-4">
                <div className="text-4xl font-black">{value} {unit}</div>
                <div className={`flex items-center text-sm font-bold mt-2 ${isPositive ? 'text-success' : 'text-error'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(change)}% {isPositive ? 'تحسن' : 'تراجع'}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;