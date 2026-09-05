import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Lock, 
  Check, 
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';
import { StyleRegisterKey } from '../types';
import { BASE_STYLE_BLOCK, STYLE_REGISTERS } from '../data/protocolsData';

interface StyleRegistersViewProps {
  onCopy: (text: string, label: string) => void;
}

export const StyleRegistersView: React.FC<StyleRegistersViewProps> = ({ onCopy }) => {
  const [activeRegisterId, setActiveRegisterId] = useState<StyleRegisterKey>('register-a');
  const [includeBaseBlock, setIncludeBaseBlock] = useState(true);

  const activeRegister = STYLE_REGISTERS.find(r => r.id === activeRegisterId) || STYLE_REGISTERS[0];

  const fullPromptToCopy = includeBaseBlock
    ? `${BASE_STYLE_BLOCK}\n\n${activeRegister.lockedContent}`
    : activeRegister.lockedContent;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Header with Warm Bronze / Look-Book Amber on Dark Gray */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-amber-600/30 bg-gradient-to-r from-amber-600/10 via-[#221f24] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              Protocolo OAK · Etapa 3
            </span>
            <span className="text-xs text-slate-400 font-mono">3 Registros · Locked Blocks</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Style Registers: Cinematic Photo-Realism
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Trava a iluminação, granulação, paleta de cores e textura da imagem. Escolha <strong>apenas um registro</strong> por produção e copie sem parafrasear.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onCopy(fullPromptToCopy, `${activeRegister.name} copiado!`)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-amber-600/25"
        >
          <Copy className="w-3.5 h-3.5" />
          Copiar Registro Selecionado
        </motion.button>
      </div>

      {/* Base Style Block (Fixed across all styles) with Motion */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md"
      >
        <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              BASE LOCKED BLOCK (Inviolável · Presente em todos os prompts)
            </h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onCopy(BASE_STYLE_BLOCK, 'Base Style Block copiado!')}
            className="text-xs font-mono text-amber-300 hover:text-white flex items-center gap-1.5 bg-[#181920] px-3 py-1.5 rounded-lg border border-[#2c2e3b] font-semibold"
          >
            <Copy className="w-3 h-3" />
            Copiar Base
          </motion.button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Este bloco estabelece o piso técnico de fidelidade óptica, eliminação de artefatos digitais, simetrias artificiais e iluminação comercial excessiva:
        </p>

        <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {BASE_STYLE_BLOCK}
        </pre>
      </motion.div>

      {/* 3 Registers Selector in Dark Gray */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Escolha o Registro Cinematográfico da Produção
          </h3>
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeBaseBlock}
              onChange={e => setIncludeBaseBlock(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 bg-[#181920]"
            />
            <span>Incluir Bloco BASE ao copiar</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STYLE_REGISTERS.map((reg) => {
            const isSelected = reg.id === activeRegisterId;
            return (
              <motion.div
                key={reg.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveRegisterId(reg.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-[#252329] ring-2 ring-amber-500/30 shadow-xl shadow-black/40'
                    : 'border-[#2e313f] bg-[#1f2029] hover:border-[#3d4152] hover:bg-[#22242e]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 font-extrabold' 
                        : 'bg-[#181920] text-slate-400 border border-[#2c2e3b]'
                    }`}>
                      {reg.tag}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                        <Check className="w-3.5 h-3.5" /> Selecionado
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white mb-2">
                    {reg.name}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {reg.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2a2c3a] space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Assinatura Óptica
                  </div>
                  <div className="text-xs font-mono text-amber-300 bg-[#14151a] p-2 rounded-lg border border-[#282a35]">
                    {reg.id === 'register-a' && '35mm Film · Grain Orgânico · Halation · Kodak 5219'}
                    {reg.id === 'register-b' && 'Digital Cinema · Arri Alexa 65 · Master Primes · Sharp'}
                    {reg.id === 'register-c' && 'Documentary Realistic · Luz Natural · Run-and-Gun'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Register Full Prompt Display */}
      <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
          <div>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
              Conteúdo do Registro Ativo
            </span>
            <h4 className="text-sm font-bold text-white">
              {activeRegister.name} ({activeRegister.tag})
            </h4>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onCopy(fullPromptToCopy, `${activeRegister.name} copiado!`)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Bloco Completo
          </motion.button>
        </div>

        <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed">
          {fullPromptToCopy}
        </pre>
      </div>
    </motion.div>
  );
};
