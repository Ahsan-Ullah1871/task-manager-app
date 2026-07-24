import { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  Category,
  SortBy,
  StatusFilter,
  TaskSort,
} from '../features/tasks/types';

interface Props {
  categories: Category[];
  categoryId: string | null;
  status: StatusFilter;
  sort: TaskSort;
  searchText: string;
  onSearchChange: (text: string) => void;
  onCategoryChange: (id: string | null) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: TaskSort) => void;
}

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Done', value: 'done' },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Created', value: 'created' },
  { label: 'Due', value: 'due' },
];

/** Search box + status/category/sort controls above the list. */
function TaskListControls({
  categories,
  categoryId,
  status,
  sort,
  searchText,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.search}
        value={searchText}
        onChangeText={onSearchChange}
        placeholder="Search by title"
        clearButtonMode="while-editing"
        autoCorrect={false}
      />

      <View style={styles.segment}>
        {STATUS_OPTIONS.map((opt) => (
          <Segment
            key={opt.value}
            label={opt.label}
            active={status === opt.value}
            onPress={() => onStatusChange(opt.value)}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Chip
          label="All categories"
          active={categoryId === null}
          onPress={() => onCategoryChange(null)}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={categoryId === c.id}
            onPress={() => onCategoryChange(c.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={sort.sortBy === opt.value}
            onPress={() => onSortChange({ ...sort, sortBy: opt.value })}
          />
        ))}
        <Chip
          label={sort.dir === 'asc' ? '↑ Asc' : '↓ Desc'}
          active={false}
          onPress={() =>
            onSortChange({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
          }
        />
      </View>
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.segmentItem, active && styles.segmentItemActive]}
      onPress={onPress}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
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
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: '#fff',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, color: '#666' },
  segmentTextActive: { color: '#111', fontWeight: '600' },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortLabel: { fontSize: 13, color: '#666', marginRight: 2 },
});

export default memo(TaskListControls);
