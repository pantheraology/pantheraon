import { useCallback } from 'react';
import { Space } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/config/storage';
import { parseStoredDate, toStoredDate } from '@/lib/utils';

interface StoredSpace {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export const useSpaces = () => {
  const [storedSpaces, setStoredSpaces] = useLocalStorage<StoredSpace[]>(STORAGE_KEYS.SPACES, []);

  // Parse dates from stored format
  const spaces: Space[] = storedSpaces.map((s) => ({
    ...s,
    createdAt: parseStoredDate(s.createdAt),
  }));

  const createSpace = useCallback((name: string): Space => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
    };
    
    setStoredSpaces((prev) => [
      ...prev,
      { ...newSpace, createdAt: toStoredDate(newSpace.createdAt) },
    ]);
    
    return newSpace;
  }, [setStoredSpaces]);

  const deleteSpace = useCallback((id: string) => {
    setStoredSpaces((prev) => prev.filter((s) => s.id !== id));
  }, [setStoredSpaces]);

  const getSpace = useCallback((id: string): Space | undefined => {
    return spaces.find((s) => s.id === id);
  }, [spaces]);

  return {
    spaces,
    createSpace,
    deleteSpace,
    getSpace,
  };
};
