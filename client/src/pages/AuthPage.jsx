import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { authLogin } from '../services/api';
import toast from 'react-hot-toast';
import { trackLogin } from '../utils/analytics';
import {
  FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiShield, FiZap
} from 'react-icons/fi';

export default function AuthPage() {
  const navigate = useNavigate();
  const { loginUser, user: currentUser } = useUser();
  const [mode, setMode] = useState('login'); // login | register
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const handleBackendAuth = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await authLogin(idToken);
    
    if (res.data.success) {
      const user = res.data.data;
      loginUser(user, idToken); 
      return user;
    }
    throw new Error('Backend verification failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured.');
      return;
    }
    
    setLoading(true);
    try {
      let userCredential;
      if (mode === 'register') {
        if (!form.name || !form.email || !form.password) {
          toast.error('Please fill in all fields.');
          setLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(userCredential.user, { displayName: form.name });
        toast.success('Neural identity verified! 🎉');
      } else {
        if (!form.email || !form.password) {
          toast.error('Please fill in email and password.');
          setLoading(false);
          return;
        }
        userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Welcome back to the matrix! 🗳️');
      }

      const user = await handleBackendAuth(userCredential.user);
      trackLogin(mode === 'register' ? 'email_register' : 'email_login');
      navigate(user.profileCompleted ? '/dashboard' : '/setup');
    } catch (err) {
      console.error('Auth Error:', err);
      const msg = typeof err.response?.data?.error === 'string'
        ? err.response.data.error
        : (typeof err.message === 'string' ? err.message : 'Authentication failed.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      toast.error('Google Sign-In is not configured.');
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = await handleBackendAuth(result.user);
      toast.success(`Access Granted, ${user.name}! 🎉`);
      trackLogin('google');
      navigate(user.profileCompleted ? '/dashboard' : '/setup');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in popup was closed.');
      } else {
        const msg = typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : (typeof err.message === 'string' ? err.message : 'Google sign-in failed.');
        toast.error(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex items-center justify-center px-4 py-8" role="main" id="main-content">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(0,242,255,0.4)]" role="img" aria-label="CivicPulse Logo">
            <FiZap className="text-black text-2xl" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter gradient-text uppercase">CivicPulse Terminal</h1>
          <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">Secure Access Protocol // V2.6</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card bg-white/[0.02] border-white/5 shadow-2xl">
          <div className="p-8">
            {/* Tab Switcher */}
            <div className="flex rounded-full bg-white/[0.03] border border-white/5 p-1.5 mb-8" role="tablist" aria-label="Authentication mode">
              {['login', 'register'].map((tab) => (
                <button 
                  key={tab} 
                  id={`tab-${tab}`}
                  role="tab"
                  aria-selected={mode === tab}
                  aria-controls="auth-panel"
                  onClick={() => setMode(tab)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300 ${mode === tab
                      ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                      : 'text-text-muted hover:text-text-primary'
                    }`}>
                  {tab === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {/* Google Sign-In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || !isFirebaseConfigured}
              whileHover={{ scale: isFirebaseConfigured ? 1.02 : 1 }}
              whileTap={{ scale: isFirebaseConfigured ? 0.98 : 1 }}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest mb-6 ${isFirebaseConfigured
                  ? 'bg-white/[0.03] border-white/10 hover:border-primary/40 text-text-primary'
                  : 'bg-white/[0.01] border-white/5 text-text-muted cursor-not-allowed'
                }`}
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {googleLoading ? 'Decrypting...' : mode === 'login' ? 'Sync via Google' : 'Register via Google'}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6" aria-hidden="true">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-text-muted text-[8px] font-black uppercase tracking-[0.3em]">Identity Hub</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Email/Password Form */}
            <div id="auth-panel" role="tabpanel" aria-labelledby={`tab-${mode}`}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div key="name-field"
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}>
                      <label htmlFor="auth-name" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                         Display Name
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                        <input 
                          id="auth-name" 
                          type="text" 
                          className="input-field pl-11 bg-white/[0.03] border-white/10 rounded-full" 
                          placeholder="Your identity"
                          value={form.name} 
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="auth-email" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                    Email Stream
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input 
                      id="auth-email" 
                      type="email" 
                      className="input-field pl-11 bg-white/[0.03] border-white/10 rounded-full" 
                      placeholder="user@network.com"
                      value={form.email} 
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                    Access Key
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input 
                      id="auth-password" 
                      type={showPw ? 'text' : 'password'} 
                      className="input-field pl-11 pr-12 bg-white/[0.03] border-white/10 rounded-full"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                    >
                      {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 mt-4 uppercase tracking-[0.2em] font-black text-[11px]"
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {mode === 'login' ? 'Execute Login' : 'Create Profile'} <FiArrowRight size={14} />
                    </span>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-text-muted text-[10px] uppercase tracking-widest font-bold">
          <FiShield size={12} className="text-primary" />
          <span>Biometric Protection Active</span>
        </div>
      </motion.div>
    </div>
  );
}
