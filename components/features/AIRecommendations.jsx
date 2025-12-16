// AIRecommendations.jsx
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Zap, Brain, ArrowRight } from 'lucide-react';

const RecommendationItem = ({ rule, reason, confidence, onAction }) => (
  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-3 transition-all hover:shadow-lg">
    <h4 className="font-bold text-lg text-primary flex items-center gap-2"><ArrowRight className="w-5 h-5" /> تدرب على: {rule}</h4>
    <p className="text-sm text-gray-600 mt-1 mb-3">السبب: {reason} (ثقة {confidence}%)</p>
    <Button size="sm" variant="primary" onClick={onAction} icon={Zap}>ابدأ التدريب المقترح</Button>
  </div>
);

const AIRecommendations = ({ recommendations }) => (
  <Card title="توصيات الذكاء الاصطناعي" subtitle="مقترحات تدريب شخصية مبنية على أدائك" icon={Brain} variant="primary">
    {recommendations.length > 0 ? (
      recommendations.map((rec, i) => (
        <RecommendationItem key={i} {...rec} />
      ))
    ) : (
      <p className="text-center text-gray-500 py-4">أداؤك ممتاز! لا توجد توصيات حالياً.</p>
    )}
  </Card>
);
export default AIRecommendations;