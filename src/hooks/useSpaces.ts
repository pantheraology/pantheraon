import { useCallback } from 'react';
import { Space } from '@/types';
import { useLocalStorage } from './useLocalStorage';

const SPACES_KEY = 'pantheraon-spaces';

interface StoredSpace {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export const useSpaces = () => {
  const [storedSpaces, setStoredSpaces] = useLocalStorage<StoredSpace[]>(SPACES_KEY, []);

  // Parse dates from stored format
  const spaces: Space[] = storedSpaces.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
  }));

  const createSpace = useCallback((name: string): Space => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
    };
    
    setStoredSpaces((prev) => [
      ...prev,
      { ...newSpace, createdAt: newSpace.createdAt.toISOString() },
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
