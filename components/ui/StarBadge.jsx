
const StarBadge = ({ count, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };
  return (
    <div className={`flex items-center justify-center bg-yellow-400 rounded-full p-1 shadow-md border-2 border-yellow-600 ${sizeClasses[size]}`}>
      <LucideStar className={`fill-yellow-600 text-white ${sizeClasses[size]}`} />
      <span className="font-extrabold text-gray-800 ml-1">{count}</span>
    </div>
  );
};