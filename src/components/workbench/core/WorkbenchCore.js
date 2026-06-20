// WorkbenchCore — the "operating system" of the digital laboratory.
//
// Owns the bench parameters and the engine stack, and runs an event-driven
// pipeline on every change:
//
//   setParam → SignalEngine.setParams → CircuitEngine recompute
//            → MeasurementEngine recompute → telemetry update → notify subscribers
//
// instruments + the AI tutor subscribe to a single source of truth.
import SignalEngine from './SignalEngine';
import CircuitEngine from './CircuitEngine';
import MeasurementEngine from './MeasurementEngine';

const MAX_ACTIONS = 12;

export class WorkbenchCore {
  constructor(initialParams) {
    this.params = { ...initialParams };
    this.signal = new SignalEngine(this.params);
    this.circuit = new CircuitEngine();
    this.measurement = new MeasurementEngine(this.signal, this.circuit);

    this.listeners = new Set();
    this.recentActions = [];
    this.activeInstrument = null;
    this.currentExperiment = null;
    this.errors = 0;

    this.snapshot = this._buildSnapshot();
  }

  // ----- subscription (useSyncExternalStore compatible) -----
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  _emit() {
    this.snapshot = this._buildSnapshot();
    this.listeners.forEach((fn) => fn());
  }

  _buildSnapshot() {
    return {
      params: this.params,
      scope: this.measurement.scope(),
      telemetry: this.getTelemetry(),
    };
  }

  // ----- the event pipeline -----
  update(partialOrUpdater, meta) {
    const patch = typeof partialOrUpdater === 'function' ? partialOrUpdater(this.params) : partialOrUpdater;
    const next = { ...this.params, ...patch };

    // detect what changed for telemetry / tutor
    const changedKeys = Object.keys(patch).filter((k) => next[k] !== this.params[k]);

    this.params = next;
    this.signal.setParams(this.params);          // 1. signal engine
    // 2. circuit engine is stateless (reads params on demand)
    // 3. measurement engine recomputes lazily inside snapshot
    if (changedKeys.length) {
      this.recordAction({ type: 'param', keys: changedKeys, at: Date.now(), ...meta });
      if (this.params.faulty && !patch.faulty === false) this.errors += 0; // no-op guard
    }
    this._emit();                                // 4. notify subscribers
  }

  setParam(key, value, meta) {
    this.update({ [key]: value }, meta);
  }

  // ----- instrument context + telemetry -----
  setActiveInstrument(id) {
    if (this.activeInstrument === id) return;
    this.activeInstrument = id;
    this.recordAction({ type: 'open-instrument', id, at: Date.now() });
    this._emit();
  }

  setExperiment(id) {
    this.currentExperiment = id;
  }

  recordAction(action) {
    this.recentActions = [action, ...this.recentActions].slice(0, MAX_ACTIONS);
  }

  recordError() {
    this.errors += 1;
  }

  /** Full telemetry the AI Tutor consumes to understand what the student is doing. */
  getTelemetry() {
    return {
      activeInstrument: this.activeInstrument,
      currentExperiment: this.currentExperiment,
      params: this.params,
      measurements: {
        scope: this.measurement.scope(),
      },
      recentActions: this.recentActions,
      errors: this.errors,
    };
  }
}

export const createWorkbenchCore = (initialParams) => new WorkbenchCore(initialParams);
export default WorkbenchCore;
