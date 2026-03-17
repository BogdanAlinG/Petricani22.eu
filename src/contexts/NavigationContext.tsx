import { createContext, useContext, useState, useCallback } from 'react';

type NavDirection = 'forward' | 'back';

interface NavigationContextValue {
  direction: NavDirection;
  setDirection: (d: NavDirection) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  direction: 'forward',
  setDirection: () => {},
  goBack: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirectionState] = useState<NavDirection>('forward');

  const setDirection = useCallback((d: NavDirection) => {
    setDirectionState(d);
  }, []);

  const goBack = useCallback(() => {
    setDirectionState('back');
  }, []);

  return (
    <NavigationContext.Provider value={{ direction, setDirection, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
