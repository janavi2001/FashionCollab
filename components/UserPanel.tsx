
import React, { useState } from 'react';
import type { User } from '../types';
import UserIcon from './icons/UserIcon';
import AddUserIcon from './icons/AddUserIcon';

interface UserPanelProps {
  users: User[];
  activeUser: User;
  onAddUser: (name: string) => void;
  onSwitchUser: (user: User) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ users, activeUser, onAddUser, onSwitchUser }) => {
  const [newUserName, setNewUserName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim());
      setNewUserName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 border-b border-[#FFC87E]">
      <h3 className="text-sm font-semibold text-[#C89F8D] uppercase tracking-wider mb-3">
        Participants
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        {users.map((user) => (
          <button
            key={user.name}
            onClick={() => onSwitchUser(user)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              user.name === activeUser.name
                ? 'bg-[#F99B1C] text-white shadow-lg'
                : 'bg-[#FBE6DA] text-[#6D574E] hover:bg-[#f8e0d4]'
            }`}
            aria-pressed={user.name === activeUser.name}
          >
            <UserIcon />
            <span>{user.name}</span>
          </button>
        ))}
        {!isAdding && (
           <button
             onClick={() => setIsAdding(true)}
             className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FBE6DA] text-[#6D574E] hover:bg-[#f8e0d4] transition-colors"
             aria-label="Add new user"
           >
             <AddUserIcon />
           </button>
        )}
      </div>
       {isAdding && (
         <form onSubmit={handleAddUserSubmit} className="mt-3 flex gap-2">
           <input
             type="text"
             value={newUserName}
             onChange={(e) => setNewUserName(e.target.value)}
             placeholder="New participant's name"
             className="flex-grow px-3 py-1.5 bg-[#FBE6DA] border-2 border-[#FFC87E] rounded-lg text-[#6D574E] focus:outline-none focus:border-[#F99B1C] text-sm transition-colors"
             autoFocus
           />
           <button
             type="submit"
             className="px-4 py-1.5 font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none disabled:opacity-50 transition-colors text-sm"
             disabled={!newUserName.trim()}
           >
             Add
           </button>
           <button
             type="button"
             onClick={() => setIsAdding(false)}
             className="px-4 py-1.5 font-semibold rounded-lg text-[#6D574E] bg-[#FBE6DA] hover:bg-[#f8e0d4] focus:outline-none transition-colors text-sm"
           >
             Cancel
           </button>
         </form>
       )}
    </div>
  );
};

export default UserPanel;