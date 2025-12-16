import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * @typedef {object} ProblemData
 * @property {number} num1 - الرقم الأول
 * @property {number} num2 - الرقم الثاني
 * @property {string} operator - العملية الحسابية (+, -, *, /)
 * @property {number} [answer] - الإجابة الصحيحة (للعرض عند الحاجة)
 * * عرض مسألة رياضية بشكل جذاب وواضح للأطفال.
 * * @param {object} props - خصائص المكون
 * @param {ProblemData} props.problem - بيانات المسألة
 * @param {number} props.problemNumber - رقم المسألة الحالية
 * @param {number} props.totalProblems - إجمالي عدد المسائل
 * @param {boolean} [props.showAnswer=false] - هل يجب عرض الإجابة الصحيحة
 * @param {boolean} [props.interactive=true] - وضع التفاعل (للأصوات/الأنيميشن)
 * @param {React.ReactNode} [props.userInput] - إدخال المستخدم الحالي
 * @returns {JSX.Element}
 */
const ProblemDisplay = ({
  problem,
  problemNumber,
  totalProblems,
  showAnswer = false,
  interactive = true,
  userInput,
}) => {
  // ترجمة العمليات للغة العربية
  const operatorMap = { '+': '+', '-': '-', '*': '×', '/': '÷' };
  const displayOperator = operatorMap[problem.operator] || '?';
  const displayAnswer = showAnswer ? (problem.answer !== undefined ? problem.answer : '؟') : userInput;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-3xl shadow-2xl backdrop-blur-sm">
      
      {/* مؤشر المسألة */}
      <div className="badge badge-lg badge-info text-white font-bold mb-6">
        مسألة {problemNumber} / {totalProblems}
      </div>

      {/* عرض المسألة */}
      <div className="flex items-center text-8xl font-black text-gray-900 space-x-8 space-x-reverse min-h-[140px]">
        {/* الرقم الأول */}
        <span className="p-4 bg-blue-100 rounded-xl shadow-md transition-transform duration-500 hover:scale-105">
          {problem.num1}
        </span>
        
        {/* العملية */}
        <span className="text-purple-600 text-6xl font-bold p-2 transition-opacity duration-500 opacity-90">
          {displayOperator}
        </span>
        
        {/* الرقم الثاني */}
        <span className="p-4 bg-blue-100 rounded-xl shadow-md transition-transform duration-500 hover:scale-105">
          {problem.num2}
        </span>

        {/* علامة التساوي */}
        <span className="text-gray-700 text-6xl font-bold p-2">=</span>
        
        {/* حقل الإجابة */}
        <span 
          className={`
            p-4 min-w-[150px] rounded-xl font-black text-center
            ${showAnswer ? 'bg-success/80 text-white' : 'bg-yellow-200 text-gray-900 border-4 border-yellow-500'}
            transition-all duration-500
          `}
        >
          {displayAnswer !== null && displayAnswer !== '' ? displayAnswer : '?'}
        </span>
      </div>

      {/* التلميحات (اختياري) */}
      {interactive && (
        <div className="mt-6 text-gray-500 text-sm flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <span>أدخل الإجابة باستخدام لوحة الأرقام أدناه</span>
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;

/*
// أمثلة الاستخدام
<ProblemDisplay
  problem={{ num1: 15, num2: 7, operator: '+' }}
  problemNumber={5}
  totalProblems={10}
  userInput="22"
/>
*/