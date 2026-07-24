import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../features/tasks/store';
import type { Category } from '../features/tasks/types';

export default function CategoriesScreen() {
  const categories = useTaskStore((s) => s.categories);
  const addCategory = useTaskStore((s) => s.addCategory);

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addCategory(trimmed);
      setName('');
    } catch (err) {
      Alert.alert(
        'Could not add category',
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  }, [name, submitting, addCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="New category name"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, (!name.trim() || submitting) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim() || submitting}
        >
          <Text style={styles.addBtnText}>{submitting ? '…' : 'Add'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No categories yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const keyExtractor = (c: Category) => c.id;

const renderItem = ({ item }: { item: Category }) => (
  <View style={styles.row}>
    <Text style={styles.rowText}>{item.name}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  addRow: { flexDirection: 'row', gap: 10, padding: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  addBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e6',
  },
  rowText: { fontSize: 16, color: '#222' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});
