import React, { useState } from 'react';
import { 
  Clapperboard, 
  Workflow, 
  Grid3X3, 
  Scale, 
  UserCheck, 
  Sparkles, 
  BookOpen, 
  Layers,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  FolderGit2,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useProjects } from '../context/ProjectContext';
import { ProjectManagerModal } from './ProjectManagerModal';
import { soundFx } from '../utils/audio';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  copiedNotice: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, copiedNotice }) => {
  const { theme, toggleTheme } = useTheme();
  const { activeProject, lastSavedTime } = useProjects();
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFx.isMuted());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  const navItems: { 
    id: TabType; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: string;
    activeStyle: string;
    accentDot: string;
  }[] = [
    { 
      id: 'pipeline', 
      label: 'Pipeline (1-5)', 
      icon: Workflow, 
      badge: '5 Etapas',
      activeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
      accentDot: 'bg-amber-400'
    },
    { 
      id: 'storyboard-5x3', 
      label: 'Sheet 5×3 Engine', 
      icon: Clapperboard, 
      badge: '15 Shots',
      activeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/10',
      accentDot: 'bg-indigo-400'
    },
    { 
      id: 'scale-2x2', 
      label: 'Escala 2×2 Lata', 
      icon: Scale, 
      badge: '11.5cm',
      activeStyle: 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-500/10',
      accentDot: 'bg-red-400'
    },
    { 
      id: 'character-sheet', 
      label: 'Character Sheet', 
      icon: UserCheck, 
      badge: 'v2.0',
      activeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
      accentDot: 'bg-emerald-400'
    },
    { 
      id: 'depth-3x3', 
      label: 'Depth Board 3×3', 
      icon: Grid3X3, 
      badge: 'Grayscale',
      activeStyle: 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/10',
      accentDot: 'bg-violet-400'
    },
    { 
      id: 'styles', 
      label: 'Style Registers', 
      icon: Sparkles, 
      badge: 'A / B / C',
      activeStyle: 'bg-amber-600/20 text-amber-200 border-amber-600/40 shadow-sm shadow-amber-600/10',
      accentDot: 'bg-amber-500'
    },
    { 
      id: 'protocols-docs', 
      label: 'Protocolos & Repo', 
      icon: BookOpen, 
      activeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10',
      accentDot: 'bg-sky-400'
    },
  ];

  return (
    <>
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <header className="sticky top-0 z-40 border-b border-[#2d303d] bg-[#181920]/95 backdrop-blur-md transition-colors duration-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo / Brand */}
            <div 
              className="flex items-center gap-3 cursor-pointer group shrink-0" 
              onClick={() => onSelectTab('pipeline')}
              id="brand-header-link"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 transition-transform duration-200 group-hover:scale-105">
                <Layers className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white font-sans">
                    Storyboard Animation Engine
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                    v2.0 PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono tracking-tight">
                  AI Cinematic Storyboards, Asset Locks & Workflows
                </p>
              </div>
            </div>

            {/* Active Project Switcher Dropdown Button */}
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundFx.playMicroClick();
                  setIsProjectModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-[#222432] hover:bg-[#2a2d3e] text-slate-200 transition-all shadow-xs group"
                title={`Projeto ativo: ${activeProject.name} (Salvo ${lastSavedTime || 'agora'})`}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>

                <div className="text-left font-mono text-xs max-w-[130px] md:max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white truncate text-[11px] group-hover:text-amber-300 transition-colors">
                      {activeProject.name}
                    </span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-[#181922] text-amber-400 border border-amber-500/30 shrink-0">
                      {activeProject.category === 'ads' ? 'ADS' : 'CINEMA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Salvo {lastSavedTime ? `às ${lastSavedTime}` : 'localmente'}</span>
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
              </motion.button>
            </div>

            {/* Center Notice Alert (for desktop) */}
            {copiedNotice && (
              <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-in fade-in zoom-in-95 duration-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{copiedNotice}</span>
              </div>
            )}

            {/* Right Action Bar: Audio Toggle, Theme Switcher & Repo Link */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Audio Feedback Sound Toggle */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="audio-feedback-toggle"
                onClick={handleToggleMute}
                title={isMuted ? 'Ativar feedback sonoro de UI' : 'Mutar sons de UI'}
                aria-label={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 ${
                  isMuted
                    ? 'border-[#2d303d] bg-[#22242d] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span className="hidden sm:inline text-[11px]">Mudo</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-[11px] font-semibold">Som</span>
                  </>
                )}
              </motion.button>

              {/* Theme Toggle Button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                id="theme-switcher-toggle"
                onClick={() => {
                  soundFx.playMicroClick();
                  toggleTheme();
                }}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2d303d] bg-[#22242d] hover:bg-[#282a36] text-slate-300 transition-all duration-200 text-xs font-mono group"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
                    <span className="hidden md:inline font-medium">Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400 transition-transform group-hover:-rotate-12" />
                    <span className="hidden md:inline font-medium">Escuro</span>
                  </>
                )}
              </motion.button>

              {/* GitHub Repo Origin Badge */}
              <a 
                href="https://github.com/jointgitkaru/Storyboards-e-Assets-Creations" 
                target="_blank" 
                rel="noreferrer"
                id="github-repo-link"
                onClick={() => soundFx.playMicroClick()}
                className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 rounded-lg bg-[#22242d] border border-[#2d303d] font-mono"
              >
                <span className="text-slate-500">repo:</span>
                <span className="font-semibold text-slate-300">jointgitkaru</span>
              </a>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 overflow-x-auto pb-2.5 scrollbar-none pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 border ${
                    isActive
                      ? item.activeStyle
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#22242d] border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.accentDot} ${isActive ? 'scale-125 ring-2 ring-current/20' : 'opacity-40'}`} />
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                      isActive 
                        ? 'bg-white/10 text-current font-bold' 
                        : 'bg-[#262833] text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
};
