import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateText, synthesizeSpeech } from '../services/api';
import {
  FiGlobe, FiCopy, FiCheck, FiVolume2, FiSend, FiRotateCcw, FiRepeat
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { LANGUAGES, QUICK_PHRASES } from '../config/constants/translator.constants';
import ErrorBoundary from '../components/common/ErrorBoundary';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function TranslatorInterface() {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  
  const textareaRef = useRef(null);
  const audioRef = useRef(new Audio());
  const blobUrlRef = useRef(null);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const selectedTarget = useMemo(() => 
    LANGUAGES.find(l => l.code === targetLang), [targetLang]
  );

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    if (sourceLang === targetLang) {
      toast.error('Languages must be different');
      return;
    }
    
    setError('');
    setIsTranslating(true);
    try {
      const { data } = await translateText(inputText.trim(), targetLang);
      if (data.success) {
        setTranslatedText(data.data);
      } else {
        throw new Error(data.error?.message || 'Translation failed');
      }
    } catch (err) {
      setError('Translation failed. Please check your connection.');
      toast.error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = useCallback(async (text, langCode) => {
    const langInfo = LANGUAGES.find(l => l.code === langCode);
    const speechCode = langInfo?.speechCode || 'en-US';

    setIsSpeaking(true);
    try {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      const res = await synthesizeSpeech(text, speechCode);
      const blob = new Blob([res.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      
      audioRef.current.src = url;
      audioRef.current.play();
      audioRef.current.onended = () => {
        setIsSpeaking(false);
      };
    } catch (err) {
      console.error('Speech synthesis failed', err);
      toast.error('Speech synthesis failed');
      setIsSpeaking(false);
    }
  }, []);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSwapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText('');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-bg-elevated flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20">
          <FiGlobe size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Civic Translator</h1>
          <p className="text-xs text-text-muted">Powered by Google Cloud AI</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 ml-1">From</p>
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map(l => (
                <button key={`src-${l.code}`} onClick={() => setSourceLang(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${sourceLang === l.code ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-bg-elevated border border-border hover:border-primary/50'}`}>
                  {l.nameEn}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSwapLangs} className="p-2.5 rounded-xl bg-bg-elevated border border-border hover:text-primary hover:border-primary transition-all shadow-sm">
            <FiRepeat size={16} />
          </button>

          <div className="flex-1 w-full">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 ml-1">To</p>
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map(l => (
                <button key={`tgt-${l.code}`} onClick={() => setTargetLang(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${targetLang === l.code ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-bg-elevated border border-border hover:border-primary/50'}`}>
                  {l.nameEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex flex-col group">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate..."
            rows={5}
            className="input-field text-sm resize-none flex-1 min-h-[120px] bg-bg-card/30"
          />
          <div className="flex justify-end mt-4">
            <button onClick={handleTranslate} disabled={!inputText.trim() || isTranslating}
              className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold ml-1">Output ({selectedTarget?.nameEn})</span>
            {translatedText && (
              <div className="flex gap-2">
                <button onClick={() => handleSpeak(translatedText, targetLang)} disabled={isSpeaking}
                  className="p-2 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-primary transition-colors">
                  <FiVolume2 size={14} className={isSpeaking ? 'animate-pulse text-primary' : ''} />
                </button>
                <button onClick={() => handleCopy(translatedText)}
                  className="p-2 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-primary transition-colors">
                  {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
                </button>
              </div>
            )}
          </div>
          <div className={`flex-1 p-4 rounded-xl text-sm font-medium leading-relaxed ${translatedText ? 'bg-bg-elevated border border-primary/10' : 'bg-bg-elevated/30 border border-dashed border-border'}`}>
            {translatedText || <span className="text-text-muted italic">Translation will appear here...</span>}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 ml-1">Quick Phrases</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_PHRASES.map(p => (
            <button key={p} onClick={() => setInputText(p)}
              className="px-3 py-2 rounded-lg bg-bg-elevated border border-border text-xs hover:border-primary hover:text-primary transition-all bg-bg-card/30">
              {p}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TranslatorPage() {
  return (
    <ErrorBoundary>
      <TranslatorInterface />
    </ErrorBoundary>
  );
}
