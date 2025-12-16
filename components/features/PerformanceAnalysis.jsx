// PerformanceAnalysis.jsx
import Card from '../ui/Card';
import { Lightbulb, AlertTriangle } from 'lucide-react';

const AnalysisItem = ({ rule, score, weakness }) => (
  <li className="flex justify-between items-center p-3 border-b">
    <span className="font-semibold">{rule}</span>
    <div className="flex items-center gap-3">
      <span className={`font-extrabold ${weakness ? 'text-error' : 'text-success'}`}>{score}%</span>
      {weakness && <AlertTriangle className="w-5 h-5 text-error" />}
    </div>
  </li>
);

const PerformanceAnalysis = ({ weakestRules }) => (
  <Card title="تحليل نقاط الضعف" subtitle="القواعد التي تحتاج إلى تدريب إضافي" icon={Lightbulb} variant="error">
    <ul className="space-y-1 mt-3">
      {weakestRules.map((item, i) => (
        <AnalysisItem key={i} {...item} />
      ))}
    </ul>
    <p className="text-sm text-gray-500 mt-4">نصيحة: ركز تدريبك على القواعد ذات الدرجة الأقل.</p>
  </Card>
);
export default PerformanceAnalysis;