import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Chassis, Knob, HwButton, Led } from './hardware';
import { formatFreq, freqToPos, posToFreq } from './benchUtils';

const ACCENT = '#f472b6';
const DUTS = [{ id: 'bandpass', label: 'Band-Pass' }, { id: 'lowpass', label: 'Low-Pass' }, { id: 'highpass', label: 'High-Pass' }];
const VIEWS = [{ id: 'mag', label: 'Magnitude' }, { id: 'smith', label: 'Smith' }, { id: 'phase', label: 'Phase' }];

const sParams = (f, fc, bw, type) => {
  const x = (f - fc) / (bw / 2);
  let s21;
  if (type === 'bandpass') s21 = -10 * Math.log10(1 + x * x);
  else if (type === 'lowpass') s21 = f <= fc ? -0.5 : -10 * Math.log10(1 + Math.pow((f - fc) / (bw / 2), 2));
  else s21 = f >= fc ? -0.5 : -10 * Math.log10(1 + Math.pow((fc - f) / (bw / 2), 2));
  s21 = Math.max(-40, s21);
  const transmitted = Math.pow(10, s21 / 10);
  const s11dB = Math.max(-35, 10 * Math.log10(Math.max(0.0003, 1 - transmitted * 0.97)));
  const gammaMag = Math.pow(10, s11dB / 20);
  const theta = Math.atan2(x, 1); // reflection phase sweeps with detuning
  return {
    s21: Number(s21.toFixed(2)), s11: Number(s11dB.toFixed(2)),
    gRe: gammaMag * Math.cos(theta * 2), gIm: gammaMag * Math.sin(theta * 2),
    s21Phase: Number((-Math.atan(x) * (180 / Math.PI)).toFixed(1)),
  };
};

const SmithChart = ({ data, markerIdx }) => {
  const S = 240, R = 100, cx = S / 2, cy = S / 2;
  const pts = data.map((d) => `${cx + d.gRe * R},${cy - d.gIm * R}`).join(' ');
  const mk = data[markerIdx];
  return (
    <svg width="100%" viewBox={`0 0 ${S} ${S}`} style={{ maxHeight: 250 }}>
      <rect x="0" y="0" width={S} height={S} fill="#0a0d0a" rx="8" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(94,141,78,0.4)" strokeWidth="1.2" />
      {/* constant-resistance circles */}
      {[0.5, 1, 2].map((r) => {
        const rr = R / (1 + r), ccx = cx + (R - rr);
        return <circle key={r} cx={ccx} cy={cy} r={rr} fill="none" stroke="rgba(94,141,78,0.18)" strokeWidth="1" />;
      })}
      {/* reactance arcs (horizontal axis) */}
      <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="rgba(94,141,78,0.18)" strokeWidth="1" />
      <polyline points={pts} fill="none" stroke={ACCENT} strokeWidth="2" />
      {mk && <circle cx={cx + mk.gRe * R} cy={cy - mk.gIm * R} r="4" fill="#fbbf24" />}
      <text x={cx + R - 4} y={cy - 6} fill="rgba(94,141,78,0.7)" fontSize="9" textAnchor="end" fontFamily="monospace">open</text>
      <text x={cx - R + 4} y={cy - 6} fill="rgba(94,141,78,0.7)" fontSize="9" fontFamily="monospace">short</text>
      <text x={cx} y={cy + R - 6} fill="#fbbf24" fontSize="9" textAnchor="middle" fontFamily="monospace">Γ locus · ● = center freq</text>
    </svg>
  );
};

