const KidButton = ({ theme = 'primary', icon: Icon, children, onClick, playSound }) => (
  <button
    onClick={() => {
        playSound('click');
        onClick();
    }}
    className={`${BASE_BUTTON_STYLE} ${BUTTON_THEMES[theme]} text-lg w-full sm:w-auto min-w-[150px] font-mono`}
  >
    {Icon && <Icon className="w-6 h-6 ml-2" />}
    {children}
  </button>
);
