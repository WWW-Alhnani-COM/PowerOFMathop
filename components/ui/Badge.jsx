import React from 'react';
import { Award, Zap, Check } from 'lucide-react';

/**
 * @typedef {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} BadgeVariant
 * * شارة تصنيف (Badge) للاستخدام في الإحصائيات أو الإنجازات.
 * * @param {object} props - خصائص المكون
 * @param {React.ReactNode} props.children - محتوى الشارة
 * @param {BadgeVariant} [props.variant='info'] - لون الشارة
 * @param {React.ComponentType<{className: string}>} [props.icon] - أيقونة اختيارية
 * @returns {JSX.Element}
 */
const Badge = ({ children, variant = 'info', icon: Icon }) => {
  const colorMap = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
  };

  return (
    <div className={`badge ${colorMap[variant]} gap-2 text-white font-bold p-3 text-sm rounded-full`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </div>
  );
};

export default Badge;