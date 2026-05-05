import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getQuiz, saveQuizResult } from '../services/api';
import toast from 'react-hot-toast';
import { FiBookOpen, FiAward, FiRefreshCw, FiArrowRight } from 'react-icons/fi';

export default function QuizSection() {
  const { user } = useUser();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  
  const resultsRef = useRef(null);
  const questionRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getQuiz();
        if (data.success) setQuiz(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (submitted && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [submitted]);

  useEffect(() => {
    if (started && questionRef.current) {
      questionRef.current.focus();
    }
  }, [started, currentQ]);

  const handleSelect = (qId, optionIndex) => {
    if (submitted) return;
    setSelected(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const handleSubmit = async () => {
    const answers = quiz.questions.map(q => ({
      questionId: q.id,
      selectedAnswer: selected[q.id] !== undefined ? selected[q.id] : -1,
    }));
    
    try {
      const { data } = await saveQuizResult(answers);
      if (data.success) {
        setResults(data.data);
        setSubmitted(true);
        if (data.data.percentage >= 70) {
          toast.success(`Great score! ${data.data.score}/${data.data.total} 🎉`);
        } else {
          toast('Keep learning! You can try again anytime 💪', { icon: '📚' });
        }
      }
    } catch (e) { toast.error('Failed to submit quiz'); }
  };

  const restart = () => {
    setCurrentQ(0);
    setSelected({});
    setSubmitted(false);
    setResults(null);
    setStarted(false);
  };

  if (loading) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Loading Quiz">
        <h2 className="section-title"><FiBookOpen className="text-primary" aria-hidden="true" /> Learn & Quiz</h2>
        <div className="loading-shimmer h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6" role="region" aria-label="Learning Quiz Section">
      <h2 className="section-title"><FiBookOpen className="text-primary" aria-hidden="true" /> Learn & Quiz</h2>

      {!started ? (
        /* Start Screen */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
          <span className="text-5xl block mb-3" role="img" aria-label="Brain">🧠</span>
          <h3 className="text-xl font-bold mb-2">Test Your Election Knowledge</h3>
          <p className="text-text-secondary text-sm mb-4">
            {quiz?.questions?.length || 10} questions about India's electoral process.<br />
            Score 70%+ to boost your readiness score!
          </p>
          <motion.button 
            onClick={() => setStarted(true)} 
            className="btn-primary"
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }}
            aria-label="Start Quiz Now">
            Start Quiz <FiBookOpen className="inline ml-1" aria-hidden="true" />
          </motion.button>
        </motion.div>
      ) : submitted && results ? (
        /* Results Screen */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          ref={resultsRef}
          tabIndex="-1"
          className="text-center py-4 outline-none">
          <span className="text-5xl block mb-3" role="img" aria-label={results.percentage >= 70 ? 'Trophy' : 'Books'}>
            {results.percentage >= 70 ? '🏆' : '📚'}
          </span>
          <h3 className="text-2xl font-bold mb-1" aria-label={`Score: ${results.score} out of ${results.total}`}>
            {results.score}/{results.total}
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            {results.percentage}% — {results.percentage >= 70 ? 'Excellent! You know your rights!' : 'Keep learning about the voting process!'}
            {results.readinessBonus && (
              <span className="block text-secondary text-xs mt-1">+10 Readiness Score bonus! 🎉</span>
            )}
          </p>

          {/* Answer review */}
          <div className="text-left space-y-2 max-h-60 overflow-y-auto mb-4 custom-scrollbar" role="list" aria-label="Question Review">
            {quiz.questions.map((q, i) => {
              const r = results.results.find(r => r.questionId === q.id);
              return (
                <div key={q.id} role="listitem" className={`p-3 rounded-xl text-xs ${r?.correct ? 'bg-secondary/5 border border-secondary/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                  <p className="font-medium text-text-primary mb-1">
                    <span role="img" aria-label={r?.correct ? 'Correct' : 'Incorrect'}>{r?.correct ? '✅' : '❌'}</span> {q.question}
                  </p>
                  <p className="text-text-muted">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <motion.button onClick={restart} className="btn-secondary"
            whileHover={{ scale: 1.03 }}
            aria-label="Retake Quiz">
            <FiRefreshCw className="inline mr-1" aria-hidden="true" /> Try Again
          </motion.button>
        </motion.div>
      ) : (
        /* Quiz Questions */
        <AnimatePresence mode="wait">
          <motion.div key={currentQ}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            ref={questionRef}
            tabIndex="-1"
            className="outline-none">

            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted">
                Question {currentQ + 1} of {quiz.questions.length}
              </span>
              <div className="flex gap-1" aria-hidden="true">
                {quiz.questions.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentQ ? 'bg-primary' : i < currentQ || selected[quiz.questions[i].id] !== undefined ? 'bg-primary/40' : 'bg-border'
                  }`} />
                ))}
              </div>
            </div>

            {/* Question */}
            <h3 id={`q-${currentQ}`} className="text-base font-semibold mb-4">
              {quiz.questions[currentQ].question}
            </h3>

            {/* Options */}
            <div className="space-y-2 mb-4" role="radiogroup" aria-labelledby={`q-${currentQ}`}>
              {quiz.questions[currentQ].options.map((opt, i) => (
                <motion.button key={i}
                  role="radio"
                  aria-checked={selected[quiz.questions[currentQ].id] === i}
                  onClick={() => handleSelect(quiz.questions[currentQ].id, i)}
                  whileTap={{ scale: 0.98 }}
                  className={`quiz-option w-full text-left text-sm flex items-center gap-3 ${
                    selected[quiz.questions[currentQ].id] === i ? 'selected' : ''
                  }`}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-[10px] font-bold transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                aria-label="Previous Question"
                className="btn-secondary text-sm px-4 py-2 disabled:opacity-30">
                Previous
              </button>
              {currentQ < quiz.questions.length - 1 ? (
                <button onClick={() => setCurrentQ(currentQ + 1)}
                  aria-label="Next Question"
                  className="btn-primary text-sm px-4 py-2">
                  Next <FiArrowRight className="inline ml-1" aria-hidden="true" />
                </button>
              ) : (
                <button onClick={handleSubmit}
                  className="btn-primary text-sm px-6 py-2"
                  disabled={Object.keys(selected).length < quiz.questions.length}
                  aria-label="Submit Quiz Result">
                  Submit Quiz <FiAward className="inline ml-1" aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
