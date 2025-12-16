// StreakCounter.jsx
import { Zap } from 'lucide-react';

const StreakCounter = ({ currentStreak }) => (
  <div className={`flex items-center gap-2 p-3 rounded-full shadow-lg font-black text-xl bg-warning/20 text-warning transition-all duration-300 ${currentStreak > 0 ? 'scale-105' : 'opacity-70'}`}>
    <Zap className="w-6 h-6 animate-pulse" />
    <span>{currentStreak}</span>
    <span className="text-sm font-semibold">تتابع نجاح</span>
  </div>
);
export default StreakCounter;