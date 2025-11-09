import React from 'react';

interface ChevronIconProps {
  isOpen: boolean;
}

const ChevronIcon: React.FC<ChevronIconProps> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

export default ChevronIcon;
