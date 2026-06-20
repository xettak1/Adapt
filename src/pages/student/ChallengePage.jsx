import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Zap, Target, FlaskConical, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Lock, Unlock, ArrowRight, Brain, Beaker, Gauge
} from 'lucide-react';
import challengeService from '../../services/challengeService';
import useAppStore from '../../store/useAppStore';
import MCQTask from '../../components/challenge/MCQTask';
import DragArrangeTask from '../../components/challenge/DragArrangeTask';
import FeedbackPanel from '../../components/challenge/FeedbackPanel';
import CelebrationModal from '../../components/gamification/CelebrationModal';
import Badge from '../../components/common/Badge';
import XPBadge from '../../components/gamification/XPBadge';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { DIFFICULTY } from '../../constants';

const InfoCard = ({ icon, title, children, defaultOpen = false, accentColor = 'bg-primary-50 border-primary-100' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div variants={staggerItem} className={`rounded-2xl border overflow-hidden ${accentColor}`}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-surface-800 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-5 pb-5 text-sm text-surface-600 leading-relaxed border-t border-white/60">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PhaseStep = ({ index, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      done ? 'bg-success-500 text-white' : active ? 'bg-primary-600 text-white shadow-glow' : 'bg-surface-100 text-surface-400'
    }`}>
      {done ? <CheckCircle2 size={14} /> : index}
    </div>
    <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-surface-800' : 'text-surface-400'}`}>{label}</span>
  </div>
);

