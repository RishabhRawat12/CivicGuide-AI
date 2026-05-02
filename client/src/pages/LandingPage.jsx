import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  FiArrowRight, FiCheckCircle, FiShield, FiZap, FiCpu,
  FiChevronRight, FiLock, FiMapPin, FiMessageCircle, FiBookOpen,
  FiUsers, FiMap, FiAward, FiStar, FiActivity, FiGlobe
} from 'react-icons/fi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } };

const FEATURES = [
  { icon: <FiZap />, title: 'AI-Guided Roadmap', desc: 'Your unique voting journey, architected by Gemini AI for maximum precision.', gradient: 'from-[#00F2FF] to-[#006AFF]' },
  { icon: <FiActivity />, title: 'Real-time Readiness', desc: 'Live scoring of your voter status with predictive registration analysis.', gradient: 'from-[#7000FF] to-[#BD00FF]' },
  { icon: <FiCpu />, title: 'Bilingual Neural Chat', desc: 'Instant clarity in English or Hindi, powered by deep-learning models.', gradient: 'from-[#00F2FF] to-[#7000FF]' },
  { icon: <FiShield />, title: 'Neutral Protocol', desc: 'Zero-bias algorithmic verification based on official ECI data streams.', gradient: 'from-[#FF00E5] to-[#7000FF]' },
  { icon: <FiMapPin />, title: 'Precision Locator', desc: 'Geospatial mapping of your polling station with real-time navigation.', gradient: 'from-[#00F2FF] to-[#00B4D8]' },
  { icon: <FiGlobe />, title: 'National ECI Intel', desc: 'Macro-scale visualization of constituencies and voter demographics.', gradient: 'from-[#7000FF] to-[#00F2FF]' },
];

const STATS = [
  { end: 950, suffix: 'M+', label: 'Voter Network' },
  { end: 10.5, suffix: 'L+', label: 'Digital Polling Nodes', decimals: 1 },
  { end: 543, suffix: '', label: 'Sovereign Zones' },
  { end: 36, suffix: '', label: 'State Matrices' },
];

