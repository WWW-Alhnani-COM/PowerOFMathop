// StatsCard.jsx
import Card from '@ui/Card';
import { Award, Zap, Clock, TrendingUp, Check, TrendingDown } from 'lucide-react';
const iconMap = { points: Award, accuracy: Check, streak: Zap, time: Clock };
const colorMap = { points: 'primary', accuracy: 'success', streak: 'warning', time: 'info' };

const StatsCard = ({ title, value, unit, type, change = 0 }) => {
  const Icon = iconMap[type] || TrendingUp;
  const isPositive = change >= 0;

  return (
    <Card title={title} icon={Icon} variant={colorMap[type] || 'default'}>
      <div className="text-4xl font-black">{value} {unit}</div>
      <div className={`flex items-center text-sm font-bold mt-2 ${isPositive ? 'text-success' : 'text-error'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 rotate-180" />}
        {Math.abs(change)}% {isPositive ? 'تحسن' : 'تراجع'}
      </div>
    </Card>
  );
};
export default StatsCard;