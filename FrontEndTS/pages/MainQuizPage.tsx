import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { Settings, Play, Square, SkipForward, RotateCcw } from 'lucide-react';
import { startGame, resetGame, connectEvents, postConfig } from '../utils/espApi';

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
  
  // New States for Podium Logic
  const [focusedRank, setFocusedRank] = useState<number>(0);
  const [scoreFeedbacks, setScoreFeedbacks] = useState<Record<number, { text: string, type: 'positive' | 'negative', key: number } | null>>({});

  const audioCtxRef = useRef<any>(null);
  const gainRef = useRef<any>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const esRef = useRef<EventSource | null>(null);

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
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch {}
      currentSourceRef.current = null;
    }
    const src = ctx.createBufferSource();
    src.buffer = bufferRef.current;
    src.connect(gainRef.current);
    src.onended = () => { currentSourceRef.current = null; };
    currentSourceRef.current = src;
    src.start(ctx.currentTime);
  };

  // --- NEW: Comfortable Feedback Tones ---
  const playFeedbackTone = (type: 'positive' | 'negative') => {
    const ctx = audioCtxRef.current;
    // Attempt to init if not ready, though usually initAudio is called by interaction first
    if (!ctx) return; 
    
    try { if (ctx.state === 'suspended') { ctx.resume(); } } catch {}

    const osc = ctx.createOscillator();
    const feedbackGain = ctx.createGain();
    
    osc.connect(feedbackGain);
    feedbackGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'positive') {
      // Comfortable "Success" Chime: Sine wave, sliding slightly up, soft attack/decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // Slide up to C6

      // Envelope to make it soft
      feedbackGain.gain.setValueAtTime(0, now);
      feedbackGain.gain.linearRampToValueAtTime(0.2, now + 0.05); // Soft attack
      feedbackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // Long decay

      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Comfortable "Error/Pass" Tone: Low sine wave (less harsh than triangle), sliding down
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(196.00, now); // G3
      osc.frequency.linearRampToValueAtTime(130.81, now + 0.25); // Slide down to C3

      // Envelope
      feedbackGain.gain.setValueAtTime(0, now);
      feedbackGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      feedbackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  };

  useEffect(() => {
    let timer: any;
    if (gameState === GameState.RUNNING && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === GameState.RUNNING) {
      setGameState(GameState.FINISHED);
      setFocusedRank(0); // Default select 1st place
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    try { if (esRef.current) { esRef.current.close(); esRef.current = null; } } catch {}
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
      }
    );
    esRef.current = es;
    return () => { try { if (esRef.current) { esRef.current.close(); esRef.current = null; } } catch {} };
  }, [soundEnabled, config.buzzerAudioData, config.buzzerToneFreq, config.buzzerToneMs]);

  useEffect(() => {
    (async () => {
      if (!config.buzzerAudioData) { bufferRef.current = null; return; }
      await initAudio();
      try {
        const res = await fetch(config.buzzerAudioData);
        const ab = await res.arrayBuffer();
        const buf = await audioCtxRef.current.decodeAudioData(ab);
        bufferRef.current = buf;
        if (currentSourceRef.current) { try { currentSourceRef.current.stop(); } catch {} currentSourceRef.current = null; }
      } catch {}
    })();
  }, [config.buzzerAudioData]);

  useEffect(() => {
    const handler = () => { if (soundEnabled) { initAudio().catch(()=>{}); } };
    window.addEventListener('click', handler, { once: true } as any);
    window.addEventListener('keydown', handler, { once: true } as any);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [soundEnabled]);

  // --------------------------------------------------------------------------------
  // LOGIC: Keyboard Controls for Scoring (Only in FINISHED state)
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (gameState !== GameState.FINISHED || pressedOrder.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ENTER: Correct Answer
      if (e.key === 'Enter') {
        let points = 0;
        if (focusedRank === 0) points = 10;
        else if (focusedRank === 1) points = 8;
        else if (focusedRank === 2) points = 5;

        if (points > 0) {
          playFeedbackTone('positive'); // Trigger positive sound
          triggerFeedback(focusedRank, `+${points}`, 'positive');
        }
      } 
      // RIGHT ARROW: Wrong Answer / Pass
      else if (e.key === 'ArrowRight') {
        // Show -5 animation on current
        playFeedbackTone('negative'); // Trigger negative sound
        triggerFeedback(focusedRank, '-5', 'negative');
        
        // Move focus to next rank if available
        if (focusedRank < Math.min(2, pressedOrder.length - 1)) {
          setTimeout(() => setFocusedRank(prev => prev + 1), 300); // Slight delay for UX
        }
      }
      // OPTIONAL: LEFT ARROW to go back? (Not requested but helpful for testing)
      else if (e.key === 'ArrowLeft') {
         if (focusedRank > 0) {
           setFocusedRank(prev => prev - 1);
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pressedOrder, focusedRank]);

  const triggerFeedback = (rank: number, text: string, type: 'positive' | 'negative') => {
    setScoreFeedbacks(prev => ({
      ...prev,
      [rank]: { text, type, key: Date.now() }
    }));
  };

  const handleReset = () => {
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
    updateConfig({ currentQuestionNumber: 1 });
    resetGame().catch(() => {});
    setPressedOrder([]);
    setFocusedRank(0);
    setScoreFeedbacks({});
  };

  const handleStart = () => {
    const durationMs = Number(config.questionTimeoutSeconds) * 1000;
    postConfig(durationMs).catch(() => {});
    startGame().catch(() => {});
    setGameState(GameState.RUNNING);
    setPressedOrder([]);
    if (soundEnabled) { initAudio().catch(()=>{}); }
  };

  const handleFinish = () => {
    setGameState(GameState.FINISHED);
    setFocusedRank(0);
  };

  const handleNextRound = () => {
    const current = Number(config.currentQuestionNumber) || 1;
    updateConfig({ currentQuestionNumber: current + 1 });
    setGameState(GameState.READY);
    setTimeLeft(config.questionTimeoutSeconds);
    setPressedOrder([]);
    setFocusedRank(0);
    setScoreFeedbacks({});
  };

  // --------------------------------------------------------------------------------
  // RENDER: Loading Screen
  // --------------------------------------------------------------------------------
  if (gameState === GameState.IDLE) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
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
  
  // Logic to determine which teams to show
  // If FINISHED, we ONLY show the top 3 pressed teams in a specific layout.
  // If RUNNING/READY, we show all teams or a grid.
  const podiumTeams = pressedOrder.map((i) => config.teams[i]).filter(Boolean).slice(0, 3);
  
  // Helper for ordinal suffix
  const getOrdinal = (n: number) => {
    return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  }

  return (
    <div className="h-screen w-screen bg-dark-bg flex flex-col text-white overflow-hidden relative font-sans">
      
      {/* Styles for animations */}
      <style>{`
        @keyframes floatUpFade {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          20% { opacity: 1; transform: translateY(0) scale(1.2); }
          80% { opacity: 1; transform: translateY(-40px) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.9); }
        }
        @keyframes floatDownFade {
          0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
          20% { opacity: 1; transform: translateY(0) scale(1.2); }
          80% { opacity: 1; transform: translateY(40px) scale(1); }
          100% { opacity: 0; transform: translateY(60px) scale(0.9); }
        }
        .anim-positive { animation: floatUpFade 1.5s ease-out forwards; }
        .anim-negative { animation: floatDownFade 1.5s ease-out forwards; }
      `}</style>

      {/* 1. CUSTOM HEADER */}
      <header className="h-[120px] flex items-center px-4 md:px-8 relative z-20 bg-gradient-to-b from-gray-900 via-gray-900/95 to-black border-b-4 border-[#FFB300] shadow-[0_0_30px_rgba(255,179,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-center">
          {config.leftLogo ? (
            <img src={config.leftLogo} className="object-contain mix-blend-multiply" style={{ maxHeight: '100px', maxWidth: '120px' }} alt="Left" />
          ) : <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse"></div>}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider">
            {config.headerTitle}
          </h1>
          <p className="text-[#FFB300] font-bold tracking-[0.3em] uppercase mt-2 text-sm md:text-lg animate-pulse drop-shadow-[0_0_5px_rgba(255,179,0,0.8)]">
            {config.headerSubtitle}
          </p>
        </div>

        <div className="flex items-center justify-center">
          {config.rightLogo ? (
            <img src={config.rightLogo} className="object-contain mix-blend-multiply" style={{ maxHeight: '100px', maxWidth: '120px' }} alt="Right" />
          ) : <div className="w-16 h-16 rounded-full bg-gray-800 animate-pulse"></div>}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* VIEW: GAME RUNNING OR READY (Split Screen) */}
        {gameState !== GameState.FINISHED && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-6 gap-6">
             {/* LEFT: COUNTDOWN TILE */}
            <div className="flex items-center justify-center relative bg-dark-surface/50 rounded-3xl border border-gray-800 backdrop-blur-sm overflow-hidden shadow-2xl">
               {config.mainAnimationGif && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <img src={config.mainAnimationGif} className="w-full h-full object-cover opacity-40 pointer-events-none" loading="eager" alt="Background" />
                 </div>
               )}
               <div className="relative z-10 text-center w-full max-w-4xl px-12">
                {gameState === GameState.RUNNING ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="text-[8rem] md:text-[10rem] font-display font-black leading-none text-white drop-shadow-[0_0_30px_#ff00ff]">
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
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

            {/* RIGHT: REGULAR TEAM GRID */}
            <div className="relative overflow-y-auto">
              {pressedOrder.length > 0 && (
                <div className="bg-neon-blue text-black px-6 py-2 rounded-xl font-black font-display text-base md:text-lg lg:text-xl mb-3 shadow-[0_0_20px_#00f3ff]">
                  LIVE LEADERBOARD
                </div>
              )}
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                 {/* Show pressed teams first, then rest */}
                 {(() => {
                   const ordered = pressedOrder.map(i => config.teams[i]).filter(Boolean);
                   const rest = config.teams.filter(t => !ordered.includes(t));
                   return [...ordered, ...rest].map((team, idx) => (
                      <div key={team.id} className="relative bg-dark-card border border-gray-700 rounded-2xl overflow-hidden p-3 flex flex-col items-center justify-center gap-2 text-center hover:border-neon-blue transition-colors max-w-[260px] w-full mx-auto h-[200px] md:h-[220px]">
                        {ordered.includes(team) && (
                          <div className="absolute top-3 left-3 text-neon-blue font-display font-black text-xs bg-black/40 px-2 py-1 rounded">
                            #{ordered.indexOf(team) + 1}
                          </div>
                        )}
                        <div className="rounded-full bg-black border-2 border-gray-600 overflow-hidden w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                          {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{team.name[0]}</span>}
                        </div>
                        <div className="font-bold uppercase tracking-wider text-sm md:text-base text-white truncate w-full">{team.name}</div>
                      </div>
                   ));
                 })()}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: FINISHED / PODIUM MODE */}
        {gameState === GameState.FINISHED && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
             <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
             
             {podiumTeams.length === 0 ? (
               <div className="text-4xl font-display text-gray-500">NO BUZZERS PRESSED</div>
             ) : (
               <div className="flex flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-7xl relative z-10">
                 {podiumTeams.map((team, index) => {
                   // Style settings based on Rank
                   const isFirst = index === 0;
                   const isSecond = index === 1;
                   const isThird = index === 2;
                   
                   // Determine size classes
                   let containerClass = "";
                   let glowColor = "";
                   let borderColor = "";
                   let textColor = "";
                   let ordinal = "";

                   if (isFirst) {
                      containerClass = "scale-110 z-20"; // Largest
                      glowColor = "shadow-[0_0_50px_rgba(255,215,0,0.4)]";
                      borderColor = "border-neon-gold";
                      textColor = "text-neon-gold";
                      ordinal = "1st";
                   } else if (isSecond) {
                      containerClass = "scale-100 z-10"; // Medium
                      glowColor = "shadow-[0_0_30px_rgba(192,192,192,0.3)]";
                      borderColor = "border-gray-300"; // Silverish
                      textColor = "text-gray-300";
                      ordinal = "2nd";
                   } else {
                      containerClass = "scale-90 z-0"; // Smallest
                      glowColor = "shadow-[0_0_20px_rgba(205,127,50,0.3)]";
                      borderColor = "border-orange-700"; // Bronzeish
                      textColor = "text-orange-400";
                      ordinal = "3rd";
                   }

                   // Active Selection Logic (Keyboard focus)
                   const isActive = focusedRank === index;
                   const activeStyle = isActive 
                      ? `ring-4 ring-offset-4 ring-offset-black ${isFirst ? 'ring-neon-gold' : isSecond ? 'ring-gray-300' : 'ring-orange-600'} scale-[1.15]`
                      : 'opacity-80'; // Dim others slightly

                   const feedback = scoreFeedbacks[index];

                   return (
                     <div 
                        key={team.id}
                        className={`
                          relative flex flex-col items-center justify-center 
                          bg-dark-surface border-2 rounded-3xl p-8 transition-all duration-500 ease-out
                          w-64 h-80 md:w-80 md:h-96
                          ${containerClass} ${borderColor} ${glowColor} ${isActive ? activeStyle : 'opacity-70 blur-[1px] grayscale-[30%]'}
                        `}
                     >
                        {/* Rank Badge */}
                        <div className={`absolute -top-6 bg-black border-2 ${borderColor} ${textColor} px-6 py-2 rounded-full font-black font-display text-2xl shadow-xl tracking-widest`}>
                          {ordinal}
                        </div>

                        {/* Team Logo */}
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${borderColor} overflow-hidden shadow-2xl bg-black mb-6 relative group`}>
                          {team.logo ? (
                            <img src={team.logo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={team.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-gray-900">{team.name[0]}</div>
                          )}
                        </div>

                        {/* Team Name */}
                        <h2 className={`text-2xl md:text-3xl font-black uppercase text-center tracking-wide ${textColor} drop-shadow-md line-clamp-2`}>
                          {team.name}
                        </h2>

                        {/* Scoring Animation Overlay */}
                        {feedback && (
                           <div key={feedback.key} className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 ${feedback.type === 'positive' ? 'anim-positive' : 'anim-negative'}`}>
                              <span className={`text-8xl font-black font-display drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-black ${feedback.type === 'positive' ? 'text-neon-green stroke-2' : 'text-red-500'}`}>
                                {feedback.text}
                              </span>
                           </div>
                        )}
                        
                        {/* Celebration Particles if Active & Correct */}
                        {isActive && feedback?.type === 'positive' && (
                           <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                             <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 animate-ping"></div>
                             <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-white animate-pulse"></div>
                             <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-neon-gold animate-bounce"></div>
                           </div>
                        )}
                     </div>
                   );
                 })}
               </div>
             )}
             
          </div>
        )}

      </main>

      {/* CONTROLS (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-dark-surface/80 border border-gray-800 rounded-md px-3 py-2 z-30">
        <ControlBtn icon={<RotateCcw />} label="Reset" onClick={handleReset} color="bg-gray-700 hover:bg-gray-600" />
        
        {gameState !== GameState.RUNNING && gameState !== GameState.FINISHED && (
          <ControlBtn icon={<Play fill="currentColor" />} label="Start Quiz" onClick={handleStart} color="bg-neon-blue text-black" main />
        )}
        
        {gameState === GameState.RUNNING && (
          <ControlBtn icon={<Square fill="currentColor" />} label="Finish Early" onClick={handleFinish} color="bg-red-600" main />
        )}

        <ControlBtn icon={<SkipForward />} label="Next Round" onClick={handleNextRound} color="bg-purple-700" />
        
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
    className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold uppercase tracking-wider transition-all ${color} ${main ? 'text-base px-6' : 'text-xs text-white'}`}
  >
    {icon} {label}
  </button>
);
