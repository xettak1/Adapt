import { useState, useEffect, useRef } from 'react';

/* Returns a continuously updating time value (seconds) while `active`. */
export default function useAnimationTime(active = true) {
  const [t, setT] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    if (!active) return;
    const loop = (now) => {
      if (start.current === null) start.current = now;
      setT((now - start.current) / 1000);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf.current);
      start.current = null;
    };
  }, [active]);

  return t;
}
