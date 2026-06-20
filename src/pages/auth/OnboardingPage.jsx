import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import useAppStore from '../../store/useAppStore';
import {
  experienceOptions, goalOptions, diagnosticQuestions, determinePlacement,
} from '../../data/mockOnboarding';
import onboardingService from '../../services/onboardingService';

const TOTAL_STEPS = 4; // experience, goals, diagnostic, placement

const ProgressBar = ({ step }) => (
  <div className="flex items-center gap-2 mb-10">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div key={i} className="flex-1 h-1.5 rounded-full bg-surface-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-moss-600"
          initial={{ width: 0 }}
          animate={{ width: i <= step ? '100%' : '0%' }}
          transition={{ duration: 0.4 }}
        />
      </div>
    ))}
  </div>
);

/* ---------- Sortable item for order questions ---------- */
const SortableBlock = ({ item, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 bg-white ${isDragging ? 'opacity-60 border-primary-400' : 'border-surface-200'}`}
    >
      <span className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-black text-surface-400">{index + 1}</span>
      <span className="flex-1 text-sm font-medium text-surface-700">{item.text}</span>
      <button {...attributes} {...listeners} className="p-1 text-surface-300 cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </button>
    </div>
  );
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const addNotification = useAppStore((s) => s.addNotification);

  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState(null);
  const [goals, setGoals] = useState([]);

  // Adaptive diagnostic engine
  const [diagIndex, setDiagIndex] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [diagAnswers, setDiagAnswers] = useState([]);
  const [servedQuestions, setServedQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [orderBlocks, setOrderBlocks] = useState([]);
  const DIAG_LENGTH = 5;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const pickQuestion = (difficulty) => {
    const pool = diagnosticQuestions[difficulty] || diagnosticQuestions.medium;
    const unused = pool.filter((q) => !servedQuestions.includes(q.id));
    const q = (unused.length ? unused : pool)[0];
    return q;
  };

  const startDiagnostic = () => {
    const q = pickQuestion('medium');
    setCurrentQuestion(q);
    setServedQuestions([q.id]);
    if (q.type === 'order') setOrderBlocks([...q.blocks].sort(() => Math.random() - 0.5));
    setStep(2);
  };

  const submitDiagnosticAnswer = () => {
    let correct = false;
    if (currentQuestion.type === 'order') {
      correct = orderBlocks.every((b, i) => currentQuestion.correctOrder[i] === b.id);
    } else {
      correct = selectedAnswer === currentQuestion.correct;
    }

    const newAnswers = [...diagAnswers, { id: currentQuestion.id, correct, concept: currentQuestion.concept }];
    setDiagAnswers(newAnswers);

    const nextIndex = diagIndex + 1;
    if (nextIndex >= DIAG_LENGTH) {
      finishDiagnostic(newAnswers);
      return;
    }

    // Adapt difficulty
    let nextDiff = currentDifficulty;
    if (correct) nextDiff = currentDifficulty === 'easy' ? 'medium' : 'hard';
    else nextDiff = currentDifficulty === 'hard' ? 'medium' : 'easy';

    const q = pickQuestion(nextDiff);
    setCurrentDifficulty(nextDiff);
    setCurrentQuestion(q);
    setServedQuestions((prev) => [...prev, q.id]);
    if (q.type === 'order') setOrderBlocks([...q.blocks].sort(() => Math.random() - 0.5));
    setSelectedAnswer(null);
    setDiagIndex(nextIndex);
  };

  const [placement, setPlacement] = useState(null);

  const revealPlacement = (track, score) => {
    setPlacement({ track, score });
    setStep(3);
    setTimeout(() => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
    }, 500);
  };

  const finishDiagnostic = (answers) => {
    const score = Math.round((answers.filter((a) => a.correct).length / answers.length) * 100);
    const expLevel = experienceOptions.find((e) => e.id === experience)?.level ?? 0;
    revealPlacement(determinePlacement(expLevel, score), score);
  };

  // Completely-new learners skip the diagnostic entirely — they just pick their
  // goals and start from Module 1 (zero to hero).
  const continueFromGoals = () => {
    if (experience === 'new') {
      revealPlacement(determinePlacement(0, 0), null); // Beginner track · Instrument Basics
    } else {
      startDiagnostic();
    }
  };

  const handleFinish = () => {
    completeOnboarding({
      experience,
      goals,
      track: placement.track.id,
      startingModule: placement.track.startingModule,
      diagnosticScore: placement.score,
    });
    // Persist to the backend (best-effort; the local store is the UI source of truth).
    onboardingService
      .submit({ experience, goals, diagnosticScore: placement.score ?? 0 })
      .catch(() => {});
    addNotification({ type: 'success', title: 'Welcome aboard!', message: `You're on the ${placement.track.name}` });
    navigate('/student/learn');
  };

  const canProceed = useMemo(() => {
    if (step === 0) return !!experience;
    if (step === 1) return goals.length > 0;
    return true;
  }, [step, experience, goals]);

  const answerSelected = currentQuestion?.type === 'order' ? true : selectedAnswer !== null;

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <h1 className="brand-text text-2xl text-primary-600">Adapt</h1>
        <span className="text-xs text-surface-400 font-medium">
          Step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-xl">
          <ProgressBar step={step} />

          <AnimatePresence mode="wait">
            {/* STEP 1 — Experience */}
            {step === 0 && (
              <motion.div
                key="exp"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl sm:text-3xl font-black text-surface-900 mb-2 text-center">
                  What best describes your RF & Electronics background?
                </h2>
                <p className="text-surface-400 text-center mb-8">This helps us tailor your learning path.</p>
                <div className="space-y-3">
                  {experienceOptions.map((opt) => (
                    <motion.button
                      key={opt.id}
                      onClick={() => setExperience(opt.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all duration-200 ${
                        experience === opt.id
                          ? 'border-primary-500 bg-primary-50 shadow-glow'
                          : 'border-surface-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <span className="text-4xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-surface-800">{opt.title}</p>
                        <p className="text-sm text-surface-400">{opt.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        experience === opt.id ? 'border-primary-500 bg-primary-500' : 'border-surface-300'
                      }`}>
                        {experience === opt.id && <Check size={14} className="text-white" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Goals */}
            {step === 1 && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl sm:text-3xl font-black text-surface-900 mb-2 text-center">
                  What do you want to improve?
                </h2>
                <p className="text-surface-400 text-center mb-8">Pick all that apply — we'll prioritize these.</p>
                <div className="grid grid-cols-2 gap-3">
                  {goalOptions.map((goal) => {
                    const selected = goals.includes(goal.id);
                    return (
                      <motion.button
                        key={goal.id}
                        onClick={() => setGoals((prev) => selected ? prev.filter((g) => g !== goal.id) : [...prev, goal.id])}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all duration-200 ${
                          selected ? 'border-primary-500 bg-primary-50 shadow-glow' : 'border-surface-200 bg-white hover:border-primary-300'
                        }`}
                      >
                        <span className="text-3xl">{goal.emoji}</span>
                        <span className="text-sm font-semibold text-surface-700 text-center">{goal.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Adaptive Diagnostic */}
            {step === 2 && currentQuestion && (
              <motion.div
                key={`diag-${currentQuestion.id}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles size={14} className="text-primary-500" />
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                    Adaptive Check · {currentQuestion.difficulty} · {diagIndex + 1}/{DIAG_LENGTH}
                  </span>
                </div>
                <div className="card p-6 sm:p-8">
                  <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                    {currentQuestion.type === 'scenario' ? 'Scenario' : currentQuestion.type === 'order' ? 'Procedure Order' : currentQuestion.type === 'concept' ? 'Concept' : 'Multiple Choice'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-surface-900 mt-2 mb-6 leading-relaxed">
                    {currentQuestion.prompt}
                  </h2>

                  {currentQuestion.type === 'order' ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        setOrderBlocks((prev) => {
                          const oldI = prev.findIndex((b) => b.id === active.id);
                          const newI = prev.findIndex((b) => b.id === over.id);
                          return arrayMove(prev, oldI, newI);
                        });
                      }
                    }}>
                      <SortableContext items={orderBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {orderBlocks.map((b, i) => <SortableBlock key={b.id} item={b} index={i} />)}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt) => (
                        <motion.button
                          key={opt.id}
                          onClick={() => setSelectedAnswer(opt.id)}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                            selectedAnswer === opt.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-white hover:border-primary-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            selectedAnswer === opt.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-300 text-surface-400'
                          }`}>
                            {opt.id.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-surface-700">{opt.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={submitDiagnosticAnswer}
                  disabled={!answerSelected}
                  className="w-full btn-primary mt-6 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {diagIndex + 1 >= DIAG_LENGTH ? 'See My Results' : 'Next Question'} <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* STEP 4 — Placement */}
            {step === 3 && placement && (
              <motion.div
                key="placement"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                  className={`w-24 h-24 rounded-4xl bg-gradient-to-br ${placement.track.color} mx-auto flex items-center justify-center text-5xl mb-6 shadow-glass-lg`}
                >
                  {placement.track.emoji}
                </motion.div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Your Personalized Path</p>
                <h2 className="text-3xl font-black text-surface-900 mb-2">{placement.track.name}</h2>
                <p className="text-surface-500 mb-6 max-w-md mx-auto">{placement.track.description}</p>

                <div className="card p-5 mb-6 text-left max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100">
                    <span className="text-sm text-surface-500">{placement.score === null ? 'Starting Point' : 'Diagnostic Score'}</span>
                    {placement.score === null ? (
                      <span className="text-sm font-bold text-success-600 bg-success-50 px-2.5 py-1 rounded-full">Fresh start · Module 1</span>
                    ) : (
                      <span className="text-lg font-black text-primary-600">{placement.score}%</span>
                    )}
                  </div>
                  <p className="label-text mb-3">Your Starting Modules</p>
                  <div className="space-y-2">
                    {placement.track.modules.map((mod, i) => (
                      <motion.div
                        key={mod}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-400'}`}>{i + 1}</span>
                        <span className="text-sm font-medium text-surface-700">{mod}</span>
                        {i === 0 && <span className="ml-auto text-xs font-bold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">Start here</span>}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <button onClick={handleFinish} className="w-full btn-primary flex items-center justify-center gap-2 py-3.5">
                  Start Learning <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer nav (steps 0-1 only) */}
          {step < 2 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => step > 0 && setStep(step - 1)}
                disabled={step === 0}
                className="flex items-center gap-1.5 text-sm font-semibold text-surface-400 hover:text-surface-600 disabled:opacity-0 transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => step === 1 ? continueFromGoals() : setStep(step + 1)}
                disabled={!canProceed}
                className="btn-primary flex items-center gap-2 disabled:opacity-40"
              >
                {step === 1 && experience === 'new' ? 'Start Learning' : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
