// ProgressChart.jsx
import Card from '../ui/Card';
import { BarChart2 } from 'lucide-react';

// ملاحظة: في تطبيق حقيقي، سيتم استخدام مكتبة رسوم بيانية مثل Recharts أو Chart.js هنا.
const ProgressChart = ({ data, title = 'التقدم الأسبوعي في النقاط' }) => (
  <Card title={title} icon={BarChart2} variant="info">
    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg p-4">
      {/* هنا يتم عرض الرسم البياني الفعلي (باستخدام مكتبة) */}
      <p>مكان مخصص لعرض الرسم البياني التفاعلي (Data Visualization)</p>
    </div>
  </Card>
);
export default ProgressChart;