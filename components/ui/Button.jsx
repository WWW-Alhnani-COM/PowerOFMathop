import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @typedef {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost' | 'info'} ButtonVariant
 * @typedef {'sm' | 'md' | 'lg' | 'xl'} ButtonSize
 * * زر تفاعلي مصمم للأطفال مع ألوان وحالات مختلفة.
 * * @param {object} props - خصائص المكون
 * @param {React.ReactNode} props.children - محتوى الزر
 * @param {ButtonVariant} [props.variant='primary'] - نوع الزر
 * @param {ButtonSize} [props.size='md'] - حجم الزر
 * @param {boolean} [props.fullWidth=false] - هل يملأ الزر العرض بالكامل
 * @param {boolean} [props.loading=false] - حالة التحميل
 * @param {React.ComponentType<{className: string}>} [props.icon] - أيقونة من Lucide React
 * @param {string} [props.className=''] - كلاسات إضافية
 * @returns {JSX.Element}
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'btn-primary bg-gradient-to-r from-blue-500 to-purple-600 border-none text-white',
    secondary: 'btn-secondary',
    success: 'btn-success text-white',
    error: 'btn-error text-white',
    warning: 'btn-warning text-white',
    info: 'btn-info text-white',
    ghost: 'btn-ghost'
  };

  const sizes = {
    sm: 'btn-sm text-sm',
    md: 'btn-md text-base',
    lg: 'btn-lg text-lg',
    xl: 'btn-xl px-10 py-5 text-xl'
  };

  return (
    <button
      className={`
        btn ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
        rounded-2xl font-extrabold shadow-lg
        transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98]
        flex items-center justify-center gap-3 whitespace-nowrap
      `}
      disabled={loading || props.disabled}
      aria-busy={loading}
      aria-label={loading ? "جاري التحميل" : children}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-6 h-6" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;

/*
// أمثلة الاستخدام
<Button variant="primary" size="xl" icon={Award}>ابدأ التحدي</Button>
<Button variant="success" loading>جارٍ الحفظ</Button>
<Button variant="error" fullWidth>إلغاء</Button>
*/