// DashboardStats.jsx
import StatsCard from '@components/student/StatsCard';

const DashboardStats = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <StatsCard title="إجمالي النقاط" value={stats.points} unit="نقطة" type="points" change={stats.pointChange} />
    <StatsCard title="متوسط الدقة" value={stats.accuracy} unit="%" type="accuracy" change={stats.accuracyChange} />
    <StatsCard title="أفضل تتابع" value={stats.bestStreak} unit="يوم" type="streak" change={stats.streakChange} />
    <StatsCard title="الوقت الإجمالي" value={stats.totalTime} unit="دقيقة" type="time" change={stats.timeChange} />
  </div>
);
export default DashboardStats;