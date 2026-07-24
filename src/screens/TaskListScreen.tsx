import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SyncStatusBar from '../components/SyncStatusBar';
import TaskListControls from '../components/TaskListControls';
import TaskListItem from '../components/TaskListItem';
import TaskFormModal, { type TaskFormValues } from '../components/TaskFormModal';
import { useDebouncedValue, useVisibleTasks } from '../features/tasks/hooks';
import { useTaskStore } from '../features/tasks/store';
import type { LocalTask } from '../features/tasks/types';
import type { TaskListProps } from '../navigation/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function TaskListScreen({ navigation }: TaskListProps) {
  const categories = useTaskStore((s) => s.categories);
  const filters = useTaskStore((s) => s.filters);
  const sort = useTaskStore((s) => s.sort);
  const sync = useTaskStore((s) => s.sync);
  const setFilters = useTaskStore((s) => s.setFilters);
  const setSort = useTaskStore((s) => s.setSort);
  const refresh = useTaskStore((s) => s.refresh);
  const createTask = useTaskStore((s) => s.createTask);
  const toggleStar = useTaskStore((s) => s.toggleStar);

  // Local search text is per-keystroke; the debounced value drives filtering.
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const visibleTasks = useVisibleTasks(debouncedSearch);

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch fresh data in the background once on mount (cache already on screen).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable onPress={() => navigation.navigate('Categories')} hitSlop={8}>
            <Text style={styles.headerLink}>Categories</Text>
          </Pressable>
          <Pressable onPress={() => setShowCreate(true)} hitSlop={8}>
            <Text style={styles.headerAdd}>＋</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const handlePressItem = useCallback(
    (id: string) => navigation.navigate('TaskDetail', { taskId: id }),
    [navigation],
  );

  const handleCreate = useCallback(
    async (values: TaskFormValues) => {
      setSubmitting(true);
      try {
        await createTask(values);
        setShowCreate(false);
      } catch (err) {
        Alert.alert(
          'Could not create task',
          err instanceof Error ? err.message : 'Unknown error',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [createTask],
  );

  const renderItem = useCallback(
    ({ item }: { item: LocalTask }) => (
      <TaskListItem
        task={item}
        categoryName={item.category_id ? categoryNameById.get(item.category_id) ?? null : null}
        onPress={handlePressItem}
        onToggleStar={toggleStar}
      />
    ),
    [categoryNameById, handlePressItem, toggleStar],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SyncStatusBar
        lastRefreshedAt={sync.lastRefreshedAt}
        isRefreshing={sync.isRefreshing}
        isOffline={sync.isOffline}
        error={sync.error}
      />

      <FlatList
        data={visibleTasks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <TaskListControls
            categories={categories}
            categoryId={filters.categoryId}
            status={filters.status}
            sort={sort}
            searchText={searchText}
            onSearchChange={setSearchText}
            onCategoryChange={(id) => setFilters({ categoryId: id })}
            onStatusChange={(status) => setFilters({ status })}
            onSortChange={setSort}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {sync.isRefreshing ? 'Loading tasks…' : 'No tasks match your filters.'}
            </Text>
          </View>
        }
        onRefresh={refresh}
        refreshing={sync.isRefreshing}
      />

      <TaskFormModal
        visible={showCreate}
        title="New Task"
        categories={categories}
        submitting={submitting}
        onCancel={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}

const keyExtractor = (task: LocalTask) => task.id;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerLink: { color: '#2563eb', fontSize: 15 },
  headerAdd: { color: '#2563eb', fontSize: 26, lineHeight: 28 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});
