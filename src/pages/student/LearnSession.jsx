import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Clock, Zap, Flame, ChevronRight, Sparkles, BookOpen, Cpu, Trophy } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import studentService from '../../services/studentService';
import { mockLesson } from '../../data/mockLesson';
import StreakCounter from '../../components/gamification/StreakCounter';
import { formatXP, getXPProgressInLevel } from '../../utils';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';

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
    <motion.div {...pageTransition} className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Greeting */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={staggerItem} className="flex items-center justify-between mb-1">
          <p className="text-surface-400 font-medium">{greeting},</p>
          <StreakCounter streak={streak} size="sm" />
        </motion.div>
        <motion.h1 variants={staggerItem} className="text-3xl font-black text-surface-900 mb-6">
          {firstName} 👋
        </motion.h1>

        {/* Daily streak progress strip */}
        <motion.div variants={staggerItem} className="flex items-center gap-3 mb-8">
          <div className="flex-1 progress-bar h-2">
            <motion.div
              className="progress-fill bg-gradient-to-r from-purple-400 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <span className="text-xs font-bold text-purple-600">{formatXP(xp)} XP · Lv.{level}</span>
        </motion.div>
      </motion.div>

      {/* TODAY'S SESSION — Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
        className="relative rounded-4xl overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-moss-700 p-7 text-white shadow-glass-lg mb-6"
      >
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles size={12} /> Today's Session
            </span>
            <span className="text-xs text-white/70 font-medium">{startingModule}</span>
          </div>

          <h2 className="text-2xl font-black mb-2">{mockLesson.title}</h2>
          <p className="text-white/80 text-sm mb-5 leading-relaxed">
            A bite-sized lesson on locking down unstable waveforms — perfect for building today's momentum.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className="flex items-center gap-1.5 text-sm font-medium"><Clock size={15} />{mockLesson.estimatedDuration}</span>
            <span className="flex items-center gap-1.5 text-sm font-medium"><Zap size={15} className="fill-current" />+{mockLesson.xpReward} XP</span>
            <span className="flex items-center gap-1.5 text-sm font-medium"><BookOpen size={15} />{mockLesson.cards.length} cards</span>
          </div>

          <Link
            to="/student/lesson"
            className="w-full bg-white text-primary-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/95 transition-all hover:-translate-y-0.5"
          >
            <Play size={18} className="fill-current" /> Start Lesson
          </Link>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <motion.div variants={staggerItem}>
          <Link to="/student/workbench" className="block card-hover p-5 bg-gradient-to-br from-moss-50 to-white border-moss-100 h-full">
            <div className="w-11 h-11 rounded-2xl bg-moss-100 flex items-center justify-center mb-3">
              <Cpu size={20} className="text-moss-700" />
            </div>
            <p className="font-bold text-surface-800 text-sm">Workbench</p>
            <p className="text-xs text-surface-400 mt-0.5">Experiment with instruments</p>
          </Link>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Link to="/student/challenge" className="block card-hover p-5 bg-gradient-to-br from-amber-50 to-white border-amber-100 h-full">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
              <Trophy size={20} className="text-amber-600" />
            </div>
            <p className="font-bold text-surface-800 text-sm">Daily Challenge</p>
            <p className="text-xs text-surface-400 mt-0.5">Test your mastery</p>
          </Link>
        </motion.div>
      </motion.div>

      {/* Continue path */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Your Learning Path</h3>
          <Link to="/student/progress" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-2.5">
          {(data?.student?.moduleProgress || []).slice(0, 3).map((mod) => (
            <div key={mod.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
              <span className="text-lg">{mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '📖' : '🔒'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-surface-700 truncate">{mod.name}</span>
                  <span className="text-xs font-bold text-surface-400">{mod.mastery}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${mod.status === 'completed' ? 'bg-success-500' : mod.status === 'in_progress' ? 'bg-primary-500' : 'bg-surface-200'}`}
                    style={{ width: `${mod.mastery}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearnSession;
