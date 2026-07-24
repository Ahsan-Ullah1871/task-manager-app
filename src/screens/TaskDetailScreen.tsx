import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskFormModal, { type TaskFormValues } from '../components/TaskFormModal';
import { useTaskStore } from '../features/tasks/store';
import { formatDueDate } from '../lib/format';
import type { TaskDetailProps } from '../navigation/types';

export default function TaskDetailScreen({ route, navigation }: TaskDetailProps) {
  const { taskId } = route.params;

  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const categories = useTaskStore((s) => s.categories);
  const updateTask = useTaskStore((s) => s.updateTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const toggleStar = useTaskStore((s) => s.toggleStar);
  const removeTask = useTaskStore((s) => s.removeTask);

  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);

  const categoryName = task?.category_id
    ? categories.find((c) => c.id === task.category_id)?.name ?? null
    : null;

  const run = useCallback(
    async (label: string, fn: () => Promise<void>) => {
      setBusy(true);
      try {
        await fn();
      } catch (err) {
        Alert.alert(label, err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const handleEdit = useCallback(
    async (values: TaskFormValues) => {
      await run('Could not save task', async () => {
        await updateTask(taskId, values);
        setShowEdit(false);
      });
    },
    [run, updateTask, taskId],
  );

  const handleDelete = useCallback(() => {
    Alert.alert('Delete task', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          run('Could not delete task', async () => {
            await removeTask(taskId);
            navigation.goBack();
          }),
      },
    ]);
  }, [run, removeTask, taskId, navigation]);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.missing}>
          <Text style={styles.missingText}>This task is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const due = formatDueDate(task.due_at);
  const isDone = task.status === 'done';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDone && styles.titleDone]}>
            {task.title}
          </Text>
          <Pressable onPress={() => toggleStar(task.id)} hitSlop={10}>
            <Text style={[styles.star, task.starred && styles.starOn]}>
              {task.starred ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.metaGrid}>
          <Meta label="Status" value={isDone ? 'Done' : 'Open'} />
          <Meta label="Category" value={categoryName ?? '—'} />
          <Meta label="Due" value={due ?? '—'} />
          <Meta label="Starred (local)" value={task.starred ? 'Yes' : 'No'} />
        </View>

        {task.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        ) : null}

        <View style={styles.buttons}>
          <Button
            label={isDone ? 'Reopen' : 'Mark complete'}
            variant="primary"
            disabled={busy}
            onPress={() => run('Could not update task', () => toggleComplete(task.id))}
          />
          <Button
            label="Edit"
            variant="ghost"
            disabled={busy}
            onPress={() => setShowEdit(true)}
          />
          <Button
            label="Delete"
            variant="danger"
            disabled={busy}
            onPress={handleDelete}
          />
        </View>
      </ScrollView>

      <TaskFormModal
        visible={showEdit}
        title="Edit Task"
        categories={categories}
        initial={task}
        submitting={busy}
        onCancel={() => setShowEdit(false)}
        onSubmit={handleEdit}
      />
    </SafeAreaView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function Button({
  label,
  variant,
  disabled,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'ghost' | 'danger';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && styles.btnTextOnColor,
          variant === 'danger' && styles.btnTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111' },
  titleDone: { textDecorationLine: 'line-through', color: '#999' },
  star: { fontSize: 28, color: '#bbb' },
  starOn: { color: '#f5b301' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaCell: { width: '44%' },
  metaLabel: { fontSize: 12, color: '#888' },
  metaValue: { fontSize: 15, color: '#222', marginTop: 2 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 12, color: '#888' },
  description: { fontSize: 15, color: '#222', lineHeight: 21 },
  buttons: { gap: 10, marginTop: 8 },
  btn: { paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnGhost: { backgroundColor: '#f0f0f0' },
  btnDanger: { backgroundColor: '#fdecec' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  btnTextOnColor: { color: '#fff' },
  btnTextDanger: { color: '#b00020' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  missingText: { color: '#999', fontSize: 15 },
});
