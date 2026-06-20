// CircuitEngine — the circuit layer that sits BETWEEN signal sources and
// measurement instruments. Given the bench parameters it computes how the
// signal is transformed on its way to each instrument (filters, loads, DUTs).
//
// Pure, dependency-free. Owned by WorkbenchCore.

const CH2_FC = 1.2e6; // CH2 1st-order low-pass corner (filter characterization)

export class CircuitEngine {
  /** Magnitude response of the CH2 low-pass at frequency f (Hz). */
  ch2Gain(f) {
    return 1 / Math.sqrt(1 + Math.pow(f / CH2_FC, 2));
  }

  /** Phase lag (deg) of the CH2 low-pass at f. */
  ch2PhaseDeg(f) {
    return (Math.atan(f / CH2_FC) * 180) / Math.PI;
  }

  /** Current the bench load draws from supply output #idx (simple resistive model). */
  loadCurrent(params, idx = 0) {
    const onKey = ['ch1On', 'ch2On', 'ch3On'][idx];
    const iKey = ['ch1Current', 'ch2Current', 'ch3Current'][idx];
    if (!params[onKey]) return 0;
    return Math.min(params[iKey], 0.18 + idx * 0.06);
  }

  /**
   * S-parameters of a filter DUT at frequency f for the VNA.
   * Returns { s21, s11 } in dB plus complex reflection Γ and S21 phase.
   */
  sParams(f, fc, bw, type) {
    const x = (f - fc) / (bw / 2);
    let s21;
    if (type === 'bandpass') s21 = -10 * Math.log10(1 + x * x);
    else if (type === 'lowpass') s21 = f <= fc ? -0.5 : -10 * Math.log10(1 + Math.pow((f - fc) / (bw / 2), 2));
    else s21 = f >= fc ? -0.5 : -10 * Math.log10(1 + Math.pow((fc - f) / (bw / 2), 2));
    s21 = Math.max(-40, s21);

    const transmitted = Math.pow(10, s21 / 10);
    const s11 = Math.max(-35, 10 * Math.log10(Math.max(0.0003, 1 - transmitted * 0.97)));
    const gammaMag = Math.pow(10, s11 / 20);
    const theta = Math.atan2(x, 1);
    return {
      s21: Number(s21.toFixed(2)),
      s11: Number(s11.toFixed(2)),
      gRe: gammaMag * Math.cos(theta * 2),
      gIm: gammaMag * Math.sin(theta * 2),
      gammaMag,
      s21Phase: Number((-Math.atan(x) * (180 / Math.PI)).toFixed(1)),
    };
  }

  /** VSWR from a return-loss (S11) value in dB. */
  vswr(s11dB) {
    const g = Math.pow(10, s11dB / 20);
    return (1 + g) / Math.max(0.001, 1 - g);
  }
}

export default CircuitEngine;
