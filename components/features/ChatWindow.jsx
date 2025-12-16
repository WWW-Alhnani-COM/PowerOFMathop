// ChatWindow.jsx
import React, { useState } from 'react';
import ChatBubble from '../../student/ChatBubble';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Send } from 'lucide-react';

const ChatWindow = ({ messages, currentStudentId, onSendMessage }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <Card title="نافذة الدردشة" subtitle="تحدّث مع صديقك أو مدربك" icon={Send} className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 rounded-lg">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg.text} isSender={msg.senderId === currentStudentId} />
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t mt-4">
        <Input placeholder="اكتب رسالتك..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
        <Button size="md" icon={Send} onClick={handleSend} disabled={!inputText.trim()} aria-label="إرسال الرسالة" />
      </div>
    </Card>
  );
};
export default ChatWindow;