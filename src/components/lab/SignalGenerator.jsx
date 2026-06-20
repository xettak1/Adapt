import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Target, Lightbulb } from 'lucide-react';
import { LabSlider, PowerButton } from './LabControl';
import useAnimationTime from '../../hooks/useAnimationTime';

const W = 480, H = 220;

const waveforms = [
  { id: 'sine', label: 'Sine', emoji: '〰️' },
  { id: 'square', label: 'Square', emoji: '⊓' },
  { id: 'triangle', label: 'Triangle', emoji: '△' },
  { id: 'sawtooth', label: 'Sawtooth', emoji: '◣' },
];

const waveValue = (type, phase) => {
  const p = phase % (Math.PI * 2);
  switch (type) {
    case 'square': return Math.sin(p) >= 0 ? 1 : -1;
    case 'triangle': return (2 / Math.PI) * Math.asin(Math.sin(p));
    case 'sawtooth': return (p / Math.PI) - 1;
    default: return Math.sin(p);
  }
};

const SignalGenerator = ({ mode, onChallengeComplete }) => {
  const [power, setPower] = useState(true);
  const [freq, setFreq] = useState(1.0); // MHz
  const [amplitude, setAmplitude] = useState(2.0); // Vpp
  const [waveform, setWaveform] = useState('sine');

  const t = useAnimationTime(power);
  const cycles = freq * 3;
  const amp = (amplitude / 5) * (H / 2.4);

  const points = useMemo(() => {
    if (!power) return '';
    return Array.from({ length: 200 }, (_, i) => {
      const x = (i / 199) * W;
      const phase = (i / 199) * Math.PI * 2 * cycles + t * 2;
      const y = H / 2 - waveValue(waveform, phase) * amp;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [power, cycles, amp, waveform, t]);

  // Challenge: configure to 2 MHz square wave
  const challengeDone = mode === 'challenge' && power && Math.abs(freq - 2) < 0.05 && waveform === 'square';

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      {/* Output screen */}
      <div>
        <div className="rounded-3xl bg-[#0c1410] p-4 lab-screen border border-moss-900">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-xl">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={(i / 10) * W} y1="0" x2={(i / 10) * W} y2={H} stroke="rgba(94,141,78,0.12)" strokeWidth="1" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={(i / 4) * H} x2={W} y2={(i / 4) * H} stroke="rgba(94,141,78,0.12)" strokeWidth="1" />
            ))}
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(94,141,78,0.4)" strokeWidth="1" />
            {power ? (
              <>
                <polyline points={points} fill="none" stroke="#4CAF50" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 4px rgba(76,175,80,0.6))' }} />
                <text x="8" y="18" fill="#4CAF50" fontSize="11" fontFamily="monospace">{freq.toFixed(2)} MHz</text>
                <text x="8" y="32" fill="#4CAF50" fontSize="11" fontFamily="monospace">{amplitude.toFixed(1)} Vpp</text>
                <text x={W - 8} y="18" fill="#4CAF50" fontSize="11" textAnchor="end" fontFamily="monospace">{waveform.toUpperCase()}</text>
              </>
            ) : (
              <text x={W / 2} y={H / 2} fill="rgba(94,141,78,0.5)" fontSize="14" textAnchor="middle" fontFamily="monospace">— OUTPUT DISABLED —</text>
            )}
          </svg>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <PowerButton on={power} onClick={() => setPower((p) => !p)} />
          <span className="text-xs text-surface-400 font-mono">OUTPUT · 50Ω · {power ? 'ENABLED' : 'OFF'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Waveform selector */}
        <div className="p-3 rounded-2xl bg-surface-50">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-2">Waveform</span>
          <div className="grid grid-cols-2 gap-2">
            {waveforms.map((w) => (
              <button
                key={w.id}
                onClick={() => setWaveform(w.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  waveform === w.id ? 'bg-moss-600 text-white' : 'bg-white text-surface-600 hover:bg-moss-50'
                }`}
              >
                <span>{w.emoji}</span> {w.label}
              </button>
            ))}
          </div>
        </div>

        <LabSlider label="Frequency" value={freq} min={0.1} max={5} step={0.1} unit=" MHz" onChange={setFreq} />
        <LabSlider label="Amplitude" value={amplitude} min={0.5} max={5} step={0.1} unit=" Vpp" onChange={setAmplitude} />

        {mode === 'teach' && (
          <div className="p-4 rounded-2xl bg-moss-50 border border-moss-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-moss-600" />
              <span className="text-xs font-bold text-moss-700 uppercase tracking-wide">Guided Tour</span>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">
              The signal generator creates test signals. <strong>Frequency</strong> sets how fast the wave repeats,
              <strong> amplitude</strong> sets its height (Vpp), and the <strong>waveform type</strong> changes its shape.
              Try switching to a square wave and watch the output transform instantly.
            </p>
          </div>
        )}

        {mode === 'challenge' && (
          <div className={`p-4 rounded-2xl border ${challengeDone ? 'bg-success-50 border-success-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className={challengeDone ? 'text-success-600' : 'text-amber-600'} />
              <span className="text-xs font-bold uppercase tracking-wide text-surface-600">Challenge</span>
            </div>
            <p className="text-sm text-surface-600 mb-3">Configure the generator to output a <strong>2 MHz square wave</strong>.</p>
            {challengeDone ? (
              <motion.button
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                onClick={() => onChallengeComplete?.('signal-detective')}
                className="w-full btn-moss text-sm flex items-center justify-center gap-2 py-2"
              >
                <CheckCircle2 size={15} /> Claim Reward
              </motion.button>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {waveform !== 'square' ? '○ Select the Square waveform' : '○ Set frequency to 2.0 MHz'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalGenerator;
