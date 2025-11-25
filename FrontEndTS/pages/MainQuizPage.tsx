import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Play, Pause, Square, SkipForward, RotateCcw } from 'lucide-react';
import { startGame, resetGame, connectEvents } from '../utils/espApi';

enum GameState {
  IDLE = 'IDLE',      // "Let's Start" Screen
  READY = 'READY',    // Configured Headers visible, waiting for start
  RUNNING = 'RUNNING',// Timer counting down
  FINISHED = 'FINISHED' // Results / Top 3
}

export default function MainQuizPage() {
  const { config, updateConfig } = useConfig();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [timeLeft, setTimeLeft] = useState(config.questionTimeoutSeconds);
  
  // Audio Refs (Conceptual placeholder, actual implementation would require audio files)
  // const buzzerSound = useRef(new Audio('/buzzer.mp3'));

  useEffect(() => {
    let timer: any;
    if (gameState === GameState.RUNNING && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === GameState.RUNNING) {
      setGameState(GameState.FINISHED);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Reset timer if config changes or manual reset
  const handleReset = () => {
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
    updateConfig({ currentQuestionNumber: 1 });
    resetGame().catch(() => {});
  };

  const handleStart = () => {
    startGame().catch(() => {});
    setGameState(GameState.RUNNING);
  };

  const handleFinish = () => {
    setGameState(GameState.FINISHED);
  };

  const handleNextRound = () => {
    const current = Number(config.currentQuestionNumber) || 1;
    updateConfig({ currentQuestionNumber: current + 1 });
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
  };

  // --------------------------------------------------------------------------------
  // RENDER: Loading Screen
  // --------------------------------------------------------------------------------
  if (gameState === GameState.IDLE) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse-fast"></div>
        <div className="absolute w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        <h1 className="text-6xl md:text-8xl font-display font-black text-white tracking-widest mb-12 z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-neon-blue to-neon-purple">
            READY?
          </span>
        </h1>

        <button 
          onClick={() => setGameState(GameState.READY)}
          className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105 z-10"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-neon-blue to-neon-purple opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="absolute inset-0 border-2 border-neon-blue rounded-full shadow-[0_0_20px_#00f3ff] group-hover:shadow-[0_0_40px_#00f3ff] transition-shadow"></div>
          <span className="relative font-display text-2xl font-bold text-white tracking-[0.2em] group-hover:text-neon-yellow transition-colors">
            LET'S START
          </span>
        </button>

        {/* Secret Config Link */}
        <button 
          onClick={() => navigate('/config')} 
          className="absolute top-6 right-6 text-gray-800 hover:text-white transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // RENDER: Main Interface
  // --------------------------------------------------------------------------------
  const progressPercent = (timeLeft / config.questionTimeoutSeconds) * 100;
  const [pressedOrder, setPressedOrder] = useState<number[]>([]);

  useEffect(() => {
    const es = connectEvents(
      (data) => {
        const idx = Number(data.teamIndex);
        setPressedOrder((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
      },
      (res) => {
        setPressedOrder(res.top3 || []);
        setGameState(GameState.FINISHED);
      }
    );
    return () => { try { es.close(); } catch {} };
  }, []);
  
  // Simulating "Top 3" logic. 
  // In a real buzzer app, we'd sort by whoever buzzed first or has high score.
  // Here we just take the first 3 teams from config for the visual demo as requested.
  const displayTeams = (() => {
    if (gameState === GameState.FINISHED && pressedOrder.length) {
      const topTeams = pressedOrder
        .map((i) => config.teams[i])
        .filter(Boolean)
        .slice(0, 3);
      return topTeams.length ? topTeams : config.teams.slice(0, 3);
    }
    if (pressedOrder.length) {
      const ordered = pressedOrder.map((i) => config.teams[i]).filter(Boolean);
      const rest = config.teams.filter((t) => !ordered.includes(t));
      return [...ordered, ...rest];
    }
    return config.teams;
  })();

  return (
    <div className="h-screen w-screen bg-dark-bg flex flex-col text-white overflow-hidden relative font-sans">
      
      {/* 1. CUSTOM HEADER */}
      <header className="h-[120px] bg-dark-card border-b border-gray-800 flex items-center px-4 md:px-8 relative z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Left Logo */}
        <div className="flex items-center justify-center">
          {config.leftLogo ? (
            <img
              src={config.leftLogo}
              className="object-contain mix-blend-multiply"
              style={{ maxHeight: '100px', maxWidth: '120px' }}
              alt="Left"
            />
          ) : <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse"></div>}
        </div>

        {/* Center Text */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-white uppercase tracking-wider drop-shadow-sm">
            {config.headerTitle}
          </h1>
          <p className="text-neon-blue font-bold tracking-[0.3em] uppercase mt-2 text-sm md:text-lg animate-pulse">
            {config.headerSubtitle}
          </p>
        </div>

        {/* Right Logo */}
        <div className="flex items-center justify-center">
          {config.rightLogo ? (
            <img
              src={config.rightLogo}
              className="object-contain mix-blend-multiply"
              style={{ maxHeight: '100px', maxWidth: '120px' }}
              alt="Right"
            />
          ) : <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse"></div>}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col p-6 gap-6 relative z-10 overflow-hidden">
        
        {/* 2. LARGE TILE (GIF + Timer) */}
        <div className="flex-[0.6] flex items-center justify-center relative bg-dark-surface/50 rounded-3xl border border-gray-800 backdrop-blur-sm overflow-hidden shadow-2xl">
           
           {/* Center GIF */}
           {config.mainAnimationGif && (
             <div className="absolute inset-0 flex items-center justify-center">
               <img 
                 src={config.mainAnimationGif} 
                 className="w-full h-full object-cover opacity-40 pointer-events-none" 
                 loading="eager"
                 alt="Background Animation"
               />
             </div>
           )}

           <div className="relative z-10 text-center w-full max-w-4xl px-12">
             {gameState === GameState.RUNNING || gameState === GameState.FINISHED ? (
               <div className="flex flex-col items-center w-full">
                 <div className="text-[8rem] md:text-[10rem] font-display font-black leading-none text-white drop-shadow-[0_0_30px_#ff00ff]">
                   {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                 </div>
                 {/* Progress Bar */}
                 <div className="w-full h-6 bg-gray-800 rounded-full mt-8 overflow-hidden border border-gray-700">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500 shadow-[0_0_20px_red]' : 'bg-neon-blue shadow-[0_0_20px_#00f3ff]'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                 </div>
               </div>
             ) : (
               <div className="animate-glow">
                  <div className="text-5xl md:text-6xl font-display font-black text-white tracking-widest">
                    QUESTION {Number(config.currentQuestionNumber) || 1}
                  </div>
               </div>
             )}
           </div>
        </div>

        {/* 3. TEAM LIST / LEADERBOARD */}
        <div className="flex-[0.4] relative">
          
          {gameState === GameState.FINISHED && (
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neon-yellow text-black px-8 py-2 rounded-t-xl font-black font-display text-xl z-20 shadow-[0_0_20px_#ffe600]">
               WINNERS CIRCLE
             </div>
          )}

          <div className={`grid gap-4 w-full h-full p-4 overflow-y-auto ${gameState === GameState.FINISHED ? 'grid-cols-3 items-center' : 'grid-cols-2 md:grid-cols-5 content-start'}`}>
             {displayTeams.map((team, index) => (
               <div 
                key={team.id} 
                className={`
                  relative bg-dark-card border rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-500
                  ${gameState === GameState.FINISHED 
                    ? 'h-[80%] border-neon-yellow shadow-[0_0_30px_#ffe60033] scale-105 first:scale-110 first:border-4 first:shadow-[0_0_50px_#ffe60066] z-10' 
                    : 'border-gray-700 hover:border-neon-blue'
                  }
                `}
               >
                  {gameState === GameState.FINISHED && (
                    <div className="absolute top-2 left-2 text-6xl font-black text-gray-800/50 font-display">#{index + 1}</div>
                  )}
                  
                  <div className={`
                    rounded-full bg-black border-2 border-gray-600 overflow-hidden flex items-center justify-center shadow-lg mb-3
                    ${gameState === GameState.FINISHED ? 'w-32 h-32' : 'w-20 h-20'}
                  `}>
                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-2xl">{team.name[0]}</span>}
                  </div>
                  
                  <div className={`
                    font-bold text-center uppercase tracking-wider
                    ${gameState === GameState.FINISHED ? 'text-3xl text-neon-yellow' : 'text-lg text-white'}
                  `}>
                    {team.name}
                  </div>
               </div>
             ))}
          </div>
        </div>
      </main>

      {/* 4. CONTROLS (Sticky Bottom) */}
      <div className="h-20 bg-dark-surface border-t border-gray-800 flex items-center justify-center gap-6 z-30">
        
        {/* Buttons vary based on state */}
        <ControlBtn 
          icon={<RotateCcw />} 
          label="Reset" 
          onClick={handleReset} 
          color="bg-gray-700 hover:bg-gray-600"
        />

        {gameState !== GameState.RUNNING && gameState !== GameState.FINISHED && (
          <ControlBtn 
            icon={<Play fill="currentColor" />} 
            label="Start Quiz" 
            onClick={handleStart} 
            color="bg-neon-blue text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_#00f3ff]"
            main
          />
        )}

        {gameState === GameState.RUNNING && (
          <ControlBtn 
            icon={<Square fill="currentColor" />} 
            label="Finish Early" 
            onClick={handleFinish} 
            color="bg-red-600 hover:bg-red-500 hover:shadow-[0_0_20px_red]"
            main
          />
        )}

        <ControlBtn 
          icon={<SkipForward />} 
          label="Next Round" 
          onClick={handleNextRound} 
          color="bg-purple-700 hover:bg-purple-600"
        />

        {/* Secret Config Link for Access */}
        <button onClick={() => navigate('/config')} className="absolute right-6 p-3 text-gray-600 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}

const ControlBtn = ({ icon, label, onClick, color, main }: any) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all transform active:scale-95
      ${color} ${main ? 'text-lg px-10' : 'text-sm text-white'}
    `}
  >
    {icon} {label}
  </button>
);
