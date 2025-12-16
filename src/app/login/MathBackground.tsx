// src/app/login/MathBackground.tsx
'use client';

import React, { useRef, useEffect } from 'react';

// تعريف الرموز الرياضية والأرقام التي ستظهر في الخلفية
const symbols = "0123456789+-=x÷";
const fontSize = 16; 
let columns: number;
let drops: number[];
let context: CanvasRenderingContext2D | null;
let canvas: HTMLCanvasElement | null;

const MathBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    canvas = canvasRef.current;
    if (!canvas) return;

    // تهيئة Canvas
    context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // حساب عدد الأعمدة بناءً على حجم الخط
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(0);

    const draw = () => {
      if (!context || !canvas) return;

      // تأثير التلاشي التدريجي (Semi-transparent black rectangle)
      context.fillStyle = 'rgba(255, 255, 255, 0.05)'; // لون داكن مع شفافية خفيفة
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // لون وخط الرموز
      context.fillStyle = '#af604cff'; // لون أخضر أو أصفر ساطع (للتأثير الرياضي)
      context.font = `${fontSize}px monospace`;
      
      // رسم الرموز
      for (let i = 0; i < drops.length; i++) {
        // اختيار رمز عشوائي
        const text = symbols[Math.floor(Math.random() * symbols.length)];
        
        // رسم الرمز في الموضع الحالي (x, y)
        context.fillText(text, i * fontSize, drops[i] * fontSize);

        // إذا وصل الرمز إلى أسفل الشاشة، أو عشوائياً، ابدأ من جديد من الأعلى
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // زيادة موضع السقوط
        drops[i]++;
      }
    };

    // بدء حلقة الرسوم المتحركة
    const interval = setInterval(draw, 50);

    // إعادة ضبط عند تغيير حجم النافذة
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops = Array(columns).fill(0);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      // تمديد العنصر ليغطي الشاشة بالكامل وضمان بقائه في الخلفية
      className="absolute top-0 left-0 w-full h-full z-0 opacity-100"
    />
  );
};

export default MathBackground;