
const ScoreCounter = ({ label, count, icon: Icon, color = 'text-indigo-600' }) => (
  <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 min-w-[120px]">
    {Icon && <Icon className={`w-8 h-8 mb-1 ${color}`} />}
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <h4 className={`text-2xl font-extrabold ${color}`}>{count}</h4>
  </div>
);
