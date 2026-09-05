import React, { useState } from 'react';
import { 
  Clapperboard, 
  Copy, 
  Sparkles, 
  Layers, 
  Film, 
  Settings2,
  FileDown,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { motion } from 'motion/react';
import { StyleRegisterKey } from '../types';
import { BASE_STYLE_BLOCK, STYLE_REGISTERS } from '../data/protocolsData';
import { useProjects } from '../context/ProjectContext';
import { PromptInspectorModal } from './PromptInspectorModal';
import { downloadFile, estimateTokens, compileStoryboardPrompt, generateStoryboardMarkdown } from '../utils/exportHelpers';
import { soundFx } from '../utils/audio';

interface Storyboard5x3EngineProps {
  onCopy: (text: string, label: string) => void;
}

export const Storyboard5x3Engine: React.FC<Storyboard5x3EngineProps> = ({ onCopy }) => {
  const { 
    activeProject, 
    updateActiveStoryboard, 
    updateActiveProject, 
    syncCharacterToStoryboard, 
    syncScaleToStoryboard 
  } = useProjects();

  const [currentState, setCurrentState] = useState<number>(3); // Default to State 3 (Generate Sheet 5x3)
  const [activePanelIdx, setActivePanelIdx] = useState<number | null>(0);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  const sb = activeProject.storyboard;
  const activeRegister = STYLE_REGISTERS.find(r => r.id === sb.selectedRegister) || STYLE_REGISTERS[1];
  const compiledPrompt = compileStoryboardPrompt(activeProject);
  const tokenEstimate = estimateTokens(compiledPrompt);

  // Consecutive framing violation detection
  const framingViolations: number[] = [];
  for (let i = 0; i < sb.panels.length - 1; i++) {
    const current = sb.panels[i].framing.trim().toLowerCase();
    const next = sb.panels[i + 1].framing.trim().toLowerCase();
    if (current && next && current === next) {
      framingViolations.push(i + 1);
    }
  }

  const handleUpdatePanelCaption = (idx: number, caption: string) => {
    const nextPanels = [...sb.panels];
    nextPanels[idx] = { ...nextPanels[idx], caption };
    updateActiveStoryboard({ panels: nextPanels });
  };

  const handleUpdatePanelFraming = (idx: number, framing: string) => {
    const nextPanels = [...sb.panels];
    nextPanels[idx] = { ...nextPanels[idx], framing };
    updateActiveStoryboard({ panels: nextPanels });
  };

  const handleFixConsecutiveFraming = (panelIdx: number, newFraming: string) => {
    handleUpdatePanelFraming(panelIdx, newFraming);
  };

  const handleDownloadMd = () => {
    soundFx.playActionConfirm();
    const md = generateStoryboardMarkdown(activeProject);
    const filename = `storyboard-5x3-${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleDownloadTxt = () => {
    soundFx.playActionConfirm();
    const filename = `prompt-5x3-${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    downloadFile(compiledPrompt, filename, 'text/plain');
  };

  const handleSyncCharacter = () => {
    soundFx.playActionConfirm();
    syncCharacterToStoryboard();
    onCopy('', 'Dados do Personagem Sincronizados com o Storyboard!');
  };

  const handleSyncScale = () => {
    soundFx.playActionConfirm();
    syncScaleToStoryboard();
    onCopy('', 'Sujeito e Escala Sincronizados com o Storyboard!');
  };

  const stateLabels = [
    { num: 0, label: 'State 0: Intake', desc: 'Identifica categoria (Ads vs Non-Ads)' },
    { num: 1, label: 'State 1: Discovery', desc: 'Pergunta tema, look e sujeito' },
    { num: 2, label: 'State 2: Proposal', desc: 'Propõe a narrativa dos 15 quadros' },
    { num: 3, label: 'State 3: Generate', desc: 'Emite o prompt travado do sheet 5x3' },
    { num: 4, label: 'State 4: Complete', desc: 'Pronto para Seedance / Gemini' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Inspector Modal */}
      <PromptInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        project={activeProject}
        onFixConsecutiveFraming={handleFixConsecutiveFraming}
        onCopy={onCopy}
      />

      {/* View Header: Director's Slate */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-[#20222c] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
              Protocolo OAK · Sheet 5×3
            </span>
            <span className="text-xs text-slate-400 font-mono">15 Quadros · 1s/quadro · 0:15 Total</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">{activeProject.name}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clapperboard className="w-6 h-6 text-indigo-400" />
            Storyboard Sheet 5×3 Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Prompt mestre com chrome visível de produção, timecodes sequenciais, blocos locked e persistência por projeto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundFx.playMicroClick();
              setIsInspectorOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#282b3a] hover:bg-[#323649] text-indigo-300 hover:text-white font-mono text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Inspecionar Prompt & Gates</span>
          </button>

          <button
            onClick={handleDownloadMd}
            title="Baixar em formato Markdown com tabela completa"
            className="p-2 rounded-xl bg-[#222432] hover:bg-[#2b2e40] text-slate-300 hover:text-white border border-[#373b50] transition-colors"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadTxt}
            title="Baixar prompt puro em .txt"
            className="p-2 rounded-xl bg-[#222432] hover:bg-[#2b2e40] text-slate-300 hover:text-white border border-[#373b50] transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onCopy(compiledPrompt, 'Prompt 5x3 Mestre Copiado!')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Prompt</span>
          </motion.button>
        </div>
      </div>

      {/* Cross-Pipeline Smart Sync Bar */}
      <div className="p-3 rounded-xl border border-[#2e313f] bg-[#1a1b24] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Link2 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">Sincronização entre Etapas:</span>
          <span className="text-slate-400 hidden sm:inline">Puxe dados de outras etapas diretamente para este Storyboard</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncScale}
            className="px-3 py-1.5 rounded-lg bg-[#242634] hover:bg-[#2e3144] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all text-[11px]"
          >
            <span>Importar da Escala 2×2</span>
          </button>
          <button
            onClick={handleSyncCharacter}
            className="px-3 py-1.5 rounded-lg bg-[#242634] hover:bg-[#2e3144] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all text-[11px]"
          >
            <span>Importar da Character Sheet</span>
          </button>
        </div>
      </div>

      {/* State Machine Stepper in Dark Gray */}
      <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-4 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-[#2a2c3a] pb-2">
          <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Máquina de Estados de Geração (States 0 a 4)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Fase Atual: <strong className="text-indigo-300">State {currentState}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {stateLabels.map((st) => (
            <motion.button
              key={st.num}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                soundFx.playMicroClick();
                setCurrentState(st.num);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentState === st.num
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 shadow-md'
                  : 'border-[#2c2e3b] bg-[#1a1b22] text-slate-400 hover:border-[#3d4152] hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-mono font-bold">{st.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{st.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Production Slate & Slot Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Slotted Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                Slots da Produção (Variáveis)
              </h3>
              <span className="text-[10px] font-mono uppercase bg-[#181920] text-slate-400 px-2 py-0.5 rounded border border-[#2c2e3b]">
                Auto-salvo
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  Categoria de Produção
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateActiveProject({ category: 'ads' });
                      updateActiveStoryboard({ 
                        aspectRatio: '16:9', 
                        selectedRegister: 'register-b' 
                      });
                    }}
                    className={`py-1.5 px-3 rounded-lg border font-mono text-xs transition-colors ${
                      activeProject.category === 'ads'
                        ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300 font-bold'
                        : 'border-[#2c2e3b] bg-[#181920] text-slate-400'
                    }`}
                  >
                    Comercial / Ads
                  </button>
                  <button
                    onClick={() => {
                      updateActiveProject({ category: 'non-ads' });
                      updateActiveStoryboard({ 
                        aspectRatio: '2.39:1', 
                        selectedRegister: 'register-a' 
                      });
                    }}
                    className={`py-1.5 px-3 rounded-lg border font-mono text-xs transition-colors ${
                      activeProject.category === 'non-ads'
                        ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300 font-bold'
                        : 'border-[#2c2e3b] bg-[#181920] text-slate-400'
                    }`}
                  >
                    Narrativa / Cinema
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Palavra do Header
                  </label>
                  <input
                    type="text"
                    value={sb.titleWord}
                    onChange={e => updateActiveStoryboard({ titleWord: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Etiqueta de Duração
                  </label>
                  <input
                    type="text"
                    value={sb.formatLabel}
                    onChange={e => updateActiveStoryboard({ formatLabel: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  Sujeito Principal / Asset Chave
                </label>
                <textarea
                  rows={3}
                  value={sb.subject}
                  onChange={e => updateActiveStoryboard({ subject: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white text-xs focus:border-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  Colourway / Paleta de Cores
                </label>
                <input
                  type="text"
                  value={sb.colourway}
                  onChange={e => updateActiveStoryboard({ colourway: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Aspect Ratio
                  </label>
                  <select
                    value={sb.aspectRatio}
                    onChange={e => updateActiveStoryboard({ aspectRatio: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="2.39:1">2.39:1 (Anamorphic)</option>
                    <option value="4:3">4:3 (Academy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Style Register
                  </label>
                  <select
                    value={sb.selectedRegister}
                    onChange={e => updateActiveStoryboard({ selectedRegister: e.target.value as StyleRegisterKey })}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="register-a">Register A (Filme 35mm)</option>
                    <option value="register-b">Register B (Commercial)</option>
                    <option value="register-c">Register C (Documentary)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Register Info Pill */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                <span>{activeRegister.name}</span>
                <span>{activeRegister.tag}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {activeRegister.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 15-Panel Contact Sheet Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between border-b border-[#2a2c3a] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Matriz Visual dos 15 Painéis (Grid 5×3)
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {framingViolations.length > 0 ? (
                  <button
                    onClick={() => setIsInspectorOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] hover:bg-amber-500/25 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{framingViolations.length} Alerta(s) de Framing Consecutivo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Framings 100% Variados</span>
                  </div>
                )}
                <span className="text-slate-400">1s / quadro · 15s Total</span>
              </div>
            </div>

            {/* 15 Panels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {sb.panels.map((p, idx) => {
                const isActive = activePanelIdx === idx;
                const isViolation = framingViolations.includes(idx);
                return (
                  <motion.div
                    key={p.panelNumber}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      soundFx.playMicroClick();
                      setActivePanelIdx(idx);
                    }}
                    className={`cursor-pointer rounded-xl border p-2.5 flex flex-col justify-between transition-all h-36 relative ${
                      isViolation
                        ? 'border-amber-500/70 bg-amber-950/20'
                        : isActive
                        ? 'border-indigo-500 bg-indigo-950/50 ring-2 ring-indigo-500/30 shadow-md'
                        : 'border-[#2c2e3b] bg-[#181920] hover:border-indigo-400/50 hover:bg-[#20222a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-[#282a36] text-slate-300'
                      }`}>
                        P{p.panelNumber.toString().padStart(2, '0')}
                      </span>
                      <span className="text-slate-400">{p.timecode}</span>
                    </div>

                    <div className={`my-1.5 p-1.5 rounded-lg text-[10px] font-mono text-center font-bold truncate border ${
                      isViolation 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-[#14151a] text-indigo-300 border-[#2a2c38]'
                    }`}>
                      {p.framing}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {p.caption}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Active Panel Inspector */}
            {activePanelIdx !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-bold">
                      Painel {sb.panels[activePanelIdx].panelNumber.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs font-mono text-indigo-300 font-bold">
                      Timecode: {sb.panels[activePanelIdx].timecode}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Diretriz de Câmera e Atuação
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 font-semibold">
                      Enquadramento
                    </label>
                    <input
                      type="text"
                      value={sb.panels[activePanelIdx].framing}
                      onChange={e => handleUpdatePanelFraming(activePanelIdx, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-xs font-mono text-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 font-semibold">
                      Descrição da Ação / Movimento de Câmera
                    </label>
                    <input
                      type="text"
                      value={sb.panels[activePanelIdx].caption}
                      onChange={e => handleUpdatePanelCaption(activePanelIdx, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#181920] border border-[#2c2e3b] text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Prompt Preview Card */}
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  Prompt Mestre Compilado
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ~{tokenEstimate} tokens
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInspectorOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#252838] hover:bg-[#30344a] text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Inspecionar</span>
                </button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onCopy(compiledPrompt, 'Prompt Mestre 5x3 Copiado!')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Bloco</span>
                </motion.button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
              {compiledPrompt}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
