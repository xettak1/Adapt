import { useMemo, useState, useRef, useCallback } from 'react';
import { Chassis, Screen, Knob, HwButton, Led } from './hardware';
import useAnimationTime from '../../hooks/useAnimationTime';
import { measure, formatFreq, harmonicWeight, freqToPos, posToFreq, sidebands, occupiedBandwidth } from './benchUtils';

const W = 520, H = 250, BINS = 96;
const ACCENT = '#a78bfa';

const binFor = (f, centerF, spanDec) => {
  if (f <= 0) return -1;
  const rel = Math.log10(f / centerF) / spanDec;
  return Math.round((rel + 0.5) * (BINS - 1));
};
const freqAtFrac = (frac, centerF, spanDec) => centerF * Math.pow(10, (frac - 0.5) * spanDec);

const SpectrumAnalyzerHW = ({ bench }) => {
  const [center, setCenter] = useState(bench.frequency);
  const [span, setSpan] = useState(2);
  const [marker, setMarker] = useState(0.5);
  const m = measure(bench);
  const t = useAnimationTime(true);
  const hw = harmonicWeight(bench.waveform);
  const screenRef = useRef(null);
  const dragging = useRef(false);

  const spectrum = useMemo(() => {
    const carrierBin = binFor(bench.frequency, center, span);
    const arr = Array.from({ length: BINS }, (_, i) => {
      let mag = bench.noise * (8 + Math.abs(Math.sin(i * 1.7 + t * 4)) * 7);
      if (m.live) {
        mag += Math.exp(-Math.pow(i - carrierBin, 2) / 2.2) * 96;
        [2, 3, 4, 5].forEach((h) => {
          const b = binFor(bench.frequency * h, center, span);
          mag += Math.exp(-Math.pow(i - b, 2) / 1.8) * 60 * hw / h;
        });
      }
      return mag;
    });
    if (m.live) {
      sidebands(bench).forEach((sb) => {
        const f = bench.frequency * (1 + sb.ratio);
        const b = binFor(f, center, span);
        for (let i = 0; i < BINS; i++) arr[i] += Math.exp(-Math.pow(i - b, 2) / 1.4) * 70 * sb.mag;
      });
    }
    return arr.map((v) => Math.min(100, v));
  }, [bench.frequency, bench.noise, bench.waveform, bench.modType, bench.modDepth, bench.modIndex, bench.modRate, center, span, hw, m.live, t]);

  const peakBin = spectrum.indexOf(Math.max(...spectrum));
  const noiseFloor = Math.round(bench.noise * 100 * 0.6 + 6);
  const obw = occupiedBandwidth(bench);
  const signalPower = m.live ? (10 * Math.log10(Math.pow(bench.amplitude / 2, 2) / 50 * 1000)).toFixed(1) : null; // dBm into 50Ω

  const markerFreq = freqAtFrac(marker, center, span);
  const markerLevel = Math.round(spectrum[Math.min(BINS - 1, Math.max(0, Math.round(marker * (BINS - 1))))] || 0);

  const onMove = useCallback((e) => {
    if (!dragging.current || !screenRef.current) return;
    const r = screenRef.current.getBoundingClientRect();
    setMarker(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  }, []);
  const stop = useCallback(() => { dragging.current = false; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', stop); }, [onMove]);
  const start = (e) => { e.preventDefault(); dragging.current = true; window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', stop); };

  return (
    <Chassis model="FSV-Spectrum Analyzer" subtitle="10 Hz – 6 GHz · RBW auto" accent={ACCENT}
      badges={<Led on={m.live} color={ACCENT} label="SWEEP" />}
      screen={
        <div ref={screenRef} className="relative">
          <Screen width={W} height={H} divX={10} divY={8}>
            {spectrum.map((mag, i) => {
              const barW = W / BINS, barH = (mag / 100) * (H - 22);
              const isPeak = i === peakBin && m.live;
              return <rect key={i} x={i * barW + 0.4} y={H - barH} width={barW - 0.8} height={barH} rx="1" fill={isPeak ? '#4CAF50' : ACCENT} opacity={isPeak ? 1 : 0.5} />;
            })}
            <line x1="0" y1={H - (noiseFloor / 100) * (H - 22)} x2={W} y2={H - (noiseFloor / 100) * (H - 22)} stroke="#fb923c" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            {m.live && <text x={(peakBin / BINS) * W} y="14" fill="#4CAF50" fontSize="10" textAnchor="middle" fontFamily="monospace">▼ {formatFreq(bench.frequency)}</text>}
            <text x="6" y={H - 6} fill="rgba(167,139,250,0.7)" fontSize="9" fontFamily="monospace">CF {formatFreq(center)} · SPAN {span} dec</text>
          </Screen>
          {/* draggable marker */}
          <div className="absolute top-0 bottom-0" style={{ left: `${marker * 100}%` }}>
            <div className="absolute top-0 bottom-0 w-px bg-amber-400" />
            <div onPointerDown={start} className="absolute -top-0.5 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 cursor-ew-resize" style={{ boxShadow: '0 0 6px rgba(0,0,0,0.5)' }} />
          </div>
          <div className="absolute bottom-1 right-2 px-2 py-1 rounded-md text-[10px] font-mono" style={{ background: 'rgba(10,13,10,0.85)', color: '#fbbf24' }}>
            M1 {formatFreq(markerFreq)} · −{Math.max(0, 100 - markerLevel)} dBm
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {[
          { l: 'Peak', v: m.live ? formatFreq(bench.frequency) : '—' },
          { l: 'Signal Pwr', v: signalPower ? `${signalPower} dBm` : '—' },
          { l: 'Occ. BW', v: m.live ? formatFreq(obw) : '—' },
          { l: 'Harmonics', v: hw > 0.3 ? 'rich' : hw > 0.1 ? 'some' : 'low' },
        ].map((x) => (
          <div key={x.l} className="rounded-lg px-2 py-1.5 text-center" style={{ background: '#14171a' }}>
            <p className="text-[9px] font-mono uppercase text-surface-400">{x.l}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: ACCENT }}>{x.v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="rounded-xl p-3 flex items-start gap-4" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
          <Knob label="Center Freq" value={freqToPos(center)} min={0} max={1} step={0.002} onChange={(p) => setCenter(Math.round(posToFreq(p)))} color={ACCENT} size={60} format={() => formatFreq(center)} />
          <Knob label="Span" value={span} min={0.5} max={4} step={0.1} onChange={setSpan} color={ACCENT} size={54} unit=" dec" />
        </div>
        <div className="flex flex-col gap-2 self-center">
          <HwButton active onClick={() => setCenter(bench.frequency)} accent={ACCENT}>Peak → Center</HwButton>
          <HwButton active onClick={() => setMarker((peakBin) / (BINS - 1) || 0.5)} accent="#fbbf24">Marker → Peak</HwButton>
        </div>
      </div>
    </Chassis>
  );
};

export default SpectrumAnalyzerHW;
