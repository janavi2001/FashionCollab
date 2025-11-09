
import React, { useState } from 'react';
import type { ProductionSheet, Turntable } from '../types';

interface ProductionSheetModalProps {
  sheet: ProductionSheet;
  image: string;
  onClose: () => void;
  onGenerateTurntable: () => void;
  turntable: Turntable | null;
  isGeneratingTurntable: boolean;
}

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-semibold text-[#C89F8D] uppercase tracking-wider mb-2 border-b border-[#FBE6DA] pb-1">{title}</h3>
        {children}
    </div>
);

const ProductionSheetModal: React.FC<ProductionSheetModalProps> = ({ sheet, image, onClose, onGenerateTurntable, turntable, isGeneratingTurntable }) => {
  const [activeView, setActiveView] = useState<string>(image);

  React.useEffect(() => {
    setActiveView(image);
  }, [image]);

  const TurntableDisplay: React.FC = () => {
    if (!turntable) {
      return (
        <button
          onClick={onGenerateTurntable}
          disabled={isGeneratingTurntable}
          className="w-full mt-4 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FBE6DA] focus:ring-[#F99B1C] transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isGeneratingTurntable ? 'Generating Views...' : 'Generate 3D Turntable'}
        </button>
      );
    }

    const views = [
      { name: 'Front', src: turntable.front },
      { name: 'Side', src: turntable.side },
      { name: 'Back', src: turntable.back },
      { name: 'Other Side', src: turntable.otherSide },
    ];

    return (
      <div className="mt-4">
        <div className="grid grid-cols-4 gap-2">
          {views.map(view => (
            <button
              key={view.name}
              onClick={() => setActiveView(view.src)}
              className={`p-2 text-xs font-semibold rounded-md transition-all ${
                activeView === view.src
                  ? 'bg-[#F99B1C] text-white ring-2 ring-offset-2 ring-offset-[#FBE6DA] ring-[#F99B1C]'
                  : 'bg-[#FDEFE1] text-[#C89F8D] hover:bg-[#f8e0d4] hover:text-[#6D574E]'
              }`}
            >
              {view.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#FFFBF8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-1/2 flex-shrink-0 bg-[#FBE6DA] p-6 flex flex-col items-center justify-center">
            <div className="w-full flex-grow flex items-center justify-center min-h-0">
                <img src={activeView} alt="Finalized Design" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
            </div>
            <div className="w-full flex-shrink-0">
              <h3 className="text-sm font-semibold text-[#C89F8D] uppercase tracking-wider mt-4 mb-2 text-center">AR / VR View</h3>
              <p className="text-xs text-center text-[#C89F8D] mb-2">Generate multiple angles of your design to simulate a 3D view.</p>
              <TurntableDisplay />
            </div>
        </div>
        <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-[#FBE6DA] flex-shrink-0">
                 <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F99B1C] to-[#FFC87E]">
                    Production Sheet
                </h2>
                <p className="text-sm text-[#C89F8D]">AI-generated material and supplier list.</p>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
                <InfoSection title="Fabric & Materials">
                    <ul className="space-y-1 text-sm text-[#6D574E]">
                        {sheet.fabrics.map((fabric, i) => <li key={i}>- <strong>{fabric.name}</strong> ({fabric.amount})</li>)}
                        {sheet.materials.map((material, i) => <li key={i}>- {material}</li>)}
                    </ul>
                </InfoSection>

                <InfoSection title="Color Palette">
                    <div className="flex flex-wrap gap-2">
                        {sheet.colors.map((color, i) => (
                             <div key={i} className="flex items-center gap-2 bg-[#FBE6DA] p-2 rounded-md">
                                <div className="w-5 h-5 rounded-full border-2 border-white/20" style={{ backgroundColor: color.hex }}></div>
                                <span className="text-sm font-medium text-[#6D574E]">{color.name}</span>
                                <span className="text-xs text-[#C89F8D] font-mono">{color.hex}</span>
                             </div>
                        ))}
                    </div>
                </InfoSection>

                 <InfoSection title="Cut & Style">
                    <ul className="list-disc list-inside space-y-1 text-sm text-[#6D574E]">
                        {sheet.cutAndStyle.map((detail, i) => <li key={i}>{detail}</li>)}
                    </ul>
                </InfoSection>

                 <InfoSection title="Suggested Suppliers">
                    <ul className="space-y-2 text-sm">
                        {sheet.suppliers.map((supplier, i) => (
                             <li key={i}>
                                <a
                                href={supplier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#F99B1C] hover:text-[#e08a10] hover:underline transition-colors"
                                >
                                    {supplier.name}
                                </a>
                             </li>
                        ))}
                    </ul>
                </InfoSection>
            </div>
            <div className="p-4 bg-[#FBE6DA] border-t border-[#f8e0d4] flex-shrink-0 text-right">
                <button
                    onClick={onClose}
                    className="px-5 py-2 font-semibold rounded-lg text-white bg-[#F99B1C] hover:bg-[#e08a10] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FBE6DA] focus:ring-[#F99B1C] transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionSheetModal;