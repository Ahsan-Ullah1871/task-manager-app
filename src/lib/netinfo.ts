import NetInfo from '@react-native-community/netinfo';

export type OnlineListener = (isOnline: boolean) => void;

/**
 * Subscribe to connectivity changes. We treat the device as offline only when
 * NetInfo is certain it's unreachable; `null` (unknown) is treated as online so
 * we still attempt a refresh rather than showing a false offline banner.
 */
export function subscribeToConnectivity(listener: OnlineListener): () => void {
  return NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected !== false;
    listener(isOnline);
  });
}

/** One-off connectivity check. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected !== false;
}