const VNAHW = ({ bench }) => {
  const [fc, setFc] = useState(bench.frequency || 1e6);
  const [bw, setBw] = useState((bench.frequency || 1e6) * 0.4);
  const [dut, setDut] = useState('bandpass');
  const [view, setView] = useState('mag');

  const data = useMemo(() => {
    const start = fc * 0.1, end = fc * 2.2;
    return Array.from({ length: 80 }, (_, i) => {
      const f = start + (i / 79) * (end - start);
      return { f, ...sParams(f, fc, bw, dut) };
    });
  }, [fc, bw, dut]);

  const atFc = sParams(fc, fc, bw, dut);
  const gammaMag = Math.pow(10, atFc.s11 / 20);
  const vswr = ((1 + gammaMag) / Math.max(0.001, 1 - gammaMag)).toFixed(2);
  const markerIdx = data.reduce((best, d, i) => (Math.abs(d.f - fc) < Math.abs(data[best].f - fc) ? i : best), 0);

  return (
    <Chassis model="ZNL-Vector Network Analyzer" subtitle="2-port · S11 / S21 · 9 kHz – 6 GHz" accent={ACCENT}
      badges={<Led on color={ACCENT} label="2-PORT" />}
      screen={
        <div className="bg-[#0a0d0a] rounded-xl p-2" style={{ minHeight: 250 }}>
          {view === 'smith' ? (
            <SmithChart data={data} markerIdx={markerIdx} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(94,141,78,0.18)" strokeDasharray="3 3" />
                <XAxis dataKey="f" tickFormatter={(f) => formatFreq(f)} tick={{ fontSize: 9, fill: '#7c8a7a', fontFamily: 'monospace' }} axisLine={{ stroke: '#2a3a2a' }} minTickGap={40} />
                <YAxis domain={view === 'phase' ? [-100, 100] : [-40, 3]} tick={{ fontSize: 9, fill: '#7c8a7a', fontFamily: 'monospace' }} axisLine={{ stroke: '#2a3a2a' }} />
                <Tooltip contentStyle={{ background: '#0c100c', border: '1px solid #2a3a2a', borderRadius: 8, fontSize: 11 }} labelFormatter={(f) => formatFreq(f)} formatter={(v, n) => [`${v}${view === 'phase' ? '°' : ' dB'}`, n]} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#7c8a7a' }} />
                <ReferenceLine x={fc} stroke="#fb923c" strokeDasharray="4 4" />
                {view === 'phase' ? (
                  <Line type="monotone" dataKey="s21Phase" name="∠S21 (phase)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                ) : (
                  <>
                    <Line type="monotone" dataKey="s21" name="S21 (transmission)" stroke="#4CAF50" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="s11" name="S11 (reflection)" stroke={ACCENT} strokeWidth={2} dot={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
        {[
          { l: 'Insertion Loss', v: `${Math.abs(atFc.s21).toFixed(2)} dB` },
          { l: 'Return Loss', v: `${Math.abs(atFc.s11).toFixed(1)} dB` },
          { l: 'VSWR', v: `${vswr} : 1` },
          { l: 'Bandwidth', v: formatFreq(bw) },
        ].map((x) => (
          <div key={x.l} className="rounded-lg px-2 py-1.5 text-center" style={{ background: '#14171a' }}>
            <p className="text-[9px] font-mono uppercase text-surface-400">{x.l}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: ACCENT }}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5 flex-wrap">{DUTS.map((d) => <HwButton key={d.id} active={dut === d.id} onClick={() => setDut(d.id)} accent={ACCENT}>{d.label}</HwButton>)}</div>
          <div className="flex gap-1.5">{VIEWS.map((v) => <HwButton key={v.id} active={view === v.id} onClick={() => setView(v.id)} accent="#38bdf8">{v.label}</HwButton>)}</div>
        </div>
        <div className="rounded-xl p-3 flex items-start gap-4" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
          <Knob label="Center" value={freqToPos(fc)} min={0} max={1} step={0.002} onChange={(p) => setFc(Math.round(posToFreq(p)))} color={ACCENT} size={54} format={() => formatFreq(fc)} />
          <Knob label="Bandwidth" value={freqToPos(bw)} min={0} max={1} step={0.002} onChange={(p) => setBw(Math.round(posToFreq(p)))} color={ACCENT} size={54} format={() => formatFreq(bw)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mt-4">
        {[
          { t: 'Return Loss & VSWR', d: 'VSWR = (1+|Γ|)/(1−|Γ|). 1:1 is a perfect match; the better the return loss (more negative S11), the lower the VSWR.' },
          { t: 'Smith Chart', d: 'A map of the complex reflection coefficient Γ. The center is a perfect 50 Ω match; the rim is total reflection.' },
          { t: 'Phase (∠S21)', d: 'How much the signal is delayed through the DUT. Rapid phase change near the band edge means strong group delay.' },
        ].map((c) => (
          <div key={c.t} className="rounded-xl p-3 bg-surface-50 border border-surface-100">
            <p className="text-xs font-bold text-surface-700 mb-1">{c.t}</p>
            <p className="text-[11px] text-surface-500 leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>
    </Chassis>
  );
};

export default VNAHW;
