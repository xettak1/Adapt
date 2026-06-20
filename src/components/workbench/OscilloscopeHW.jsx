import { useState, useMemo, useRef, useCallback } from 'react';
import { Chassis, Screen, Knob, ChannelBox, HwButton, Led } from './hardware';
import useAnimationTime from '../../hooks/useAnimationTime';
import { sample, waveValue, measure, formatFreq } from './benchUtils';

const W = 520, H = 260, DIVY = 8, DIVX = 10;
const CH1 = '#facc15', CH2 = '#22d3ee';

const lpGain = (f) => 1 / Math.sqrt(1 + Math.pow(f / 1.2e6, 2));
const lpPhaseDeg = (f) => (Math.atan(f / 1.2e6) * 180) / Math.PI;

const OscilloscopeHW = ({ bench }) => {
  const [ch1, setCh1] = useState({ vDiv: 0.5, pos: 0, on: true, coupling: 'dc' });
  const [ch2, setCh2] = useState({ vDiv: 0.5, pos: -1.5, on: false, coupling: 'dc' });
  const [timeDiv, setTimeDiv] = useState(1); // ms/div
  const [trig, setTrig] = useState(0);
  const [trigSrc, setTrigSrc] = useState('ch1');
  const [running, setRunning] = useState(true);
  const [cursors, setCursors] = useState(false);
  const [cur, setCur] = useState({ a: 0.35, b: 0.65 });
  const screenRef = useRef(null);
  const dragRef = useRef(null);

  const m = measure(bench);
  const live = m.live && running;
  const t = useAnimationTime(live);
  const stable = Math.abs(trig) <= 25 && (trigSrc === 'ch1' ? ch1.on : ch2.on);
  const pxPerDiv = H / DIVY;
  const cycles = Math.max(1, 5 / timeDiv);

  const buildCh1 = () => {
    if (!live || !ch1.on) return '';
    if (ch1.coupling === 'gnd') return `0,${H / 2 - ch1.pos * pxPerDiv} ${W},${H / 2 - ch1.pos * pxPerDiv}`;
    const ampPx = (bench.amplitude / 2) / ch1.vDiv * pxPerDiv;
    const offPx = ch1.coupling === 'ac' ? 0 : (bench.offset / ch1.vDiv) * pxPerDiv;
    const drift = stable ? 0 : t * 2.5;
    return Array.from({ length: 240 }, (_, i) => {
      const noise = (Math.random() - 0.5) * bench.noise * 10;
      const y = H / 2 - ch1.pos * pxPerDiv - sample({ ...bench }, i / 239, drift / 6, cycles) * Math.min(ampPx, H / 1.9) - offPx + noise;
      return `${((i / 239) * W).toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const buildCh2 = () => {
    if (!live || !(ch2.on || bench.ch2Scope)) return '';
    if (ch2.coupling === 'gnd') return `0,${H / 2 - ch2.pos * pxPerDiv} ${W},${H / 2 - ch2.pos * pxPerDiv}`;
    const g = lpGain(bench.frequency);
    const ampPx = (bench.amplitude / 2) * g / ch2.vDiv * pxPerDiv;
    const ph = (lpPhaseDeg(bench.frequency) * Math.PI) / 180;
    const drift = stable ? 0 : t * 2.5;
    return Array.from({ length: 240 }, (_, i) => {
      const y = H / 2 - ch2.pos * pxPerDiv - waveValue('sine', (i / 239) * Math.PI * 2 * cycles + drift + ph) * Math.min(ampPx, H / 1.9);
      return `${((i / 239) * W).toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ch1Points = useMemo(buildCh1, [live, ch1, bench.waveform, bench.amplitude, bench.offset, bench.dutyCycle, bench.phase, bench.modType, bench.modDepth, bench.modIndex, bench.noise, cycles, stable, t]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ch2Points = useMemo(buildCh2, [live, ch2, bench.ch2Scope, bench.frequency, bench.amplitude, cycles, stable, t]);

  const trigY = H / 2 - (trig / 100) * (H / 2);

  const autoScale = () => { setCh1((c) => ({ ...c, vDiv: Math.max(0.1, Number((bench.amplitude / 4).toFixed(2))), pos: 0, on: true })); setTimeDiv(1); setTrig(0); };

  // Cursor dragging (HTML overlay over the screen)
  const onCursorMove = useCallback((e) => {
    if (!dragRef.current || !screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setCur((c) => ({ ...c, [dragRef.current]: frac }));
  }, []);
  const stopDrag = useCallback(() => { dragRef.current = null; window.removeEventListener('pointermove', onCursorMove); window.removeEventListener('pointerup', stopDrag); }, [onCursorMove]);
  const startDrag = (which) => (e) => { e.preventDefault(); dragRef.current = which; window.addEventListener('pointermove', onCursorMove); window.addEventListener('pointerup', stopDrag); };

  const dtMs = Math.abs(cur.b - cur.a) * DIVX * timeDiv;
  const curFreq = dtMs > 0 ? 1 / (dtMs / 1000) : 0;

  const phaseCh = live && ch2.on ? `${lpPhaseDeg(bench.frequency).toFixed(0)}°` : '—';
  const meas = [
    { l: 'Vpp', v: m.acVpp ? `${m.acVpp.toFixed(2)} V` : '—' },
    { l: 'Vrms', v: m.acVrms ? `${m.acVrms.toFixed(3)} V` : '—' },
    { l: 'Freq', v: m.frequency ? formatFreq(m.frequency) : '—' },
    { l: 'Duty', v: m.dutyCycle != null ? `${m.dutyCycle}%` : '—' },
    { l: 'Φ(1,2)', v: phaseCh },
    { l: 'Rise', v: m.riseTimeNs ? `${m.riseTimeNs.toFixed(1)} ns` : '—' },
  ];

  return (
    <Chassis model="RTO-Digital Oscilloscope" subtitle="2/4-CH · 2 GSa/s · 1 GHz BW" accent={CH1}
      badges={<><Led on={ch1.on} color={CH1} label="CH1" /><Led on={ch2.on || bench.ch2Scope} color={CH2} label="CH2" /></>}
      screen={
        <div ref={screenRef} className="relative">
          <Screen width={W} height={H} divX={DIVX} divY={DIVY}>
            {live ? (
              <>
                {ch1.on && <polyline points={ch1Points} fill="none" stroke={CH1} strokeWidth="2" style={{ filter: `drop-shadow(0 0 3px ${CH1}aa)` }} />}
                {(ch2.on || bench.ch2Scope) && <polyline points={ch2Points} fill="none" stroke={CH2} strokeWidth="2" style={{ filter: `drop-shadow(0 0 3px ${CH2}aa)` }} />}
                <line x1="0" y1={trigY} x2={W} y2={trigY} stroke="#fb923c" strokeWidth="1.2" strokeDasharray="6 4" />
                <text x={W - 4} y={trigY - 4} fill="#fb923c" fontSize="10" textAnchor="end" fontFamily="monospace">T·{trigSrc.toUpperCase()}</text>
                <text x="6" y="14" fill={CH1} fontSize="10" fontFamily="monospace">CH1 {ch1.vDiv} V/div · {ch1.coupling.toUpperCase()}</text>
                <text x="6" y="26" fill={stable ? '#4CAF50' : '#fb923c'} fontSize="10" fontFamily="monospace">{stable ? 'TRIG’D' : 'AUTO · drifting'}{bench.modType !== 'none' ? ` · ${bench.modType.toUpperCase()}` : ''}</text>
              </>
            ) : (
              <text x={W / 2} y={H / 2} fill="rgba(94,141,78,0.5)" fontSize="14" textAnchor="middle" fontFamily="monospace">{running ? '— NO SIGNAL —' : '■ STOPPED'}</text>
            )}
          </Screen>

          {/* Cursor overlay */}
          {cursors && (
            <>
              {['a', 'b'].map((k) => (
                <div key={k} className="absolute top-0 bottom-0" style={{ left: `${cur[k] * 100}%` }}>
                  <div className="absolute top-0 bottom-0 w-px" style={{ background: k === 'a' ? '#f472b6' : '#a78bfa' }} />
                  <div onPointerDown={startDrag(k)} className="absolute -top-0.5 -translate-x-1/2 w-4 h-4 rounded-full cursor-ew-resize"
                    style={{ background: k === 'a' ? '#f472b6' : '#a78bfa', boxShadow: '0 0 6px rgba(0,0,0,0.5)' }} />
                </div>
              ))}
              <div className="absolute bottom-1 right-2 px-2 py-1 rounded-md text-[10px] font-mono"
                style={{ background: 'rgba(10,13,10,0.85)', color: '#e2e8f0' }}>
                Δt {dtMs >= 1 ? `${dtMs.toFixed(2)} ms` : `${(dtMs * 1000).toFixed(1)} µs`} · 1/Δt {formatFreq(curFreq)}
              </div>
            </>
          )}
        </div>
      }
    >
      {/* Measurements */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4">
        {meas.map((x) => (
          <div key={x.l} className="rounded-lg px-2 py-1.5 text-center" style={{ background: '#14171a' }}>
            <p className="text-[9px] font-mono uppercase text-surface-400">{x.l}</p>
            <p className="text-[12px] font-mono font-bold" style={{ color: CH1 }}>{x.v}</p>
          </div>
        ))}
      </div>

      {/* Control deck */}
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <ChannelBox label="CH1" color={CH1} active={ch1.on} onToggle={() => setCh1((c) => ({ ...c, on: !c.on }))}>
          <Knob label="Volts/Div" value={ch1.vDiv} min={0.05} max={5} step={0.05} onChange={(v) => setCh1((c) => ({ ...c, vDiv: v }))} unit=" V" color={CH1} size={54} />
          <Knob label="Position" value={ch1.pos} min={-3} max={3} step={0.1} onChange={(v) => setCh1((c) => ({ ...c, pos: v }))} unit=" div" color={CH1} size={54} />
          <div className="flex flex-col gap-1">
            {['dc', 'ac', 'gnd'].map((cp) => (
              <HwButton key={cp} active={ch1.coupling === cp} onClick={() => setCh1((c) => ({ ...c, coupling: cp }))} accent={CH1} className="!px-2 !py-1">{cp.toUpperCase()}</HwButton>
            ))}
          </div>
        </ChannelBox>

        <ChannelBox label="CH2 (LPF)" color={CH2} active={ch2.on} onToggle={() => setCh2((c) => ({ ...c, on: !c.on }))}>
          <Knob label="Volts/Div" value={ch2.vDiv} min={0.05} max={5} step={0.05} onChange={(v) => setCh2((c) => ({ ...c, vDiv: v }))} unit=" V" color={CH2} size={54} />
          <Knob label="Position" value={ch2.pos} min={-3} max={3} step={0.1} onChange={(v) => setCh2((c) => ({ ...c, pos: v }))} unit=" div" color={CH2} size={54} />
        </ChannelBox>

        <div className="rounded-xl p-2.5 flex items-start gap-3" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: '1px solid #2a2f34' }}>
          <Knob label="Time/Div" value={timeDiv} min={0.2} max={5} step={0.1} onChange={setTimeDiv} unit=" ms" color="#4CAF50" size={54} />
          <Knob label="Trigger" value={trig} min={-100} max={100} step={1} onChange={setTrig} unit="%" color="#fb923c" size={54} sublabel={stable ? 'locked' : 'searching'} />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono uppercase text-surface-400 text-center">Src</span>
            <HwButton active={trigSrc === 'ch1'} onClick={() => setTrigSrc('ch1')} accent={CH1} className="!px-2 !py-1">CH1</HwButton>
            <HwButton active={trigSrc === 'ch2'} onClick={() => setTrigSrc('ch2')} accent={CH2} className="!px-2 !py-1">CH2</HwButton>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <HwButton active onClick={autoScale} accent="#4CAF50">Auto-Scale</HwButton>
          <HwButton active={cursors} onClick={() => setCursors((c) => !c)} accent="#a78bfa">Cursors</HwButton>
          <HwButton active={running} onClick={() => setRunning((r) => !r)} accent={running ? '#4CAF50' : '#f43f5e'}>{running ? 'Run' : 'Stop'}</HwButton>
        </div>
      </div>
    </Chassis>
  );
};

export default OscilloscopeHW;
