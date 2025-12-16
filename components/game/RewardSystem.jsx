// RewardSystem.jsx
import React from 'react';
import { Star, Trophy, Zap } from 'lucide-react';
import Badge from '../ui/Badge';

const RewardSystem = ({ achievementType, pointsAwarded }) => {
  const typeMap = {
    streak: { icon: Zap, color: 'warning', text: 'تتابع نجاح!' },
    level: { icon: Trophy, color: 'success', text: 'تهانينا، مستوى جديد!' },
    challenge: { icon: Star, color: 'primary', text: 'فوز في التحدي!' },
  };
  const reward = typeMap[achievementType] || typeMap['streak'];

  return (
    <div className="p-6 bg-white rounded-3xl shadow-2xl text-center max-w-sm mx-auto animate-bounce-slow">
      <div className={`p-4 rounded-full inline-block mb-3 ${reward.color === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}>
        <reward.icon className={`w-10 h-10 ${reward.color === 'warning' ? 'text-yellow-500' : 'text-green-500'}`} />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">{reward.text}</h3>
      <Badge variant={reward.color}>
        +{pointsAwarded} نقطة إضافية
      </Badge>
    </div>
  );
};
export default RewardSystem;