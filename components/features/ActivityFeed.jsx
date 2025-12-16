// ActivityFeed.jsx
import Card from '../ui/Card';
import { ArrowRight, Trophy, Zap, BookOpen } from 'lucide-react';

const ActivityItem = ({ icon: Icon, text, time, color }) => (
  <li className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-all">
    <Icon className={`w-5 h-5 ${color}`} />
    <span className="flex-1 text-sm">{text}</span>
    <span className="text-xs text-gray-500">{time}</span>
    <ArrowRight className="w-4 h-4 text-gray-400" />
  </li>
);

const ActivityFeed = ({ activities }) => (
  <Card title="شريط النشاطات الأخيرة" icon={Zap} variant="secondary">
    <ul className="space-y-2 divide-y divide-gray-200">
      {activities.length > 0 ? (
        activities.map((act, i) => (
          <ActivityItem key={i} {...act} />
        ))
      ) : (
        <p className="text-center text-gray-500 py-4">لا توجد نشاطات مؤخراً.</p>
      )}
    </ul>
  </Card>
);
export default ActivityFeed;