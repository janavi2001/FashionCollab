
import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';
import UserPanel from './UserPanel';
import SketchIcon from './icons/SketchIcon';
import ConsultantIcon from './icons/ConsultantIcon';


interface ChatPanelProps {
  messages: Message[];
  activeUser: User;
  onSendMessage: (text: string) => void;
  users: User[];
  onAddUser: (name: string) => void;
  onSwitchUser: (user: User) => void;
  onSketchUpload: (file: File) => void;
  isImageLoaded: boolean;
}

const ChatMessage: React.FC<{ message: Message; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const isSystem = message.user.name === 'System';
  const isConsultant = message.user.name === 'AI Consultant';
  
  if (isSystem) {
    return (
      <div className="text-center my-2">
        <span className="px-3 py-1 text-xs text-[#6D574E] bg-[#FBE6DA] rounded-full">{message.text}</span>
      </div>
    );
  }

  if (isConsultant) {
    return (
      <div className="flex items-start gap-3 my-4 justify-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFFBF8] flex items-center justify-center ring-1 ring-[#FFC87E]">
            <ConsultantIcon />
        </div>
        <div className="flex flex-col items-start">
            <span className="text-sm font-semibold mb-1 text-[#F99B1C]">AI Consultant</span>
            <div className="px-4 py-2 rounded-xl max-w-sm md:max-w-md text-[#6D574E] bg-[#FFFBF8]">
                <p className="italic">{message.text}</p>
            </div>
        </div>
      </div>
    );
  }


  const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isCurrentUser ? 'bg-[#F99B1C]' : 'bg-[#FFFBF8]';
  const textColor = isCurrentUser ? 'text-white' : 'text-[#6D574E]';
  const nameColor = isCurrentUser ? 'text-[#F99B1C]' : 'text-[#C89F8D]';

  return (
    <div className={`flex items-start gap-3 my-4 ${alignment}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FBE6DA] flex items-center justify-center">
            <UserIcon />
        </div>
      )}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <span className={`text-sm font-semibold mb-1 ${nameColor}`}>{message.user.name}</span>
        <div className={`px-4 py-2 rounded-xl max-w-sm md:max-w-md ${textColor} ${bubbleColor}`}>
          <p>{message.text}</p>
        </div>
      </div>
    </div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, activeUser, onSendMessage, users, onAddUser, onSwitchUser, onSketchUpload, isImageLoaded }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sketchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };
  
  const handleSketchButtonClick = () => {
      sketchInputRef.current?.click();
  };
  
  const handleSketchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onSketchUpload(file);
      }
      // Reset the input value to allow uploading the same file again
      event.target.value = '';
  };


  return (
    <div className="flex flex-col h-full bg-[#FDEFE1]">
      <UserPanel
        users={users}
        activeUser={activeUser}
        onAddUser={onAddUser}
        onSwitchUser={onSwitchUser}
      />
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} isCurrentUser={msg.user.name === activeUser.name} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-[#FFFBF8]/70 border-t border-[#FFC87E]">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Chatting as ${activeUser.name}...`}
            className="flex-grow px-4 py-3 bg-[#FBE6DA] border-2 border-[#FFC87E] rounded-lg text-[#6D574E] placeholder:text-[#C89F8D] focus:outline-none focus:border-[#F99B1C] transition-colors"
          />
          <input 
            type="file"
            ref={sketchInputRef}
            onChange={handleSketchFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
          />
           <button
             type="button"
             onClick={handleSketchButtonClick}
             className="p-3 font-semibold rounded-lg text-[#F99B1C] bg-[#FBE6DA] hover:bg-[#f8e0d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-[#F99B1C] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
             disabled={!isImageLoaded}
             title={isImageLoaded ? "Upload Sketch" : "Upload a model image first"}
           >
             <SketchIcon />
           </button>
          <button
            type="submit"
            className="px-5 py-3 font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-[#F99B1C] disabled:opacity-50 transition-all transform hover:scale-105"
            disabled={!inputText.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;