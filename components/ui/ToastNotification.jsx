
const ToastNotification = ({ type = 'info', message, onClose }) => {
  const themes = {
    success: { bg: 'bg-green-500', icon: LucideCheck },
    error: { bg: 'bg-red-500', icon: LucideX },
    warning: { bg: 'bg-yellow-500', icon: LucideAlertTriangle },
    info: { bg: 'bg-blue-500', icon: LucideInfo },
  };

  const Icon = themes[type].icon;

  return (
    <div 
      className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl text-white flex items-center transition-all duration-500 transform ${themes[type].bg}`}
      dir="rtl"
    >
      <Icon className="w-6 h-6 ml-3 animate-bounce" />
      <p className="font-semibold">{message}</p>
      <button onClick={onClose} className="mr-4 opacity-75 hover:opacity-100 transition">
        &times;
      </button>
    </div>
  );
};