import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight, Star, Target } from 'lucide-react';
import studentService from '../../services/studentService';
import useAppStore from '../../store/useAppStore';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import XPCard from '../../components/dashboard/XPCard';
import StreakCard from '../../components/dashboard/StreakCard';
import MasteryCard from '../../components/dashboard/MasteryCard';
import CurrentModuleCard from '../../components/dashboard/CurrentModuleCard';
import LevelBadge from '../../components/gamification/LevelBadge';
import AchievementBadge from '../../components/gamification/AchievementBadge';
import LeaderboardCard from '../../components/gamification/LeaderboardCard';
import { PageLoader } from '../../components/common/LoadingSpinner';

const StudentDashboard = () => {
  const user = useAppStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: () => studentService.getDashboard(user?.id || 'std-001'),
    staleTime: 60000,
  });

  if (isLoading) return <PageLoader />;

  const { student, currentModule, recentAchievements, leaderboard } = data || {};
  const weekHistory = [true, true, false, true, true, true, false];

  return (
    <motion.div {...pageTransition} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <motion.div variants={staggerItem} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <LevelBadge level={student?.level || 1} size="md" />
              <span className="text-sm font-semibold text-surface-500">Level {student?.level}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-surface-900">
              Welcome back, <span className="text-gradient">{student?.name?.split(' ')[0] || 'Student'}</span> 👋
            </h1>
            <p className="text-surface-500 mt-1">
              You're on a <span className="font-bold text-orange-500">{student?.streak}-day streak</span> · Keep it up!
            </p>
          </div>

          <Link to="/student/challenge" className="btn-primary flex items-center gap-2 hidden sm:flex">
            Today's Challenge <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Daily challenge CTA — mobile */}
        <motion.div variants={staggerItem} className="sm:hidden mt-4">
          <Link
            to="/student/challenge"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold py-3.5 rounded-2xl shadow-glow"
          >
            <Star size={18} className="fill-current" />
            Start Today's Challenge
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <motion.div variants={staggerItem}>
          <XPCard xp={student?.xp || 0} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StreakCard streak={student?.streak || 0} weekHistory={weekHistory} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MasteryCard mastery={student?.overallMastery || 0} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <CurrentModuleCard module={currentModule} studentProgress={student?.moduleProgress} />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Module Progress Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Progress */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Module Progress</h2>
              <Link to="/student/progress" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {(student?.moduleProgress || []).map((mod, i) => (
                <motion.div
                  key={mod.id}
                  variants={staggerItem}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    mod.status === 'completed' ? 'bg-success-100' :
                    mod.status === 'in_progress' ? 'bg-primary-100' : 'bg-surface-100'
                  }`}>
                    {mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '📖' : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-surface-800 truncate">{mod.name}</span>
                      <span className="text-xs font-bold text-surface-400 flex-shrink-0 ml-2">{mod.mastery}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className={`progress-fill ${mod.status === 'completed' ? 'bg-success-500' : mod.status === 'in_progress' ? 'bg-primary-500' : 'bg-surface-200'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${mod.mastery}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                  {mod.xp > 0 && (
                    <span className="text-xs font-bold text-purple-600 flex-shrink-0">{mod.xp} XP</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Achievements</h2>
              <span className="text-xs text-surface-400 font-medium">{student?.achievements?.length || 0} unlocked</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {recentAchievements?.map((achievement) => (
                <div key={achievement.id} className="flex flex-col items-center gap-1.5">
                  <AchievementBadge achievement={achievement} unlocked animate />
                  <span className="text-xs text-surface-400 font-medium text-center max-w-16">{achievement.title}</span>
                </div>
              ))}
              {(!recentAchievements || recentAchievements.length === 0) && (
                <p className="text-sm text-surface-400">Complete challenges to unlock achievements!</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Days Active', value: student?.totalDaysActive || 0, icon: '📅', color: 'text-primary-600' },
              { label: 'Challenges Done', value: (student?.moduleProgress || []).reduce((a, m) => a + (m.completedChallenges || 0), 0), icon: '✅', color: 'text-success-600' },
              { label: 'XP This Week', value: '+320', icon: '⚡', color: 'text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-surface-400 mt-0.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Leaderboard + Info */}
        <div className="space-y-6">
          <LeaderboardCard data={leaderboard || []} currentUserId={student?.name} />

          {/* Study tip */}
          <motion.div
            className="card p-5 bg-gradient-to-br from-accent-50 to-white border-accent-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Target size={18} className="text-accent-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-surface-800 mb-1">Today's Focus</h4>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Work on <strong>S-Parameter Analysis</strong> in Signal Behavior — it's your weakest topic and most tested in module assessments.
                </p>
                <Link to="/student/challenge" className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
                  Start Practice <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
