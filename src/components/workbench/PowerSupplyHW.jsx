import { Chassis, Knob, SegmentDisplay, HwButton, Led } from './hardware';
import { measure } from './benchUtils';

const ACCENT = '#4CAF50';

const OutputChannel = ({ idx, color, vKey, iKey, onKey, bench, setBench }) => {
  const on = bench[onKey];
  const v = bench[vKey];
  const iLimit = bench[iKey];
  // simple resistive load model: draws up to the limit
  const drawn = on ? Math.min(iLimit, 0.18 + idx * 0.06) : 0;
  const cc = on && drawn >= iLimit - 0.001;

  return (
    <div className="rounded-2xl p-3" style={{ background: 'linear-gradient(#1c2025,#14171a)', border: `1px solid ${on ? color + '88' : '#2a2f34'}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black px-1.5 py-0.5 rounded" style={{ background: on ? color : '#3a4046', color: '#0a0d0a' }}>OUT {idx + 1}</span>
        <span className="text-[9px] font-mono uppercase" style={{ color: !on ? '#5a6068' : cc ? '#fb923c' : color }}>{!on ? 'off' : cc ? 'CC' : 'CV'}</span>
      </div>
      <div className="flex gap-2 mb-3">
        <SegmentDisplay value={(on ? v : 0).toFixed(2)} unit="V" color={color} size="sm" ghost="00.00" />
        <SegmentDisplay value={drawn.toFixed(3)} unit="A" color={color} size="sm" ghost="0.000" />
      </div>
      <div className="flex items-start gap-3 justify-center">
        <Knob label="Voltage" value={v} min={0} max={30} step={0.1} onChange={(val) => setBench((b) => ({ ...b, [vKey]: val }))} color={color} size={52} unit=" V" />
        <Knob label="I-Limit" value={iLimit} min={0.05} max={3} step={0.05} onChange={(val) => setBench((b) => ({ ...b, [iKey]: val }))} color={color} size={52} unit=" A" />
      </div>
      <div className="mt-2 flex justify-center">
        <HwButton active={on} onClick={() => setBench((b) => ({ ...b, [onKey]: !b[onKey] }))} accent={on ? '#4CAF50' : '#f43f5e'}>
          Output {on ? 'On' : 'Off'}
        </HwButton>
      </div>
    </div>
  );
};

const PowerSupplyHW = ({ bench, setBench }) => (
  <Chassis model="NGP-Programmable Power Supply" subtitle={`${bench.tripleOutput ? '3' : '2'}× 0–30 V / 0–3 A`} accent={ACCENT}
    badges={<>
      <Led on={bench.ch1On} color="#4CAF50" label="O1" />
      <Led on={bench.ch2On} color="#38bdf8" label="O2" />
      {bench.tripleOutput && <Led on={bench.ch3On} color="#fbbf24" label="O3" />}
    </>}
    screen={
      <div className={`grid gap-3 py-1 ${bench.tripleOutput ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <OutputChannel idx={0} color="#4CAF50" vKey="ch1Voltage" iKey="ch1Current" onKey="ch1On" bench={bench} setBench={setBench} />
        <OutputChannel idx={1} color="#38bdf8" vKey="ch2Voltage" iKey="ch2Current" onKey="ch2On" bench={bench} setBench={setBench} />
        {bench.tripleOutput && <OutputChannel idx={2} color="#fbbf24" vKey="ch3Voltage" iKey="ch3Current" onKey="ch3On" bench={bench} setBench={setBench} />}
      </div>
    }
  >
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-[11px] text-surface-400 flex-1 min-w-[220px]">
        The supply holds a fixed <strong>voltage</strong> (CV) until the load reaches the <strong>current limit</strong>,
        then switches to constant-current (CC). OUT 1 feeds the bench rail measured by the DMM.
      </p>
      <HwButton active={bench.tripleOutput} onClick={() => setBench((b) => ({ ...b, tripleOutput: !b.tripleOutput }))} accent={ACCENT}>
        {bench.tripleOutput ? 'Triple' : 'Dual'} Output
      </HwButton>
    </div>
  </Chassis>
);

export default PowerSupplyHW;
