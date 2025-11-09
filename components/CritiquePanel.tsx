
import React from 'react';
import type { Critique } from '../types';

interface CritiquePanelProps {
  critique: Critique | null;
}

const RatingBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getBarColor = (val: number) => {
    if (val < 40) return 'bg-red-500';
    if (val < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-[#C89F8D]">{label}</span>
            <span className="text-sm font-bold text-[#6D574E]">{value}/100</span>
        </div>
        <div className="w-full bg-[#FBE6DA] rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(value)}`}
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
  );
};


const CritiquePanel: React.FC<CritiquePanelProps> = ({ critique }) => {
  if (!critique) {
    return (
        <div className="flex items-center justify-center h-24">
            <p className="text-sm text-[#C89F8D]">No critique available for this design.</p>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
            <RatingBar label="Originality" value={critique.ratings.originality} />
            <RatingBar label="Practicality" value={critique.ratings.practicality} />
            <RatingBar label="Trend Alignment" value={critique.ratings.trendAlignment} />
        </div>
        <div>
            <h4 className="text-sm font-medium text-[#C89F8D] mb-1">Suggestion</h4>
            <p className="text-sm text-[#6D574E] bg-[#FBE6DA] p-3 rounded-md">{critique.suggestion}</p>
        </div>
      </div>
  );
};

export default CritiquePanel;