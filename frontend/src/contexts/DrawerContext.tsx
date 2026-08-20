import React, { createContext, useContext, useState, ReactNode } from 'react';
import { JobListing } from '../types';

interface DrawerContextValue {
  selectedListing: JobListing | null;
  setSelectedListing: (listing: JobListing | null) => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedListing, setSelectedListing] = useState<JobListing | null>(null);
  return (
    <DrawerContext.Provider value={{ selectedListing, setSelectedListing }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return ctx;
};
