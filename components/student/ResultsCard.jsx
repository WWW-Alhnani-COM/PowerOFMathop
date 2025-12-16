// ResultsCard.jsx
import Card from '../ui/Card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const ResultsCard = ({ score, correct, wrong, time, sheetName }) => (
  <Card title={`نتيجة ${sheetName}`} subtitle="تحليل شامل للأداء" icon={CheckCircle} variant={score >= 70 ? 'success' : 'warning'} className="max-w-md mx-auto">
    <div className="space-y-3 mt-2">
      <div className="text-4xl font-black text-center mb-4">النقاط: <span className="text-primary">{score}%</span></div>
      <div className="flex justify-between items-center text-lg">
        <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-success" /> الإجابات الصحيحة:</span>
        <span className="font-extrabold">{correct}</span>
      </div>
      <div className="flex justify-between items-center text-lg">
        <span className="flex items-center gap-2"><XCircle className="w-5 h-5 text-error" /> الإجابات الخاطئة:</span>
        <span className="font-extrabold">{wrong}</span>
      </div>
      <div className="flex justify-between items-center text-lg">
        <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-info" /> الوقت المستغرق:</span>
        <span className="font-extrabold">{time} ثانية</span>
      </div>
    </div>
  </Card>
);
export default ResultsCard;