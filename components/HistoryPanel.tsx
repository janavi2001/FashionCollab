
import React, { useMemo } from 'react';
import type { Checkpoint, User } from '../types';
import CrownIcon from './icons/CrownIcon';

interface HistoryPanelProps {
  checkpoints: Checkpoint[];
  activeUser: User;
  onSelectCheckpoint: (checkpoint: Checkpoint) => void;
  onReaction: (checkpointId: number, emoji: string) => void;
}

const EMOJI_REACTIONS = ['❤️'];

const CheckpointCard: React.FC<{
    checkpoint: Checkpoint;
    isMostLoved: boolean;
    activeUser: User;
    onSelect: () => void;
    onReaction: (emoji: string) => void;
}> = ({ checkpoint, isMostLoved, activeUser, onSelect, onReaction }) => {
    
    const reactionCounts = useMemo(() => {
        const counts: Record<string, number> = { '❤️': 0 };
        for (const votedEmoji of Object.values(checkpoint.votes)) {
            if (votedEmoji === '❤️') {
                counts['❤️']++;
            }
        }
        return counts;
    }, [checkpoint.votes]);

    const currentUserVote = checkpoint.votes[activeUser.name];

    return (
        <div className="relative flex-shrink-0 w-48 bg-[#FFFBF8] rounded-lg shadow-md overflow-hidden flex flex-col">
            {isMostLoved && (
                <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold z-10 flex items-center gap-1">
                    <CrownIcon />
                    Most Loved
                </div>
            )}
            <div
                className="w-full h-32 overflow-hidden cursor-pointer relative group"
                onClick={onSelect}
            >
                <img src={checkpoint.image} alt={`Checkpoint`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-bold">View</p>
                </div>
            </div>
            <div className="p-2 flex flex-col flex-grow justify-center">
                <div className="flex justify-around items-center">
                    {EMOJI_REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onReaction(emoji)}
                            className={`flex items-center gap-1.5 text-base rounded-full px-3 py-1 transition-all duration-200 ${
                                currentUserVote === emoji
                                ? 'bg-[#F99B1C] text-white transform scale-110 shadow-lg'
                                : 'text-[#C89F8D] hover:bg-[#FBE6DA]'
                            }`}
                            aria-label={`React with ${emoji}`}
                            aria-pressed={currentUserVote === emoji}
                        >
                            <span>{emoji}</span>
                            <span className="font-mono text-sm">{reactionCounts[emoji]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const HistoryPanel: React.FC<HistoryPanelProps> = ({ checkpoints, activeUser, onSelectCheckpoint, onReaction }) => {
  const mostLovedId = useMemo(() => {
    if (checkpoints.length <= 1) return null;
    
    let maxVotes = -1;
    let mostLovedId: number | null = null;
    let isTie = false;
    
    checkpoints.forEach(c => {
        const totalVotes = Object.keys(c.votes).length;
        if (totalVotes > maxVotes) {
            maxVotes = totalVotes;
            mostLovedId = c.id;
            isTie = false;
        } else if (totalVotes === maxVotes && maxVotes > 0) {
            isTie = true;
        }
    });

    return maxVotes > 0 && !isTie ? mostLovedId : null;
  }, [checkpoints]);


  if (checkpoints.length <= 1) {
    return null;
  }

  return (
    <div className="flex gap-4 pb-2 -mx-4 px-4 overflow-x-auto">
      {checkpoints.map((checkpoint) => (
        <CheckpointCard
          key={checkpoint.id}
          checkpoint={checkpoint}
          isMostLoved={checkpoint.id === mostLovedId}
          activeUser={activeUser}
          onSelect={() => onSelectCheckpoint(checkpoint)}
          onReaction={(emoji) => onReaction(checkpoint.id, emoji)}
        />
      ))}
    </div>
  );
};

export default HistoryPanel;