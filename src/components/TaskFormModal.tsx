import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Category, LocalTask } from '../features/tasks/types';

export interface TaskFormValues {
  title: string;
  description: string | null;
  category_id: string | null;
  due_at: string | null;
}

interface Props {
  visible: boolean;
  title: string; // modal heading, e.g. "New Task"
  categories: Category[];
  initial?: LocalTask | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

// Quick due-date choices avoid pulling in a native date-picker dependency.
const dueChoices: { label: string; value: () => string | null }[] = [
  { label: 'None', value: () => null },
  { label: 'Today', value: () => endOfDay(0) },
  { label: 'Tomorrow', value: () => endOfDay(1) },
  { label: '+1 week', value: () => endOfDay(7) },
];

function endOfDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

export default function TaskFormModal({
  visible,
  title,
  categories,
  initial,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
  const [titleText, setTitleText] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (visible) {
      setTitleText(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setCategoryId(initial?.category_id ?? null);
      setDueAt(initial?.due_at ?? null);
    }
  }, [visible, initial]);

  const canSubmit = titleText.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: titleText.trim(),
      description: description.trim() ? description.trim() : null,
      category_id: categoryId,
      due_at: dueAt,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={titleText}
              onChangeText={setTitleText}
              placeholder="What needs doing?"
              autoFocus
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details"
              multiline
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              <Chip
                label="None"
                active={categoryId === null}
                onPress={() => setCategoryId(null)}
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={categoryId === c.id}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>

            <Text style={styles.label}>Due</Text>
            <View style={styles.chips}>
              {dueChoices.map((choice) => {
                const val = choice.value();
                const active =
                  choice.label === 'None' ? dueAt === null : sameDay(dueAt, val);
                return (
                  <Chip
                    key={choice.label}
                    label={choice.label}
                    active={active}
                    onPress={() => setDueAt(val)}
                  />
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, !canSubmit && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.btnPrimaryText}>
                {submitting ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function sameDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: '#f0f0f0' },
  btnGhostText: { color: '#333', fontWeight: '500' },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
