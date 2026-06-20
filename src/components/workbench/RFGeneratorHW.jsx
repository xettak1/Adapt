import { useMemo, useState } from 'react';
import { Chassis, Screen, Knob, HwButton, SegmentDisplay, Led } from './hardware';
import useAnimationTime from '../../hooks/useAnimationTime';
import { sample, formatFreq, WAVEFORMS, MOD_TYPES, freqToPos, posToFreq, FREQ_MIN, FREQ_MAX } from './benchUtils';

const FREQ_PRESETS = [
  { label: '1 kHz',   hz: 1_000 },
  { label: '100 kHz', hz: 100_000 },
  { label: '1 MHz',   hz: 1_000_000 },
  { label: '10 MHz',  hz: 10_000_000 },
  { label: '100 MHz', hz: 100_000_000 },
  { label: '1 GHz',   hz: 1_000_000_000 },
];

const W = 460, H = 120;
const ACCENT = '#38bdf8';

const RFGeneratorHW = ({ bench, setBench }) => {
  const t = useAnimationTime(bench.genOn);
  const [freqInput, setFreqInput] = useState('');

  const setFrequency = (hz) => {
    const clamped = Math.round(Math.min(FREQ_MAX, Math.max(FREQ_MIN, hz)));
    setBench((b) => ({ ...b, frequency: clamped }));
  };

  const commitFreqInput = () => {
    if (!freqInput.trim()) { setFreqInput(''); return; }
    // Accept values like "2.4G", "500M", "10k", or plain Hz numbers
    const raw = freqInput.trim().toUpperCase();
    const multipliers = { G: 1e9, M: 1e6, K: 1e3 };
    const match = raw.match(/^([0-9.]+)\s*([GMK]?)$/);
    if (match) {
      const num = parseFloat(match[1]) * (multipliers[match[2]] || 1);
      if (!isNaN(num)) setFrequency(num);
    }
    setFreqInput('');
  };
  const amp = (bench.amplitude / 4) * (H / 2.4);
  const offsetPx = (bench.offset / 4) * (H / 2.4);

  const points = useMemo(() => {
    if (!bench.genOn) return '';
    return Array.from({ length: 240 }, (_, i) => {
      const x = (i / 239) * W;
      const y = H / 2 - sample(bench, i / 239, t, 3) * amp - offsetPx;
      return `${x.toFixed(1)},${Math.max(2, Math.min(H - 2, y)).toFixed(1)}`;
    }).join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bench.genOn, bench.waveform, bench.dutyCycle, bench.phase, bench.modType, bench.modDepth, bench.modIndex, amp, offsetPx, t]);

  const freqStr = formatFreq(bench.frequency);
  const [freqNum, freqUnit] = freqStr.split(' ');

  return (
    <Chassis model="SMW-RF Signal Generator" subtitle="1 Hz – 6 GHz · −120…+13 dBm" accent={ACCENT}
      badges={<Led on={bench.genOn} color={ACCENT} label="RF OUT" />}
      screen={
        <div className="flex flex-col gap-2">
          {/* Big frequency readout */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline gap-2">
              <SegmentDisplay value={freqNum} unit={freqUnit} color={ACCENT} size="lg" ghost="0.000" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-surface-400">{bench.amplitude.toFixed(2)} Vpp · {bench.offset >= 0 ? '+' : ''}{bench.offset.toFixed(2)} V · φ{bench.phase}°</p>
              <p className="text-[10px] font-mono uppercase" style={{ color: ACCENT }}>
                {bench.waveform}{bench.waveform === 'pulse' ? ` · ${bench.dutyCycle}%` : ''}
                {bench.modType !== 'none' && <span className="text-amber-400"> · {bench.modType.toUpperCase()} {formatFreq(bench.modRate)}</span>}
              </p>
            </div>
          </div>
          {/* Preview waveform */}
          <Screen width={W} height={H} divX={12} divY={4}>
            {bench.genOn
              ? <polyline points={points} fill="none" stroke={ACCENT} strokeWidth="2.2" style={{ filter: `drop-shadow(0 0 3px ${ACCENT}aa)` }} />
              : <text x={W / 2} y={H / 2} fill="rgba(94,141,78,0.5)" fontSize="13" textAnchor="middle" fontFamily="monospace">RF OUTPUT DISABLED</text>}
          </Screen>
        </div>
      }
    >
      {/* Waveform keypad */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {WAVEFORMS.map((w) => (
          <HwButton key={w.id} active={bench.waveform === w.id} onClick={() => setBench((b) => ({ ...b, waveform: w.id }))} accent={ACCENT}>
            <span className="mr-1">{w.glyph}</span>{w.label}
          </HwButton>
        ))}
      </div>

      {/* Knob deck */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="rounded-xl p-3 flex flex-col gap-3" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34', minWidth: 220 }}>
          <div className="flex items-start gap-4">
            <Knob label="Frequency" value={freqToPos(bench.frequency)} min={0} max={1} step={0.002}
              onChange={(p) => setFrequency(posToFreq(p))}
              color={ACCENT} size={72} format={() => formatFreq(bench.frequency)} sublabel="drag or scroll" />
            <Knob label="Amplitude" value={bench.amplitude} min={0.05} max={4} step={0.05}
              onChange={(v) => setBench((b) => ({ ...b, amplitude: v }))} color={ACCENT} size={60} unit=" Vpp" />
          </div>
          {/* Log-scale slider */}
          <div>
            <input
              type="range" min={0} max={1} step={0.001}
              value={freqToPos(bench.frequency)}
              onChange={(e) => setFrequency(posToFreq(parseFloat(e.target.value)))}
              className="w-full cursor-pointer"
              style={{ accentColor: ACCENT }}
            />
            <div className="flex justify-between text-[9px] font-mono mt-0.5" style={{ color: `${ACCENT}88` }}>
              <span>1 Hz</span><span>1 kHz</span><span>1 MHz</span><span>1 GHz</span><span>6 GHz</span>
            </div>
          </div>
          {/* Direct entry */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={freqInput}
              onChange={(e) => setFreqInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitFreqInput()}
              onBlur={commitFreqInput}
              placeholder={formatFreq(bench.frequency)}
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
              style={{ background: '#0c1014', border: `1px solid ${ACCENT}44`, color: ACCENT }}
            />
            <button onClick={commitFreqInput}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
              style={{ background: ACCENT, color: '#0a0d0a' }}>SET</button>
          </div>
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1">
            {FREQ_PRESETS.map((p) => (
              <button key={p.label} onClick={() => setFrequency(p.hz)}
                className="px-2 py-0.5 rounded text-[9px] font-bold transition-colors"
                style={{
                  background: bench.frequency === p.hz ? ACCENT : '#1c2530',
                  color: bench.frequency === p.hz ? '#0a0d0a' : `${ACCENT}bb`,
                  border: `1px solid ${ACCENT}33`,
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3 flex items-start gap-4" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
          <Knob label="DC Offset" value={bench.offset} min={-4} max={4} step={0.05}
            onChange={(v) => setBench((b) => ({ ...b, offset: v }))} color={ACCENT} size={60} unit=" V" />
          <Knob label="Phase" value={bench.phase} min={0} max={360} step={1}
            onChange={(v) => setBench((b) => ({ ...b, phase: v }))} color={ACCENT} size={60} unit="°" />
          {/* Duty only applies to pulse — shown only when it has an effect. */}
          {bench.waveform === 'pulse' && (
            <Knob label="Duty" value={bench.dutyCycle} min={5} max={95} step={1}
              onChange={(v) => setBench((b) => ({ ...b, dutyCycle: v }))} color={ACCENT} size={60} unit="%" />
          )}
        </div>
        <div className="flex flex-col gap-2 self-center">
          <HwButton active={bench.genOn} onClick={() => setBench((b) => ({ ...b, genOn: !b.genOn }))} accent={bench.genOn ? '#4CAF50' : '#f43f5e'}>
            RF {bench.genOn ? 'On' : 'Off'}
          </HwButton>
        </div>
      </div>

      {/* Modulation section */}
      <div className="mt-4 rounded-xl p-3" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide text-surface-300">Modulation</span>
          <div className="flex gap-1.5">
            {MOD_TYPES.map((mt) => (
              <HwButton key={mt.id} active={bench.modType === mt.id} onClick={() => setBench((b) => ({ ...b, modType: mt.id }))} accent="#fbbf24">{mt.label}</HwButton>
            ))}
          </div>
        </div>
        {bench.modType !== 'none' && (
          <div className="flex items-start gap-4">
            <Knob label="Mod Rate" value={freqToPos(bench.modRate)} min={0} max={1} step={0.002}
              onChange={(p) => setBench((b) => ({ ...b, modRate: Math.round(posToFreq(p)) }))} color="#fbbf24" size={56} format={() => formatFreq(bench.modRate)} />
            {bench.modType === 'am' ? (
              <Knob label="AM Depth" value={bench.modDepth} min={0} max={100} step={1}
                onChange={(v) => setBench((b) => ({ ...b, modDepth: v }))} color="#fbbf24" size={56} unit="%" />
            ) : (
              <Knob label="Mod Index" value={bench.modIndex} min={0} max={6} step={0.1}
                onChange={(v) => setBench((b) => ({ ...b, modIndex: v }))} color="#fbbf24" size={56} unit="" />
            )}
            <p className="text-[11px] text-surface-400 self-center max-w-[180px] leading-relaxed">
              {bench.modType === 'am' && 'AM rides the message on the carrier amplitude — watch the envelope on the scope.'}
              {bench.modType === 'fm' && 'FM shifts the carrier frequency with the message — sidebands fan out on the spectrum.'}
              {bench.modType === 'pm' && 'PM shifts the carrier phase with the message — closely related to FM.'}
            </p>
          </div>
        )}
      </div>
    </Chassis>
  );
};

export default RFGeneratorHW;
