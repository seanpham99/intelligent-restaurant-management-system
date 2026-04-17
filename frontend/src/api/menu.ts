import type { MenuItem } from '../types';
import { getJson } from './client';

export function fetchMenuItems(): Promise<MenuItem[]> {
  return getJson<MenuItem[]>('/menu/list_items');
}