const ChallengePage = () => {
  const addXP = useAppStore((s) => s.addXP);
  const addNotification = useAppStore((s) => s.addNotification);

  // Solve-first flow: intro (scenario only) -> solve (tasks) -> results (content unlock)
  const [phase, setPhase] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['todays-challenge'],
    queryFn: challengeService.getTodaysChallenge,
    staleTime: 300000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, answers, timeSpent }) => challengeService.submitChallenge(id, answers, timeSpent),
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
      setPhase('results');
      addXP(data.xpEarned);
      if (data.passed) {
        setShowCelebration(true);
        addNotification({ type: 'success', title: 'Challenge Passed!', message: `+${data.xpEarned} XP · Content unlocked` });
      } else {
        addNotification({ type: 'info', title: 'Good attempt!', message: 'Educational content unlocked below.' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleAnswer = (taskId, answer) => setAnswers((prev) => ({ ...prev, [taskId]: answer }));

  const beginSolving = () => {
    setStartedAt(Date.now());
    setPhase('solve');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (submitMutation.isPending) return;
    const timeSpent = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    submitMutation.mutate({ id: challenge.id, answers, timeSpent });
  };

  const allAnswered = challenge?.tasks.every((t) => {
    const a = answers[t.id];
    if (t.type === 'mcq') return !!a;
    if (t.type === 'mcq_multi') return Array.isArray(a) && a.length > 0;
    if (t.type === 'arrange') return Array.isArray(a) && a.length === t.blocks.length;
    return false;
  });

  if (isLoading) return <PageLoader />;
  if (!challenge) return null;

  const diff = DIFFICULTY[challenge.difficulty] || DIFFICULTY.INTERMEDIATE;

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Phase indicator */}
      <div className="flex items-center gap-3 mb-6">
        <PhaseStep index={1} label="Scenario" active={phase === 'intro'} done={phase !== 'intro'} />
        <div className="flex-1 h-px bg-surface-200" />
        <PhaseStep index={2} label="Solve" active={phase === 'solve'} done={phase === 'results'} />
        <div className="flex-1 h-px bg-surface-200" />
        <PhaseStep index={3} label="Learn" active={phase === 'results'} done={false} />
      </div>

      {/* Header */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-6">
        <motion.div variants={staggerItem} className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="primary" size="sm">{challenge.moduleName}</Badge>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff.color} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />{diff.label}
          </span>
          <XPBadge xp={challenge.xpReward} size="sm" />
        </motion.div>
        <motion.h1 variants={staggerItem} className="text-2xl sm:text-3xl font-black text-surface-900 mb-2">{challenge.title}</motion.h1>
        <motion.div variants={staggerItem} className="flex items-center gap-4 text-sm text-surface-400 flex-wrap">
          <span className="flex items-center gap-1.5"><Clock size={14} />{challenge.estimatedDuration}</span>
          <span className="flex items-center gap-1.5"><Target size={14} />{challenge.tasks.length} Tasks</span>
          <span className="flex items-center gap-1.5"><Brain size={14} />{challenge.moduleName}</span>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ---------------- PHASE 1: SCENARIO ONLY ---------------- */}
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white overflow-hidden mb-6">
              <div className="px-6 py-5 border-b border-blue-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">🔬</div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Lab Scenario</p>
                  <h2 className="font-bold text-surface-800">{challenge.scenario.title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-surface-700 leading-relaxed">{challenge.scenario.context}</p>

                <div className="p-4 bg-white rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Target size={12} />Objective</p>
                  <p className="text-surface-600 text-sm">{challenge.scenario.objective}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-surface-100">
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Gauge size={12} />Available Measurements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(challenge.scenario.equipment || []).map((eq) => (
                        <span key={eq} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">{eq}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-surface-100">
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Beaker size={12} />Experimental Conditions</p>
                    <ul className="text-xs text-surface-600 space-y-1">
                      <li>• Room temperature, 50Ω system impedance</li>
                      <li>• Calibrated instruments, standard probes</li>
                      <li>• Signal source active and stable</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Discovery-learning note */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6">
              <Lock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                <strong>Solve first, learn after.</strong> Attempt this challenge with what you already know — the mini-lecture,
                history, and full explanations unlock once you submit. Trust your reasoning!
              </p>
            </div>

            <button onClick={beginSolving} className="w-full btn-primary flex items-center justify-center gap-2 py-3.5">
              Attempt Challenge <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ---------------- PHASE 2: SOLVE ---------------- */}
        {phase === 'solve' && (
          <motion.div key="solve" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {/* Collapsed scenario reference */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-6">
              <InfoCard icon="🔬" title={`Scenario: ${challenge.scenario.title}`} accentColor="bg-blue-50 border-blue-100">
                <div className="mt-3 space-y-2">
                  <p className="text-surface-700">{challenge.scenario.context}</p>
                  <p className="text-xs"><span className="font-semibold text-blue-600">Objective: </span>{challenge.scenario.objective}</p>
                </div>
              </InfoCard>
            </motion.div>

            <div className="space-y-6 mb-6">
              <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                <FlaskConical size={20} className="text-primary-600" /> Challenge Tasks
              </h2>
              {challenge.tasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-7 h-7 rounded-xl bg-primary-100 text-primary-700 font-black text-sm flex items-center justify-center">{i + 1}</span>
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                      {task.type === 'mcq' ? 'Multiple Choice' : task.type === 'mcq_multi' ? 'Multi-Select' : 'Block Arrangement'}
                    </span>
                    <span className="ml-auto text-xs font-bold text-purple-600">{task.points} pts</span>
                  </div>
                  {task.type === 'arrange' ? (
                    <DragArrangeTask task={task} answer={answers[task.id]} onChange={(ans) => handleAnswer(task.id, ans)} submitted={submitted} />
                  ) : (
                    <MCQTask task={task} answer={answers[task.id]} onChange={(ans) => handleAnswer(task.id, ans)} submitted={submitted}
                      feedback={result?.feedback?.find((f) => f.taskId === task.id)} />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-semibold text-surface-700">{Object.keys(answers).length}/{challenge.tasks.length} tasks answered</p>
                  {!allAnswered && <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5"><AlertCircle size={11} /> Answer all tasks to submit</p>}
                </div>
                <motion.button onClick={handleSubmit} disabled={!allAnswered || submitMutation.isPending} className="btn-primary flex items-center gap-2 px-8" whileTap={{ scale: 0.97 }}>
                  {submitMutation.isPending ? (
                    <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />Grading...</>
                  ) : (
                    <>Submit & Unlock Content <Unlock size={15} /></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ---------------- PHASE 3: RESULTS + UNLOCKED CONTENT ---------------- */}
        {phase === 'results' && result && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Feedback */}
            <div className="card p-6 mb-6">
              <h2 className="section-title mb-5">Results & Feedback</h2>
              <FeedbackPanel result={result} challenge={challenge} />
            </div>

            {/* Unlocked banner */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-success-50 border border-success-200 mb-5">
              <Unlock size={18} className="text-success-600 flex-shrink-0" />
              <p className="text-sm text-success-700 font-medium">🎓 Educational content unlocked! Now learn the concepts behind what you just solved.</p>
            </motion.div>

            {/* Unlocked educational content */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3 mb-8">
              <InfoCard icon="📚" title={`Mini Lecture: ${challenge.miniLecture.title}`} defaultOpen accentColor="bg-violet-50 border-violet-100">
                <p className="mt-3 mb-4 text-surface-600">{challenge.miniLecture.content}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Key Takeaways</p>
                  {challenge.miniLecture.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-surface-600">{point}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard icon="📜" title={challenge.history.title} accentColor="bg-amber-50 border-amber-100">
                <p className="mt-3 text-surface-600 mb-3">{challenge.history.content}</p>
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-600 mb-1">Engineering Significance</p>
                  <p className="text-xs text-surface-600">{challenge.history.significance}</p>
                </div>
              </InfoCard>

              <InfoCard icon="⚡" title={challenge.funFact.title} accentColor="bg-emerald-50 border-emerald-100">
                <p className="mt-3 text-surface-600">{challenge.funFact.content}</p>
              </InfoCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CelebrationModal isOpen={showCelebration} onClose={() => setShowCelebration(false)} result={result} />
    </motion.div>
  );
};

export default ChallengePage;
