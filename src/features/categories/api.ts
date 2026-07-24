import { supabase } from '../../lib/supabase';
import type { Category } from '../tasks/types';

const TABLE = 'categories';
const COLUMNS = 'id, name, created_at';

/** Fetch all categories. */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

/** Create a category and return the persisted row. */
export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}
