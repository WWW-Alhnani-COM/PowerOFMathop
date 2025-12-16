// ChallengeCard.jsx
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Zap, Clock, Users, Trophy } from 'lucide-react';

const ChallengeCard = ({ challenger, challenged, status, sheetName, timeLeft, winnerId, onAction }) => {
  const isPending = status === 'pending';
  const isFinished = status === 'finished';
  const cardVariant = isPending ? 'warning' : isFinished ? 'success' : 'primary';
  const actionText = isPending ? 'قبول التحدي' : isFinished ? 'مشاهدة النتائج' : 'اذهب للعب';
  const actionVariant = isPending ? 'warning' : 'primary';

  return (
    <Card title={`تحدي: ${sheetName}`} subtitle={isPending ? 'بانتظار موافقتك' : `الحالة: ${status}`} icon={Users} variant={cardVariant}>
      <div className="flex justify-around items-center my-4">
        <div className="text-center">
          <UserCircle className="w-10 h-10 mx-auto text-blue-500" />
          <span className="font-bold">{challenger.name}</span>
        </div>
        <Zap className="w-8 h-8 text-secondary" />
        <div className="text-center">
          <UserCircle className="w-10 h-10 mx-auto text-purple-500" />
          <span className="font-bold">{challenged.name}</span>
        </div>
      </div>
      {isFinished && <div className="text-center font-black text-xl text-yellow-500 flex items-center justify-center gap-2"><Trophy /> الفائز: {winnerId === challenger.id ? challenger.name : challenged.name}</div>}
      {!isFinished && <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-1"><Clock className="w-4 h-4"/> الوقت المتبقي: {timeLeft}</div>}
      <Button fullWidth variant={actionVariant} className="mt-4" onClick={onAction} disabled={isFinished && !winnerId}>
        {actionText}
      </Button>
    </Card>
  );
};
export default ChallengeCard;