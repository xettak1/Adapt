import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Zap, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import useAppStore from '../../store/useAppStore';
import { mockLesson } from '../../data/mockLesson';

/* ---- Interactive trigger mini-demo for the "interaction" card ---- */
const TriggerInteraction = ({ onSolved }) => {
  const [level, setLevel] = useState(20);
  const stable = level >= 40 && level <= 60;
  const W = 320, H = 140;
  const points = Array.from({ length: 80 }, (_, i) => {
    const x = (i / 79) * W;
    const phase = stable ? 0 : (Date.now() / 200);
    const y = H / 2 - Math.sin((i / 79) * Math.PI * 4 + phase) * 38;
    return `${x},${y}`;
  }).join(' ');
  const triggerY = H - (level / 100) * H;

  return (
    <div>
      <div className="rounded-2xl bg-[#0c1410] p-4 lab-screen mb-4">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <motion.polyline
            points={points}
            fill="none"
            stroke={stable ? '#4CAF50' : '#5F8D4E'}
            strokeWidth="2"
            animate={stable ? {} : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.4, repeat: stable ? 0 : Infinity }}
          />
          {/* trigger line */}
          <line x1="0" y1={triggerY} x2={W} y2={triggerY} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={W - 4} y={triggerY - 4} fill="#fbbf24" fontSize="10" textAnchor="end">trigger</text>
        </svg>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={level}
        onChange={(e) => {
          const v = Number(e.target.value);
          setLevel(v);
          if (v >= 40 && v <= 60) onSolved();
        }}
        className="w-full accent-moss-600"
      />
      <p className={`text-center text-sm font-semibold mt-3 ${stable ? 'text-success-600' : 'text-surface-400'}`}>
        {stable ? '✓ Waveform locked! Trigger is in the stable band.' : 'Drag the trigger into the middle of the signal…'}
      </p>
    </div>
  );
};

const LessonPage = () => {
  const navigate = useNavigate();
  const addXP = useAppStore((s) => s.addXP);
  const addNotification = useAppStore((s) => s.addNotification);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answer, setAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [interactionSolved, setInteractionSolved] = useState(false);

  const cards = mockLesson.cards;
  const card = cards[index];
  const isLast = index === cards.length - 1;
  const progress = ((index + 1) / cards.length) * 100;

  const goNext = () => {
    if (isLast) {
      finishLesson();
      return;
    }
    setDirection(1);
    setAnswer(null);
    setRevealed(false);
    setInteractionSolved(false);
    setIndex((i) => i + 1);
  };

  const finishLesson = () => {
    addXP(mockLesson.xpReward);
    addNotification({ type: 'success', title: 'Lesson complete!', message: `+${mockLesson.xpReward} XP earned` });
    navigate('/student/learn');
  };

  const handleReward = () => {
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
  };

  // Can the user advance from the current card?
  const canAdvance = () => {
    if (card.type === 'question') return revealed;
    if (card.type === 'interaction') return interactionSolved;
    return true;
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 320 : -320, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -320 : 320, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Top bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/student/learn')}
          className="p-2 rounded-xl hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex-1 progress-bar h-2.5">
          <motion.div
            className="progress-fill bg-gradient-to-r from-primary-500 to-moss-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-xs font-bold text-surface-400 w-10 text-right">{index + 1}/{cards.length}</span>
      </header>

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
        <div className="w-full max-w-lg relative" style={{ minHeight: 440 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              onAnimationComplete={() => card.type === 'reward' && handleReward()}
              className="card p-7 sm:p-9"
            >
              {/* Kicker */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{card.kicker}</span>
              </div>

              {/* Content by type */}
              {['insight', 'scenario', 'concept', 'history', 'funfact', 'reflection'].includes(card.type) && (
                <>
                  <h2 className="text-2xl font-black text-surface-900 mb-4 leading-snug">{card.title}</h2>
                  <p className="text-surface-500 leading-relaxed text-[15px]">{card.body}</p>
                </>
              )}

              {card.type === 'question' && (
                <>
                  <h2 className="text-xl font-bold text-surface-900 mb-6 leading-snug">{card.title}</h2>
                  <div className="space-y-2.5">
                    {card.options.map((opt) => {
                      const isCorrect = revealed && opt.id === card.correct;
                      const isWrong = revealed && answer === opt.id && opt.id !== card.correct;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !revealed && setAnswer(opt.id)}
                          disabled={revealed}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                            isCorrect ? 'border-success-400 bg-success-50' :
                            isWrong ? 'border-danger-400 bg-danger-50' :
                            answer === opt.id ? 'border-primary-500 bg-primary-50' :
                            'border-surface-200 bg-white hover:border-primary-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            isCorrect ? 'border-success-500 bg-success-500 text-white' :
                            isWrong ? 'border-danger-500 bg-danger-500 text-white' :
                            answer === opt.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-300 text-surface-400'
                          }`}>
                            {isCorrect ? <Check size={12} /> : opt.id.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-surface-700">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {revealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`mt-4 p-3 rounded-xl text-sm ${answer === card.correct ? 'bg-success-50 text-success-700' : 'bg-amber-50 text-amber-700'}`}
                      >
                        {answer === card.correct ? '✓ Correct! ' : '💡 '}{card.explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {card.type === 'interaction' && (
                <>
                  <h2 className="text-xl font-bold text-surface-900 mb-2 leading-snug">{card.title}</h2>
                  <p className="text-surface-500 text-sm mb-5">{card.body}</p>
                  <TriggerInteraction onSolved={() => setInteractionSolved(true)} />
                </>
              )}

              {card.type === 'reward' && (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    className="text-7xl mb-4"
                  >
                    {card.emoji}
                  </motion.div>
                  <h2 className="text-2xl font-black text-surface-900 mb-2">{card.title}</h2>
                  <p className="text-surface-500 mb-5">{card.body}</p>
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 font-bold px-5 py-2.5 rounded-full">
                    <Zap size={16} className="fill-current" /> +{mockLesson.xpReward} XP
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {card.type === 'question' && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            disabled={answer === null}
            className="w-full btn-primary py-3.5 disabled:opacity-40"
          >
            Check Answer
          </button>
        ) : (
          <motion.button
            onClick={goNext}
            disabled={!canAdvance()}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
              isLast ? 'bg-success-600 hover:bg-success-700 text-white' : 'btn-primary'
            }`}
          >
            {isLast ? <>Finish Lesson <Check size={18} /></> : <>Continue <ArrowRight size={18} /></>}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default LessonPage;
