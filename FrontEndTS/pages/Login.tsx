import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow any non-empty input for demo
    if (username && password) {
      login(username);
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-1">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-400 via-white to-gold-400 rounded-2xl opacity-20 blur-sm"></div>
        <div className="relative bg-neutral-950 border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-white tracking-widest mb-2">ACCESS CONTROL</h2>
            <div className="h-1 w-20 bg-gold-500 mx-auto rounded-full shadow-[0_0_10px_#FFD700]"></div>
            <p className="text-neutral-400 mt-4 text-sm uppercase tracking-wide">Enter credentials to initialize system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-gold-500 uppercase tracking-wider mb-2 group-focus-within:text-white transition-colors">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-gold-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all placeholder-neutral-700"
                placeholder="admin"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gold-500 uppercase tracking-wider mb-2 group-focus-within:text-white transition-colors">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-gold-500 focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all placeholder-neutral-700"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gold-600 to-gold-400 text-black font-display font-bold text-lg py-3 rounded-lg shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-4"
            >
              INITIALIZE SESSION
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default Login;
