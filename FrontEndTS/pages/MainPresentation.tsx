import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainPresentation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-neutral-950 text-white flex flex-col relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-mono text-red-400">LIVE FEED OFF</span>
            </div>
            <button 
                onClick={() => navigate('/dashboard/home')}
                className="text-neutral-500 hover:text-white transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center z-10">
            <div className="text-center">
                <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 tracking-tighter">
                    WAITING
                </h1>
                <p className="mt-4 text-gold-400 font-mono text-xl">FOR BUZZER INPUT...</p>
            </div>
        </div>
    </div>
  );
};

export default MainPresentation;