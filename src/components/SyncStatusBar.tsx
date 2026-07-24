import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { timeAgo } from '../lib/format';

interface Props {
  lastRefreshedAt: string | null;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
}

/**
 * Thin status strip above the list: offline state, background-refresh spinner,
 * last-refreshed time, and the most recent refresh error (if any).
 */
function SyncStatusBar({ lastRefreshedAt, isRefreshing, isOffline, error }: Props) {
  return (
    <View style={[styles.bar, isOffline && styles.barOffline]}>
      <View style={styles.left}>
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#555" />
        ) : (
          <View
            style={[styles.dot, isOffline ? styles.dotOffline : styles.dotOnline]}
          />
        )}
        <Text style={styles.text}>
          {isOffline
            ? 'Offline — showing cached tasks'
            : isRefreshing
              ? 'Refreshing…'
              : `Last refreshed ${timeAgo(lastRefreshedAt)}`}
        </Text>
      </View>
      {error && !isOffline ? (
        <Text style={styles.error} numberOfLines={1}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f2f2f5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  barOffline: { backgroundColor: '#fff4e5' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: '#2e9e4f' },
  dotOffline: { backgroundColor: '#d08a15' },
  text: { fontSize: 13, color: '#444', flexShrink: 1 },
  error: { fontSize: 12, color: '#b00020', marginLeft: 8, flexShrink: 1 },
});

export default memo(SyncStatusBar);
