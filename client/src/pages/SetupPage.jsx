import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { authUpdateProfile } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowRight, FiMapPin, FiUser, FiZap } from 'react-icons/fi';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry', 'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep',
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, loginUser } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    age: '', state: '', voterStatus: 'unknown',
    hasVoterId: false, isFirstTimeVoter: false, pincode: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.age || !formData.state) {
      toast.error('Please fill in age and state.');
      return;
    }
    if (parseInt(formData.age) < 17) {
      toast.error('You must be at least 17 years old.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        isFirstTimeVoter: formData.isFirstTimeVoter || parseInt(formData.age) <= 21,
      };
      const { data } = await authUpdateProfile(payload);
      if (data.success) {
        loginUser(data.data.user, data.data.token, data.data.checklist);
        toast.success('Neural profile synchronized! 🎉');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sync profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex items-center justify-center px-4 py-8" role="main" id="main-content">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg">

        <div className="glass-card bg-white/[0.02] border-white/5 shadow-2xl">
          <div className="p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                <FiUser className="text-black text-2xl" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase gradient-text">Identity Sync</h1>
              <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">
                Initializing Onboarding Protocol for {user?.name?.split(' ')[0]}
              </p>
            </div>

            {/* Signed-in badge */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-8">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border border-primary/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-sm font-black text-primary shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-tight text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-text-muted truncate font-bold">{user?.email}</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary text-black flex-shrink-0">
                Verified
              </span>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="setup-age" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                    Chronological Age
                  </label>
                  <input id="setup-age" type="number" className="input-field bg-white/[0.03] border-white/10 rounded-full" placeholder="18+" min="17" max="120"
                    value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} 
                    required />
                </div>
                <div>
                  <label htmlFor="setup-pincode" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                     Area Code
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input id="setup-pincode" type="text" className="input-field pl-11 bg-white/[0.03] border-white/10 rounded-full" placeholder="400001"
                      value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} 
                      inputMode="numeric" pattern="[0-9]{6}" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="setup-state" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                  Regional Jurisdiction
                </label>
                <select id="setup-state" className="input-field bg-white/[0.03] border-white/10 rounded-full" required
                  value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}>
                  <option value="" className="bg-[#0A0A0C]">Select Territory</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s} className="bg-[#0A0A0C]">{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="setup-voter-status" className="block text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black">
                  Registration Status
                </label>
                <select id="setup-voter-status" className="input-field bg-white/[0.03] border-white/10 rounded-full"
                  value={formData.voterStatus} onChange={e => setFormData({ ...formData, voterStatus: e.target.value })}>
                  <option value="unknown" className="bg-[#0A0A0C]">Status Unknown</option>
                  <option value="not_registered" className="bg-[#0A0A0C]">Not Registered</option>
                  <option value="applied" className="bg-[#0A0A0C]">Sync in Progress</option>
                  <option value="registered" className="bg-[#0A0A0C]">Fully Authorized ✓</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 group">
                  <input id="setup-has-voter-id" type="checkbox" className="w-5 h-5 accent-primary rounded-lg cursor-pointer bg-white/5 border-white/10"
                    checked={formData.hasVoterId}
                    onChange={e => setFormData({ ...formData, hasVoterId: e.target.checked })} />
                  <label htmlFor="setup-has-voter-id" className="text-[10px] font-black uppercase tracking-widest text-text-muted cursor-pointer group-hover:text-text-primary transition-colors">
                    I possess a Neural ID (EPIC) Card
                  </label>
                </div>
                <div className="flex items-center gap-3 group">
                  <input id="setup-is-first-time" type="checkbox" className="w-5 h-5 accent-primary rounded-lg cursor-pointer bg-white/5 border-white/10"
                    checked={formData.isFirstTimeVoter}
                    onChange={e => setFormData({ ...formData, isFirstTimeVoter: e.target.checked })} />
                  <label htmlFor="setup-is-first-time" className="text-[10px] font-black uppercase tracking-widest text-text-muted cursor-pointer group-hover:text-text-primary transition-colors">
                    Initial Voting Protocol (First-time)
                  </label>
                </div>
              </div>

              <motion.button type="submit" disabled={submitting}
                className="btn-primary w-full py-4 mt-4 uppercase tracking-[0.2em] font-black text-[11px]"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden="true" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Initialize Journey <FiArrowRight size={14} />
                  </span>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
