import { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  fullWidth: boolean;
  setFullWidth: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [fullWidth, setFullWidth] = useState(false);
  return (
    <LayoutContext.Provider value={{ fullWidth, setFullWidth }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}
