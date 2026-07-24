import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `delayMs`. Rapid updates coalesce — only the last
 * value to settle within a quiet window is emitted. Generic and dependency-free
 * so it can be unit-tested in isolation (used for the 300ms search debounce).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
