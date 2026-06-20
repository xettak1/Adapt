import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Target, Lightbulb } from 'lucide-react';
import { LabSlider } from './LabControl';
import useAnimationTime from '../../hooks/useAnimationTime';

const W = 480, H = 240;
const BINS = 48;

// Frequency peaks (carrier + harmonics) in "bin" positions
const buildSpectrum = (carrierBin, harmonics, noiseLevel, t) => {
  return Array.from({ length: BINS }, (_, i) => {
    let mag = 0;
    // carrier
    mag += Math.exp(-Math.pow(i - carrierBin, 2) / 2) * 95;
    // harmonics
    if (harmonics) {
      mag += Math.exp(-Math.pow(i - carrierBin * 2, 2) / 2) * 48;
      mag += Math.exp(-Math.pow(i - carrierBin * 3, 2) / 2.5) * 28;
    }
    // noise floor (animated)
    mag += noiseLevel * (8 + Math.abs(Math.sin(i * 1.3 + t * 4)) * 6);
    return Math.min(100, mag);
  });
};

const SpectrumAnalyzer = ({ mode, onChallengeComplete }) => {
  const [carrierBin, setCarrierBin] = useState(8);
  const [harmonics, setHarmonics] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(0.4);
  const [selectedBin, setSelectedBin] = useState(null);

  const t = useAnimationTime(true);
  const spectrum = useMemo(() => buildSpectrum(carrierBin, harmonics, noiseLevel, t), [carrierBin, harmonics, noiseLevel, t]);

  // The strongest peak is the carrier
  const peakBin = spectrum.indexOf(Math.max(...spectrum));
  const carrierFreq = (carrierBin / BINS) * 5; // map to 0-5 GHz

  // Challenge: identify the strongest peak
  const challengeDone = mode === 'challenge' && selectedBin !== null && Math.abs(selectedBin - carrierBin) <= 1;

  const binFreq = (i) => ((i / BINS) * 5).toFixed(2);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      <div>
        <div className="rounded-3xl bg-[#0c1410] p-4 lab-screen border border-moss-900">
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-xl">
            {/* grid */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1="0" y1={(i / 4) * H} x2={W} y2={(i / 4) * H} stroke="rgba(94,141,78,0.12)" strokeWidth="1" />
            ))}
            {/* bars */}
            {spectrum.map((mag, i) => {
              const barW = W / BINS;
              const barH = (mag / 100) * (H - 20);
              const x = i * barW;
              const isPeak = i === peakBin;
              const isSelected = selectedBin === i;
              return (
                <motion.rect
                  key={i}
                  x={x + 1}
                  y={H - barH}
                  width={barW - 2}
                  height={barH}
                  rx="1.5"
                  fill={isSelected ? '#fbbf24' : isPeak ? '#4CAF50' : '#5F8D4E'}
                  opacity={isPeak || isSelected ? 1 : 0.65}
                  onClick={() => mode === 'challenge' && setSelectedBin(i)}
                  style={{ cursor: mode === 'challenge' ? 'pointer' : 'default' }}
                />
              );
            })}
            {/* peak marker */}
            <motion.g animate={{ x: peakBin * (W / BINS) }} transition={{ type: 'spring', stiffness: 200 }}>
              <text x={W / BINS / 2} y="14" fill="#4CAF50" fontSize="10" textAnchor="middle" fontFamily="monospace">▼ {carrierFreq.toFixed(2)}GHz</text>
            </motion.g>
            <text x="8" y={H - 6} fill="rgba(94,141,78,0.6)" fontSize="9" fontFamily="monospace">0 GHz</text>
            <text x={W - 8} y={H - 6} fill="rgba(94,141,78,0.6)" fontSize="9" textAnchor="end" fontFamily="monospace">5 GHz</text>
          </svg>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs font-bold text-moss-700 font-mono">PEAK: {carrierFreq.toFixed(2)} GHz · {Math.round(spectrum[peakBin])} dB</span>
          <span className="text-xs text-surface-400 font-mono">RBW 100kHz · SPAN 5GHz</span>
        </div>
      </div>

      <div className="space-y-3">
        <LabSlider label="Carrier Frequency" value={carrierFreq} min={0.5} max={4.5} step={0.1} unit=" GHz"
          onChange={(v) => setCarrierBin(Math.round((v / 5) * BINS))} />
        <LabSlider label="Noise Floor" value={noiseLevel} min={0} max={1} step={0.05} unit=""
          format={(v) => `${Math.round(v * 100)}%`} onChange={setNoiseLevel} />

        <button
          onClick={() => setHarmonics((h) => !h)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
            harmonics ? 'bg-moss-600 text-white' : 'bg-surface-100 text-surface-500'
          }`}
        >
          Show Harmonics
          <span className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all ${harmonics ? 'bg-white/30 justify-end' : 'bg-surface-300 justify-start'}`}>
            <span className="w-4 h-4 rounded-full bg-white" />
          </span>
        </button>

        {mode === 'teach' && (
          <div className="p-4 rounded-2xl bg-moss-50 border border-moss-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-moss-600" />
              <span className="text-xs font-bold text-moss-700 uppercase tracking-wide">Guided Tour</span>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">
              A spectrum analyzer shows signal strength across <strong>frequency</strong> instead of time. The tallest
              green bar is your <strong>carrier</strong> peak. Smaller bars at 2× and 3× the carrier are
              <strong> harmonics</strong>. The fuzzy baseline is the <strong>noise floor</strong> — raise it to see how
              weak signals get buried.
            </p>
          </div>
        )}

        {mode === 'challenge' && (
          <div className={`p-4 rounded-2xl border ${challengeDone ? 'bg-success-50 border-success-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className={challengeDone ? 'text-success-600' : 'text-amber-600'} />
              <span className="text-xs font-bold uppercase tracking-wide text-surface-600">Challenge</span>
            </div>
            <p className="text-sm text-surface-600 mb-3">Click the <strong>strongest frequency peak</strong> on the display.</p>
            {challengeDone ? (
              <motion.button
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                onClick={() => onChallengeComplete?.('spectrum-hunter')}
                className="w-full btn-moss text-sm flex items-center justify-center gap-2 py-2"
              >
                <CheckCircle2 size={15} /> Claim Reward
              </motion.button>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {selectedBin === null ? '○ Tap a bar on the spectrum' : '✗ Not quite — find the tallest green bar'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;
