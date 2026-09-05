import React, { useState } from 'react';
import { 
  Grid3X3, 
  Copy, 
  Camera,
  Link2,
  FileDown,
  FileText,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { DEPTH_9_SHOTS, DEPTH_MAP_EXTRACTION_PROMPT } from '../data/protocolsData';
import { useProjects } from '../context/ProjectContext';
import { downloadFile } from '../utils/exportHelpers';
import { soundFx } from '../utils/audio';

interface DepthBoard3x3ViewProps {
  onCopy: (text: string, label: string) => void;
}

export const DepthBoard3x3View: React.FC<DepthBoard3x3ViewProps> = ({ onCopy }) => {
  const { activeProject, updateActiveDepth } = useProjects();
  const depthState = activeProject.depthBoard;

  const [selectedShot, setSelectedShot] = useState<number>(depthState.selectedShot || 1);
  const sceneSubject = depthState.sceneSubject || 'An explorer traversing a luminous subterranean crystalline cavern';

  const currentShot = DEPTH_9_SHOTS.find(s => s.number === selectedShot) || DEPTH_9_SHOTS[0];

  const full3x3Prompt = `You are a cinematic storyboard generator working in DEPTH-ONLY STORYBOARD MODE.

You will receive:
IMAGE 1 — VISUAL REFERENCE: Color/rendered image defining scene look, subject identity, and lighting.
IMAGE 2 — DEPTH REFERENCE: Physically accurate linear depth map (white = nearest, black = farthest).

SCENE SUBJECT: ${sceneSubject}

TASK: Generate one final 3x3 storyboard containing nine sequential shots from the same scene.
The nine panels must form a coherent cinematic narrative sequence.
The final output must contain DEPTH MAPS ONLY (clean grayscale linear depth).

9-SHOT NARRATIVE BEAT SEQUENCE:
1. TOP LEFT — SHOT 1: ESTABLISHING WIDE (Introduce environment and spatial layout)
2. TOP CENTER — SHOT 2: MOVEMENT OR INTENTION (Subject begins to move or investigate)
3. TOP RIGHT — SHOT 3: DISCOVERY OR POINT OF VIEW (Reveal what attracted attention)
4. MIDDLE LEFT — SHOT 4: REACTION (Subject responds emotionally/physically)
5. MIDDLE CENTER — SHOT 5: PREPARATION (Preparation for central action, increase tension)
6. MIDDLE RIGHT — SHOT 6: INSERT DETAIL (Crucial tactile close-up: hand, tool, trigger, mechanism)
7. BOTTOM LEFT — SHOT 7: MAIN ACTION (Sequence primary climax, most dynamic composition)
8. BOTTOM CENTER — SHOT 8: CONSEQUENCE OR RESULT (Immediate aftermath of the action)
9. BOTTOM RIGHT — SHOT 9: RESOLUTION OR DEPARTURE (Resolve the event beat)

CONVENTIONS & CONSTRAINTS:
- White = nearest surface, Black = farthest distance.
- Pure linear depth gradients, sharp edge occlusion, NO color, NO texture, NO lighting, NO ambient occlusion.
- Grid: 3x3 (nine panels arranged 3 across by 3 down).`;

  const handleUpdateSubject = (newSub: string) => {
    updateActiveDepth({ sceneSubject: newSub });
  };

  const handleSyncFromStoryboard = () => {
    soundFx.playActionConfirm();
    updateActiveDepth({ sceneSubject: activeProject.storyboard.subject });
    onCopy('', 'Sujeito importado do Storyboard 5×3!');
  };

  const handleDownloadMd = () => {
    soundFx.playActionConfirm();
    const md = `# Depth Board 3×3 Protocol — ${activeProject.name}

> Protocol: OAK Depth-First Cinematic Storyboarding  
> Subject: ${sceneSubject}  

\`\`\`text
${full3x3Prompt}
\`\`\`

---

## 9-Shot Breakdown
${DEPTH_9_SHOTS.map(s => `### Shot ${s.number}: ${s.title} (${s.position})
- **Framing:** ${s.framing}
- **Narrative Role:** ${s.narrativeRole}
- **Depth Rule:** ${s.depthRule}
`).join('\n')}
`;
    const filename = `depth-board-3x3-${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleDownloadTxt = () => {
    soundFx.playActionConfirm();
    const filename = `depth-board-3x3-${activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    downloadFile(full3x3Prompt, filename, 'text/plain');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-[#221f29] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40">
              Workflow OAK · Etapa 4
            </span>
            <span className="text-xs text-slate-400 font-mono">Grayscale Linear Depth · Grid 3×3</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">{activeProject.name}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Grid3X3 className="w-6 h-6 text-violet-400" />
            Depth Map & Depth Board 3×3
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Controla a câmera, paralaxe e volumetria espacial. Saída rigorosamente em escala de cinza linear (branco = perto, preto = longe).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMd}
            title="Baixar em Markdown"
            className="p-2 rounded-xl bg-[#222432] hover:bg-[#2b2e40] text-slate-300 hover:text-white border border-[#373b50] transition-colors"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadTxt}
            title="Baixar em .txt"
            className="p-2 rounded-xl bg-[#222432] hover:bg-[#2b2e40] text-slate-300 hover:text-white border border-[#373b50] transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onCopy(full3x3Prompt, 'Prompt 3x3 copiado!')}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-violet-600/25"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Prompt Board 3×3</span>
          </motion.button>
        </div>
      </div>

      {/* Cross-Pipeline Integration Bar */}
      <div className="p-3 rounded-xl border border-[#2e313f] bg-[#1a1b24] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Link2 className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-white">Sujeito da Cena:</span>
          <span className="text-slate-400 truncate max-w-md">{sceneSubject}</span>
        </div>

        <button
          onClick={handleSyncFromStoryboard}
          className="px-3 py-1.5 rounded-lg bg-[#242634] hover:bg-[#2e3144] text-violet-300 border border-violet-500/30 flex items-center gap-1.5 transition-all text-[11px]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Puxar Sujeito do Storyboard 5×3</span>
        </button>
      </div>

      {/* Step 2 Callout: Extraction of Depth Map */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md"
      >
        <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Etapa 2 da Linha de Produção
            </span>
            <h3 className="text-sm font-bold text-white">
              Prompt de Extração de Depth Map (Nano Banana / GPT Image 2)
            </h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onCopy(DEPTH_MAP_EXTRACTION_PROMPT, 'Prompt de Depth Map copiado!')}
            className="text-xs font-mono text-violet-300 hover:text-white flex items-center gap-1.5 bg-[#181920] px-3 py-1.5 rounded-lg border border-[#2c2e3b] font-semibold"
          >
            <Copy className="w-3 h-3" />
            <span>Copiar Extração</span>
          </motion.button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Cole este prompt junto da sua <strong>Reference Image</strong> no gerador para extrair o mapa de profundidade físico:
        </p>

        <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {DEPTH_MAP_EXTRACTION_PROMPT}
        </pre>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span>Convenção inviolável: <strong>Branco = Mais Próximo</strong> | <strong>Preto = Mais Distante</strong> (Sem cor, luz ou texturas).</span>
        </div>
      </motion.div>

      {/* 3x3 Grid Narrative Sequence Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 3x3 Grid */}
        <div className="lg:col-span-7 rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-violet-400" />
                Matriz Narrativa de 9 Planos (3×3)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Sequência cronológica obrigatória (Fase 3 do protocolo)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Clique para inspecionar
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {DEPTH_9_SHOTS.map(shot => {
              const isSelected = shot.number === selectedShot;
              return (
                <motion.div
                  key={shot.number}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    soundFx.playMicroClick();
                    setSelectedShot(shot.number);
                    updateActiveDepth({ selectedShot: shot.number });
                  }}
                  className={`group cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all h-40 ${
                    isSelected
                      ? 'border-violet-500 bg-violet-950/40 ring-2 ring-violet-500/40 shadow-md'
                      : 'border-[#2c2e3b] bg-[#181920] hover:border-violet-400/50 hover:bg-[#20222a]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-violet-600 text-white' : 'bg-[#282a36] text-slate-300'
                    }`}>
                      #{shot.number}
                    </span>
                    <span className="text-slate-400 truncate max-w-[85px]">{shot.position}</span>
                  </div>

                  <div className="my-2">
                    <div className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                      {shot.title}
                    </div>
                    <div className="text-[10px] font-mono text-violet-300 truncate">
                      {shot.framing}
                    </div>
                  </div>

                  <div className="h-1 rounded-full bg-[#252834] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-400"
                      style={{ width: `${(shot.number / 9) * 100}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Shot Inspector */}
        <div className="lg:col-span-5 rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
            <span className="text-xs font-mono font-bold text-violet-300 uppercase tracking-wider">
              Inspetor de Plano #{currentShot.number}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {currentShot.position}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-base font-bold text-white mb-1">
                {currentShot.title}
              </div>
              <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {currentShot.framing}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 block font-semibold">
                Papel Narrativo no Arco (Beat)
              </label>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#181920] p-3 rounded-xl border border-[#2c2e3b]">
                {currentShot.narrativeRole}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 block font-semibold">
                Ação / Movimento do Sujeito
              </label>
              <p className="text-xs text-slate-200 leading-relaxed bg-[#181920] p-3 rounded-xl border border-[#2c2e3b]">
                {currentShot.actionDescription}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-violet-400 block font-semibold">
                Regra Inviolável de Profundidade Linear
              </label>
              <p className="text-xs text-violet-200 leading-relaxed bg-violet-950/25 p-3 rounded-xl border border-violet-500/30 font-mono">
                {currentShot.depthRule}
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-mono text-slate-400 block font-semibold">
                Editar Sujeito da Cena
              </label>
              <textarea
                rows={2}
                value={sceneSubject}
                onChange={e => handleUpdateSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs focus:border-violet-500 focus:outline-hidden resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
