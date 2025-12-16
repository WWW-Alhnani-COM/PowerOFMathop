
const CircularLevelButton = ({ level = 1, unlocked = true, onClick, playSound }) => (
  <button
    onClick={() => {
        playSound('click');
        onClick();
    }}
    disabled={!unlocked}
    className={`w-20 h-20 rounded-full border-4 shadow-2xl flex items-center justify-center text-xl font-extrabold transition duration-300 active:scale-90 ${
      unlocked
        ? 'bg-yellow-400 border-yellow-600 text-gray-800 hover:bg-yellow-500 shadow-yellow-500/60'
        : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-70'
    }`}
  >
    {level}
    {!unlocked && <LucideLock className="absolute w-6 h-6 text-gray-700" />}
  </button>
);