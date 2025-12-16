// C:\Users\Ahmed\Desktop\MyWork\powerofmath-next\components\ui\NumberPad.jsx

import React from 'react';
import { Delete, Check, RotateCcw } from 'lucide-react';

/**
 * @typedef {object} NumberPadProps
 * @property {(value: number | string) => void} onNumberClick - عند النقر على رقم أو عملية
 * @property {() => void} onDelete - عند النقر على حذف (مسح آخر رقم)
 * @property {() => void} onClear - عند النقر على مسح كامل
 * @property {() => void} onSubmit - عند النقر على تأكيد
 * @property {boolean} [disabled=false] - تعطيل اللوحة
 * @property {boolean} [showOperations=false] - عرض أزرار العمليات (+, -, ×, ÷)
 */

/**
 * @param {NumberPadProps} props
 * @returns {JSX.Element}
 */
const NumberPad = ({
  onNumberClick,
  onDelete,
  onClear,
  onSubmit,
  disabled = false,
  showOperations = false,
}) => {
  const numbers = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  
  /**
   * دالة مساعدة لإنشاء زر رقم/عملية.
   * @param {string | number | JSX.Element} content - النص أو المكون الذي يظهر على الزر
   * @param {() => void} onClick - دالة النقر
   * @param {string} variant - نوع اللون ('primary', 'action', 'submit', 'secondary', 'error')
   * @param {import('lucide-react').Icon} [IconComponent] - مكون الأيقونة من Lucide
   * @param {string} size - حجم الزر ('btn-lg', 'btn-xl')
   */
  const renderButton = (content, onClick, variant = 'primary', IconComponent = null, size = 'btn-lg') => (
    <button
      key={content}
      className={`
        btn ${size} rounded-2xl shadow-lg font-black text-2xl
        ${variant === 'primary' ? 'btn-primary bg-blue-500 hover:bg-blue-600 text-white' : 
          variant === 'action' ? 'btn-warning bg-orange-400 hover:bg-orange-500 text-white' : 
          variant === 'submit' ? 'btn-success bg-green-500 hover:bg-green-600 text-white col-span-2' : 
          variant === 'error' ? 'btn-error bg-red-500 hover:bg-red-600 text-white' :
          'btn-secondary'}
        ${disabled ? 'btn-disabled opacity-60' : 'hover:scale-105 active:scale-95'}
        transition-all duration-150 h-auto p-4
      `}
      onClick={onClick}
      disabled={disabled}
      // إذا كان المحتوى أيقونة، نستخدم aria-label وصفي
      aria-label={typeof content === 'string' ? content : `زر التحكم ${content.type?.displayName || 'غير محدد'}`}
    >
      {/* استخدام المكون IconComponent إذا تم تمريره */}
      {IconComponent ? <IconComponent className="w-7 h-7" /> : content}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg mx-auto">
      <div className={`grid gap-4 ${showOperations ? 'grid-cols-4' : 'grid-cols-3'}`}>
        
        {/* الأرقام 7-9 */}
        {numbers.slice(0, 3).map(num => renderButton(String(num), () => onNumberClick(num)))}
        {showOperations && renderButton('+', () => onNumberClick('+'), 'action')}
        
        {/* الأرقام 4-6 */}
        {numbers.slice(3, 6).map(num => renderButton(String(num), () => onNumberClick(num)))}
        {showOperations && renderButton('-', () => onNumberClick('-'), 'action')}
        
        {/* الأرقام 1-3 */}
        {numbers.slice(6, 9).map(num => renderButton(String(num), () => onNumberClick(num)))}
        {showOperations && renderButton('×', () => onNumberClick('*'), 'action')}

        {/* الصفر وعمليات التحكم */}
        
        {/* زر المسح الكامل (Clear) */}
        {/* نمرر RotateCcw كـ IconComponent بدلاً من وضعه في content */}
        {renderButton('مسح', onClear, 'secondary', RotateCcw, 'btn-lg')} 
        
        {/* زر الصفر */}
        {renderButton('0', () => onNumberClick(0))}
        
        {/* زر الحذف (Delete) */}
        {/* نمرر Delete كـ IconComponent بدلاً من وضعه في content */}
        {renderButton('حذف', onDelete, 'error', Delete, 'btn-lg')}
        
        {showOperations && renderButton('÷', () => onNumberClick('/'), 'action')}

        {/* زر التأكيد (Submit) - يمتد على 3 أعمدة إذا لم يكن هناك عمليات */}
        {!showOperations && (
            <div className='col-span-3 mt-2'>
              {/* نمرر Check كـ IconComponent */}
              {renderButton('تأكيد', onSubmit, 'submit', Check, 'btn-xl')}
            </div>
        )}
      </div>

      {/* زر التأكيد في حالة وجود عمليات */}
      {showOperations && (
        <div className='mt-4 col-span-4'> {/* تأكد من امتداد الزر على 4 أعمدة في حالة وجود عمليات */}
          {/* نمرر Check كـ IconComponent */}
          {renderButton('تأكيد', onSubmit, 'submit', Check, 'btn-xl')}
        </div>
      )}
    </div>
  );
};

export default NumberPad;