import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { SlugPair } from '../hooks/useLocalizedPath';

interface SlugContextType {
  currentSlugPair: SlugPair | null;
  setCurrentSlugPair: (pair: SlugPair | null) => void;
}

const SlugContext = createContext<SlugContextType>({
  currentSlugPair: null,
  setCurrentSlugPair: () => {},
});

export function SlugProvider({ children }: { children: ReactNode }) {
  const [currentSlugPair, setCurrentSlugPairState] = useState<SlugPair | null>(null);

  const setCurrentSlugPair = useCallback((pair: SlugPair | null) => {
    setCurrentSlugPairState(pair);
  }, []);

  return (
    <SlugContext.Provider value={{ currentSlugPair, setCurrentSlugPair }}>
      {children}
    </SlugContext.Provider>
  );
}

export function useSlugContext() {
  return useContext(SlugContext);
}
