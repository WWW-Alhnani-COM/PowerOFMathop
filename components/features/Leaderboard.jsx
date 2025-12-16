// Leaderboard.jsx
import Card from '../ui/Card';
import { Award, Star, TrendingUp } from 'lucide-react';
import Badge from '../ui/Badge';

const LeaderboardItem = ({ rank, name, score }) => (
  <li className={`flex items-center p-3 rounded-xl my-2 shadow-md ${rank === 1 ? 'bg-yellow-400/30 ring-2 ring-yellow-500' : 'bg-white'}`}>
    <Badge variant={rank <= 3 ? 'warning' : 'primary'} icon={rank === 1 ? Award : Star}>{rank}</Badge>
    <span className="mx-4 font-bold flex-1 text-lg">{name}</span>
    <span className="font-extrabold text-xl text-primary flex items-center gap-1"><TrendingUp className="w-5 h-5"/> {score}</span>
  </li>
);

const Leaderboard = ({ players }) => (
  <Card title="جدول المتصدرين الأسبوعي" icon={Award} variant="warning" className="max-w-xl mx-auto">
    <ul className="space-y-2">
      {players.slice(0, 5).map((player, i) => (
        <LeaderboardItem key={i} rank={i + 1} {...player} />
      ))}
    </ul>
  </Card>
);
export default Leaderboard;