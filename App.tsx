
import React, { useState } from 'react';
import Lobby from './components/Lobby';
import DesignRoom from './components/DesignRoom';
import type { User, RoomInfo } from './types';

const App: React.FC = () => {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  const handleJoinRoom = (roomName: string, userName: string) => {
    if (roomName.trim() && userName.trim()) {
      const user: User = { name: userName };
      setRoomInfo({ roomName, user });
    }
  };

  const handleLeaveRoom = () => {
    setRoomInfo(null);
  };

  return (
    <div className="min-h-screen bg-[#FBE6DA] font-sans">
      {roomInfo ? (
        <DesignRoom roomInfo={roomInfo} onLeave={handleLeaveRoom} />
      ) : (
        <Lobby onJoin={handleJoinRoom} />
      )}
    </div>
  );
};

export default App;