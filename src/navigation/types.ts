import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  Categories: undefined;
};

export type TaskListProps = NativeStackScreenProps<
  RootStackParamList,
  'TaskList'
>;
export type TaskDetailProps = NativeStackScreenProps<
  RootStackParamList,
  'TaskDetail'
>;
export type CategoriesProps = NativeStackScreenProps<
  RootStackParamList,
  'Categories'
>;
