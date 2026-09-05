import React, { useState } from 'react';
import { 
  Scale, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  CheckSquare, 
  Ruler,
  Link2,
  FileDown,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { COCA_COLA_CAN_SPECS } from '../data/protocolsData';
import { useProjects } from '../context/ProjectContext';
import { downloadFile, generateScaleMarkdown } from '../utils/exportHelpers';
import { soundFx } from '../utils/audio';

interface ScaleCalculator2x2Props {
  onCopy: (text: string, label: string) => void;
}

export const ScaleCalculator2x2: React.FC<ScaleCalculator2x2Props> = ({ onCopy }) => {
  const { activeProject, updateActiveScale, syncScaleToStoryboard } = useProjects();
  const sc = activeProject.scaleCalculator;

  const [activeTab, setActiveTab] = useState<'v1' | 'master'>('v1');

  // Can height is fixed at 11.5 cm
  const canHeight = COCA_COLA_CAN_SPECS.heightCm;
  const numericHeight = typeof sc.verifiedHeight === 'number' ? sc.verifiedHeight : 0;
  const ratio = numericHeight > 0 ? (numericHeight / canHeight).toFixed(2) : '—';
  const hasDimensions = numericHeight > 0;

  // Generated Short Invocation Prompt (v1.0)
  const shortInvocationPrompt = `Apply the Coca-Cola Dimensional Scale Protocol v1.0.

Fixed scale reference: standard 33cl Coca-Cola Classic can
(height 11.5cm, body diameter 6.6cm, top/base diameter 5.2cm),
positioned 5–10cm beside the subject, same ground plane, horizontal camera,
no forced perspective, consistent scale across all 4 panels of a 2x2 sheet.

Do NOT guess dimensions. If subject/object measurements below are
incomplete, STOP and ask before generating. For measurable objects
without confirmed real-world dimensions, research the exact
version/model first — never assume a "typical" size.

SUBJECT DIMENSIONS:
Subject: ${sc.subjectName || '[Specify Subject]'}
Verified height: ${numericHeight > 0 ? `${numericHeight} cm` : '[xx] cm'}
${sc.verifiedLength ? `Verified length: ${sc.verifiedLength} cm` : 'Verified length: [xx] cm (se aplicável)'}
${sc.verifiedWidth ? `Verified width: ${sc.verifiedWidth} cm` : 'Verified width: [xx] cm (se aplicável)'}
${sc.verifiedDepth ? `Verified depth: ${sc.verifiedDepth} cm` : 'Verified depth: [xx] cm (se aplicável)'}
${sc.additionalNotes ? `Additional measurements: ${sc.additionalNotes}` : 'Additional measurements: [se necessário]'}

CALCULATED SCALE RATIO:
Subject height ratio = ${numericHeight > 0 ? `${numericHeight} ÷ 11.5 = ${ratio}x the height of the can` : 'Pending confirmed height'}

Requested views:
1. Front
2. 3/4
3. Side
4. Rear 3/4

Style: neutral gray studio background, soft diffuse lighting,
photographic realism, no stylization, no anatomy changes.`;

  // Master Prompt rules snippet
  const masterPromptSnippet = `==================================================
MANDATORY SCALE REFERENCE — COCA-COLA CAN
==================================================
Use ONE standard 33 cl Coca-Cola Classic can as the fixed dimensional reference
object in EVERY panel.

The can MUST have these exact physical dimensions:
- Total height: 11.5 cm
- Body diameter: 6.6 cm
- Top/lid diameter: 5.2 cm
- Capacity: 33 cl

These dimensions are FIXED and MUST NOT be altered, stretched, compressed, or
approximated. The can must remain physically consistent in all four panels.

The Coca-Cola can must be positioned beside the subject at a real-world physical
distance of approximately 5–10 cm from the nearest point of the subject.

The can and the subject MUST occupy the same physical ground/reference plane
whenever the subject is standing, sitting, lying, or otherwise resting on a surface.

DO NOT place the can closer or farther away merely to make the composition
visually attractive.

==================================================
DIMENSIONAL CALCULATION — ABSOLUTE REQUIREMENT
==================================================
The subject's physical dimensions MUST be calculated relative to the fixed
11.5 cm can height.

DO NOT visually estimate the subject's size.
DO NOT invent dimensions.
DO NOT normalize or resize the subject independently between panels.
DO NOT make the can larger or smaller to compensate for composition.

The ratio between subject and can must correspond to their actual physical dimensions:
Subject (${numericHeight} cm) ÷ Can (11.5 cm) = exactly ${ratio}x the height of the can.`;

  const handleSendToStoryboard = () => {
    soundFx.playActionConfirm();
    syncScaleToStoryboard();
    onCopy('', 'Dimensões da Escala Sincronizadas com o Storyboard 5×3!');
  };

  const handleDownloadMd = () => {
    soundFx.playActionConfirm();
    const md = generateScaleMarkdown(activeProject);
    const filename = `scale-2x2-${(sc.subjectName || activeProject.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleDownloadTxt = () => {
    soundFx.playActionConfirm();
    const filename = `scale-2x2-${(sc.subjectName || activeProject.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    downloadFile(shortInvocationPrompt, filename, 'text/plain');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-[#221f24] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-red-600 text-white font-bold shadow-xs">
              Objeto Mestre Fixo: Lata 33cl
            </span>
            <span className="text-xs text-slate-400 font-mono">11,5 cm × 6,6 cm × 5,2 cm</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">{activeProject.name}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-red-500" />
            Protocolo de Escala 2×2 Coca-Cola
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Folha de calibração dimensional que ancora o tamanho físico real contra a lata padrão sem distorções de perspectiva.
          </p>
        </div>

        {/* Gate Badge with Motion */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-xs shadow-xs ${
              hasDimensions
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            {hasDimensions ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Gate Aprovado: {ratio}× da Lata</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="font-bold">Gate Bloqueado: Medida Exigida</span>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Cross-Pipeline Action Bar */}
      <div className="p-3 rounded-xl border border-[#2e313f] bg-[#1a1b24] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Link2 className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-white">Integração com o Storyboard:</span>
          <span className="text-slate-400 hidden sm:inline">Envie as medidas calibradas deste objeto diretamente para o Subject do Storyboard 5×3</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMd}
            title="Baixar especificação de escala em Markdown"
            className="p-2 rounded-lg bg-[#242634] hover:bg-[#2e3144] text-slate-300 hover:text-white border border-[#353849] transition-colors"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadTxt}
            title="Baixar prompt puro em .txt"
            className="p-2 rounded-lg bg-[#242634] hover:bg-[#2e3144] text-slate-300 hover:text-white border border-[#353849] transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendToStoryboard}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition-all text-xs shadow-xs"
          >
            <span>🔗 Enviar para Storyboard 5×3</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Calculator & Inputs */}
        <div className="lg:col-span-5 space-y-5">
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#2a2c3a] pb-3">
              <Calculator className="w-4 h-4 text-red-400" />
              Entrada de Dimensões Reais
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  Nome do Sujeito / Objeto
                </label>
                <input
                  type="text"
                  value={sc.subjectName}
                  onChange={e => updateActiveScale({ subjectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-red-500 focus:outline-hidden"
                  placeholder="ex: Cybernetic Drone, Criatura, Smartphone"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Altura Confirmada (cm) *
                  </label>
                  <input
                    type="number"
                    value={sc.verifiedHeight}
                    onChange={e => updateActiveScale({ verifiedHeight: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-red-500/50 text-red-300 font-mono text-xs focus:border-red-500 focus:outline-hidden font-bold"
                    placeholder="ex: 46"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Comprimento (cm)
                  </label>
                  <input
                    type="number"
                    value={sc.verifiedLength}
                    onChange={e => updateActiveScale({ verifiedLength: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-red-500 focus:outline-hidden"
                    placeholder="ex: 60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Largura (cm)
                  </label>
                  <input
                    type="number"
                    value={sc.verifiedWidth}
                    onChange={e => updateActiveScale({ verifiedWidth: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-red-500 focus:outline-hidden"
                    placeholder="ex: 40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                    Profundidade (cm)
                  </label>
                  <input
                    type="number"
                    value={sc.verifiedDepth}
                    onChange={e => updateActiveScale({ verifiedDepth: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white font-mono text-xs focus:border-red-500 focus:outline-hidden"
                    placeholder="opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  Medidas Adicionais (envergadura, partes)
                </label>
                <input
                  type="text"
                  value={sc.additionalNotes}
                  onChange={e => updateActiveScale({ additionalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-red-500 focus:outline-hidden"
                  placeholder="ex: envergadura 55cm, diâmetro 12cm"
                />
              </div>
            </div>

            {/* Calculated Multiplier Card */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 space-y-2">
              <div className="text-[11px] font-mono text-red-300 uppercase tracking-wider flex items-center justify-between">
                <span>Cálculo Dimensional Obrigatório</span>
                <span className="font-bold">Regra Master</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">{ratio}×</span>
                <span className="text-xs text-slate-300 font-sans">a altura da lata de Coca-Cola (11,5 cm)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {numericHeight > 0 
                  ? `Fórmula: ${numericHeight} cm ÷ 11.5 cm = exatamente ${ratio}x da lata padrão.` 
                  : 'Preencha a altura confirmada para calcular a proporção.'}
              </p>
            </div>

            {/* Checklist */}
            <div className="pt-2 border-t border-[#2a2c3a] space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-300 uppercase mb-1">
                Checklist Rápido (Protocolo v1.0)
              </div>
              {[
                'Lata = 11,5 × 6,6 × 5,2 cm (fixo, nunca muda)',
                'Medida do sujeito confirmada (não estimada)',
                `Proporção calculada: ${ratio}×`,
                'Distância lata-sujeito: 5–10 cm (padrão 7 cm)',
                'Câmera horizontal, no mesmo plano de chão',
                'Mesma escala nos 4 painéis do grid 2×2',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Visual Simulator & Prompt Generator */}
        <div className="lg:col-span-7 space-y-5">
          {/* Visual 2x2 Simulation Matrix */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-red-400" />
                  Simulação Visual da Folha 2×2
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Lata e sujeito compartilham o mesmo plano de chão horizontal
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-[#181920] border border-[#2c2e3b] text-slate-300">
                Estúdio Cinza Neutro
              </span>
            </div>

            {/* 2x2 Grid of Views */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { view: '1. Front View', desc: 'Frente alinhada com lata à esquerda' },
                { view: '2. 3/4 View', desc: 'Giro de 45° mantendo mesma distância' },
                { view: '3. Side View', desc: 'Perfil exato, proporção de profundidade' },
                { view: '4. Rear 3/4 View', desc: 'Três quartos traseiro de fechamento' },
              ].map((v, i) => (
                <div key={i} className="rounded-xl border border-[#2c2e3b] bg-[#181920] p-3.5 flex flex-col justify-between h-44">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-red-400">{v.view}</span>
                    <span>11.5cm Ref</span>
                  </div>

                  {/* Proportional visual mockup */}
                  <div className="flex items-end justify-center gap-4 h-24 border-b border-[#2c2e3b] pb-1">
                    {/* Can visual */}
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-12 rounded bg-gradient-to-b from-red-600 to-red-800 border border-red-400/50 flex items-center justify-center shadow-md">
                        <span className="text-[8px] font-bold text-white rotate-90 tracking-widest">Coke</span>
                      </div>
                      <span className="text-[8px] font-mono text-red-400 mt-0.5 font-bold">11.5cm</span>
                    </div>

                    {/* Subject visual representation scaled */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-14 rounded-t-lg bg-gradient-to-t from-slate-600 to-slate-400 border border-slate-500 flex items-center justify-center text-center p-1 shadow-xs transition-all duration-300"
                        style={{
                          height: numericHeight > 0 
                            ? `${Math.min(85, Math.max(20, (numericHeight / 11.5) * 16))}px` 
                            : '48px'
                        }}
                      >
                        <span className="text-[9px] font-mono text-white truncate font-semibold">
                          {numericHeight > 0 ? `${numericHeight}cm` : 'Sujeito'}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                        {ratio}× lata
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                    {v.desc}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Prompt Exporter */}
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playMicroClick();
                    setActiveTab('v1');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    activeTab === 'v1'
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prompt Invocação v1.0
                </button>
                <button
                  onClick={() => {
                    soundFx.playMicroClick();
                    setActiveTab('master');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    activeTab === 'master'
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Regras MASTER Completas
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onCopy(
                  activeTab === 'v1' ? shortInvocationPrompt : masterPromptSnippet,
                  activeTab === 'v1' ? 'Prompt de Invocação v1 Copiado!' : 'Regras MASTER Copiadas!'
                )}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt</span>
              </motion.button>
            </div>

            <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed">
              {activeTab === 'v1' ? shortInvocationPrompt : masterPromptSnippet}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
