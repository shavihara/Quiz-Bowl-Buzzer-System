import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NavItem } from '../types';

// Icons using SVG directly to avoid dependencies for this snippet, or use lucide-react in real project.
// Here I use simple SVG for the logo.
const Logo = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
  </svg>
);

const navItems: NavItem[] = [
  { label: 'Home', path: '/dashboard/home' },
  { label: 'About Us', path: '/dashboard/about' },
  { label: 'History', path: '/dashboard/history' },
];

const DashboardLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white overflow-hidden font-sans selection:bg-gold-500 selection:text-black">
      {/* Modern Header */}
      <header className="h-16 md:h-20 flex-none bg-neutral-900/80 border-b border-white/10 backdrop-blur-md px-6 flex items-center justify-between z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-full bg-black/50 border border-gold-400/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Logo />
          </div>
          <h1 className="hidden md:block font-display font-bold text-lg md:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-white">
            QUIZ BUZZER SYSTEM
          </h1>
          <h1 className="md:hidden font-display font-bold text-xl text-gold-400">QBS</h1>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center bg-black/30 rounded-full p-1 border border-white/5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                px-4 md:px-6 py-1.5 md:py-2 rounded-full text-sm md:text-base font-medium transition-all duration-300
                ${isActive 
                  ? 'bg-gold-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.5)] font-bold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Logout */}
        <div>
          <button 
            onClick={handleLogout}
            className="group relative px-4 md:px-6 py-2 rounded-lg bg-transparent overflow-hidden border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-50 transition-all duration-300"
          >
             <div className="absolute inset-0 w-0 bg-red-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
             <span className="relative font-bold text-sm tracking-wide uppercase">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
        {/* Subtle grid background using CSS gradients instead of external SVG */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
             }}>
        </div>
        
        {/* Page Content */}
        <div className="relative h-full w-full p-4 md:p-8 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;