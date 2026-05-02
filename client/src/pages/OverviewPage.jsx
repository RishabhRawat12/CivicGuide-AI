import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getChecklist, getJourney } from '../services/api';
import VotingJourney from '../components/VotingJourney';
import SmartChecklist from '../components/SmartChecklist';
import {
  FiArrowRight, FiTrendingUp, FiCpu, FiActivity, FiZap, FiTarget
} from 'react-icons/fi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const { user, checklist, journey } = useUser();
  const [score, setScore] = useState(0);
  const [checklistProgress, setChecklistProgress] = useState({ completed: 0, total: 0 });
  const [journeySteps, setJourneySteps] = useState(0);

  // Sync state with global checklist from context
  useEffect(() => {
    if (checklist?.items) {
      const items = checklist.items;
      const completed = items.filter(i => i.completed).length;
      const total = items.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      setScore(percentage);
      setChecklistProgress({ completed, total });
    }
  }, [checklist]);

  useEffect(() => {
    if (journey?.steps) {
      setJourneySteps(journey.steps.length);
    }
  }, [journey]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const handleChecklistUpdate = (newItems) => {
    const completed = newItems.filter(i => i.completed).length;
    const total = newItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setScore(percentage);
    setChecklistProgress({ completed, total });
  };

  const rawStatus = user?.voterStatus;
  const derivedStatus = (rawStatus === 'unknown' || !rawStatus)
    ? (score >= 100 ? 'ready' : score >= 50 ? 'in_progress' : 'not_started')
    : rawStatus;

  const STATUS_MAP = {
    registered:     { label: 'Authorized',      icon: <FiShield />, color: 'text-primary' },
    applied:        { label: 'Syncing',         icon: <FiActivity />, color: 'text-cyan-400' },
    not_registered: { label: 'Deauthorized',    icon: <FiZap />, color: 'text-red-500' },
    ready:          { label: 'Protocol Ready',   icon: <FiTarget />, color: 'text-primary' },
    in_progress:    { label: 'Processing',      icon: <FiCpu />, color: 'text-purple-500' },
    not_started:    { label: 'Initialize',      icon: <FiZap />, color: 'text-primary' },
  };
  const statusInfo = STATUS_MAP[derivedStatus] || STATUS_MAP.not_started;

  const quickLinks = [
    { to: '/dashboard/timeline', icon: <FiActivity />, label: 'Pulse Timeline', desc: 'Deadlines & Windows' },
    { to: '/dashboard/chat', icon: <FiCpu />, label: 'Neural Chat', desc: 'Query AI Assistant' },
    { to: '/dashboard/booth', icon: <FiTarget />, label: 'Node Locator', desc: 'Find Polling Node' },
    { to: '/dashboard/scenarios', icon: <FiZap />, label: 'Simulations', desc: 'Test Vote Protocol' },
    { to: '/dashboard/quiz', icon: <FiActivity />, label: 'Skill Check', desc: 'Verify Knowledge' },
    { to: '/dashboard/profile', icon: <FiTarget />, label: 'User Identity', desc: 'Manage Core Profile' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Hero Welcome Card */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/5 p-8 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 blur-[80px]" />
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <FiZap className="animate-pulse" /> Identity Sync Online
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4 uppercase">
              Agent <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-text-secondary text-base max-w-md font-medium leading-relaxed">
              {user?.isFirstTimeVoter
                ? "First-time entry protocol detected. Initializing comprehensive civic onboarding."
                : "Continuous engagement verified. Resuming democratic synchronization protocol."}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-white/5 border border-white/10 text-text-secondary">
                Region: {user?.state}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-white/5 border border-white/10 ${statusInfo.color} flex items-center gap-2`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="progress-ring-container relative">
              <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                <defs>
                  <linearGradient id="cyberRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2FF" />
                    <stop offset="100%" stopColor="#7000FF" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="70" fill="none" className="stroke-white/5" strokeWidth="8" />
                <motion.circle cx="80" cy="80" r="70" fill="none"
                  stroke="url(#cyberRing)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 70) - (score / 100) * (2 * Math.PI * 70) }}
                  transition={{ duration: 2, ease: 'circOut', delay: 0.5 }}
                  className="progress-ring-fill" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="text-4xl font-black gradient-text tracking-tighter"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}>
                  {score}%
                </motion.span>
                <p className="text-text-muted text-[8px] font-black uppercase tracking-[0.2em]">Sync Level</p>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-4 flex items-center gap-2">
              <FiTrendingUp className="text-primary" /> Core Readiness Index
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 bg-white/[0.01]">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Journey Nodes</p>
          <p className="text-3xl font-black tracking-tighter text-primary mt-2">{journeySteps}</p>
        </div>
        <div className="glass-card p-6 bg-white/[0.01]">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Task Completion</p>
          <p className="text-3xl font-black tracking-tighter text-white mt-2">
            {checklistProgress.completed}<span className="text-text-muted text-sm font-medium">/{checklistProgress.total}</span>
          </p>
        </div>
        <div className="glass-card p-6 bg-white/[0.01]">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Deployment Status</p>
          <div className={`flex items-center gap-2 mt-2 font-black text-sm uppercase tracking-widest ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
        </div>
      </motion.div>

      {/* Main Sections */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2">
            <FiActivity /> Linear Journey Projection
          </h2>
          <VotingJourney />
        </div>
        <div className="glass-card p-8 border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 flex items-center gap-2">
            <FiTarget /> Operational Checklist
          </h2>
          <SmartChecklist onProgressChange={handleChecklistUpdate} />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="pb-12">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Execution Terminals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(({ to, icon, label, desc }) => (
            <Link key={to} to={to}>
              <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card p-6 group cursor-pointer h-full border-white/5 hover:border-primary/40 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:text-primary transition-all text-xl">
                  {icon}
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{label}</h3>
                <p className="text-xs text-text-muted mt-2 font-medium leading-relaxed">{desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
