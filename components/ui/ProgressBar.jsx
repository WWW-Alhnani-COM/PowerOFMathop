import React from 'react';

/**
 * @typedef {'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'} ProgressVariant
 * * شريط تقدم بسيط وجذاب.
 * * @param {object} props - خصائص المكون
 * @param {number} props.progress - نسبة التقدم (0-100)
 * @param {ProgressVariant} [props.variant='primary'] - لون شريط التقدم
 * @returns {JSX.Element}
 */
const ProgressBar = ({ progress, variant = 'primary' }) => {
  const colorMap = {
    primary: 'progress-primary',
    secondary: 'progress-secondary',
    success: 'progress-success',
    error: 'progress-error',
    warning: 'progress-warning',
    info: 'progress-info',
  };

  return (
    <progress 
      className={`progress ${colorMap[variant]} w-full h-3 rounded-full transition-all duration-500`} 
      value={progress} 
      max="100"
      aria-valuenow={progress}
      aria-valuemin="0"
      aria-valuemax="100"
    ></progress>
  );
};

export default ProgressBar;