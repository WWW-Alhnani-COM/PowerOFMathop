'use client'

import React from 'react';
import { Trophy, Lock, Star, CheckCircle } from 'lucide-react';
import ProgressBar from '@ui/ProgressBar'; // سيتم إنشاء هذا المكون لاحقاً

/**
 * @typedef {object} LevelCardProps
 * @property {number} levelNumber - رقم المستوى (1-8)
 * @property {string} levelName - اسم المستوى
 * @property {string} description - وصف مختصر للمستوى
 * @property {number} [progress=0] - نسبة التقدم في المستوى (0-100)
 * @property {boolean} [isLocked=false] - هل المستوى مغلق
 * @property {boolean} [isCurrent=false] - هل هو المستوى الحالي للطالب
 * @property {number} [totalSheets=10] - إجمالي الشيتات
 * @property {number} [completedSheets=0] - عدد الشيتات المكتملة
 * @property {() => void} [onSelect] - دالة يتم استدعاؤها عند النقر
 * * بطاقة عرض المستوى.
 * @returns {JSX.Element}
 */
const LevelCard = ({
  levelNumber,
  levelName,
  description,
  progress = 0,
  isLocked = false,
  isCurrent = false,
  totalSheets = 10,
  completedSheets = 0,
  onSelect
}) => {
  const isCompleted = progress === 100;
  
  const icon = isLocked ? Lock : isCompleted ? Trophy : isCurrent ? Star : CheckCircle;
  const iconColor = isLocked ? 'text-gray-400' : isCompleted ? 'text-yellow-500' : isCurrent ? 'text-blue-500' : 'text-green-500';
  const buttonText = isLocked ? 'مغلق' : isCurrent ? 'متابعة' : isCompleted ? 'إعادة' : progress > 0 ? 'استئناف' : 'ابدأ';
  const buttonVariant = isLocked ? 'disabled' : isCurrent ? 'primary' : isCompleted ? 'secondary' : 'success';

  // تحديد اللون الأساسي لدائرة الرقم
  let numberBg = 'bg-gray-400';
  if (!isLocked) {
    if (isCompleted) numberBg = 'bg-gradient-to-br from-yellow-400 to-orange-500';
    else if (isCurrent) numberBg = 'bg-gradient-to-br from-blue-500 to-purple-600';
    else numberBg = 'bg-gradient-to-br from-green-500 to-emerald-600';
  }

  return (
    <div
      className={`
        card bg-white shadow-xl max-w-sm mx-auto
        ${isLocked ? 'opacity-70' : 'hover:shadow-2xl cursor-pointer hover:scale-[1.02]'}
        transition-all duration-300 rounded-3xl
        ${isCurrent ? 'ring-4 ring-primary/50 ring-offset-2' : ''}
        overflow-hidden
      `}
      onClick={!isLocked ? onSelect : undefined}
      aria-label={`المستوى ${levelNumber}: ${levelName}`}
      role="button"
    >
      <div className="card-body p-6">
        {/* رأس البطاقة */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* دائرة رقم المستوى */}
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center
              text-white font-black text-2xl shadow-md
              ${numberBg}
            `}>
              {isLocked ? <Lock className="w-6 h-6" /> : levelNumber}
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-gray-900">{levelName}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          
          {/* حالة المستوى */}
          <div className="text-right">
            {React.createElement(icon, { className: `w-7 h-7 ${iconColor}` })}
          </div>
        </div>
        
        {/* التقدم */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1 font-semibold">
            <span>{isLocked ? 'المستوى مغلق' : 'التقدم'}</span>
            <span className="font-extrabold">{!isLocked && `${progress}%`}</span>
          </div>
          <ProgressBar progress={progress} variant={isLocked ? 'error' : 'primary'} />
        </div>
        
        {/* الإحصائيات وزر الإجراء */}
        <div className="flex justify-between items-center text-sm text-gray-600 pt-2">
          <span>{completedSheets}/{totalSheets} شيتات مكتملة</span>
          <button 
            className={`btn btn-sm ${isLocked ? 'btn-disabled' : `btn-${buttonVariant}`} rounded-xl font-bold`}
            disabled={isLocked}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked && onSelect) onSelect();
            }}
            aria-disabled={isLocked}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelCard;