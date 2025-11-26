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
  const [pressedOrder, setPressedOrder] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(config.buzzerSoundEnabled);
  const audioCtxRef = useRef<any>(null);
  const gainRef = useRef<any>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const initAudio = async () => {
    if (!audioCtxRef.current) {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
      gainRef.current = audioCtxRef.current.createGain();
      gainRef.current.gain.value = 0.35;
      gainRef.current.connect(audioCtxRef.current.destination);
    }
    try { if (audioCtxRef.current.state === 'suspended') { await audioCtxRef.current.resume(); } } catch {}
    if (config.buzzerAudioData && !bufferRef.current) {
      try {
        const res = await fetch(config.buzzerAudioData);
        const ab = await res.arrayBuffer();
        bufferRef.current = await audioCtxRef.current.decodeAudioData(ab);
      } catch {}
    }
  };
  const playBeep = (freq: number, ms: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !gainRef.current) return;
    try { if (ctx.state === 'suspended') { ctx.resume(); } } catch {}
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gainRef.current);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + ms / 1000);
  };
  const playBuffer = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || !gainRef.current || !bufferRef.current) return;
    try { if (ctx.state === 'suspended') { ctx.resume(); } } catch {}
    const src = ctx.createBufferSource();
    src.buffer = bufferRef.current;
    src.connect(gainRef.current);
    src.start(ctx.currentTime);
  };
  
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

  useEffect(() => {
    const es = connectEvents(
      (data) => {
        const idx = Number(data.teamIndex);
        setPressedOrder((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        if (soundEnabled) {
          if (config.buzzerAudioData && bufferRef.current) {
            playBuffer();
          } else {
            const base = Number(config.buzzerToneFreq) || 800;
            const freq = base + idx * 90;
            const ms = Number(config.buzzerToneMs) || 200;
            playBeep(freq, ms);
          }
        }
      },
      (res) => {
        setPressedOrder(res.top3 || []);
        setGameState(GameState.FINISHED);
      }
    );
    return () => { try { es.close(); } catch {} };
  }, [soundEnabled, config.buzzerAudioData, config.buzzerToneFreq, config.buzzerToneMs]);

  useEffect(() => {
    const handler = () => { if (soundEnabled) { initAudio().catch(()=>{}); } };
    window.addEventListener('click', handler, { once: true } as any);
    window.addEventListener('keydown', handler, { once: true } as any);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [soundEnabled]);

  // Reset timer if config changes or manual reset
  const handleReset = () => {
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
    updateConfig({ currentQuestionNumber: 1 });
    resetGame().catch(() => {});
    setPressedOrder([]);
  };

  const handleStart = () => {
    startGame().catch(() => {});
    setGameState(GameState.RUNNING);
    setPressedOrder([]);
    if (soundEnabled) { initAudio().catch(()=>{}); }
  };

  const handleFinish = () => {
    setGameState(GameState.FINISHED);
  };

  const handleNextRound = () => {
    const current = Number(config.currentQuestionNumber) || 1;
    updateConfig({ currentQuestionNumber: current + 1 });
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
    setPressedOrder([]);
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
  const positionsMap = pressedOrder.reduce<Record<string, number>>((acc, idx, place) => {
    acc[String(idx)] = place + 1;
    return acc;
  }, {});
  const podiumTeams = (() => {
    if (!pressedOrder.length) return [] as typeof config.teams;
    const topIds = pressedOrder.slice(0, 3);
    return topIds.map((i) => config.teams[i]).filter(Boolean);
  })();
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-6 gap-6 relative z-10 overflow-hidden">

        {/* LEFT: COUNTDOWN TILE */}
        <div className="flex items-center justify-center relative bg-dark-surface/50 rounded-3xl border border-gray-800 backdrop-blur-sm overflow-hidden shadow-2xl">
           
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

        {/* RIGHT: TEAM LIST + LIVE LEADERBOARD */}
        <div className="relative">
          {pressedOrder.length > 0 && gameState !== GameState.FINISHED && (
            <div className="bg-neon-blue text-black px-6 py-2 rounded-xl font-black font-display text-base md:text-lg lg:text-xl mb-3 shadow-[0_0_20px_#00f3ff]">
              LIVE LEADERBOARD
            </div>
          )}
          
          {gameState === GameState.FINISHED && pressedOrder.length > 0 && (
            <div className="mb-4">
              <div className="bg-neon-yellow text-black px-6 py-2 rounded-xl font-black font-display text-lg text-center shadow-[0_0_20px_#ffe600]">WINNERS CIRCLE</div>
              <div className="mt-4 grid grid-cols-3 gap-3 items-end">
                <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-3 text-center animate-pulse-slow">
                  {podiumTeams[1] && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl">🥈</div>
                      <div className="w-16 h-16 rounded-full bg-black border border-gray-600 overflow-hidden">
                        {podiumTeams[1].logo ? <img src={podiumTeams[1].logo} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{podiumTeams[1].name?.[0] || '?'}</span>}
                      </div>
                      <div className="text-neon-blue font-bold uppercase tracking-wider text-sm truncate w-full">{podiumTeams[1].name}</div>
                      <div className="text-gray-400 text-xs">{ordinal(2)}</div>
                    </div>
                  )}
                </div>
                <div className="bg-black/70 border border-neon-yellow rounded-2xl p-4 text-center shadow-[0_0_25px_#ffe600aa] scale-105 animate-bounce">
                  {podiumTeams[0] && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">🥇</div>
                      <div className="w-20 h-20 rounded-full bg-black border border-neon-yellow overflow-hidden">
                        {podiumTeams[0].logo ? <img src={podiumTeams[0].logo} className="w-full h-full object-cover" /> : <span className="text-neon-yellow font-black text-2xl">{podiumTeams[0].name?.[0] || '?'}</span>}
                      </div>
                      <div className="text-neon-yellow font-black uppercase tracking-wider text-base truncate w-full">{podiumTeams[0].name}</div>
                      <div className="text-gray-300 text-xs">{ordinal(1)}</div>
                    </div>
                  )}
                </div>
                <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-3 text-center animate-pulse-slow">
                  {podiumTeams[2] && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl">🥉</div>
                      <div className="w-16 h-16 rounded-full bg-black border border-gray-600 overflow-hidden">
                        {podiumTeams[2].logo ? <img src={podiumTeams[2].logo} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{podiumTeams[2].name?.[0] || '?'}</span>}
                      </div>
                      <div className="text-neon-blue font-bold uppercase tracking-wider text-sm truncate w-full">{podiumTeams[2].name}</div>
                      <div className="text-gray-400 text-xs">{ordinal(3)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`grid gap-4 w-full h-full p-4 overflow-y-auto grid-cols-1`}>
              {displayTeams.map((team, index) => (
                <div 
                 key={team.id} 
                className={`
                  relative bg-dark-card border rounded-xl overflow-hidden grid grid-cols-[auto_auto_1fr] items-center gap-4 p-4 transition-all duration-500
                  ${gameState === GameState.FINISHED 
                    ? 'border-neon-yellow shadow-[0_0_30px_#ffe60033]' 
                    : 'border-gray-700 hover:border-neon-blue'
                  }
                `}
                >
                  {gameState === GameState.FINISHED && pressedOrder.length > 0 ? (
                    <div className={`text-neon-yellow font-display font-black text-sm md:text-base bg-black/40 px-2 py-1 rounded`}>#{index + 1}</div>
                  ) : (
                    (() => {
                      const teamIndex = config.teams.findIndex(t => t.id === team.id);
                      const place = positionsMap[String(teamIndex)];
                      return place ? (
                        <div className={`text-neon-blue font-display font-black text-sm md:text-base bg-black/40 px-2 py-1 rounded`}>#{place}</div>
                      ) : (
                        <div className="w-6" />
                      );
                    })()
                  )}

                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="rounded-full bg-black border-2 border-gray-600 overflow-hidden flex items-center justify-center shadow-lg w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20">
                      {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl md:text-2xl">{team.name[0]}</span>}
                    </div>
                    <div className={`font-bold uppercase tracking-wider ${gameState === GameState.FINISHED ? 'text-2xl md:text-3xl text-neon-yellow' : 'text-base md:text-lg text-white'} truncate max-w-[50vw] md:max-w-[30vw]`}>
                      {team.name}
                    </div>
                  </div>
                  <div className="justify-self-end text-right text-xs md:text-sm text-gray-400">
                    {gameState !== GameState.FINISHED && positionsMap[String(config.teams.findIndex(t => t.id === team.id))] ? (
                      <span>Position #{positionsMap[String(config.teams.findIndex(t => t.id === team.id))]}</span>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {/* 4. CONTROLS (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-dark-surface/80 border border-gray-800 rounded-md px-3 py-2 z-30">
        
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
          color="bg-neon-blue text-black"
          main
        />
        )}

        {gameState === GameState.RUNNING && (
          <ControlBtn 
            icon={<Square fill="currentColor" />} 
            label="Finish Early" 
            onClick={handleFinish} 
          color="bg-red-600"
          main
        />
        )}

        <ControlBtn 
          icon={<SkipForward />} 
          label="Next Round" 
          onClick={handleNextRound} 
          color="bg-purple-700"
        />
        <button onClick={() => navigate('/config')} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}

const ControlBtn = ({ icon, label, onClick, color, main }: any) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-md font-semibold uppercase tracking-wider transition-all
      ${color} ${main ? 'text-base px-6' : 'text-xs text-white'}
    `}
  >
    {icon} {label}
  </button>
);
