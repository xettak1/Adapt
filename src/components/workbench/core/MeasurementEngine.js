// MeasurementEngine — all measurement/analysis logic for the instrument suite,
// as pure functions. Instruments NEVER compute measurements themselves; they
// render what this engine returns. Driven by SignalEngine + CircuitEngine.
import { formatFreq } from '../benchUtils';

export class MeasurementEngine {
  constructor(signal, circuit) {
    this.signal = signal;
    this.circuit = circuit;
  }

  // ----------------------- OSCILLOSCOPE -----------------------
  scope() {
    const m = this.signal.measure();
    const p = this.signal.params;
    return {
      vpp: m.acVpp,
      vrms: m.acVrms,
      peak: m.acVpp / 2,
      frequency: m.frequency,
      periodNs: m.periodNs,
      dutyCycle: m.dutyCycle,
      riseTimeNs: m.riseTimeNs,
      fallTimeNs: m.fallTimeNs,
      // CH1→CH2 phase introduced by the circuit low-pass
      phaseDeg: m.live ? this.circuit.ch2PhaseDeg(p.frequency) : 0,
      noisePct: m.noisePct,
      live: m.live,
    };
  }

  // ----------------------- SPECTRUM ANALYZER (FFT) -----------------------
  spectrum({ center, span, bins, t }) {
    const p = this.signal.params;
    const live = this.signal.isLive();
    const hw = this.signal.harmonicWeight();
    const binFor = (f) => {
      if (f <= 0) return -1;
      const rel = Math.log10(f / center) / span;
      return Math.round((rel + 0.5) * (bins - 1));
    };
    const carrierBin = binFor(p.frequency);
    const arr = new Array(bins);
    for (let i = 0; i < bins; i++) {
      let mag = p.noise * (8 + Math.abs(Math.sin(i * 1.7 + t * 4)) * 7);
      if (live) {
        mag += Math.exp(-Math.pow(i - carrierBin, 2) / 2.2) * 96;
        [2, 3, 4, 5].forEach((h) => {
          mag += Math.exp(-Math.pow(i - binFor(p.frequency * h), 2) / 1.8) * 60 * hw / h;
        });
      }
      arr[i] = mag;
    }
    if (live) {
      this.signal.sidebands().forEach((sb) => {
        const b = binFor(p.frequency * (1 + sb.ratio));
        for (let i = 0; i < bins; i++) arr[i] += Math.exp(-Math.pow(i - b, 2) / 1.4) * 70 * sb.mag;
      });
    }
    for (let i = 0; i < bins; i++) arr[i] = Math.min(100, arr[i]);
    const peakBin = arr.indexOf(Math.max(...arr));
    const noiseFloor = Math.round(p.noise * 100 * 0.6 + 6);
    const signalPower = live ? Number((10 * Math.log10(Math.pow(p.amplitude / 2, 2) / 50 * 1000)).toFixed(1)) : null;
    return {
      bins: arr, peakBin, noiseFloor, signalPower, live,
      carrierFreq: live ? p.frequency : 0,
      occupiedBandwidth: this.signal.occupiedBandwidth(),
      harmonicLabel: hw > 0.3 ? 'rich' : hw > 0.1 ? 'some' : 'low',
      freqAtFrac: (frac) => center * Math.pow(10, (frac - 0.5) * span),
    };
  }

  // ----------------------- VECTOR NETWORK ANALYZER -----------------------
  vna({ fc, bw, dut, points = 80 }) {
    const start = fc * 0.1, end = fc * 2.2;
    const data = Array.from({ length: points }, (_, i) => {
      const f = start + (i / (points - 1)) * (end - start);
      return { f, ...this.circuit.sParams(f, fc, bw, dut) };
    });
    const atFc = this.circuit.sParams(fc, fc, bw, dut);
    const markerIdx = data.reduce((best, d, i) => (Math.abs(d.f - fc) < Math.abs(data[best].f - fc) ? i : best), 0);
    return {
      data, atFc, markerIdx,
      insertionLoss: Math.abs(atFc.s21),
      returnLoss: Math.abs(atFc.s11),
      vswr: this.circuit.vswr(atFc.s11),
    };
  }

  // ----------------------- DIGITAL MULTIMETER -----------------------
  dmm(mode) {
    const m = this.signal.measure();
    switch (mode) {
      case 'dcv': return { value: m.dcVoltage.toFixed(3), unit: 'V⎓', name: 'DC Voltage' };
      case 'acv': return { value: m.acVrms.toFixed(3), unit: 'V∿', name: 'AC Voltage' };
      case 'cur': return { value: (m.current * 1000).toFixed(1), unit: 'mA', name: 'Current' };
      case 'res': return { value: this.signal.params.faulty ? 'O.L' : '47.0', unit: 'Ω', name: 'Resistance' };
      case 'cont': return { value: m.continuity ? '000.3' : 'O.L', unit: m.continuity ? 'Ω •))' : 'Ω', name: 'Continuity' };
      case 'freq': return { value: m.frequency ? formatFreq(m.frequency) : '0', unit: '', name: 'Frequency' };
      default: return { value: '0', unit: '', name: '' };
    }
  }
}

export default MeasurementEngine;
