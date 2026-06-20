import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, Award, BarChart2, Activity, ChevronRight,
  BookOpen, Zap, CheckCircle, Lock, Star, Cpu
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import instructorService from '../../services/instructorService';
import Avatar from '../../components/common/Avatar';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';

const StatCard = ({ icon, label, value, delta, color }) => (
  <motion.div variants={staggerItem} className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="label-text mb-1">{label}</p>
        <div className={`text-3xl font-black ${color}`}>{value}</div>
        {delta && (
          <p className="text-xs text-success-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp size={11} />{delta}
          </p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center ${color.replace('text-', 'from-').replace('-600', '-400')} to-${color.replace('text-', '').replace('-600', '-600')}`} style={{ background: 'linear-gradient(135deg, currentColor 0%, currentColor 100%)' }}>
        <div className="w-11 h-11 rounded-2xl bg-surface-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  </motion.div>
);

const activityTypeConfig = {
  module: { icon: <BookOpen size={13} />, color: 'bg-primary-100 text-primary-600' },
  achievement: { icon: <Star size={13} />, color: 'bg-amber-100 text-amber-600' },
  challenge: { icon: <CheckCircle size={13} />, color: 'bg-success-100 text-success-600' },
  perfect: { icon: <Award size={13} />, color: 'bg-purple-100 text-purple-600' },
  unlock: { icon: <Lock size={13} />, color: 'bg-blue-100 text-blue-600' },
};

const InstructorDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: instructorService.getDashboard,
    staleTime: 60000,
  });

  if (isLoading) return <PageLoader />;

  const { stats, performanceTrends, moduleCompletion, recentActivity, workbenchAnalytics } = data || {};
  const maxUses = Math.max(1, ...(workbenchAnalytics?.instrumentUsage?.map((i) => i.uses) || [1]));

  const statCards = [
    { icon: <Users size={20} className="text-primary-600" />, label: 'Total Students', value: stats?.totalStudents || 0, delta: null, color: 'text-primary-600' },
    { icon: <Activity size={20} className="text-success-600" />, label: 'Active Students', value: stats?.activeStudents || 0, delta: '+2 this week', color: 'text-success-600' },
    { icon: <Award size={20} className="text-purple-600" />, label: 'Avg. Mastery', value: `${stats?.averageMastery?.toFixed(1) || 0}%`, delta: '+4.2% this month', color: 'text-purple-600' },
    { icon: <BarChart2 size={20} className="text-amber-600" />, label: 'Completion Rate', value: `${stats?.completionRate || 0}%`, delta: '+8% vs last month', color: 'text-amber-600' },
  ];

  return (
    <motion.div {...pageTransition} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-8">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl sm:text-3xl font-black text-surface-900 mb-1">Instructor Dashboard</h1>
          <p className="text-surface-500">Monitor student progress and class performance</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Performance Trends</h2>
            <span className="text-xs text-surface-400">8 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceTrends || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                formatter={(v, name) => [`${v}${name === 'avgScore' ? '%' : ''}`, name === 'avgScore' ? 'Avg Score' : 'Challenges']}
              />
              <Area type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Module Completion */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Module Completion Rate</h2>
            <Link to="/instructor/heatmap" className="text-xs font-semibold text-primary-600 flex items-center gap-1">
              Heatmap <ChevronRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moduleCompletion || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                formatter={(v, name) => [`${v}%`, name === 'completion' ? 'Completion' : 'Avg Mastery']}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="completion" name="Completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgMastery" name="Avg Mastery" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workbench Engagement */}
      {workbenchAnalytics && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2"><Cpu size={18} className="text-moss-600" /> Workbench Engagement</h2>
            <span className="text-xs text-surface-400">Adaptive lab analytics</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div>
              <p className="label-text mb-3">Instrument Usage</p>
              <div className="space-y-2.5">
                {workbenchAnalytics.instrumentUsage.map((inst) => (
                  <div key={inst.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-surface-600 w-24 flex-shrink-0">{inst.name}</span>
                    <div className="flex-1 progress-bar h-2.5">
                      <motion.div className="progress-fill bg-gradient-to-r from-moss-400 to-moss-600"
                        initial={{ width: 0 }} animate={{ width: `${(inst.uses / maxUses) * 100}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <span className="text-xs font-bold text-surface-500 w-8 text-right">{inst.uses}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              {[
                { label: 'Lab Sessions', value: workbenchAnalytics.totalSessions, color: 'text-moss-700' },
                { label: 'Experiments Done', value: workbenchAnalytics.experimentsCompleted, color: 'text-success-600' },
                { label: 'Avg Interactions', value: workbenchAnalytics.avgInteractions, color: 'text-primary-600' },
                { label: 'Error Rate', value: `${workbenchAnalytics.errorRate}%`, color: 'text-amber-600' },
              ].map((s) => (
                <div key={s.label} className="bg-surface-50 rounded-2xl p-3 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-surface-400 mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Activity</h2>
            <span className="text-xs text-surface-400">{recentActivity?.length || 0} events</span>
          </div>
          <div className="space-y-3">
            {(recentActivity || []).map((act) => {
              const typeConf = activityTypeConfig[act.type] || activityTypeConfig.challenge;
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: act.id * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConf.color}`}>
                    {typeConf.icon}
                  </span>
                  <Avatar name={act.student} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate">{act.student}</p>
                    <p className="text-xs text-surface-400 truncate">{act.action}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {act.xp > 0 && <p className="text-xs font-bold text-purple-600">+{act.xp} XP</p>}
                    <p className="text-xs text-surface-300">{act.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'View Class Heatmap', to: '/instructor/heatmap', icon: <BarChart2 size={16} className="text-primary-500" />, desc: 'Mastery overview' },
                { label: 'Student Roster', to: '/instructor/heatmap', icon: <Users size={16} className="text-emerald-500" />, desc: `${stats?.totalStudents || 0} students` },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800">{link.label}</p>
                    <p className="text-xs text-surface-400">{link.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-surface-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Class health */}
          <div className="card p-5 bg-gradient-to-br from-success-50 to-white border-success-100">
            <h3 className="text-sm font-bold text-success-700 mb-3">Class Health Score</h3>
            <div className="text-4xl font-black text-success-600 mb-1">B+</div>
            <p className="text-xs text-success-600 font-medium">Above average performance</p>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Engagement', v: 82 },
                { label: 'Mastery Rate', v: 69 },
                { label: 'Completion', v: 62 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-success-600 font-medium">{item.label}</span>
                    <span className="text-success-700 font-bold">{item.v}%</span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <motion.div
                      className="progress-fill bg-success-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.v}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InstructorDashboard;
