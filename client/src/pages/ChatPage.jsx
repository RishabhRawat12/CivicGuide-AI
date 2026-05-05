import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { useUser } from '../context/UserContext';
import { sendChatMessage, getChatHistory } from '../services/api';
import {
  FiSend, FiVolume2, FiVolumeX, FiZap, FiBookOpen, FiRefreshCcw
} from 'react-icons/fi';
import { trackChatMessage } from '../utils/analytics';
import ErrorBoundary from '../components/common/ErrorBoundary';

const QUICK_QUESTIONS = [
  { label: 'How to register?', q: 'How do I register as a voter in India?' },
  { label: 'What is EVM?', q: 'What is an Electronic Voting Machine (EVM) and how does it work?' },
  { label: 'Documents needed?', q: 'What documents do I need to carry on voting day?' },
  { label: 'Helpline?', q: 'What is the voter helpline number?' },
];

/**
 * Markdown component mapping to match premium CSS tokens
 */
const MarkdownComponents = {
  h2: ({ children }) => <h2 className="chat-heading">{children}</h2>,
  h3: ({ children }) => <h3 className="chat-subheading">{children}</h3>,
  ul: ({ children }) => <div className="chat-bullet-group">{children}</div>,
  li: ({ children }) => (
    <div className="chat-bullet-item">
      <span className="chat-bullet-dot">•</span>
      <span>{children}</span>
    </div>
  ),
  ol: ({ children }) => <div className="space-y-2 my-2">{children}</div>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="chat-link">
      {children}
    </a>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
};

function ChatInterface() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [sessionId] = useState(`sess_${Math.random().toString(36).substring(7)}`);
  
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const setInitialMessage = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: `🙏 **Namaste ${user?.name || 'Voter'}!** I am your **CivicGuide AI** assistant. How can I help you prepare for the elections today?`,
    }]);
  }, [user?.name]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getChatHistory();
        if (data.success && data.data.length > 0) {
          setMessages(data.data);
        } else {
          setInitialMessage();
        }
      } catch (err) {
        setInitialMessage();
      }
    };
    if (user) load();
  }, [user, setInitialMessage]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = async (overrideMsg) => {
    const msgText = overrideMsg || input.trim();
    if (!msgText || sending) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setSending(true);

    try {
      const { data } = await sendChatMessage(msgText, sessionId);
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.data.reply,
          sentiment: data.data.sentiment 
        }]);
        trackChatMessage(data.data.provider || 'gemini');
      } else {
        throw new Error(data.error?.message || 'Failed to get response');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Would you like to try again?',
        isError: true,
        lastMsg: msgText
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const retryLast = (msg) => {
    setMessages(prev => prev.slice(0, -1)); // Remove the error message
    handleSend(msg);
  };

  const memoizedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="h-full flex flex-col" role="main">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Civic Assistant</h1>
          <p className="text-xs text-text-muted">Powered by Official ECI Data</p>
        </div>
        <button onClick={() => setVoiceOn(!voiceOn)}
          className={`p-2 rounded-lg border transition-all ${voiceOn ? 'bg-primary/20 border-primary text-primary' : 'bg-bg-elevated border-border text-text-muted'}`}>
          {voiceOn ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 min-h-0">
        <div className="flex flex-col glass-card overflow-hidden">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {memoizedMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-bg-elevated text-text-primary border border-border rounded-tl-none'
                }`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {DOMPurify.sanitize(msg.content)}
                      </ReactMarkdown>
                      {msg.isError && (
                        <button 
                          onClick={() => retryLast(msg.lastMsg)}
                          className="mt-3 flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                        >
                          <FiRefreshCcw size={12} /> Retry Response
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-bg-elevated p-3 rounded-2xl rounded-tl-none border border-border">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-bg-card/50">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about elections..."
                className="input-field flex-1" />
              <button onClick={() => handleSend()} disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex flex-col gap-4">
          <div className="glass-card-static p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <FiZap className="text-primary" /> Suggestions
            </h3>
            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => handleSend(q.q)}
                  className="w-full text-left text-xs p-2 rounded-lg border border-border hover:border-primary transition-all text-text-secondary hover:text-primary bg-bg-card/30">
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card-static p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <FiBookOpen className="text-secondary" /> Facts
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Voter Age</span>
                <span className="font-bold">18+</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">ECI Helpline</span>
                <span className="font-bold">1950</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatInterface />
    </ErrorBoundary>
  );
}
