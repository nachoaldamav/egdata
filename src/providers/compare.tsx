import { type ReactNode, useState } from 'react';
import { CompareContext } from '../context/compare';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compare, setCompare] = useState<string[]>([]);

  const addToCompare = (id: string) => {
    setCompare((prev) => [...prev, id]);
  };

  const removeFromCompare = (id: string) => {
    setCompare((prev) => prev.filter((item) => item !== id));
  };

  return (
    <CompareContext.Provider value={{ compare, addToCompare, removeFromCompare }}>
      {children}
    </CompareContext.Provider>
  );
}
