
import React, { useRef } from 'react';
import type { ImageFile } from '../types';
import UploadIcon from './icons/UploadIcon';

interface MoodboardPanelProps {
  images: ImageFile[];
  vibe: string | null;
  onAddImage: (file: File) => void;
  onSync: () => void;
  isSummarizing: boolean;
  isGenerating: boolean;
}

const MoodboardPanel: React.FC<MoodboardPanelProps> = ({
  images,
  vibe,
  onAddImage,
  onSync,
  isSummarizing,
  isGenerating,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#FDEFE1] p-4 space-y-4 overflow-y-auto">
        <div>
            <h3 className="text-sm font-semibold text-[#C89F8D] uppercase tracking-wider mb-2">AI Vibe Summary</h3>
            <div className="p-3 bg-[#FFFBF8]/70 rounded-lg min-h-[60px] flex items-center justify-center">
                {isSummarizing ? (
                    <p className="text-[#C89F8D] italic text-sm">Summarizing vibe...</p>
                ) : vibe ? (
                    <p className="text-[#F99B1C] italic">"{vibe}"</p>
                ) : (
                    <p className="text-[#C89F8D] text-sm">Add images to the moodboard to generate a vibe.</p>
                )}
            </div>
        </div>
        
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-[#C89F8D] uppercase tracking-wider">Moodboard Items</h3>
                <button
                    onClick={handleUploadClick}
                    className="px-3 py-1 text-xs font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] transition-colors"
                >
                    Add Image
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((image, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden bg-[#FBE6DA]">
                        <img 
                            src={`data:${image.mimeType};base64,${image.data}`} 
                            alt={`Moodboard item ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
                {images.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center text-center p-6 bg-[#FFFBF8]/70 rounded-lg">
                        <UploadIcon />
                        <p className="mt-2 text-sm text-[#C89F8D]">Your moodboard is empty.</p>
                     </div>
                )}
            </div>
        </div>

        <div className="flex-grow"></div>

        <div className="flex-shrink-0">
             <button
                onClick={onSync}
                className="w-full py-3 px-4 text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-[#F99B1C] to-[#FFC87E] hover:from-[#e08a10] hover:to-[#F99B1C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FDEFE1] focus:ring-[#F99B1C] transition-transform transform hover:scale-105 disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed"
                disabled={!vibe || isSummarizing || isGenerating}
            >
                {isGenerating ? 'Synchronizing...' : 'Synchronize with Current Render'}
            </button>
        </div>
    </div>
  );
};

export default MoodboardPanel;