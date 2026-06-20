import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Zap, Flame, Brain, Calendar, TrendingUp, AlertTriangle,
  FileText, Save, BookOpen, XCircle, Lightbulb, CheckCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import instructorService from '../../services/instructorService';
import Avatar from '../../components/common/Avatar';
import LevelBadge from '../../components/gamification/LevelBadge';
import StreakCounter from '../../components/gamification/StreakCounter';
import XPBadge from '../../components/gamification/XPBadge';
import ProgressRing from '../../components/common/ProgressRing';
import { getMasteryLevel } from '../../utils';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';
import useAppStore from '../../store/useAppStore';

const SKILLS_RADAR = (student) => {
  const allTopics = [
    { topic: 'Oscilloscope', value: 88 },
    { topic: 'Signal Gen.', value: 74 },
    { topic: 'Impedance', value: 45 },
    { topic: 'S-Params', value: 38 },
    { topic: 'Triggering', value: 62 },
    { topic: 'RF Power', value: 70 },
  ];
  return allTopics;
};

const StudentDetailPage = () => {
  const { id } = useParams();
  const addNotification = useAppStore((s) => s.addNotification);
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => instructorService.getStudentDetail(id),
    staleTime: 60000,
    onSuccess: (data) => { if (data?.instructorNotes) setNote(data.instructorNotes); },
  });

  const saveMutation = useMutation({
    mutationFn: (n) => instructorService.saveInstructorNote(id, n),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Note saved successfully.' });
      queryClient.invalidateQueries(['student-detail', id]);
    },
  });

  if (isLoading) return <PageLoader />;
  if (!student) return null;

  const masteryLevel = getMasteryLevel(student.overallMastery || 0);
  const radarData = SKILLS_RADAR(student);

  return (
    <motion.div {...pageTransition} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back nav */}
      <Link to="/instructor/heatmap" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Heatmap
      </Link>

      {/* Profile Header */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="card p-6 mb-6">
        <motion.div variants={staggerItem} className="flex items-start gap-5 flex-wrap">
          <Avatar name={student.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-black text-surface-900">{student.name}</h1>
              <LevelBadge level={student.level} size="sm" showLabel />
            </div>
            <p className="text-surface-400 text-sm mb-3">{student.email} · {student.currentTrack}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <XPBadge xp={student.xp} />
              <StreakCounter streak={student.streak} size="sm" />
              <span className="text-xs text-surface-400 flex items-center gap-1"><Calendar size={12} />{student.totalDaysActive} days active</span>
            </div>
          </div>
          <ProgressRing value={student.overallMastery || 0} size={80} strokeWidth={6} color="#3b82f6" bg="#e2e8f0">
            <div className="text-center">
              <div className="text-lg font-black text-primary-700">{student.overallMastery}%</div>
              <div className="text-xs text-surface-400">mastery</div>
            </div>
          </ProgressRing>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-surface-100">
          {[
            { label: 'Overall Mastery', value: `${student.overallMastery}%`, icon: <Brain size={14} className="text-primary-500" />, sub: masteryLevel.label },
            { label: 'XP Points', value: student.xp?.toLocaleString(), icon: <Zap size={14} className="text-purple-500" />, sub: `Level ${student.level}` },
            { label: 'Day Streak', value: student.streak, icon: <Flame size={14} className="text-orange-500" />, sub: 'consecutive days' },
            { label: 'Active Since', value: student.joinDate, icon: <Calendar size={14} className="text-blue-500" />, sub: `${student.totalDaysActive} days total` },
          ].map((s) => (
            <div key={s.label} className="bg-surface-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="label-text text-surface-400">{s.label}</span></div>
              <div className="text-lg font-black text-surface-800">{s.value}</div>
              <div className="text-xs text-surface-400">{s.sub}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance History Chart */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary-500" />
              <h2 className="section-title">Performance History</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={student.performanceHistory || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Module Progress */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-primary-500" />
              <h2 className="section-title">Module Progression</h2>
            </div>
            <div className="space-y-3">
              {(student.moduleProgress || []).map((mod, i) => (
                <div key={mod.id} className="flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">{mod.status === 'completed' ? '✅' : mod.status === 'in_progress' ? '📖' : '🔒'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-surface-700 truncate">{mod.name}</span>
                      <span className="text-xs font-bold text-surface-400 flex-shrink-0 ml-2">{mod.mastery}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className={`progress-fill ${mod.status === 'completed' ? 'bg-success-500' : mod.status === 'in_progress' ? 'bg-primary-500' : 'bg-surface-200'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${mod.mastery}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                  {mod.xp > 0 && <span className="text-xs font-bold text-purple-600 flex-shrink-0">{mod.xp} XP</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Error History */}
          {(student.errorHistory || []).length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle size={18} className="text-danger-500" />
                <h2 className="section-title">Error History</h2>
              </div>
              <div className="space-y-3">
                {student.errorHistory.map((err, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-danger-50 border border-danger-100 rounded-xl">
                    <AlertTriangle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{err.topic} · <span className="text-danger-600">{err.module}</span></p>
                      <p className="text-xs text-surface-500 mt-0.5">{err.error}</p>
                      <p className="text-xs text-surface-300 mt-1">{err.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skill Radar */}
          <div className="card p-5">
            <h2 className="section-title mb-3">Skill Profile</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name={student.name} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weak Skills */}
          {(student.weakSkills || []).length > 0 && (
            <div className="card p-5 border-warning-200 bg-warning-50/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-warning-600" />
                <h3 className="text-sm font-bold text-warning-700">Weak Areas</h3>
              </div>
              <div className="space-y-1.5">
                {student.weakSkills.map((skill) => (
                  <div key={skill} className="flex items-center gap-2 text-sm text-surface-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning-500 flex-shrink-0" />
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Intervention */}
          <div className="card p-5 bg-primary-50 border-primary-100">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-primary-600" />
              <h3 className="text-sm font-bold text-primary-700">Recommended Intervention</h3>
            </div>
            <ul className="space-y-1.5">
              {['Schedule 1-on-1 tutoring session', 'Assign targeted S-parameter exercises', 'Share VNA operation video resources'].map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-surface-600">
                  <CheckCircle size={12} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructor Notes */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-surface-500" />
              <h3 className="text-sm font-bold text-surface-700">Instructor Notes</h3>
            </div>
            <textarea
              value={note || student.instructorNotes || ''}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Add private notes about this student..."
              className="w-full text-sm text-surface-700 bg-surface-50 border border-surface-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 transition-all"
            />
            <button
              onClick={() => saveMutation.mutate(note)}
              disabled={saveMutation.isPending}
              className="mt-2 w-full flex items-center justify-center gap-2 btn-primary text-sm py-2"
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDetailPage;
