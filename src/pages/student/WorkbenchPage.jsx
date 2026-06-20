import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Bot, X, Target, CheckCircle2, Zap, GraduationCap, Compass,
  Activity, FlaskConical, Plus, Trash2, Play, Pause, RotateCcw, Link2, Link2Off
} from 'lucide-react';
import confetti from 'canvas-confetti';
import useAppStore from '../../store/useAppStore';
import simulationService from '../../services/simulationService';
import { initialBench } from '../../components/workbench/benchUtils';
import { reactiveNote } from '../../utils/tutorEngine';
import { guidedExperiments, challengeTasks } from '../../data/experiments';
import OscilloscopeHW from '../../components/workbench/OscilloscopeHW';
import RFGeneratorHW from '../../components/workbench/RFGeneratorHW';
import SpectrumAnalyzerHW from '../../components/workbench/SpectrumAnalyzerHW';
import VNAHW from '../../components/workbench/VNAHW';
import MultimeterHW from '../../components/workbench/MultimeterHW';
import PowerSupplyHW from '../../components/workbench/PowerSupplyHW';
import LogicAnalyzerHW from '../../components/workbench/LogicAnalyzerHW';
import AITutor from '../../components/workbench/AITutor';
import { pageTransition } from '../../animations/variants';

const INSTRUMENTS = [
  { id: 'rf-generator', name: 'RF Signal Generator', short: 'RF Gen', icon: '📡', role: 'source', Comp: RFGeneratorHW },
  { id: 'power-supply', name: 'Power Supply', short: 'Supply', icon: '🔋', role: 'source', Comp: PowerSupplyHW },
  { id: 'oscilloscope', name: 'Oscilloscope', short: 'Scope', icon: '📈', role: 'measure', Comp: OscilloscopeHW },
  { id: 'spectrum-analyzer', name: 'Spectrum Analyzer', short: 'Spectrum', icon: '📶', role: 'measure', Comp: SpectrumAnalyzerHW },
  { id: 'vna', name: 'Vector Network Analyzer', short: 'VNA', icon: '🔗', role: 'measure', Comp: VNAHW },
  { id: 'multimeter', name: 'Digital Multimeter', short: 'DMM', icon: '🔢', role: 'measure', Comp: MultimeterHW },
  { id: 'logic-analyzer', name: 'Logic Analyzer', short: 'Logic', icon: '🔲', role: 'measure', Comp: LogicAnalyzerHW },
];

const COMPONENTS = [
  { id: 'res', label: 'Resistor', glyph: '▭' }, { id: 'cap', label: 'Capacitor', glyph: '⊣⊢' },
  { id: 'ind', label: 'Inductor', glyph: '◠◠◠' }, { id: 'diode', label: 'Diode', glyph: '▷|' },
  { id: 'transistor', label: 'Transistor', glyph: '⊐' }, { id: 'opamp', label: 'Op-Amp', glyph: '▷' },
  { id: 'filter', label: 'RF Filter', glyph: '∿▭' },
];

const MODES = [
  { id: 'guided', label: 'Guided', icon: <GraduationCap size={15} /> },
  { id: 'explore', label: 'Explore', icon: <Compass size={15} /> },
  { id: 'challenge', label: 'Challenge', icon: <Target size={15} /> },
];

