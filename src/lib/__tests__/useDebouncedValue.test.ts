import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../useDebouncedValue';

// Keep setImmediate real: the testing library's async render/rerender flushes
// through it, and faking it deadlocks the internal act() calls.
const useFakeTimers = () =>
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask'] });

describe('useDebouncedValue', () => {
  beforeEach(() => useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately', async () => {
    const { result } = await renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('only updates after the delay elapses', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'b' });
    expect(result.current).toBe('a'); // not yet

    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a'); // still not

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b'); // now
  });

  it('coalesces rapid changes, emitting only the last value', async () => {
    const { result, rerender } = await renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await rerender({ value: 'abc' });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await rerender({ value: 'abcd' });

    // Each keystroke reset the timer, so nothing has been emitted yet.
    expect(result.current).toBe('a');

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('abcd');
  });
});
