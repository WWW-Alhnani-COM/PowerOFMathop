
const QuizProgressBar = ({ current, total, color = 'bg-green-500' }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner border-2 border-white">
      <div 
        className={`h-full ${color} rounded-full transition-all duration-500 flex items-center justify-center`} 
        style={{ width: `${percentage}%` }}
      >
        <span className="text-xs font-bold text-white mix-blend-difference">
          {current} / {total}
        </span>
      </div>
    </div>
  );
};
