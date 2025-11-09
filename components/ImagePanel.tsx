
import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImagePanelProps {
  currentImage: string | null;
  isLoading: boolean;
  onImageUpload: (file: File) => void;
  error: string | null;
}

const LoadingOverlay: React.FC = () => {
    const messages = [
        "Sketching new ideas...",
        "Stitching the seams...",
        "Perfecting the palette...",
        "The AI is hard at work...",
        "Drafting the new look..."
    ];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#F99B1C]"></div>
            <p className="mt-4 text-lg font-semibold text-white">{message}</p>
        </div>
    );
};

const ImagePanel: React.FC<ImagePanelProps> = ({ currentImage, isLoading, onImageUpload, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!currentImage) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#FFFBF8] rounded-lg border-2 border-dashed border-[#FFC87E]">
        <div className="text-center">
            <UploadIcon />
            <h3 className="mt-2 text-lg font-medium text-[#6D574E]">Upload a model image</h3>
            <p className="mt-1 text-sm text-[#C89F8D]">Get started by uploading a photo (PNG, JPG).</p>
            <button
                onClick={handleUploadClick}
                className="mt-6 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFBF8] focus:ring-[#F99B1C] transition-colors"
            >
                Select File
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black/20 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
      {isLoading && <LoadingOverlay />}
      <img src={currentImage} alt="Current Design" className="object-contain max-h-full max-w-full" />
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm z-20">
            <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ImagePanel;