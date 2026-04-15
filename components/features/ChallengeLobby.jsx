// ChallengeLobby.jsx
import Card from '@ui/Card';
import Button from '@ui/Button';
import { Users, Clock, Check, Loader2 } from 'lucide-react';
import Timer from '@student/Timer';

const PlayerStatus = ({ name, isReady }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-md">
    <span className="font-bold">{name}</span>
    {isReady ? (
      <span className="text-success flex items-center gap-1 font-semibold"><Check className="w-5 h-5" /> جاهز</span>
    ) : (
      <span className="text-warning flex items-center gap-1 font-semibold"><Loader2 className="w-5 h-5 animate-spin" /> ينتظر</span>
    )}
  </div>
);

const ChallengeLobby = ({ challengeCode, players, timeLeft, isCurrentPlayerReady, onReadyToggle }) => (
  <Card title="غرفة انتظار التحدي" subtitle={`كود التحدي: ${challengeCode}`} icon={Users} className="max-w-lg mx-auto">
    <div className="flex justify-center my-4">
      <Timer initialTime={timeLeft} direction="down" isRunning={!players.every(p => p.ready)} onTimeUp={() => alert('انتهى وقت الانتظار!')} />
    </div>
    <div className="space-y-3 mt-4">
      {players.map(p => <PlayerStatus key={p.id} name={p.name} isReady={p.ready} />)}
    </div>
    <Button fullWidth variant={isCurrentPlayerReady ? 'error' : 'success'} className="mt-6" onClick={onReadyToggle}>
      {isCurrentPlayerReady ? 'إلغاء الاستعداد' : 'أنا جاهز!'}
    </Button>
  </Card>
);
export default ChallengeLobby;