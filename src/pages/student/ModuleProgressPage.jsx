import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, PlayCircle, ArrowRight, Zap, Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import studentService from '../../services/studentService';
import useAppStore from '../../store/useAppStore';
import ProgressRing from '../../components/common/ProgressRing';
import Badge from '../../components/common/Badge';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';

const statusConfig = {
  completed: { icon: <CheckCircle size={18} className="text-success-500" />, label: 'Completed', badge: 'success', ring: '#10b981' },
  in_progress: { icon: <PlayCircle size={18} className="text-primary-500" />, label: 'In Progress', badge: 'primary', ring: '#3b82f6' },
  locked: { icon: <Lock size={18} className="text-surface-300" />, label: 'Locked', badge: 'default', ring: '#e2e8f0' },
};

const ModuleCard = ({ module, index, isLast }) => {
  const config = statusConfig[module.status] || statusConfig.locked;
  const isLocked = module.status === 'locked';

  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <motion.div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${
            module.status === 'completed' ? 'bg-success-100 border-success-300' :
            module.status === 'in_progress' ? 'bg-primary-100 border-primary-300' :
            'bg-surface-100 border-surface-200'
          }`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          {config.icon}
        </motion.div>
        {!isLast && <div className={`w-0.5 flex-1 mt-2 ${module.status === 'completed' ? 'bg-success-300' : 'bg-surface-200'}`} style={{ minHeight: 32 }} />}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 + 0.1 }}
        className={`flex-1 mb-6 card p-5 ${isLocked ? 'opacity-60' : ''} ${!isLocked ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''}`}
      >
        <div className="flex items-start gap-4">
          {/* Module icon */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${isLocked ? 'grayscale' : ''}`}>
            {module.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-bold text-surface-800 ${isLocked ? 'text-surface-400' : ''}`}>{module.title}</h3>
              <Badge variant={config.badge} size="xs">{config.label}</Badge>
            </div>
            <p className="text-xs text-surface-400 mb-3 leading-relaxed">{module.description}</p>

            {/* Progress */}
            {!isLocked && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-400">Mastery Progress</span>
                  <span className="text-xs font-bold text-surface-600">{module.mastery}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className={`progress-fill ${module.status === 'completed' ? 'bg-gradient-to-r from-success-400 to-success-500' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${module.mastery}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-surface-400">{module.totalChallenges} challenges</span>
              <span className="text-surface-200">·</span>
              <span className="text-xs text-surface-400">~{module.estimatedHours}h</span>
              {module.xpEarned > 0 && (
                <>
                  <span className="text-surface-200">·</span>
                  <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                    <Zap size={10} className="fill-current" />{module.xpEarned} XP earned
                  </span>
                </>
              )}
              {module.status === 'completed' && module.completedAt && (
                <>
                  <span className="text-surface-200">·</span>
                  <span className="text-xs text-success-600 font-medium">Completed {module.completedAt}</span>
                </>
              )}
            </div>

            {/* Topics */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {module.topics.slice(0, 4).map((topic) => (
                <span key={topic} className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLocked ? 'bg-surface-100 text-surface-300' : `${module.colorLight} ${module.colorText}`}`}>
                  {topic}
                </span>
              ))}
              {module.topics.length > 4 && (
                <span className="text-xs text-surface-400 font-medium">+{module.topics.length - 4} more</span>
              )}
            </div>
          </div>

          {/* Ring */}
          {!isLocked && (
            <div className="flex-shrink-0 hidden sm:block">
              <ProgressRing value={module.mastery} size={56} strokeWidth={4} color={config.ring} bg="#e2e8f0">
                <span className="text-xs font-black" style={{ color: config.ring }}>{module.mastery}%</span>
              </ProgressRing>
            </div>
          )}
        </div>

        {/* CTA */}
        {module.status === 'in_progress' && (
          <Link to="/student/challenge" className="mt-4 btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
            Continue <ArrowRight size={14} />
          </Link>
        )}
        {isLocked && module.prerequisites.length > 0 && (
          <div className="mt-3 text-xs text-surface-400 flex items-center gap-1">
            <Lock size={11} /> Complete prerequisite modules to unlock
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ModuleProgressPage = () => {
  const user = useAppStore((s) => s.user);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['module-progress', user?.id],
    queryFn: () => studentService.getModuleProgress(user?.id || 'std-001'),
    staleTime: 60000,
  });

  if (isLoading) return <PageLoader />;

  const completed = modules?.filter((m) => m.status === 'completed').length || 0;
  const totalXP = modules?.reduce((a, m) => a + (m.xpEarned || 0), 0) || 0;

  return (
    <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-8">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 mb-1">Module Progress</h1>
          <p className="text-surface-500">Master each module to unlock the next one on your RF journey</p>
        </motion.div>

        {/* Summary stats */}
        <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Modules Complete', value: `${completed}/${modules?.length || 0}`, icon: '🏆', color: 'text-success-600' },
            { label: 'Total XP Earned', value: `${totalXP.toLocaleString()}`, icon: '⚡', color: 'text-purple-600' },
            { label: 'Mastery Required', value: '80%', icon: '🎯', color: 'text-primary-600' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-surface-400 mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Mastery requirement note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-2xl flex items-center gap-3"
      >
        <Trophy size={18} className="text-primary-600 flex-shrink-0" />
        <p className="text-sm text-primary-700 font-medium">
          Reach <strong>80%+ mastery</strong> in each module to unlock the next one. Advanced Diagnostics requires 85%.
        </p>
      </motion.div>

      {/* Module Timeline */}
      <div>
        {(modules || []).map((module, i) => (
          <ModuleCard key={module.id} module={module} index={i} isLast={i === (modules?.length || 1) - 1} />
        ))}
      </div>
    </motion.div>
  );
};

export default ModuleProgressPage;
