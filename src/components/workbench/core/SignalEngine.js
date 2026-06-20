// SignalEngine — the central signal source for the entire bench. Generates
// waveforms, applies modulation, noise, and exposes harmonic/sideband content.
// Every instrument reads the signal through this engine (via WorkbenchCore),
// so a single parameter change propagates everywhere.
//
// The pure waveform math lives in benchUtils (the signal "kernel"); this class
// is the stateful engine wrapper that WorkbenchCore owns.
import {
  sample as kernelSample, waveValue, sidebands as kernelSidebands,
  occupiedBandwidth as kernelObw, harmonicWeight as kernelHw, measure as kernelMeasure,
} from '../benchUtils';

export class SignalEngine {
  constructor(params) {
    this.params = params;
  }

  setParams(params) {
    this.params = params;
  }

  /** Live = source on AND wired AND not faulted. */
  isLive() {
    const p = this.params;
    return p.genOn && p.connected && !p.faulty;
  }

  /** Normalized waveform sample (incl. modulation) at u∈[0,1], time t, carrier cycles. */
  sample(u, t, cycles) {
    return kernelSample(this.params, u, t, cycles);
  }

  /** Raw carrier value with no modulation (used for clean references / CH2). */
  carrier(phase) {
    return waveValue(this.params.waveform, phase, this.params.dutyCycle / 100);
  }

  /** Raw electrical measurements at the bench output node. */
  measure() {
    return kernelMeasure(this.params);
  }

  sidebands() {
    return kernelSidebands(this.params);
  }

  occupiedBandwidth() {
    return kernelObw(this.params);
  }

  harmonicWeight() {
    return kernelHw(this.params.waveform);
  }
}

export default SignalEngine;
