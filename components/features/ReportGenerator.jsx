// ReportGenerator.jsx
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { FileText, Download } from 'lucide-react';

const ReportGenerator = ({ periods, onGenerate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0].value);

  return (
    <Card title="مولد التقارير" subtitle="احصل على تقرير أداء شامل" icon={FileText} className="max-w-md mx-auto">
      <div className="space-y-4">
        <Select label="اختر الفترة الزمنية" options={periods} value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} />
        <Button fullWidth variant="primary" icon={Download} onClick={() => onGenerate(selectedPeriod)}>
          توليد وتحميل التقرير
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-4">قد يستغرق توليد التقرير بعض الوقت.</p>
    </Card>
  );
};
export default ReportGenerator;