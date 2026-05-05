import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getChecklist, getJourney } from '../services/api';
import VotingJourney from '../components/VotingJourney';
import SmartChecklist from '../components/SmartChecklist';
import {
  FiArrowRight, FiTrendingUp
} from 'react-icons/fi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

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
    registered:     { label: 'Registered',      emoji: '✅', color: 'text-secondary' },
    applied:        { label: 'Applied',          emoji: '⏳', color: 'text-blue-500' },
    not_registered: { label: 'Not Registered',   emoji: '❌', color: 'text-red-500' },
    ready:          { label: 'Ready to Vote',    emoji: '🎉', color: 'text-secondary' },
    in_progress:    { label: 'In Progress',      emoji: '🔄', color: 'text-blue-500' },
    not_started:    { label: 'Getting Started',  emoji: '🚀', color: 'text-primary' },
  };
  const statusInfo = STATUS_MAP[derivedStatus] || STATUS_MAP.not_started;

  const quickLinks = [
    { to: '/dashboard/timeline', iconEmoji: '📅', label: 'Timeline', desc: 'Election deadlines' },
    { to: '/dashboard/chat', iconEmoji: '🤖', label: 'AI Chat', desc: 'Ask anything' },
    { to: '/dashboard/booth', iconEmoji: '📍', label: 'Booth Guide', desc: 'Find station' },
    { to: '/dashboard/scenarios', iconEmoji: '🎭', label: 'Scenarios', desc: 'Simulate voting' },
    { to: '/dashboard/quiz', iconEmoji: '🧠', label: 'Learn & Quiz', desc: 'Test knowledge' },
    { to: '/dashboard/profile', iconEmoji: '👤', label: 'My Profile', desc: 'Manage account' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-bg-card to-secondary/10 border border-border p-6 lg:p-8">
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1">
            <p className="text-text-muted text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {user?.name} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-text-secondary text-sm max-w-md">
              {user?.isFirstTimeVoter
                ? "Your first election is a big milestone. Let's make sure you're fully prepared."
                : "Let's continue your journey. Every step counts toward a stronger democracy!"}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-secondary">
                📍 {user?.state}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-secondary">
                {statusInfo.emoji} {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="progress-ring-container">
              <svg width="136" height="136" viewBox="0 0 136 136">
                <defs>
                  <linearGradient id="tricolorRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9933" />
                    <stop offset="50%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#138808" />
                  </linearGradient>
                </defs>
                <circle cx="68" cy="68" r={radius} fill="none" className="progress-ring-bg" strokeWidth="7" />
                <motion.circle cx="68" cy="68" r={radius} fill="none"
                  stroke="url(#tricolorRing)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  className="progress-ring-fill" />
              </svg>
              <div className="absolute text-center">
                <motion.span className="text-2xl font-bold gradient-text"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                  {score}%
                </motion.span>
                <p className="text-text-muted text-[10px]">Readiness</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              <FiTrendingUp size={12} className="text-primary" /> Voter Readiness
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card-static p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider">Journey Steps</p>
          <p className="text-2xl font-bold text-primary mt-1">{journeySteps}</p>
        </div>
        <div className="glass-card-static p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider">Tasks Done</p>
          <p className="text-2xl font-bold text-secondary mt-1">
            {checklistProgress.completed}<span className="text-text-muted text-sm">/{checklistProgress.total}</span>
          </p>
        </div>
        <div className="glass-card-static p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider">Current Status</p>
          <p className={`text-sm font-semibold mt-1 ${statusInfo.color}`}>
            {statusInfo.emoji} {statusInfo.label}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VotingJourney />
        <SmartChecklist onProgressChange={handleChecklistUpdate} />
      </motion.div>

      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-4 text-text-primary">Recommended Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map(({ to, iconEmoji, label, desc }) => (
            <Link key={to} to={to}>
              <motion.div whileHover={{ y: -3 }} className="glass-card p-4 group cursor-pointer h-full">
                <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center mb-3">
                  <span className="text-lg">{iconEmoji}</span>
                </div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</h3>
                <p className="text-xs text-text-muted mt-1">{desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
