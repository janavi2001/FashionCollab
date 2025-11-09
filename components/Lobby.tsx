
import React, { useState } from 'react';

interface LobbyProps {
  onJoin: (roomName: string, userName:string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(roomName, userName);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FBE6DA]">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#FFFBF8] rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F99B1C] to-[#FFC87E]">
            AI Fashion Collab Studio
          </h1>
          <p className="mt-2 text-[#C89F8D]">Join a design room and start creating.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="peer w-full bg-[#FBE6DA] border-2 border-[#FFC87E] rounded-lg text-[#6D574E] px-4 py-3 placeholder-transparent focus:outline-none focus:border-[#F99B1C] transition-all"
              placeholder="Room Name"
              required
            />
            <label
              htmlFor="roomName"
              className="absolute left-4 -top-3.5 text-[#C89F8D] text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#c89f8d99] peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-[#F99B1C] peer-focus:text-sm"
            >
              Room Name
            </label>
          </div>
          <div className="relative">
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="peer w-full bg-[#FBE6DA] border-2 border-[#FFC87E] rounded-lg text-[#6D574E] px-4 py-3 placeholder-transparent focus:outline-none focus:border-[#F99B1C] transition-all"
              placeholder="Your Name"
              required
            />
            <label
              htmlFor="userName"
              className="absolute left-4 -top-3.5 text-[#C89F8D] text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-[#c89f8d99] peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-[#F99B1C] peer-focus:text-sm"
            >
              Your Name
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-[#F99B1C] to-[#e08a10] hover:from-[#e08a10] hover:to-[#F99B1C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-[#F99B1C] transition-transform transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            disabled={!roomName.trim() || !userName.trim()}
          >
            Enter Studio
          </button>
        </form>
      </div>
    </div>
  );
};

export default Lobby;