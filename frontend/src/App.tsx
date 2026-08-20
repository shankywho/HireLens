import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BoardPage } from './pages/BoardPage';
import { CompanyPage } from './pages/CompanyPage';
import { HealthPage } from './pages/HealthPage';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { DrawerProvider, useDrawer } from './contexts/DrawerContext';
import { JobListing } from './types';

// Inner component that consumes Drawer context
const MainApp: React.FC = () => {
  const { selectedListing, setSelectedListing } = useDrawer();
  const [activeTab, setActiveTab] = useState<'feed' | 'company' | 'health'>('feed');

  return (
    <div className="bg-caldera-grid min-h-screen text-obsidian flex flex-col font-sans font-medium selection:bg-ember selection:text-chalk">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <BoardPage
            onNavigateHealth={() => setActiveTab('health')}
            onSelectListing={setSelectedListing}
          />
        )}
        {activeTab === 'company' && (
          <CompanyPage onSelectListing={setSelectedListing} />
        )}
        {activeTab === 'health' && <HealthPage />}
      </main>

      {/* Consolidated EvidenceDrawer */}
      <EvidenceDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      <footer className="bg-limestone py-6 mt-16 border-t border-dotted border-obsidian/25 text-center font-sans font-medium text-xs text-obsidian/70">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-mono font-bold text-xs uppercase tracking-wider text-obsidian">
            HIRELENS // OSINT RECONNAISSANCE ENGINE
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-obsidian/60">
            POWERED BY BRIGHT DATA SCRAPER STUDIO & GOOGLE GEMINI 3.6 FLASH
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <DrawerProvider>
    <MainApp />
  </DrawerProvider>
);

export default App;
