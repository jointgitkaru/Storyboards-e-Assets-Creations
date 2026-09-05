import React from 'react';
import { 
  UserCheck, 
  Scale, 
  Sparkles, 
  Grid3X3, 
  Film, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Camera, 
  ExternalLink,
  FolderGit2,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { PRODUCTION_PIPELINE_STEPS, STYLE_REGISTERS } from '../data/protocolsData';
import { useProjects } from '../context/ProjectContext';
import { ScriptEpisodeImporterModal } from './ScriptEpisodeImporterModal';

interface ProductionLineViewProps {
  onNavigate: (tab: TabType) => void;
}

export const ProductionLineView: React.FC<ProductionLineViewProps> = ({ onNavigate }) => {
  const { activeProject } = useProjects();
  const [isScriptModalOpen, setIsScriptModalOpen] = React.useState(false);
  const stepIcons = [UserCheck, Scale, Sparkles, Grid3X3, Film];

  const stepTargets: TabType[] = ['character-sheet', 'scale-2x2', 'styles', 'depth-3x3', 'storyboard-5x3'];

  const activeRegister = STYLE_REGISTERS.find(r => r.id === activeProject.storyboard.selectedRegister) || STYLE_REGISTERS[1];
  const numHeight = typeof activeProject.scaleCalculator.verifiedHeight === 'number' ? activeProject.scaleCalculator.verifiedHeight : 0;
  const scaleRatio = numHeight > 0 ? (numHeight / 11.5).toFixed(2) : '1.0';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto py-2"
    >
      {/* Hero Golden Rule Banner */}
      <motion.div 
        whileHover={{ scale: 1.002 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#21232d] to-[#1a1b22] p-6 md:p-8 shadow-xl shadow-black/30 transition-all"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                Regra de Ouro da Linha de Produção (OAK)
              </span>
              <span className="text-xs text-slate-400 font-mono">5 Protocolos Travados</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              A referência controla o <span className="text-amber-400">look</span>; o board de profundidade controla a <span className="text-amber-400">câmera</span>; as character sheets controlam a <span className="text-amber-400">identidade</span>.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Cada protocolo trava uma dimensão exata do problema sem contaminação entre etapas. Prompts são compostos por <strong className="text-amber-300">lock blocks</strong> (palavra por palavra, nunca parafraseados) + <strong className="text-amber-300">slots</strong> (valores variáveis da produção).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate('storyboard-5x3')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
            >
              <span>Abrir Engine 5×3</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate('scale-2x2')}
              className="px-4 py-2.5 rounded-xl bg-[#252833] hover:bg-[#2d303e] text-slate-200 text-xs font-mono font-medium border border-[#373a4b] flex items-center gap-2 transition-all shadow-xs"
            >
              <span>Calculadora Escala Lata</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Active Production Workspace Snapshot */}
      <div className="p-5 rounded-2xl border border-[#34374a] bg-[#1a1b24] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#292b38] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Produção Ativa Carregada</span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {activeProject.name}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setIsScriptModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar Episódio (.md)</span>
            </button>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              {activeProject.category.toUpperCase()}
            </span>
            <span className="text-slate-400">{activeProject.aspectRatio}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">15 Painéis 5×3</span>
          </div>
        </div>


        {/* 5 Integrated Assets Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* Step 1: Character */}
          <div 
            onClick={() => onNavigate('character-sheet')}
            className="p-3 rounded-xl bg-[#14151e] border border-[#2b2e3e] hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>01. IDENTIDADE</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-white font-bold truncate">
              {activeProject.characterSheet.name}
            </div>
            <div className="text-[11px] text-emerald-300 truncate">
              {activeProject.characterSheet.role || 'Protagonista'}
            </div>
          </div>

          {/* Step 2: Scale */}
          <div 
            onClick={() => onNavigate('scale-2x2')}
            className="p-3 rounded-xl bg-[#14151e] border border-[#2b2e3e] hover:border-red-500/50 cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>02. ESCALA 2×2</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-white font-bold truncate">
              {activeProject.scaleCalculator.subjectName || 'Objeto Mestre'}
            </div>
            <div className="text-[11px] text-red-300">
              {numHeight > 0 ? `${numHeight}cm (${scaleRatio}× lata)` : '11.5cm ref'}
            </div>
          </div>

          {/* Step 3: Style Register */}
          <div 
            onClick={() => onNavigate('styles')}
            className="p-3 rounded-xl bg-[#14151e] border border-[#2b2e3e] hover:border-amber-500/50 cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>03. LOOK & REGISTER</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-white font-bold truncate">
              {activeRegister.tag}
            </div>
            <div className="text-[11px] text-amber-300 truncate">
              {activeRegister.name.split('—')[0]}
            </div>
          </div>

          {/* Step 4: Depth Board */}
          <div 
            onClick={() => onNavigate('depth-3x3')}
            className="p-3 rounded-xl bg-[#14151e] border border-[#2b2e3e] hover:border-violet-500/50 cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>04. CÂMERA & DEPTH</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-white font-bold truncate">
              Depth Board 3×3
            </div>
            <div className="text-[11px] text-violet-300">
              9 Beats Grayscale
            </div>
          </div>

          {/* Step 5: Storyboard Sheet */}
          <div 
            onClick={() => onNavigate('storyboard-5x3')}
            className="p-3 rounded-xl bg-[#14151e] border border-indigo-500/40 hover:border-indigo-400 cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>05. SHEET 5×3</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-white font-bold truncate">
              {activeProject.storyboard.titleWord.toUpperCase()} · {activeProject.storyboard.formatLabel}
            </div>
            <div className="text-[11px] text-indigo-300">
              15 Painéis Travados
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Cards in Dark Gray with Motion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Sequência Obrigatória de Travamento
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Etapas 1 a 5 · Linha de Produção
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRODUCTION_PIPELINE_STEPS.map((step, idx) => {
            const Icon = stepIcons[idx];
            const targetTab = stepTargets[idx];
            return (
              <motion.div 
                key={step.step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 hover:border-amber-500/50 hover:shadow-xl hover:shadow-black/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      ETAPA {step.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#282a36] border border-[#3a3d4e] flex items-center justify-center text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {step.name}
                  </h4>
                  
                  <div className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#181920] text-amber-300 border border-[#2d303e] mb-2.5">
                    {step.dimension}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2a2c3a] space-y-2.5">
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-mono text-[10px] leading-tight text-slate-300">
                      {step.gate}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate(targetTab)}
                    className="w-full py-2 px-3 rounded-xl bg-[#262834] hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Configurar Etapa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Production Matrix in Dark Gray */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-6 space-y-4 shadow-md"
      >
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" />
          Matriz de Separação de Responsabilidades
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2e313f] text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-3">Dimensão Visual</th>
                <th className="py-3 px-3">Protocolo Responsável</th>
                <th className="py-3 px-3">Regra Inviolável</th>
                <th className="py-3 px-3">Formato de Saída</th>
                <th className="py-3 px-3">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282a36] font-sans">
              <tr className="hover:bg-[#252733] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">Identidade do Personagem</td>
                <td className="py-3 px-3 font-mono text-amber-400">Character Reference Sheet v2.0</td>
                <td className="py-3 px-3 text-slate-300">11 seções, régua métrica, sem cena dramática, estúdio neutro</td>
                <td className="py-3 px-3 font-mono text-slate-400">Sheet horizontal com turnarounds</td>
                <td className="py-3 px-3">
                  <button onClick={() => onNavigate('character-sheet')} className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Ver v2.0 <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#252733] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">Dimensão Real do Objeto</td>
                <td className="py-3 px-3 font-mono text-red-400">Escala 2×2 Coca-Cola Classic</td>
                <td className="py-3 px-3 text-slate-300">Lata padrão 11,5 cm fixa, proporção calculada por fórmula</td>
                <td className="py-3 px-3 font-mono text-slate-400">Grid 2×2 com 4 vistas alinhadas</td>
                <td className="py-3 px-3">
                  <button onClick={() => onNavigate('scale-2x2')} className="text-red-400 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Ver Escala <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#252733] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">Look & Estilo do Filme</td>
                <td className="py-3 px-3 font-mono text-amber-300">Style Registers A / B / C</td>
                <td className="py-3 px-3 text-slate-300">Bloco BASE photorealistic + um register travado palavra por palavra</td>
                <td className="py-3 px-3 font-mono text-slate-400">Prompt de estilo para Midjourney/GPT</td>
                <td className="py-3 px-3">
                  <button onClick={() => onNavigate('styles')} className="text-amber-300 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Ver Registers <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#252733] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">Câmera e Profundidade</td>
                <td className="py-3 px-3 font-mono text-violet-400">Depth Board 3×3 Grayscale</td>
                <td className="py-3 px-3 text-slate-300">Apenas geometria e profundidade; cor e look vêm da referência</td>
                <td className="py-3 px-3 font-mono text-slate-400">Grid 3×3 de mapas de profundidade</td>
                <td className="py-3 px-3">
                  <button onClick={() => onNavigate('depth-3x3')} className="text-violet-400 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Ver Depth <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#252733] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">Animação & Storyboard</td>
                <td className="py-3 px-3 font-mono text-indigo-400">Storyboard Sheet 5×3 Engine</td>
                <td className="py-3 px-3 text-slate-300">15 painéis, timecodes 0:00 a 0:15, chrome visível, sem framings repetidos</td>
                <td className="py-3 px-3 font-mono text-slate-400">Sheet 5×3 + Vídeo 15 segundos</td>
                <td className="py-3 px-3">
                  <button onClick={() => onNavigate('storyboard-5x3')} className="text-indigo-400 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold">
                    Ver 5×3 <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      <ScriptEpisodeImporterModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onNavigateToStoryboard={() => onNavigate('storyboard-5x3')}
      />
    </motion.div>
  );
};

