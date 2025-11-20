import React from 'react';

interface DiagnosisBannerProps {
  diagnosis: string;
}

export const DiagnosisBanner: React.FC<DiagnosisBannerProps> = ({ diagnosis }) => {
  return (
    <div className="w-full flex justify-center px-2 md:px-4 flex-shrink-0">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 md:py-4 shadow-lg border-2 border-white/70 max-w-lg w-full">
        <div className="text-center">
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Diagnosis
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 leading-tight px-2">
            {diagnosis}
          </h2>
        </div>
      </div>
    </div>
  );
};
