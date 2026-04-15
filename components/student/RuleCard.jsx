// RuleCard.jsx
import Card from '@ui/Card';
import Button from '@ui/Button';
import { Zap, TrendingUp, HelpCircle } from 'lucide-react';

const RuleCard = ({ ruleName, difficulty, status, onSelect }) => (
  <Card title={ruleName} subtitle={`الصعوبة: ${difficulty}`} icon={Zap} hoverEffect={true} variant={status === 'ضعف' ? 'error' : 'default'} className="max-w-xs">
    <div className="flex justify-between items-center mt-2">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">الحالة:</span>
        <span className={`font-bold ${status === 'ضعف' ? 'text-error' : 'text-success'}`}>{status}</span>
      </div>
      <Button size="sm" variant="info" onClick={onSelect} icon={TrendingUp}>تدرب الآن</Button>
    </div>
  </Card>
);
export default RuleCard;