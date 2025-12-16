
const SoundToggle = ({ isMuted, toggleMute }) => (
    <div className="flex items-center space-x-2" dir="ltr">
        <button
            onClick={toggleMute}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 shadow-inner ${
                isMuted ? 'bg-red-400' : 'bg-green-500'
            }`}
        >
            <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ${
                    isMuted ? 'translate-x-1' : 'translate-x-9'
                } flex items-center justify-center`}
            >
                {isMuted ? <LucideVolumeX className="w-4 h-4 text-red-600" /> : <LucideVolume2 className="w-4 h-4 text-green-600" />}
            </span>
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300" dir="rtl">
            {isMuted ? 'الصوت مغلق' : 'الصوت مفعّل'}
        </span>
    </div>
);