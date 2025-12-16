// ChatBubble.jsx
const ChatBubble = ({ message, isSender }) => (
  <div className={`chat ${isSender ? 'chat-end' : 'chat-start'} transition-all duration-300`}>
    <div className={`chat-bubble ${isSender ? 'chat-bubble-primary' : 'bg-gray-200 text-gray-800'} rounded-2xl p-3 shadow-md font-medium text-base max-w-xs md:max-w-sm`}>
      {message}
    </div>
  </div>
);
export default ChatBubble;