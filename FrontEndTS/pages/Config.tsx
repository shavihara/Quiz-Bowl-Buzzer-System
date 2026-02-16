import React from 'react';
import { useNavigate } from 'react-router-dom';

const Config: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col p-8 md:p-12 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-display font-bold text-gold-400">System Configuration</h2>
        <button 
          onClick={() => navigate('/dashboard/home')}
          className="px-6 py-2 border border-white/20 rounded hover:bg-white/10 hover:border-gold-400 transition-all text-sm uppercase tracking-wider"
        >
          Close / Back
        </button>
      </div>

      {/* Content Placeholder */}
      <div className="flex-1 border border-dashed border-white/20 rounded-xl flex items-center justify-center bg-neutral-900/50">
        <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            <h3 className="text-xl font-bold text-neutral-300">Configuration Panel</h3>
            <p className="text-neutral-500 mt-2">localStorage integration pending.</p>
        </div>
      </div>
    </div>
  );
};

export default Config;