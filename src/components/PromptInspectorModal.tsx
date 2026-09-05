import React, { useState } from 'react';
import { 
  Lock, 
  Copy, 
  FileDown, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Wand2, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectData } from '../types';
import { BASE_STYLE_BLOCK, STYLE_REGISTERS } from '../data/protocolsData';
import { downloadFile, estimateTokens, compileStoryboardPrompt, generateStoryboardMarkdown } from '../utils/exportHelpers';
import { soundFx } from '../utils/audio';

interface PromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onFixConsecutiveFraming: (panelIdx: number, newFraming: string) => void;
  onCopy: (text: string, label: string) => void;
}

const COMPLEMENTARY_FRAMINGS = [
  'Wide Establishing',
  'Medium Close-Up',
  'Macro Insert',
  'Low Angle Medium',
  'Tracking Wide',
  'Close-up Profile',
  'POV / OTS',
  'High Angle Wide'
];

export const PromptInspectorModal: React.FC<PromptInspectorModalProps> = ({
  isOpen,
  onClose,
  project,
  onFixConsecutiveFraming,
  onCopy
}) => {
  const [activeView, setActiveView] = useState<'visual' | 'raw'>('visual');

  if (!isOpen) return null;

  const sb = project.storyboard;
  const activeRegister = STYLE_REGISTERS.find(r => r.id === sb.selectedRegister) || STYLE_REGISTERS[1];
  const compiledRaw = compileStoryboardPrompt(project);
  const tokenCount = estimateTokens(compiledRaw);

  // Live Gate Check: Consecutive framing violations
  const framingViolations: { index: number; framing: string }[] = [];
  for (let i = 0; i < sb.panels.length - 1; i++) {
    const current = sb.panels[i].framing.trim().toLowerCase();
    const next = sb.panels[i + 1].framing.trim().toLowerCase();
    if (current && next && current === next) {
      framingViolations.push({ index: i + 1, framing: sb.panels[i + 1].framing });
    }
  }

  // Completeness check
  const emptyPanels = sb.panels.filter(p => !p.caption.trim());
  const isSubjectEmpty = !sb.subject.trim();

  const handleCopyRaw = () => {
    onCopy(compiledRaw, 'Prompt Copiado com Sucesso!');
  };

  const handleDownloadMd = () => {
    soundFx.playActionConfirm();
    const md = generateStoryboardMarkdown(project);
    const filename = `storyboard-5x3-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleDownloadTxt = () => {
    soundFx.playActionConfirm();
    const filename = `prompt-5x3-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    downloadFile(compiledRaw, filename, 'text/plain');
  };

  const handleAutoFix = (violationIdx: number) => {
    soundFx.playActionConfirm();
    const currentFraming = sb.panels[violationIdx].framing;
    const alternatives = COMPLEMENTARY_FRAMINGS.filter(f => f.toLowerCase() !== currentFraming.toLowerCase());
    const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
    onFixConsecutiveFraming(violationIdx, replacement);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-500/40 bg-[#171821] shadow-2xl shadow-black overflow-hidden font-sans"
        >
          {/* Top Bar Header */}
          <div className="px-6 py-4 border-b border-[#2a2c3a] bg-[#1a1b25] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Auditoria & Compilação de Prompt 5×3
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    OAK Protocol v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {project.name} · {project.category.toUpperCase()} · {sb.aspectRatio}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-[#242633] p-1 rounded-xl border border-[#343748]">
                <button
                  onClick={() => {
                    soundFx.playMicroClick();
                    setActiveView('visual');
                  }}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                    activeView === 'visual' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visual & Gates
                </button>
                <button
                  onClick={() => {
                    soundFx.playMicroClick();
                    setActiveView('raw');
                  }}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                    activeView === 'raw' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Prompt
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252834] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gate Status & Diagnostics Banner */}
          <div className="px-6 py-3 border-b border-[#282a38] bg-[#14151c] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Tokens Estimados:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ~{tokenCount} tokens
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Grade:</span>
              <span className="text-amber-400 font-bold">15 Painéis (5×3)</span>
            </div>

            <div className="flex items-center gap-3">
              {framingViolations.length === 0 && emptyPanels.length === 0 && !isSubjectEmpty ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Todos os Gates Aprovados (100%)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">
                    {framingViolations.length > 0 ? `${framingViolations.length} Alerta(s) de Framing` : 'Campos pendentes'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Body Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
            {/* Gate Alert: Consecutive Framing Violation */}
            {framingViolations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Gate de Qualidade: Violação da Regra de Enquadramento Consecutivo</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  O protocolo OAK proíbe estritamente que dois quadros consecutivos compartilhem a mesma escala de câmera.
                </p>
                <div className="space-y-1.5 pt-1">
                  {framingViolations.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-lg border border-amber-500/20">
                      <span>
                        Painel #{v.index + 1} repete o framing: <strong className="text-white">"{v.framing}"</strong>
                      </span>
                      <button
                        onClick={() => handleAutoFix(v.index)}
                        className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-mono text-[11px] font-bold hover:bg-amber-400 flex items-center gap-1 transition-all"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Variar Automaticamente</span>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === 'visual' ? (
              <div className="space-y-4">
                {/* Protocol Header Block */}
                <div className="p-4 rounded-xl border border-[#313444] bg-[#1d1f2b] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">CABECALHO & METADADOS DA SHEET</span>
                    <span className="px-2 py-0.5 rounded bg-[#272a39] text-amber-400 border border-[#3c3f54]">
                      SLOTS PREENCHIDOS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-[#14151d] p-2.5 rounded-lg border border-[#2b2d3d]">
                      <span className="text-slate-500 block text-[10px]">HEADER TITLE</span>
                      <span className="text-white font-bold">{sb.titleWord.toUpperCase()}</span>
                    </div>
                    <div className="bg-[#14151d] p-2.5 rounded-lg border border-[#2b2d3d]">
                      <span className="text-slate-500 block text-[10px]">FORMAT</span>
                      <span className="text-white font-bold">{sb.formatLabel.toUpperCase()}</span>
                    </div>
                    <div className="bg-[#14151d] p-2.5 rounded-lg border border-[#2b2d3d]">
                      <span className="text-slate-500 block text-[10px]">ASPECT RATIO</span>
                      <span className="text-amber-400 font-bold">{sb.aspectRatio}</span>
                    </div>
                    <div className="bg-[#14151d] p-2.5 rounded-lg border border-[#2b2d3d]">
                      <span className="text-slate-500 block text-[10px]">REGISTER</span>
                      <span className="text-indigo-300 font-bold">{activeRegister.name.split('—')[1] || activeRegister.name}</span>
                    </div>
                  </div>
                  <div className="bg-[#14151d] p-3 rounded-lg border border-[#2b2d3d] text-xs font-mono space-y-1">
                    <div className="text-slate-500 text-[10px]">SUBJECT (SUJEITO PRINCIPAL)</div>
                    <div className="text-slate-200 font-sans leading-relaxed">{sb.subject}</div>
                  </div>
                  <div className="bg-[#14151d] p-3 rounded-lg border border-[#2b2d3d] text-xs font-mono space-y-1">
                    <div className="text-slate-500 text-[10px]">COLOURWAY & TEXTURA</div>
                    <div className="text-slate-200 font-sans leading-relaxed">{sb.colourway}</div>
                  </div>
                </div>

                {/* Locked Block: Base Style */}
                <div className="p-4 rounded-xl border border-amber-500/40 bg-[#1c1a24] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED BLOCK: BASE CINEMATIC PHOTO-REALISM</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      TRAVADO PALAVRA POR PALAVRA
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#13131a] p-3 rounded-lg border border-[#2c2c3d]">
                    {BASE_STYLE_BLOCK}
                  </pre>
                </div>

                {/* Locked Block: Register Specific */}
                <div className="p-4 rounded-xl border border-indigo-500/40 bg-[#191b28] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED BLOCK: {activeRegister.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                      TRAVADO PALAVRA POR PALAVRA
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#13141f] p-3 rounded-lg border border-[#2a2c3e]">
                    {activeRegister.lockedContent}
                  </pre>
                </div>

                {/* 15 Panels Sequence Preview */}
                <div className="p-4 rounded-xl border border-[#313444] bg-[#1d1f2b] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">SEQUÊNCIA DOS 15 PAINÉIS (15s RUNTIME)</span>
                    <span className="text-slate-400">1 segundo / quadro</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                    {sb.panels.map((p, idx) => {
                      const isViolation = framingViolations.some(v => v.index === idx);
                      return (
                        <div 
                          key={p.panelNumber} 
                          className={`p-2.5 rounded-lg border text-xs font-mono flex items-start gap-3 transition-colors ${
                            isViolation
                              ? 'border-amber-500/60 bg-amber-500/10'
                              : 'border-[#292c3c] bg-[#151620]'
                          }`}
                        >
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            #{p.panelNumber.toString().padStart(2, '0')}
                          </span>
                          <span className="text-slate-400 shrink-0">[{p.timecode}]</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#252837] text-slate-300 shrink-0">
                            {p.framing}
                          </span>
                          <span className="text-slate-200 flex-1 font-sans text-[12px]">{p.caption}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>PROMPT COMPILADO INTEGRAL</span>
                  <span>Pronto para copiar ou download</span>
                </div>
                <textarea 
                  readOnly 
                  value={compiledRaw} 
                  rows={20}
                  className="w-full rounded-xl border border-[#313444] bg-[#12131a] p-4 text-xs font-mono text-slate-300 leading-relaxed focus:outline-hidden selection:bg-amber-500/30 selection:text-white resize-none"
                />
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-4 border-t border-[#2a2c3a] bg-[#1a1b25] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Pipeline: Etapa 4 & 5 (Storyboard Sheet 5×3)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 rounded-xl bg-[#252834] hover:bg-[#2d303f] text-slate-300 hover:text-white border border-[#363a4d] text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
                title="Baixar prompt limpo em formato .txt"
              >
                <FileText className="w-4 h-4" />
                <span>Baixar .TXT</span>
              </button>

              <button
                onClick={handleDownloadMd}
                className="px-3.5 py-2 rounded-xl bg-[#252834] hover:bg-[#2d303f] text-slate-300 hover:text-white border border-[#363a4d] text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
                title="Baixar especificação completa em formato Markdown .md"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar .MD</span>
              </button>

              <button
                onClick={handleCopyRaw}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Prompt Integral</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