function CountUp({ end, suffix = '', decimals = 0, duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed);
      const current = eased * end;
      setCount(current);
      if (elapsed < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count);

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,242,255,0.4)] tabular-nums">
      {display}{suffix}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-primary relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] bg-primary text-black px-4 py-2 rounded-full font-bold">Skip to Main Content</a>

      {/* ====== NAVBAR ====== */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <nav className="glass-card px-6 py-4 flex items-center justify-between border-white/5 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]" role="img" aria-label="CivicPulse Logo">
              <FiZap className="text-black text-xl" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-black tracking-tighter gradient-text block">CIVICPULSE AI</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">Voter OS 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-sm font-bold text-text-secondary hover:text-primary transition-all hidden md:block uppercase tracking-wider">
              Access Terminal
            </Link>
            <Link to="/auth" className="btn-primary py-2.5 px-6 text-xs uppercase tracking-widest font-black" aria-label="Initialize Journey">
              Initialize <FiChevronRight className="inline ml-1" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ====== HERO ====== */}
      <main id="main-content" tabIndex="-1">
        <section className="relative z-10 px-5 pt-44 pb-32 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Online: ECI Version 4.0</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] uppercase"
          >
            Digitalize Your <br />
            <span className="gradient-text drop-shadow-[0_0_30px_rgba(0,242,255,0.2)]">Civic Power</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-base md:text-lg max-w-2xl mb-12 font-medium leading-relaxed"
          >
            Experience the next evolution of election engagement. AI-powered precision metrics for every step of your democratic journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/auth">
              <button className="btn-primary py-4 px-10 text-sm uppercase tracking-widest font-black flex items-center gap-3">
                Deploy Roadmap <FiArrowRight className="text-lg" />
              </button>
            </Link>
            <a href="https://voters.eci.gov.in/" target="_blank" rel="noreferrer"
              className="btn-secondary py-4 px-8 text-sm uppercase tracking-widest font-black border-white/10 hover:border-primary/50 text-white">
              ECI Protocol ↗
            </a>
          </motion.div>
        </section>

        {/* ====== STATS GRID ====== */}
        <section className="relative z-10 px-5 mb-32">
          <div className="max-w-6xl mx-auto glass-card p-12 border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {STATS.map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <CountUp end={s.end} suffix={s.suffix} decimals={s.decimals || 0} />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-text-muted mt-3">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== FEATURES (BENTO GRID) ====== */}
        <section className="relative z-10 px-5 py-24 bg-white/[0.01] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Core Modules</h2>
                <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Engineered for Transparency</h3>
              </div>
              <p className="text-text-muted max-w-sm font-medium">Modular AI infrastructure designed to eliminate friction from the voting process.</p>
            </div>

            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="glass-card p-8 group border-white/5 hover:border-primary/40 transition-all duration-500"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-primary text-2xl group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                    {f.icon}
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-3 group-hover:text-primary transition-colors">{f.title}</h4>
                  <p className="text-text-secondary text-sm font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ====== INTERFACE HIGHLIGHT ====== */}
        <section className="relative z-10 px-5 py-32 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="glass-card p-2 sm:p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-white/10">
              <div className="bg-[#050505] rounded-xl overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 opacity-60" />
                <div className="aspect-video flex items-center justify-center bg-white/[0.02]">
                  <div className="text-center p-8">
                    <FiActivity className="text-6xl text-primary mb-6 mx-auto animate-pulse" />
                    <h5 className="text-2xl font-black uppercase tracking-tight mb-2">Interface Simulation</h5>
                    <p className="text-text-muted text-sm max-w-xs mx-auto">Our neural-interface allows for seamless navigation through complex legislative datasets.</p>
                  </div>
                </div>
                {/* Floating UI Elements Decor */}
                <div className="absolute top-8 left-8 w-32 h-1 bg-primary/40 rounded-full animate-shimmer" />
                <div className="absolute bottom-8 right-8 w-24 h-24 border border-white/10 rounded-full animate-spin-slow" />
              </div>
            </div>
          </div>
        </section>

        {/* ====== FINAL CALL ====== */}
        <section className="relative z-10 px-5 py-40">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="glass-card p-12 md:p-20 border-primary/20 bg-primary/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl" />
              
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
                Ready to <br /><span className="text-primary">Sync?</span>
              </h2>
              <p className="text-text-secondary text-sm md:text-base font-medium mb-12 max-w-md mx-auto">
                Join the network of informed citizens and elevate your civic contribution.
              </p>
              <Link to="/auth">
                <button className="btn-primary py-5 px-12 text-base uppercase tracking-widest font-black shadow-[0_0_50px_rgba(0,242,255,0.2)]">
                  Execute Protocol
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="relative z-10 border-t border-white/5 bg-[#080808] py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <FiZap className="text-black text-sm" />
                </div>
                <span className="text-xl font-black tracking-tighter gradient-text">CIVICPULSE AI</span>
              </div>
              <p className="text-text-muted text-sm font-medium max-w-sm leading-relaxed">
                Autonomous voter assistance engine. Empowering the largest democracy on Earth with next-generation AI infrastructure.
              </p>
            </div>
            <div>
              <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-6">Endpoints</h6>
              <ul className="space-y-4">
                <li><a href="#" className="text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">ECI Portal</a></li>
                <li><a href="#" className="text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Voter Intel</a></li>
                <li><a href="#" className="text-xs text-text-muted hover:text-primary transition-colors font-bold uppercase tracking-widest">Neural Chat</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-6">Security</h6>
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <FiShield /> Encrypted Channel
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <FiLock /> Biometric Ready
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">© 2026 CivicPulse AI // Educational Protocol 🇮🇳</p>
            <div className="flex gap-6">
              {['Twitter', 'Github', 'Discord'].map(social => (
                <a key={social} href="#" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
