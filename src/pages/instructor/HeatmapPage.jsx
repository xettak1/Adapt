import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Filter, SortAsc, ChevronRight, Info, AlertTriangle, Trophy,
  TrendingUp, TrendingDown, Sparkles, Users, Layers, BarChart2
} from 'lucide-react';
import instructorService from '../../services/instructorService';
import Tooltip from '../../components/common/Tooltip';
import Avatar from '../../components/common/Avatar';
import { pageTransition, staggerContainer, staggerItem } from '../../animations/variants';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { getHeatmapColor, getHeatmapTextColor } from '../../utils';

const avg = (scores) => {
  const valid = scores.filter((s) => s !== null);
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
};

const masteryLabel = (score) => {
  if (score === null) return 'Not started';
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Moderate';
  return 'Weak';
};

const interventionFor = (score) => {
  if (score === null) return 'Encourage the student to begin this module.';
  if (score >= 75) return 'On track — consider an enrichment challenge.';
  if (score >= 50) return 'Reinforce with targeted practice on weak topics.';
  return 'Schedule a 1-on-1 review session.';
};

const BAND_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#e2e8f0'];
const BAND_LABELS = ['Strong ≥75%', 'Moderate 50–74%', 'Weak <50%', 'Not Started'];

const ClassDistribution = ({ rows }) => {
  const total = rows.length || 1;
  const counts = [
    rows.filter((r) => r.average !== null && r.average >= 75).length,
    rows.filter((r) => r.average !== null && r.average >= 50 && r.average < 75).length,
    rows.filter((r) => r.average !== null && r.average < 50).length,
    rows.filter((r) => r.average === null).length,
  ];

  return (
    <div>
      <div className="flex h-5 rounded-full overflow-hidden mb-3 gap-px">
        {counts.map((c, i) =>
          c > 0 ? (
            <motion.div
              key={i}
              className="h-full"
              style={{ backgroundColor: BAND_COLORS[i], width: `${(c / total) * 100}%` }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            />
          ) : null
        )}
      </div>
      <div className="grid grid-cols-2 gap-y-2 gap-x-3">
        {BAND_LABELS.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: BAND_COLORS[i] }} />
            <span className="text-xs text-surface-600 font-medium">
              <span className="font-black text-surface-700">{counts[i]}</span> {l.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModuleScoreBars = ({ modules, moduleAvgs }) => (
  <div className="space-y-3">
    {modules.map((m, i) => (
      <div key={m}>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-semibold text-surface-600 truncate max-w-[160px]" title={m}>{m}</span>
          <span className="text-xs font-black ml-2 flex-shrink-0"
            style={{ color: moduleAvgs[i] !== null ? getHeatmapColor(moduleAvgs[i]) : '#94a3b8' }}>
            {moduleAvgs[i] !== null ? `${moduleAvgs[i]}%` : '—'}
          </span>
        </div>
        <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: moduleAvgs[i] !== null ? getHeatmapColor(moduleAvgs[i]) : '#e2e8f0' }}
            initial={{ width: 0 }}
            animate={{ width: moduleAvgs[i] !== null ? `${moduleAvgs[i]}%` : '0%' }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
          />
        </div>
      </div>
    ))}
  </div>
);

const HeatCell = ({ score, studentName, moduleName }) => {
  const bg = getHeatmapColor(score);
  const text = getHeatmapTextColor(score);
  const trend = score === null ? 0 : (score % 7) - 3;

  return (
    <Tooltip
      placement="top"
      content={
        score === null
          ? `${studentName} · ${moduleName}: Not started`
          : `${studentName} · ${moduleName} · ${score}% (${masteryLabel(score)}) · ${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend)}% · ${interventionFor(score)}`
      }
    >
      <motion.div
        className="w-full h-20 rounded-2xl flex flex-col items-center justify-center font-bold cursor-default select-none"
        style={{ backgroundColor: bg, color: text }}
        whileHover={{ scale: 1.07, zIndex: 10 }}
        transition={{ duration: 0.15 }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <span className="text-xl leading-none font-black">
          {score === null ? '—' : `${score}%`}
        </span>
        {score !== null && (
          <span className="text-xs font-bold opacity-80 mt-1 flex items-center gap-0.5">
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </motion.div>
    </Tooltip>
  );
};

const InsightCard = ({ icon, title, color, children }) => (
  <div className={`rounded-2xl border p-5 ${color}`}>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="text-base font-bold text-surface-800">{title}</h4>
    </div>
    {children}
  </div>
);

const HeatmapPage = () => {
  const [sortBy, setSortBy] = useState('lowest');
  const [perfFilter, setPerfFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [cohort, setCohort] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: instructorService.getHeatmapData,
    staleTime: 60000,
  });

  const processed = useMemo(() => {
    if (!data) return { modules: [], rows: [], moduleAvgs: [], insights: null };
    const { modules = [], data: rows = [] } = data;

    const withAvg = rows.map((r) => ({ ...r, average: avg(r.scores) }));

    const sorted = [...withAvg].sort((a, b) => {
      if (sortBy === 'lowest') return (a.average ?? 999) - (b.average ?? 999);
      if (sortBy === 'highest') return (b.average ?? -1) - (a.average ?? -1);
      if (sortBy === 'active') return b.scores.filter((s) => s !== null).length - a.scores.filter((s) => s !== null).length;
      if (sortBy === 'inactive') return a.scores.filter((s) => s !== null).length - b.scores.filter((s) => s !== null).length;
      return 0;
    });

    const filtered = sorted.filter((r) => {
      if (perfFilter === 'all') return true;
      if (r.average === null) return perfFilter === 'weak';
      if (perfFilter === 'strong') return r.average >= 75;
      if (perfFilter === 'moderate') return r.average >= 50 && r.average < 75;
      if (perfFilter === 'weak') return r.average < 50;
      return true;
    });

    const moduleAvgs = modules.map((_, mi) => avg(rows.map((r) => r.scores[mi])));

    const atRisk = withAvg.filter((r) => r.average !== null && r.average < 50);
    const top = [...withAvg].filter((r) => r.average !== null).sort((a, b) => b.average - a.average)[0];
    const hardestIdx = moduleAvgs.reduce(
      (worst, v, i) => (v !== null && (moduleAvgs[worst] === null || v < moduleAvgs[worst]) ? i : worst),
      0
    );

    return {
      modules,
      rows: filtered,
      allRows: withAvg,
      moduleAvgs,
      insights: { atRisk, top, hardestModule: modules[hardestIdx], hardestScore: moduleAvgs[hardestIdx] },
    };
  }, [data, sortBy, perfFilter]);

  if (isLoading) return <PageLoader />;
  const { modules, rows, allRows, moduleAvgs, insights } = processed;

  const visibleModuleIdx = modules.map((_, i) => i).filter(
    (i) => moduleFilter === 'all' || String(i) === moduleFilter
  );

  return (
    <motion.div {...pageTransition} className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mb-6">
        <motion.div variants={staggerItem}>
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 mb-1">Mastery Heatmap</h1>
          <p className="text-surface-500 text-base">Classroom performance at a glance — with actionable insights</p>
        </motion.div>

        {/* Controls */}
        <motion.div variants={staggerItem} className="flex gap-3 mt-5 flex-wrap">
          {[
            { icon: <Users size={15} />, value: cohort, set: setCohort, options: [['all', 'All Cohorts'], ['2024', 'Cohort 2024'], ['2025', 'Cohort 2025']] },
            { icon: <Layers size={15} />, value: moduleFilter, set: setModuleFilter, options: [['all', 'All Modules'], ...modules.map((m, i) => [String(i), m])] },
            { icon: <SortAsc size={15} />, value: sortBy, set: setSortBy, options: [['lowest', 'Lowest Mastery'], ['highest', 'Highest Mastery'], ['active', 'Most Active'], ['inactive', 'Least Active']] },
            { icon: <Filter size={15} />, value: perfFilter, set: setPerfFilter, options: [['all', 'All Levels'], ['strong', 'Strong'], ['moderate', 'Moderate'], ['weak', 'At Risk']] },
          ].map((ctrl, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm shadow-sm">
              <span className="text-surface-400">{ctrl.icon}</span>
              <select
                value={ctrl.value}
                onChange={(e) => ctrl.set(e.target.value)}
                className="bg-transparent text-surface-700 font-semibold outline-none cursor-pointer text-sm"
              >
                {ctrl.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-5 flex-wrap">
        <span className="text-xs font-bold text-surface-400 uppercase tracking-wide flex items-center gap-1.5">
          <Info size={13} /> Legend:
        </span>
        {[{ c: '#10b981', l: 'Strong ≥75%' }, { c: '#f59e0b', l: 'Moderate 50–74%' }, { c: '#f43f5e', l: 'Weak <50%' }, { c: '#e2e8f0', l: 'Not Started' }].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: x.c }} />
            <span className="text-sm text-surface-500 font-medium">{x.l}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Heatmap */}
        <div className="card p-6 overflow-x-auto">
          <div style={{ minWidth: 680 }}>
            {/* Column headers */}
            <div className="flex gap-3 mb-4">
              <div className="w-52 flex-shrink-0" />
              {visibleModuleIdx.map((mi) => (
                <div key={mi} className="flex-1 min-w-0 text-center">
                  <div className="text-sm font-bold text-surface-700 px-1 leading-tight" title={modules[mi]}>
                    {modules[mi]}
                  </div>
                  {moduleAvgs[mi] !== null && (
                    <div
                      className="text-xs font-black mt-1.5 px-2.5 py-1 rounded-full inline-block"
                      style={{ backgroundColor: getHeatmapColor(moduleAvgs[mi]), color: getHeatmapTextColor(moduleAvgs[mi]) }}
                    >
                      {moduleAvgs[mi]}%
                    </div>
                  )}
                </div>
              ))}
              <div className="w-20 flex-shrink-0 text-sm font-bold text-surface-400 text-center">Avg</div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {rows.map((row) => (
                <motion.div
                  key={row.studentId}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-center"
                >
                  <Link
                    to={`/instructor/student/${row.studentId}`}
                    className="w-52 flex-shrink-0 flex items-center gap-2.5 group"
                  >
                    <Avatar name={row.studentName} size="sm" />
                    <span className="text-base font-bold text-surface-700 group-hover:text-primary-600 truncate">
                      {row.studentName}
                    </span>
                    <ChevronRight size={13} className="text-surface-300 group-hover:text-primary-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  {visibleModuleIdx.map((mi) => (
                    <div key={mi} className="flex-1 min-w-0">
                      <HeatCell score={row.scores[mi]} studentName={row.studentName} moduleName={modules[mi]} />
                    </div>
                  ))}
                  <div className="w-20 flex-shrink-0">
                    {row.average !== null ? (
                      <div
                        className="h-20 rounded-2xl flex items-center justify-center font-black text-xl"
                        style={{ backgroundColor: `${getHeatmapColor(row.average)}25`, color: getHeatmapColor(row.average) }}
                      >
                        {row.average}%
                      </div>
                    ) : (
                      <div className="h-20 rounded-2xl flex items-center justify-center text-surface-300 font-bold bg-surface-50 text-xl">—</div>
                    )}
                  </div>
                </motion.div>
              ))}
              {rows.length === 0 && (
                <p className="text-center text-surface-400 text-base py-10">No students match these filters.</p>
              )}
            </div>
          </div>
        </div>

        {/* Insights panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary-500" />
            <h2 className="text-lg font-black text-surface-800">Insights</h2>
          </div>

          {/* Class distribution demo */}
          <InsightCard
            icon={<BarChart2 size={18} className="text-primary-500" />}
            title="Class Distribution"
            color="bg-white border-surface-200"
          >
            <ClassDistribution rows={allRows} />
          </InsightCard>

          {/* Module performance bars demo */}
          <InsightCard
            icon={<TrendingUp size={18} className="text-surface-500" />}
            title="Module Performance"
            color="bg-white border-surface-200"
          >
            <ModuleScoreBars modules={modules} moduleAvgs={moduleAvgs} />
          </InsightCard>

          <InsightCard
            icon={<AlertTriangle size={18} className="text-danger-500" />}
            title="Students At Risk"
            color="bg-danger-50 border-danger-200"
          >
            {insights.atRisk.length ? (
              <ul className="space-y-2">
                {insights.atRisk.map((r) => (
                  <li key={r.studentId} className="flex items-center justify-between">
                    <Link
                      to={`/instructor/student/${r.studentId}`}
                      className="text-base font-semibold text-surface-700 hover:text-danger-600 transition-colors"
                    >
                      {r.studentName}
                    </Link>
                    <span className="text-sm font-black text-danger-500">{r.average}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-surface-500">No students currently at risk 🎉</p>
            )}
          </InsightCard>

          <InsightCard
            icon={<Trophy size={18} className="text-success-600" />}
            title="Top Performer"
            color="bg-success-50 border-success-200"
          >
            {insights.top ? (
              <div className="flex items-center gap-3">
                <Avatar name={insights.top.studentName} size="sm" />
                <div>
                  <p className="text-base font-bold text-surface-800">{insights.top.studentName}</p>
                  <p className="text-sm text-success-600 font-black">{insights.top.average}% avg mastery</p>
                </div>
              </div>
            ) : <p className="text-sm text-surface-500">—</p>}
          </InsightCard>

          <InsightCard
            icon={<TrendingDown size={18} className="text-amber-600" />}
            title="Hardest Module"
            color="bg-amber-50 border-amber-200"
          >
            <p className="text-base font-bold text-surface-800">{insights.hardestModule}</p>
            <p className="text-sm text-amber-600 font-semibold mt-1">
              Class avg {insights.hardestScore ?? 0}% — consider a group review.
            </p>
          </InsightCard>

          <InsightCard
            icon={<Sparkles size={18} className="text-primary-600" />}
            title="Recommended Interventions"
            color="bg-primary-50 border-primary-200"
          >
            <ul className="space-y-2 text-sm text-surface-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5 font-black">•</span>
                Schedule 1-on-1s for {insights.atRisk.length} at-risk student{insights.atRisk.length === 1 ? '' : 's'}.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5 font-black">•</span>
                Run a workshop on <strong>{insights.hardestModule}</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5 font-black">•</span>
                Pair top performers as peer mentors.
              </li>
            </ul>
          </InsightCard>
        </div>
      </div>
    </motion.div>
  );
};

export default HeatmapPage;
