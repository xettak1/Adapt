import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, Target } from 'lucide-react';
import { LabSlider, PowerButton } from './LabControl';
import useAnimationTime from '../../hooks/useAnimationTime';

const W = 480, H = 260;

/* Teach-me step definitions */
const teachSteps = [
  { key: 'power', text: 'Press POWER ON to start the oscilloscope. Instruments need a warm-up before accurate readings.' },
  { key: 'vscale', text: 'Adjust the Vertical Scale (volts/div) so the waveform fills ~80% of the screen without clipping.' },
  { key: 'timebase', text: 'Set the Time Base (time/div) to display 2–3 complete cycles for easy reading.' },
  { key: 'trigger', text: 'Move the Trigger Level into the middle of the signal to lock the waveform in place.' },
  { key: 'done', text: 'Perfect! A stable, well-scaled waveform is ready for measurement. You are an Oscilloscope Explorer!' },
];

const Oscilloscope = ({ mode, onChallengeComplete }) => {
  const [power, setPower] = useState(false);
  const [vScale, setVScale] = useState(1.0); // volts/div
  const [timeBase, setTimeBase] = useState(1.0); // ms/div
  const [trigger, setTrigger] = useState(50); // 0-100
  const [freq] = useState(2.0);
  const [teachStep, setTeachStep] = useState(0);

  const t = useAnimationTime(power);

  // Waveform stability: stable when trigger is centred
  const triggerStable = trigger >= 40 && trigger <= 60;
  const cycles = 4 / timeBase;
  const amplitude = (H / 2.6) / vScale;

  const points = useMemo(() => {
    if (!power) return '';
    const drift = triggerStable ? 0 : t * 3;
    return Array.from({ length: 160 }, (_, i) => {
      const x = (i / 159) * W;
      const y = H / 2 - Math.sin((i / 159) * Math.PI * 2 * cycles + drift) * Math.min(amplitude, H / 2.2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [power, cycles, amplitude, triggerStable, t]);

  const triggerY = H - (trigger / 100) * H;

  // Challenge: stabilize the waveform
  const challengeDone = mode === 'challenge' && power && triggerStable && vScale <= 1.2 && vScale >= 0.6;

  // Teach-me highlight
  const hl = (key) => mode === 'teach' && teachSteps[teachStep]?.key === key;

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      {/* Screen */}
      <div>
        <div className="rounded-3xl bg-[#0c1410] p-4 lab-screen border border-moss-900">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-xl">
            {/* grid */}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={(i / 10) * W} y1="0" x2={(i / 10) * W} y2={H} stroke="rgba(94,141,78,0.15)" strokeWidth="1" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={(i / 6) * H} x2={W} y2={(i / 6) * H} stroke="rgba(94,141,78,0.15)" strokeWidth="1" />
            ))}
            {/* center axes */}
            <line x1={W / 2} y1="0" x2={W / 2} y2={H} stroke="rgba(94,141,78,0.4)" strokeWidth="1" />
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(94,141,78,0.4)" strokeWidth="1" />

            {power ? (
              <>
                <polyline
                  points={points}
                  fill="none"
                  stroke={triggerStable ? '#4CAF50' : '#85a373'}
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(76,175,80,0.6))' }}
                />
                <line x1="0" y1={triggerY} x2={W} y2={triggerY} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5 4" />
                <text x={W - 6} y={triggerY - 5} fill="#fbbf24" fontSize="11" textAnchor="end" fontFamily="monospace">T</text>
                {/* readouts */}
                <text x="8" y="18" fill="#4CAF50" fontSize="11" fontFamily="monospace">{vScale.toFixed(1)} V/div</text>
                <text x="8" y="32" fill="#4CAF50" fontSize="11" fontFamily="monospace">{timeBase.toFixed(1)} ms/div</text>
                <text x={W - 8} y="18" fill={triggerStable ? '#4CAF50' : '#fbbf24'} fontSize="11" textAnchor="end" fontFamily="monospace">
                  {triggerStable ? 'TRIG: LOCKED' : 'TRIG: SEARCHING'}
                </text>
              </>
            ) : (
              <text x={W / 2} y={H / 2} fill="rgba(94,141,78,0.5)" fontSize="14" textAnchor="middle" fontFamily="monospace">— NO SIGNAL —</text>
            )}
          </svg>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mt-3 px-1">
          <PowerButton on={power} onClick={() => { setPower((p) => !p); if (!power && mode === 'teach' && teachStep === 0) setTeachStep(1); }} />
          <span className="text-xs text-surface-400 font-mono">CH1 · {freq.toFixed(1)} MHz · 50Ω</span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <LabSlider label="Vertical Scale" value={vScale} min={0.2} max={3} step={0.1} unit=" V/div" onChange={(v) => { setVScale(v); if (hl('vscale')) setTeachStep(2); }} highlight={hl('vscale')} />
        <LabSlider label="Time Base" value={timeBase} min={0.2} max={3} step={0.1} unit=" ms/div" onChange={(v) => { setTimeBase(v); if (hl('timebase')) setTeachStep(3); }} highlight={hl('timebase')} />
        <LabSlider label="Trigger Level" value={trigger} min={0} max={100} step={1} unit="%" onChange={(v) => { setTrigger(v); if (hl('trigger') && v >= 40 && v <= 60) setTeachStep(4); }} highlight={hl('trigger')} />

        {/* Teach me panel */}
        {mode === 'teach' && (
          <motion.div
            key={teachStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-moss-50 border border-moss-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-moss-600" />
              <span className="text-xs font-bold text-moss-700 uppercase tracking-wide">Step {Math.min(teachStep + 1, teachSteps.length)} / {teachSteps.length}</span>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">{teachSteps[teachStep]?.text}</p>
          </motion.div>
        )}

        {/* Challenge panel */}
        {mode === 'challenge' && (
          <div className={`p-4 rounded-2xl border ${challengeDone ? 'bg-success-50 border-success-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className={challengeDone ? 'text-success-600' : 'text-amber-600'} />
              <span className="text-xs font-bold uppercase tracking-wide text-surface-600">Challenge</span>
            </div>
            <p className="text-sm text-surface-600 mb-3">Power on and adjust the controls until the waveform is stable and well-scaled.</p>
            {challengeDone ? (
              <motion.button
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={() => onChallengeComplete?.('trigger-master')}
                className="w-full btn-moss text-sm flex items-center justify-center gap-2 py-2"
              >
                <CheckCircle2 size={15} /> Claim Reward
              </motion.button>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {!power ? '○ Turn on the power' : !triggerStable ? '○ Center the trigger level' : '○ Adjust vertical scale (0.6–1.2 V/div)'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Oscilloscope;