const SignalFlow = ({ bench, active, circuit }) => {
  const source = bench.genOn ? 'RF Generator' : bench.ch1On ? 'Power Supply' : 'No Source';
  const on = bench.genOn || bench.ch1On;
  const measure = active.role === 'measure' ? active.short : 'Scope';
  const Node = ({ label, icon, lit }) => (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border whitespace-nowrap ${lit ? 'bg-white border-moss-300' : 'bg-surface-50 border-surface-200 opacity-60'}`}>
      <span className="text-sm">{icon}</span><span className="text-[11px] font-semibold text-surface-700">{label}</span>
    </div>
  );
  const Flow = ({ lit }) => (
    <div className="relative flex-1 h-px bg-surface-200 min-w-[18px]">
      {lit && <motion.span className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-moss-500" animate={{ left: ['0%', '100%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />}
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <Node label={source} icon="📡" lit={on} /><Flow lit={on} />
      {circuit.map((c) => (<span key={c.key} className="contents"><Node label={c.label} icon="🔧" lit={on} /><Flow lit={on} /></span>))}
      <Node label="Circuit" icon="🔌" lit={on} /><Flow lit={on} />
      <Node label={measure} icon="📊" lit={on} />
    </div>
  );
};

const WorkbenchPage = () => {
  const addXP = useAppStore((s) => s.addXP);
  const unlockLabAchievement = useAppStore((s) => s.unlockLabAchievement);
  const labAchievements = useAppStore((s) => s.labAchievements);
  const addNotification = useAppStore((s) => s.addNotification);
  const recordInstrumentOpen = useAppStore((s) => s.recordInstrumentOpen);
  const recordExperimentComplete = useAppStore((s) => s.recordExperimentComplete);
  const recordWorkbenchInteraction = useAppStore((s) => s.recordWorkbenchInteraction);
  const recordWorkbenchError = useAppStore((s) => s.recordWorkbenchError);
  const experimentsCompleted = useAppStore((s) => s.workbench.experimentsCompleted);

  const [bench, setBench] = useState(initialBench);
  const [activeId, setActiveId] = useState('oscilloscope');
  const [mode, setMode] = useState('guided');
  const [tutorOpen, setTutorOpen] = useState(false);
  const [claimed, setClaimed] = useState({});
  const [circuit, setCircuit] = useState([]);
  const [experimentId, setExperimentId] = useState(guidedExperiments[0].id);
  const [tutorEvent, setTutorEvent] = useState(null);

  const prevBench = useRef(bench);
  const active = INSTRUMENTS.find((i) => i.id === activeId);
  const ActiveComp = active.Comp;
  const task = challengeTasks[activeId];
  const taskDone = mode === 'challenge' && task?.check(bench);
  const experiment = guidedExperiments.find((e) => e.id === experimentId);
  const workbenchDone = experimentsCompleted.includes(experimentId);

  // Track instrument usage + award Explorer badge on first scope launch.
  useEffect(() => {
    recordInstrumentOpen(activeId);
    if (activeId === 'oscilloscope' && !labAchievements.includes('oscilloscope-explorer')) {
      unlockLabAchievement('oscilloscope-explorer');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Reactive tutor + interaction/error analytics when key bench params change.
  useEffect(() => {
    const note = reactiveNote(prevBench.current, bench);
    if (note) setTutorEvent({ id: Date.now(), text: note });
    if (prevBench.current !== bench) recordWorkbenchInteraction();
    if (bench.faulty && !prevBench.current.faulty) recordWorkbenchError();
    prevBench.current = bench;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bench]);

  const resetBench = () => { setBench(initialBench); addNotification({ type: 'info', message: 'Bench reset to defaults.' }); };
  const completeExperiment = () => {
    recordExperimentComplete(experimentId);
    addXP(40);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
    addNotification({ type: 'success', title: 'Experiment complete!', message: `${experiment.title} · +40 XP` });
  };

  const claimReward = () => {
    if (claimed[activeId]) return;
    setClaimed((c) => ({ ...c, [activeId]: true }));
    addXP(120);
    confetti({ particleCount: 130, spread: 85, origin: { y: 0.5 } });
    if (task.achievement) {
      unlockLabAchievement(task.achievement);
      simulationService.recordChallenge(activeId, task.achievement).catch(() => {});
    }
    addNotification({ type: 'success', title: 'Lab task complete!', message: '+120 XP earned' });
  };

  const addComponent = (c) => setCircuit((list) => [...list, { ...c, key: `${c.id}-${Date.now()}` }]);
  const removeComponent = (key) => setCircuit((list) => list.filter((c) => c.key !== key));

  return (
    <motion.div {...pageTransition} className="max-w-[1500px] mx-auto px-3 sm:px-5 lg:px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-moss-600 to-moss-800 flex items-center justify-center">
            <Cpu size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-surface-900">Digital RF Workbench</h1>
            <p className="text-xs text-surface-400">One connected bench — every knob propagates through the system</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-surface-100 rounded-xl">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === m.id ? 'text-moss-700' : 'text-surface-500'}`}>
                {mode === m.id && <motion.div layoutId="wbmode" className="absolute inset-0 bg-white rounded-lg shadow-card" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span className="relative z-10 flex items-center gap-1.5">{m.icon}{m.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setTutorOpen(true)} className="lg:hidden btn-moss text-sm py-2 px-3 flex items-center gap-1.5"><Bot size={15} /></button>
        </div>
      </div>

      {/* TOP TOOLBAR */}
      <div className="card px-3 py-2 mb-4 flex items-center gap-2 flex-wrap">
        <button onClick={() => setBench((b) => ({ ...b, genOn: !b.genOn }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${bench.genOn ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'}`}>
          {bench.genOn ? <Pause size={13} /> : <Play size={13} />}{bench.genOn ? 'Source Running' : 'Source Paused'}
        </button>
        <button onClick={resetBench} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 text-surface-600 hover:bg-surface-200">
          <RotateCcw size={13} /> Reset
        </button>
        <button onClick={() => setBench((b) => ({ ...b, connected: !b.connected }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${bench.connected ? 'bg-moss-100 text-moss-700' : 'bg-danger-100 text-danger-600'}`}>
          {bench.connected ? <Link2 size={13} /> : <Link2Off size={13} />}{bench.connected ? 'Connected' : 'Disconnected'}
        </button>
        <div className="h-5 w-px bg-surface-200 mx-1 hidden sm:block" />
        <div className="flex items-center gap-3 text-xs text-surface-400 font-mono ml-auto">
          <span className="hidden sm:flex items-center gap-1.5"><Activity size={12} className="text-moss-500" /> {active.name}</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${bench.genOn && bench.connected ? 'bg-success-500' : 'bg-surface-300'}`} />
            {bench.genOn && bench.connected ? 'signal live' : 'idle'}
          </span>
          <span className="hidden md:inline">noise {Math.round(bench.noise * 100)}%</span>
        </div>
      </div>

      {/* Main lab layout: left components · center bench · right tutor */}
      <div className="grid lg:grid-cols-[180px_1fr_350px] gap-4 items-start">
        {/* LEFT — components & devices */}
        <div className="hidden lg:flex flex-col gap-3">
          <div className="card p-3">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FlaskConical size={13} /> Components</p>
            <div className="space-y-1.5">
              {COMPONENTS.map((c) => (
                <button key={c.id} onClick={() => addComponent(c)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-50 hover:bg-moss-50 text-left transition-colors group">
                  <span className="font-mono text-moss-600 text-sm w-8">{c.glyph}</span>
                  <span className="text-xs font-medium text-surface-600 flex-1">{c.label}</span>
                  <Plus size={13} className="text-surface-300 group-hover:text-moss-500" />
                </button>
              ))}
            </div>
          </div>

          {circuit.length > 0 && (
            <div className="card p-3">
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Circuit</p>
              <div className="space-y-1">
                {circuit.map((c) => (
                  <div key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-moss-50">
                    <span className="font-mono text-moss-600 text-xs w-6">{c.glyph}</span>
                    <span className="text-xs text-surface-600 flex-1">{c.label}</span>
                    <button onClick={() => removeComponent(c.key)}><Trash2 size={12} className="text-surface-400 hover:text-danger-500" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bench condition */}
          <div className="card p-3">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Bench Condition</p>
            <label className="text-xs text-surface-600 block mb-1">Noise: {Math.round(bench.noise * 100)}%</label>
            <input type="range" min="0" max="1" step="0.02" value={bench.noise} onChange={(e) => setBench((b) => ({ ...b, noise: Number(e.target.value) }))} className="w-full accent-moss-600 mb-2" />
            <button onClick={() => setBench((b) => ({ ...b, faulty: !b.faulty }))}
              className={`w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${bench.faulty ? 'bg-danger-100 text-danger-600' : 'bg-surface-100 text-surface-500'}`}>
              {bench.faulty ? '⚠ Fault injected' : 'Inject fault'}
            </button>
          </div>
        </div>

        {/* CENTER — workspace */}
        <div className="space-y-4 min-w-0">
          {/* Signal flow */}
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Activity size={14} className="text-moss-600" />
              <span className="text-xs font-bold text-surface-500 uppercase tracking-wide">Signal Flow</span>
            </div>
            <SignalFlow bench={bench} active={active} circuit={circuit} />
          </div>

          {/* Guided experiment banner */}
          {mode === 'guided' && (
            <div className="card p-4 border-primary-100 bg-primary-50/40">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <GraduationCap size={15} className="text-primary-600" />
                <span className="text-xs font-bold text-surface-600 uppercase tracking-wide">Guided Experiment</span>
                <select value={experimentId} onChange={(e) => setExperimentId(e.target.value)}
                  className="ml-auto text-xs font-medium bg-white border border-surface-200 rounded-lg px-2 py-1 outline-none">
                  {guidedExperiments.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <ol className="space-y-1 mb-3">
                {experiment.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-surface-600">
                    <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {workbenchDone ? (
                <p className="text-xs font-semibold text-success-600 flex items-center gap-1.5"><CheckCircle2 size={14} /> Experiment completed</p>
              ) : (
                <button onClick={completeExperiment} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Mark Complete · +40 XP
                </button>
              )}
            </div>
          )}

          {/* Active instrument chassis */}
          <AnimatePresence mode="wait">
            <motion.div key={activeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <ActiveComp bench={bench} setBench={setBench} />
            </motion.div>
          </AnimatePresence>

          {/* Challenge panel */}
          {mode === 'challenge' && task && (
            <div className={`card p-4 ${taskDone ? 'border-success-200 bg-success-50/50' : 'border-amber-200 bg-amber-50/40'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className={taskDone ? 'text-success-600' : 'text-amber-600'} />
                <span className="text-xs font-bold uppercase tracking-wide text-surface-600">Lab Task · {active.name}</span>
              </div>
              <p className="text-sm text-surface-600 mb-3">{task.goal}</p>
              {taskDone ? (
                claimed[activeId]
                  ? <p className="text-sm font-semibold text-success-600 flex items-center gap-1.5"><CheckCircle2 size={15} /> Completed — nice work!</p>
                  : <button onClick={claimReward} className="btn-moss text-sm flex items-center gap-2 py-2 px-6"><Zap size={15} className="fill-current" /> Claim +120 XP</button>
              ) : <p className="text-xs text-amber-600 font-medium">Adjust the instruments to meet the goal…</p>}
            </div>
          )}

          {/* Instrument tray (bottom dock) */}
          <div className="card p-3">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 px-1">Instrument Tray</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {INSTRUMENTS.map((inst) => (
                <button key={inst.id} onClick={() => setActiveId(inst.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl border-2 transition-all min-w-[84px] ${activeId === inst.id ? 'border-moss-500 bg-moss-50' : 'border-surface-200 bg-white hover:border-moss-300'}`}>
                  <span className="text-xl">{inst.icon}</span>
                  <span className={`text-[11px] font-semibold whitespace-nowrap ${activeId === inst.id ? 'text-moss-700' : 'text-surface-500'}`}>{inst.short}</span>
                  {inst.role === 'source' && <span className="text-[8px] font-bold uppercase px-1 rounded bg-amber-100 text-amber-600">SRC</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — AI tutor (persistent) */}
        <div className="hidden lg:block sticky top-5">
          <div className="card overflow-hidden" style={{ height: 'calc(100vh - 110px)', minHeight: 580 }}>
            <AITutor bench={bench} activeInstrument={activeId} event={tutorEvent} />
          </div>
        </div>
      </div>

      {/* Mobile tutor drawer */}
      <AnimatePresence>
        {tutorOpen && (
          <>
            <motion.div className="fixed inset-0 bg-surface-900/40 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTutorOpen(false)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl overflow-hidden shadow-glass-xl"
              style={{ height: '85vh' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                <span className="font-bold text-surface-800 flex items-center gap-2"><Bot size={18} className="text-moss-600" /> Lab Tutor</span>
                <button onClick={() => setTutorOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={18} /></button>
              </div>
              <div style={{ height: 'calc(85vh - 53px)' }}>
                <AITutor bench={bench} activeInstrument={activeId} event={tutorEvent} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkbenchPage;
