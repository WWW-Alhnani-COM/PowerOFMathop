// ConfettiEffect.jsx (افتراض استخدام مكتبة مثل react-confetti)
import React, { useEffect, useState } from 'react';
// import Confetti from 'react-confetti'; // يفترض أن هذه المكتبة مثبتة

const ConfettiEffect = ({ active, duration = 3000 }) => {
  const [isRunning, setIsRunning] = useState(active);

  useEffect(() => {
    if (active) {
      setIsRunning(true);
      const timer = setTimeout(() => setIsRunning(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isRunning) return null;

  // في التطبيق الفعلي، ستستخدم <Confetti />
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
        {/* <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} gravity={0.5} /> */}
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-yellow-500 animate-pulse">
            🎉 فوز! 🎉
        </div>
    </div>
  );
};
export default ConfettiEffect;