import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, GraduationCap, HelpCircle, Lightbulb, BookOpen,
  Minimize2, Maximize2, Compass, Target, TrendingUp, Bot
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import {
  respond, contextualTip, walkthrough, levelFromMastery, HINT_LEVELS,
} from '../../utils/tutorEngine';

const TEACH_MODES = [
  { id: 'teach', label: 'Teach Me', icon: <GraduationCap size={13} /> },
  { id: 'explain', label: 'Explain This', icon: <BookOpen size={13} /> },
  { id: 'why', label: 'Why?', icon: <HelpCircle size={13} /> },
  { id: 'example', label: 'Show Example', icon: <Lightbulb size={13} /> },
  { id: 'simplify', label: 'Simplify', icon: <Minimize2 size={13} /> },
  { id: 'deeper', label: 'Go Deeper', icon: <Maximize2 size={13} /> },
];

const instrumentLabel = {
  oscilloscope: 'Oscilloscope', 'function-generator': 'Function Generator',
  multimeter: 'Multimeter', voltmeter: 'Voltmeter',
  'spectrum-analyzer': 'Spectrum Analyzer', 'power-supply': 'Power Supply',
};

let msgId = 0;

const AITutor = ({ bench, activeInstrument, event = null }) => {
  const overallMastery = useAppStore((s) => s.overallMastery);
  const onboarding = useAppStore((s) => s.onboarding);
  const level = levelFromMastery(overallMastery);
  const currentModule = onboarding?.startingModule || 'Signal Behavior';

  const context = {
    level,
    activeInstrument,
    bench,
    currentModule,
  };

  const [messages, setMessages] = useState([
    {
      id: ++msgId,
      from: 'tutor',
      text: `Hi! I'm your lab tutor 👋 I can see you're at the ${instrumentLabel[activeInstrument] || 'workbench'}. Ask me anything, or tap a mode below. I'll match my explanations to your level (${level}).`,
    },
  ]);
  const [input, setInput] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [tip, setTip] = useState(null);
  const scrollRef = useRef(null);

  const push = (from, text) => setMessages((m) => [...m, { id: ++msgId, from, text }]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Adaptive intervention: surface a proactive tip when the bench context warrants it.
  useEffect(() => {
    const t = contextualTip(context);
    setTip(t);
    setHintIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstrument]);

  // Reactive coaching: when the bench changes, the tutor comments (cause→effect).
  useEffect(() => {
    if (event?.text) push('tutor', event.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const handleMode = (mode) => {
    push('student', TEACH_MODES.find((m) => m.id === mode).label + ` · ${instrumentLabel[activeInstrument] || ''}`);
    setTimeout(() => push('tutor', respond({ mode, context })), 250);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    push('student', text);
    setInput('');
    setTimeout(() => push('tutor', respond({ text, context })), 280);
  };

  const handleWalkthrough = () => {
    push('student', 'Guide me through this experiment.');
    const steps = walkthrough(activeInstrument);
    const text = `Let's do it step by step:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    setTimeout(() => push('tutor', text), 280);
  };

  const handleHint = () => {
    const idx = Math.min(hintIndex, HINT_LEVELS.length - 1);
    push('tutor', `💡 Hint ${idx + 1}/${HINT_LEVELS.length}: ${HINT_LEVELS[idx]}`);
    setHintIndex((i) => Math.min(i + 1, HINT_LEVELS.length - 1));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-surface-100 flex items-center gap-3 bg-gradient-to-r from-moss-50 to-white">
        <div className="relative">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-moss-500 to-moss-700 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <motion.span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-500 border-2 border-white"
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-surface-800 text-sm flex items-center gap-1.5">Lab Tutor <Sparkles size={12} className="text-moss-500" /></p>
          <p className="text-xs text-surface-400 capitalize">{level} mode · {instrumentLabel[activeInstrument] || 'Workbench'}</p>
        </div>
      </div>

      {/* Learning Path Coach */}
      <div className="px-4 py-3 border-b border-surface-100 bg-surface-50/60">
        <div className="flex items-center gap-2 mb-2">
          <Compass size={13} className="text-moss-600" />
          <span className="text-xs font-bold text-surface-600 uppercase tracking-wide">Your Path</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-xl p-2 border border-surface-100">
            <TrendingUp size={13} className="text-moss-600 mx-auto mb-0.5" />
            <p className="text-sm font-black text-surface-800">{overallMastery}%</p>
            <p className="text-[10px] text-surface-400">Mastery</p>
          </div>
          <div className="bg-white rounded-xl p-2 border border-surface-100">
            <BookOpen size={13} className="text-primary-500 mx-auto mb-0.5" />
            <p className="text-[11px] font-bold text-surface-700 leading-tight truncate">{currentModule}</p>
            <p className="text-[10px] text-surface-400">Module</p>
          </div>
          <div className="bg-white rounded-xl p-2 border border-surface-100">
            <Target size={13} className="text-amber-500 mx-auto mb-0.5" />
            <p className="text-[11px] font-bold text-surface-700 leading-tight">Triggering</p>
            <p className="text-[10px] text-surface-400">Review</p>
          </div>
        </div>
      </div>

      {/* Proactive intervention tip */}
      <AnimatePresence>
        {tip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-snug">{tip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar" style={{ minHeight: 180 }}>
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.from === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
              m.from === 'student' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-surface-100 text-surface-700 rounded-bl-sm'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="px-3 pt-2 border-t border-surface-100">
        <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={handleWalkthrough} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-moss-100 text-moss-700 hover:bg-moss-200 transition-colors">
            <Compass size={12} /> Guide me
          </button>
          <button onClick={handleHint} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
            <Lightbulb size={12} /> Hint
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {TEACH_MODES.map((m) => (
            <button key={m.id} onClick={() => handleMode(m.id)}
              className="flex items-center justify-center gap-1 text-[11px] font-semibold px-1.5 py-1.5 rounded-lg bg-surface-50 text-surface-600 hover:bg-primary-50 hover:text-primary-700 transition-colors">
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-surface-100">
        <div className="flex items-center gap-2 bg-surface-50 rounded-2xl px-3 py-1.5 border border-surface-200 focus-within:border-moss-300 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the tutor anything…"
            className="flex-1 bg-transparent text-sm outline-none text-surface-700 placeholder-surface-400 py-1.5"
          />
          <button onClick={handleSend} disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-moss-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-moss-700 transition-colors flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
