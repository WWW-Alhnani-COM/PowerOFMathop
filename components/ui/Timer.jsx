
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

/**
 * @typedef {object} TimerProps
 * @property {number} [initialTime=60] - الوقت الأولي بالثواني (للمؤقت التنازلي)
 * @property {'up' | 'down'} [direction='down'] - اتجاه المؤقت (تصاعدي أو تنازلي)
 * @property {boolean} [isRunning=true] - حالة تشغيل المؤقت
 * @property {() => void} [onTimeUp] - دالة تُستدعى عند انتهاء الوقت (إذا كان تنازلي)
 * @returns {JSX.Element}
 */
const Timer = ({
  initialTime = 60,
  direction = 'down',
  isRunning = true,
  onTimeUp,
}) => {
  const [time, setTime] = useState(direction === 'down' ? initialTime : 0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // تنسيق الوقت (MM:SS)
  const formatTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!isRunning || isTimeUp) return;

    const interval = setInterval(() => {
      setTime(prevTime => {
        if (direction === 'down') {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsTimeUp(true);
            onTimeUp && onTimeUp();
            return 0;
          }
          return prevTime - 1;
        } else {
          return prevTime + 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, direction, onTimeUp, isTimeUp]);

  // تحديد اللون حسب حالة الوقت (للتنازلي)
  const color = direction === 'down' && time <= 10 && time > 0 ? 'text-error animate-pulse' : 'text-primary';
  const badgeClass = direction === 'down' ? (time <= 10 && time > 0 ? 'badge-error' : 'badge-primary') : 'badge-info';

  return (
    <div 
      className={`
        flex items-center gap-2 p-3 rounded-full shadow-lg bg-white
        ${color} transition-all duration-300
      `}
      aria-label={`المؤقت: ${formatTime(time)}`}
    >
      <Clock className="w-6 h-6" />
      <span className="font-black text-xl min-w-[70px] text-center">
        {formatTime(time)}
      </span>
      {direction === 'down' && (
         <div className={`badge ${badgeClass} text-white font-bold`}>
           {isTimeUp ? 'انتهى!' : 'الوقت المتبقي'}
         </div>
      )}
    </div>
  );
};

export default Timer;