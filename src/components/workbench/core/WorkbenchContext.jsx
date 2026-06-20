import { createContext, useContext, useMemo, useRef, useSyncExternalStore, useCallback } from 'react';
import { createWorkbenchCore } from './WorkbenchCore';
import { initialBench } from '../benchUtils';

const WorkbenchContext = createContext(null);

/**
 * Provider that instantiates a single WorkbenchCore and exposes it to the tree.
 * Components read reactive state via useWorkbench().
 */
export const WorkbenchProvider = ({ children, initial = initialBench }) => {
  const coreRef = useRef(null);
  if (!coreRef.current) coreRef.current = createWorkbenchCore(initial);
  return <WorkbenchContext.Provider value={coreRef.current}>{children}</WorkbenchContext.Provider>;
};

/**
 * Subscribe to the core. Returns the live params plus engine handles and the
 * event-driven setters. `setBench` keeps the legacy (bench, updater) signature
 * so instrument components need no changes.
 */
export const useWorkbench = () => {
  const core = useContext(WorkbenchContext);
  if (!core) throw new Error('useWorkbench must be used within a WorkbenchProvider');

  const snapshot = useSyncExternalStore(core.subscribe, core.getSnapshot, core.getSnapshot);

  const setBench = useCallback((updater) => core.update(updater), [core]);
  const setParam = useCallback((k, v, meta) => core.setParam(k, v, meta), [core]);

  return useMemo(
    () => ({
      core,
      params: snapshot.params,        // the bench
      bench: snapshot.params,         // alias
      scope: snapshot.scope,
      telemetry: snapshot.telemetry,
      measurement: core.measurement,  // MeasurementEngine
      signal: core.signal,            // SignalEngine
      circuit: core.circuit,          // CircuitEngine
      setBench,
      setParam,
      setActiveInstrument: core.setActiveInstrument.bind(core),
      setExperiment: core.setExperiment.bind(core),
      recordAction: core.recordAction.bind(core),
      recordError: core.recordError.bind(core),
    }),
    [core, snapshot, setBench, setParam]
  );
};

export default WorkbenchContext;
