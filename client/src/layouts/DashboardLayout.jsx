import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import Background3D from '../components/Background3D';
import {
  FiLogOut, FiMenu, FiX, FiSun, FiMoon, FiUser, FiChevronRight, 
  FiActivity, FiZap, FiTarget, FiCpu, FiShield, FiGlobe, FiGrid
} from 'react-icons/fi';

const NAV_ITEMS = [
  { path: '/dashboard', icon: <FiActivity />, label: 'Overview', end: true },
  { path: '/dashboard/timeline', icon: <FiGrid />, label: 'Timeline' },
  { path: '/dashboard/chat', icon: <FiCpu />, label: 'AI Chat' },
  { path: '/dashboard/booth', icon: <FiTarget />, label: 'Booth' },
  { path: '/dashboard/eci-map', icon: <FiGlobe />, label: 'ECI Map' },
  { path: '/dashboard/parliament', icon: <FiShield />, label: 'Parliament' },
  { path: '/dashboard/scenarios', icon: <FiZap />, label: 'Simulations' },
  { path: '/dashboard/quiz', icon: <FiActivity />, label: 'Quiz' },
  { path: '/dashboard/translator', icon: <FiGlobe />, label: 'Translate' },
];

const sidebarNav = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const sidebarItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function DashboardLayout() {
  const { user, logoutUser } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Forced dark mode for theme consistency
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/auth');
  };

  const UserAvatar = ({ size = 'w-10 h-10', textSize = 'text-xs' }) => (
    user?.avatar ? (
      <img src={user.avatar} alt="" className={`${size} rounded-full object-cover border-2 border-primary/20`} referrerPolicy="no-referrer" />
    ) : (
      <div className={`${size} rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center ${textSize} font-black text-primary shadow-[0_0_15px_rgba(0,242,255,0.2)]`}>
        {user?.name?.charAt(0)?.toUpperCase()}
      </div>
    )
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#050505] text-white selection:bg-primary/30">
      <Background3D isDarkMode={true} />

      {/* ====== CYBER NAVBAR ====== */}
      <header className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-2xl border-b border-white/5 px-6 flex-shrink-0">
        <div className="flex items-center justify-between h-20">
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]">
              <FiZap />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-black tracking-tighter uppercase gradient-text">CivicPulse</p>
              <p className="text-[8px] text-text-muted font-black uppercase tracking-[0.3em]">Neural Interface V2.6</p>
            </div>
          </div>

          <nav className="hidden lg:flex flex-1 justify-center items-center px-8 gap-1">
            {NAV_ITEMS.map(({ path, icon, label, end }) => (
              <NavLink key={path} to={path} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`
                }>
                {icon} <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-tight text-white">{user?.name}</p>
                <p className="text-[9px] text-primary uppercase font-bold tracking-widest">{user?.state}</p>
              </div>
              <NavLink to="/dashboard/profile">
                <UserAvatar />
              </NavLink>
              <button onClick={handleLogout} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                <FiLogOut size={18} />
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-primary">
              <FiMenu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* ====== CONTENT ====== */}
      <main className="flex-1 overflow-y-auto w-full relative" id="main-content">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ====== MOBILE MENU ====== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl lg:hidden"
              onClick={() => setMobileMenuOpen(false)} />

            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-[300px] bg-[#0A0A0C] border-l border-white/5 flex flex-col lg:hidden">
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <FiZap className="text-primary text-2xl" />
                   <span className="font-black uppercase tracking-tighter text-xl">Pulse</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-text-muted">
                  <FiX size={24} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map(({ path, icon, label, end }) => (
                  <NavLink key={path} to={path} end={end} onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        isActive ? 'bg-primary text-black' : 'text-text-muted hover:bg-white/5'
                      }`
                    }>
                    {icon} {label}
                  </NavLink>
                ))}
              </nav>

              <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4 mb-6">
                  <UserAvatar />
                  <div>
                    <p className="text-xs font-black uppercase text-white">{user?.name}</p>
                    <p className="text-[9px] text-text-muted uppercase font-bold">{user?.state}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="w-full py-4 rounded-2xl bg-white/5 text-red-500 text-xs font-black uppercase tracking-widest border border-red-500/20">
                  Disconnect
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
