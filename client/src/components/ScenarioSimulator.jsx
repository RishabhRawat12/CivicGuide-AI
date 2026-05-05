import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getScenarios, simulateScenario } from '../services/api';
import {
  FiArrowLeft, FiExternalLink, FiFileText,
  FiClock, FiPhone, FiCheckCircle, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

export default function ScenarioSimulator() {
  const { user } = useUser();
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getScenarios();
        if (data.success) {
          // Backend returns Map-style object, convert to array for rendering
          const scenarioArray = Object.keys(data.data).map(key => ({
            id: key,
            ...data.data[key]
          }));
          setScenarios(scenarioArray);
        }
      } catch (e) {
        console.error('Scenario List Fetch Error:', e);
      }
      setFetchingList(false);
    };
    fetch();
  }, []);

  const simulate = async (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    setLoading(true);
    try {
      const { data } = await simulateScenario(scenarioId);
      if (data.success) setResult(data.data);
    } catch (e) {
      console.error('Simulation Error:', e);
    }
    setLoading(false);
  };

  const reset = () => { 
    setSelectedScenarioId(null); 
    setResult(null); 
  };

  const selectedMeta = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <AnimatePresence mode="wait">
      {!selectedScenarioId ? (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
              <span className="text-sm">🎭</span> Electoral Scenarios
            </h2>
            <p className="text-xs text-text-muted mb-5">Select a situation to explore guidelines and solutions</p>

            {fetchingList ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="loading-shimmer h-28 rounded-xl" />)}
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scenarios.map((s) => (
                  <motion.button key={s.id} variants={fadeUp}
                    onClick={() => simulate(s.id)}
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-xl bg-bg-elevated border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 text-left transition-all group">
                    <span className="text-2xl block mb-2">{s.icon}</span>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start Simulation <FiChevronRight size={10} />
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          className="space-y-4">
          
          <button onClick={reset}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-medium">
            <FiArrowLeft size={14} /> Back to Scenarios
          </button>

          {loading ? (
            <div className="glass-card p-6 space-y-3">
              <div className="loading-shimmer h-16 rounded-xl" />
              {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-20 rounded-xl" />)}
            </div>
          ) : result && (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border-primary/20">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{selectedMeta?.icon || '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text-primary">{result.title}</h2>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{result.description}</p>
                  </div>
                </div>
              </motion.div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                  <FiCheckCircle size={14} className="text-secondary" /> Step-by-Step Resolution
                </h3>

                <motion.div variants={container} initial="hidden" animate="show"
                  className="relative space-y-0">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border rounded-full" />

                  {result.steps?.map((step, i) => (
                    <motion.div key={i} variants={fadeUp}
                      className="relative flex gap-4 pb-5 last:pb-0">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center border border-border shadow-sm">
                          <span className="text-xs font-bold text-primary">{step.number || i + 1}</span>
                        </div>
                      </div>

                      <div className="flex-1 bg-bg-elevated border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
                        <h4 className="text-sm font-semibold text-text-primary">{step.action}</h4>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">{step.details}</p>
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-[10px] text-primary hover:underline font-medium">
                            <FiExternalLink size={11} /> Official Portal ↗
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.documentsNeeded?.length > 0 && (
                  <motion.div variants={fadeUp} className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FiFileText size={14} className="text-amber-400" />
                      <p className="text-xs font-bold text-text-primary">Docs Needed</p>
                    </div>
                    <ul className="space-y-1">
                      {result.documentsNeeded.map((d, i) => (
                        <li key={i} className="text-[10px] text-text-secondary flex items-start gap-2">
                          <span className="text-amber-400">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <motion.div variants={fadeUp} className="glass-card p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock size={14} className="text-blue-400" />
                    <p className="text-xs font-bold text-text-primary">Estimated Time</p>
                  </div>
                  <p className="text-sm font-bold text-blue-400">{result.estimatedTime || 'N/A'}</p>
                </motion.div>
              </motion.div>

              {result.nextAction && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 border-secondary/20 bg-secondary/5">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle size={16} className="text-secondary mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Recommended Action</p>
                      <p className="text-sm text-text-primary font-medium">{result.nextAction}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-center pt-2">
                <button onClick={reset}
                  className="px-6 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-medium hover:border-primary transition-all">
                  Try Another Scenario
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
