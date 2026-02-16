import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col gap-6 md:gap-8">
      
      {/* Top Banner Section */}
      <section className="flex-none h-[35%] w-full relative rounded-2xl overflow-hidden border border-white/10 group bg-neutral-900">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black z-0"></div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16">
          <div className="inline-block px-3 py-1 mb-4 rounded border border-gold-400/50 bg-gold-400/10 w-max">
             <span className="text-gold-400 text-xs font-bold tracking-[0.2em] uppercase">System Ready</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 drop-shadow-lg">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">QBS</span>
          </h2>
          <p className="text-neutral-300 text-lg md:text-xl max-w-2xl leading-relaxed">
            The next generation quiz management interface. Configure your rounds, manage participants, and control the buzzer flow with real-time precision.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
      </section>

      {/* Bottom Action Tiles Section */}
      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-h-0">
        
        {/* Configuration Tile */}
        <div 
          onClick={() => navigate('/config')}
          className="relative group cursor-pointer rounded-2xl bg-neutral-900/40 border border-white/10 hover:border-gold-500/50 overflow-hidden transition-all duration-300 hover:bg-neutral-800/60"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-gold-500 group-hover:text-black transition-colors duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>

          <div className="h-full flex flex-col justify-end p-8">
            <h3 className="text-3xl font-display font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">Configuration</h3>
            <p className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
              Manage rounds, audio settings, and point systems. Access existing configurations.
            </p>
            <div className="mt-6 w-12 h-1 bg-white/20 group-hover:w-full group-hover:bg-gold-500 transition-all duration-500"></div>
          </div>
        </div>

        {/* Let's Start Tile */}
        <div 
          onClick={() => navigate('/main')}
          className="relative group cursor-pointer rounded-2xl bg-neutral-900/40 border border-white/10 hover:border-gold-500/50 overflow-hidden transition-all duration-300 hover:bg-neutral-800/60"
        >
           <div className="absolute inset-0 bg-gradient-to-tl from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

           <div className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-gold-500 group-hover:text-black transition-colors duration-300">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           </div>

           <div className="h-full flex flex-col justify-end p-8">
            <h3 className="text-3xl font-display font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">Let's Start</h3>
            <p className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
              Launch the main presentation screen. View live buzzer results and scoreboard.
            </p>
            <div className="mt-6 w-12 h-1 bg-white/20 group-hover:w-full group-hover:bg-gold-500 transition-all duration-500"></div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default DashboardHome;