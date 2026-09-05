import React, { useState } from 'react';
import { TabType } from './types';
import { Navbar } from './components/Navbar';
import { ProductionLineView } from './components/ProductionLineView';
import { Storyboard5x3Engine } from './components/Storyboard5x3Engine';
import { ScaleCalculator2x2 } from './components/ScaleCalculator2x2';
import { CharacterSheetBuilder } from './components/CharacterSheetBuilder';
import { DepthBoard3x3View } from './components/DepthBoard3x3View';
import { StyleRegistersView } from './components/StyleRegistersView';
import { ProtocolDocsView } from './components/ProtocolDocsView';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from './utils/audio';
import { ProjectProvider } from './context/ProjectContext';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const handleSelectTab = (tab: TabType) => {
    soundFx.playTabSwitch();
    setActiveTab(tab);
  };

  const handleCopy = (text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
    soundFx.playCopySuccess();
    setCopiedNotice(label);
    setTimeout(() => {
      setCopiedNotice(null);
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-[#16171d] text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500/25 selection:text-amber-200">
      {/* Top Navigation Bar with Audio Toggle and Project Switcher */}
      <Navbar 
        activeTab={activeTab} 
        onSelectTab={handleSelectTab} 
        copiedNotice={copiedNotice} 
      />

      {/* Main Content Area with Dark Gray Backdrop across all Tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'pipeline' && (
              <ProductionLineView onNavigate={handleSelectTab} />
            )}

            {activeTab === 'storyboard-5x3' && (
              <Storyboard5x3Engine onCopy={handleCopy} />
            )}

            {activeTab === 'scale-2x2' && (
              <ScaleCalculator2x2 onCopy={handleCopy} />
            )}

            {activeTab === 'character-sheet' && (
              <CharacterSheetBuilder onCopy={handleCopy} />
            )}

            {activeTab === 'depth-3x3' && (
              <DepthBoard3x3View onCopy={handleCopy} />
            )}

            {activeTab === 'styles' && (
              <StyleRegistersView onCopy={handleCopy} />
            )}

            {activeTab === 'protocols-docs' && (
              <ProtocolDocsView onCopy={handleCopy} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer in Dark Gray */}
      <footer className="border-t border-[#2a2c38] bg-[#16171d]/90 py-6 text-xs text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-200 font-semibold">Storyboard Animation Engine</span>
            <span>·</span>
            <span className="text-slate-400">Claude Code & OAK Studio Edition</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Multi-Projeto LocalStorage</span>
            <span>·</span>
            <span>15 Panels (5×3)</span>
            <span>·</span>
            <span>9 Shots Depth (3×3)</span>
            <span>·</span>
            <span>Lata 33cl (11.5cm)</span>
          </div>
        </div>
      </footer>

      {/* Floating Copy Toast Notification with Subtle Harmonic Audio Feedback */}
      <AnimatePresence>
        {copiedNotice && (
          <motion.div 
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xl shadow-emerald-950/50 border border-emerald-400/30"
          >
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{copiedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;
