import { useState, useMemo } from 'react';
import { Chassis, Screen, Knob, HwButton, Led } from './hardware';
import useAnimationTime from '../../hooks/useAnimationTime';
import { sample, formatFreq } from './benchUtils';

const W = 520, H = 230;
const ACCENT = '#34d399';
const CH_COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#f472b6'];

// Derive 4 digital channels from the bench: D0 = comparator on the analog
// signal, D1 = half-rate clock, D2 = quarter divider, D3 = a simple data bus.
const channels = (bench, t, threshold, samples, divisor) => {
  const out = [[], [], [], []];
  let lastClk = 0, d2 = 0, prevClkEdge = 0;
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    const analog = sample(bench, u, t / 6, 6);
    const d0 = analog > threshold ? 1 : 0;
    const clk = Math.floor(u * divisor) % 2; // square clock
    if (clk === 1 && lastClk === 0) { d2 ^= 1; prevClkEdge = i; } // toggle on rising edge
    lastClk = clk;
    const d3 = (Math.floor(u * divisor * 2) % 3 === 0) ? 1 : 0; // pseudo data
    out[0].push(d0); out[1].push(clk); out[2].push(d2); out[3].push(d3);
  }
  return out;
};

const digitalPath = (vals, yMid, amp) => {
  const n = vals.length;
  let d = '';
  vals.forEach((v, i) => {
    const x = (i / (n - 1)) * W;
    const y = yMid - (v ? amp : -amp);
    if (i === 0) d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const prevY = yMid - (vals[i - 1] ? amp : -amp);
      if (prevY !== y) d += ` L ${x.toFixed(1)} ${prevY.toFixed(1)}`;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  return d;
};

const LogicAnalyzerHW = ({ bench }) => {
  const [threshold, setThreshold] = useState(0);
  const [divisor, setDivisor] = useState(8);
  const [running, setRunning] = useState(true);
  const live = bench.genOn && bench.connected && running;
  const t = useAnimationTime(live);
  const SAMPLES = 180;

  const chans = useMemo(() => (live ? channels(bench, t, threshold, SAMPLES, divisor) : [[], [], [], []]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, bench.waveform, bench.amplitude, bench.frequency, bench.modType, threshold, divisor, t]);

  const rowH = H / 4;
  const labels = ['D0 · signal', 'D1 · clock', 'D2 · ÷2', 'D3 · data'];
  const busValue = live ? ((chans[2][SAMPLES - 1] << 1) | chans[3][SAMPLES - 1]) : 0;

  return (
    <Chassis model="MXO-Logic Analyzer" subtitle="4-CH digital · 100 MSa/s · timing + bus" accent={ACCENT}
      badges={<Led on={live} color={ACCENT} label="ACQ" />}
      screen={
        <Screen width={W} height={H} divX={12} divY={4}>
          {live ? (
            <>
              {chans.map((vals, ch) => {
                const yMid = ch * rowH + rowH / 2;
                return (
                  <g key={ch}>
                    <text x="6" y={yMid - rowH / 2 + 12} fill={CH_COLORS[ch]} fontSize="10" fontFamily="monospace">{labels[ch]}</text>
                    <path d={digitalPath(vals, yMid, rowH * 0.28)} fill="none" stroke={CH_COLORS[ch]} strokeWidth="1.8" style={{ filter: `drop-shadow(0 0 2px ${CH_COLORS[ch]}aa)` }} />
                  </g>
                );
              })}
              <line x1="0" y1={rowH * (threshold + 1) / 2 * 0 + 0} x2="0" y2={H} stroke="transparent" />
            </>
          ) : (
            <text x={W / 2} y={H / 2} fill="rgba(94,141,78,0.5)" fontSize="13" textAnchor="middle" fontFamily="monospace">{running ? '— NO DIGITAL ACTIVITY —' : '■ STOPPED'}</text>
          )}
        </Screen>
      }
    >
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { l: 'Clock', v: live ? formatFreq(bench.frequency / divisor) : '—' },
          { l: 'Bus [D2:D3]', v: live ? `0b${busValue.toString(2).padStart(2, '0')} (${busValue})` : '—' },
          { l: 'Edges', v: live ? 'rising' : '—' },
        ].map((x) => (
          <div key={x.l} className="rounded-lg px-2 py-1.5 text-center" style={{ background: '#14171a' }}>
            <p className="text-[9px] font-mono uppercase text-surface-400">{x.l}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: ACCENT }}>{x.v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="rounded-xl p-3 flex items-start gap-4" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
          <Knob label="Threshold" value={threshold} min={-1} max={1} step={0.05} onChange={setThreshold} color={ACCENT} size={56} unit=" V" />
          <Knob label="Clock ÷" value={divisor} min={2} max={32} step={1} onChange={setDivisor} color={ACCENT} size={56} unit="" />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-surface-400 max-w-[200px] leading-relaxed">
            D0 is the analog signal squared up by the comparator at the <strong>threshold</strong>. D1 is the sampling clock; D2 divides it; D3 is a data line — together a tiny digital bus.
          </p>
          <HwButton active={running} onClick={() => setRunning((r) => !r)} accent={running ? '#4CAF50' : '#f43f5e'}>{running ? 'Run' : 'Stop'}</HwButton>
        </div>
      </div>
    </Chassis>
  );
};

export default LogicAnalyzerHW;
