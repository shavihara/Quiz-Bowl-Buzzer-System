import React from 'react';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const NeonInput: React.FC<NeonInputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-neon-blue font-display text-sm tracking-wider uppercase font-bold">
        {label}
      </label>
      <input
        className={`bg-dark-card border border-gray-700 text-black p-3 rounded-lg focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_#00f3ff55] transition-all duration-300 placeholder-gray-500 ${className}`}
        {...props}
      />
    </div>
  );
};

export const NeonFileInput: React.FC<{
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  preview?: string | null;
  onClear?: () => void;
}> = ({ label, onChange, preview, onClear }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-neon-pink font-display text-sm tracking-wider uppercase font-bold">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <label className="flex-1 cursor-pointer group">
          <div className="flex items-center justify-center w-full h-14 border-2 border-dashed border-gray-600 rounded-lg group-hover:border-neon-pink group-hover:bg-gray-800 transition-all">
            <span className="text-gray-400 group-hover:text-neon-pink font-medium text-sm">
              Click to Upload
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={onChange} />
          </div>
        </label>
        {preview && (
          <div className="relative w-14 h-14 border border-gray-600 rounded-lg overflow-hidden bg-black">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            {onClear && (
              <button
                onClick={onClear}
                className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
