import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Clock, Zap, Flame, ChevronRight, Sparkles, BookOpen, Cpu, Trophy, Award } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import studentService from '../../services/studentService';
import { mockLesson } from '../../data/mockLesson';
import StreakCounter from '../../components/gamification/StreakCounter';
import { formatXP, getXPProgressInLevel } from '../../utils';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';

// Pre-computed stable sine wave path
const WAVE_PATH = (() => {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * 380;
    const y = 38 + Math.sin((i / 120) * Math.PI * 12) * 28;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const WaveformDemo = () => (
  <div className="w-full my-5 rounded-xl bg-black/20 px-3 py-2">
    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Live Oscilloscope Preview</p>
    <svg viewBox="0 0 380 76" className="w-full" aria-hidden="true">
      {/* Grid lines */}
      {[19, 38, 57].map((y) => (
        <line key={y} x1="0" y1={y} x2="380" y2={y}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="5 5" />
      ))}
      {[95, 190, 285].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="76"
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Stable waveform */}
      <motion.path
        d={WAVE_PATH}
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.8, ease: 'easeOut', delay: 0.4 }}
      />
      {/* Period markers */}
      {[63, 158, 253].map((x, i) => (
        <motion.line key={x} x1={x} y1="4" x2={x} y2="72"
          stroke="rgba(251,191,36,0.5)" strokeWidth="1" strokeDasharray="3 3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.5 + i * 0.2 }}
        />
      ))}
      {/* "STABLE" badge */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }}>
        <rect x="290" y="5" width="82" height="18" rx="4" fill="rgba(16,185,129,0.3)" />
        <text x="331" y="17.5" fill="#6ee7b7" fontSize="9.5" fontWeight="700" textAnchor="middle">✓ STABLE</text>
      </motion.g>
    </svg>
  </div>
);

const LearnSession = () => {
  const user = useAppStore((s) => s.user);
  const xp = useAppStore((s) => s.xp);
  const level = useAppStore((s) => s.level);
  const streak = useAppStore((s) => s.streak);
  const onboarding = useAppStore((s) => s.onboarding);

  const { data, isLoading } = useQuery({
    queryKey: ['learn-session', user?.id],
    queryFn: () => studentService.getDashboard(user?.id || 'std-001'),
    staleTime: 60000,
  });

  if (isLoading) return <PageLoader />;

  const startingModule = onboarding?.startingModule || 'Signal Behavior';
  const { progress } = getXPProgressInLevel(xp);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div {...pageTransition} className="px-6 lg:px-10 py-8 min-h-screen">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-surface-400 font-semibold text-lg">{greeting},</p>
          <h1 className="text-4xl lg:text-5xl font-black text-surface-900 mt-1 leading-tight">
            {firstName} 👋
          </h1>
        </div>
        <div className="flex flex-col sm:items-end gap-2 sm:min-w-[220px]">
          <StreakCounter streak={streak} size="sm" />
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-40 progress-bar h-2.5 rounded-full overflow-hidden bg-surface-200">
              <motion.div
                className="progress-fill h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-black text-purple-600 whitespace-nowrap">
              {formatXP(xp)} XP · Lv.{level}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">

        {/* LEFT — Hero session card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 110 }}
          className="relative rounded-4xl overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-moss-700 p-8 text-white shadow-glass-lg"
        >
          <div className="absolute inset-0 hero-pattern opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-3.5 py-1.5 rounded-full text-sm font-bold">
                <Sparkles size={14} /> Today's Session
              </span>
              <span className="text-sm text-white/70 font-semibold">{startingModule}</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-black mb-2 leading-tight">
              {mockLesson.title}
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              A bite-sized lesson on locking down unstable waveforms — perfect for building today's momentum.
            </p>

            {/* Waveform demonstration */}
            <WaveformDemo />

            <div className="flex items-center gap-5 mb-7">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Clock size={17} />{mockLesson.estimatedDuration}
              </span>
              <span className="flex items-center gap-2 text-base font-semibold">
                <Zap size={17} className="fill-current" />+{mockLesson.xpReward} XP
              </span>
              <span className="flex items-center gap-2 text-base font-semibold">
                <BookOpen size={17} />{mockLesson.cards.length} cards
              </span>
            </div>

            <Link
              to="/student/lesson"
              className="w-full bg-white text-primary-700 font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2.5 hover:bg-white/95 transition-all hover:-translate-y-0.5 shadow-md"
            >
              <Play size={20} className="fill-current" /> Start Lesson
            </Link>
          </div>
        </motion.div>

        {/* RIGHT — Stats + Actions + Path */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-5"
        >
          {/* Quick stats row */}
          <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total XP', value: formatXP(xp), color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: <Zap size={18} className="text-purple-500 fill-current" /> },
              { label: 'Level', value: `Lv.${level}`, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100', icon: <Award size={18} className="text-primary-500" /> },
              { label: 'Streak', value: `${streak} 🔥`, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', icon: <Flame size={18} className="text-orange-500" /> },
            ].map((s) => (
              <div key={s.label} className={`card border ${s.bg} p-4 text-center rounded-2xl`}>
                <div className="flex justify-center mb-1.5">{s.icon}</div>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
            <Link
              to="/student/workbench"
              className="card-hover p-6 bg-gradient-to-br from-moss-50 to-white border border-moss-100 rounded-2xl block"
            >
              <div className="w-13 h-13 rounded-2xl bg-moss-100 flex items-center justify-center mb-4" style={{ width: 52, height: 52 }}>
                <Cpu size={24} className="text-moss-700" />
              </div>
              <p className="font-black text-surface-800 text-base">Workbench</p>
              <p className="text-sm text-surface-400 mt-1 leading-snug">Experiment with RF instruments</p>
            </Link>
            <Link
              to="/student/challenge"
              className="card-hover p-6 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl block"
            >
              <div className="rounded-2xl bg-amber-100 flex items-center justify-center mb-4" style={{ width: 52, height: 52 }}>
                <Trophy size={24} className="text-amber-600" />
              </div>
              <p className="font-black text-surface-800 text-base">Daily Challenge</p>
              <p className="text-sm text-surface-400 mt-1 leading-snug">Test your mastery today</p>
            </Link>
          </motion.div>

          {/* Learning path */}
          <motion.div variants={staggerItem} className="card p-6 rounded-2xl flex-1">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-surface-800">Your Learning Path</h3>
              <Link
                to="/student/progress"
                className="text-sm text-primary-600 font-bold flex items-center gap-1 hover:text-primary-700 transition-colors"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {(data?.student?.moduleProgress || []).slice(0, 3).map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <span className="text-2xl">
                    {mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '📖' : '🔒'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-bold text-surface-700 truncate">{mod.name}</span>
                      <span className="text-sm font-black text-surface-500 ml-2 flex-shrink-0">{mod.mastery}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          mod.status === 'completed' ? 'bg-success-500' :
                          mod.status === 'in_progress' ? 'bg-primary-500' : 'bg-surface-200'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${mod.mastery}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LearnSession;
