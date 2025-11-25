import React from 'react';

const History: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col">
        <h2 className="text-2xl font-display font-bold text-gold-400 mb-6">Round History</h2>
        
        <div className="flex-1 bg-neutral-900/30 rounded-2xl border border-white/5 overflow-hidden relative">
             <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p>No recent round data found.</p>
             </div>
        </div>
    </div>
  );
};

export default History;