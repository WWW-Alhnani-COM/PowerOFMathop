// AchievementBadge.jsx
import Badge from '../ui/Badge';
import { Star, Zap, Award } from 'lucide-react';

const iconMap = { 'star': Star, 'zap': Zap, 'trophy': Award };

const AchievementBadge = ({ title, type = 'star', unlocked = true }) => {
  const Icon = iconMap[type] || Star;
  
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl ${unlocked ? 'bg-yellow-500/10' : 'bg-gray-200'} transition-all duration-300`}>
      <Icon className={`w-8 h-8 ${unlocked ? 'text-yellow-500' : 'text-gray-400'}`} />
      <span className={`text-sm font-bold mt-1 text-center ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
    </div>
  );
};
export default AchievementBadge;