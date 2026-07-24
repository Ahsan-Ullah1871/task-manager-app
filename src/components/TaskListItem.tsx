import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDueDate } from '../lib/format';
import type { LocalTask } from '../features/tasks/types';

interface Props {
  task: LocalTask;
  categoryName: string | null;
  onPress: (id: string) => void;
  onToggleStar: (id: string) => void;
}

/**
 * A single row in the task list. Memoised with a custom comparator so a row
 * only re-renders when its own visible data changes — important once the list
 * grows.
 */
function TaskListItem({ task, categoryName, onPress, onToggleStar }: Props) {
  const due = formatDueDate(task.due_at);
  const isDone = task.status === 'done';

  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(task.id)}
      android_ripple={{ color: '#eee' }}
    >
      <View style={styles.body}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgeOpen]}>
            <Text style={styles.badgeText}>{isDone ? 'Done' : 'Open'}</Text>
          </View>
          {categoryName ? (
            <Text style={styles.meta}>{categoryName}</Text>
          ) : null}
          {due ? <Text style={styles.meta}>Due {due}</Text> : null}
        </View>
      </View>

      <Pressable
        hitSlop={12}
        onPress={() => onToggleStar(task.id)}
        style={styles.star}
      >
        <Text style={[styles.starGlyph, task.starred && styles.starOn]}>
          {task.starred ? '★' : '☆'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e6',
    backgroundColor: '#fff',
  },
  body: { flex: 1, gap: 6 },
  title: { fontSize: 16, fontWeight: '500', color: '#111' },
  titleDone: { textDecorationLine: 'line-through', color: '#999' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { fontSize: 12, color: '#777' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeOpen: { backgroundColor: '#e3f0ff' },
  badgeDone: { backgroundColor: '#e6f5ea' },
  badgeText: { fontSize: 11, color: '#333' },
  star: { paddingLeft: 12 },
  starGlyph: { fontSize: 22, color: '#bbb' },
  starOn: { color: '#f5b301' },
});

/**
 * Only re-render when something the row shows actually changed. Callbacks are
 * stable (from the store / useCallback), so we don't need to compare them.
 */
function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.task.id === next.task.id &&
    prev.task.title === next.task.title &&
    prev.task.status === next.task.status &&
    prev.task.due_at === next.task.due_at &&
    prev.task.starred === next.task.starred &&
    prev.categoryName === next.categoryName
  );
}

export default memo(TaskListItem, areEqual);
