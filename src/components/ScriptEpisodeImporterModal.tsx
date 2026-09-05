import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Film, 
  Check, 
  X, 
  FolderPlus, 
  BookOpen,
  ArrowRight,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectData } from '../types';
import { useProjects } from '../context/ProjectContext';
import { soundFx } from '../utils/audio';

interface ScriptEpisodeImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStoryboard?: () => void;
}

interface PredefinedEpisode {
  id: string;
  code: string;
  title: string;
  room: string;
  characters: string;
  summary: string;
  climaxBeat: string;
  panels: {
    panelNumber: number;
    timecode: string;
    framing: string;
    caption: string;
    visualNote: string;
  }[];
}

const AMC_PRESET_EPISODES: PredefinedEpisode[] = [
  {
    id: 'amc-ep-03',
    code: 'CASO Nº 003',
    title: 'A Porta Que Se Fechou Sozinha',
    room: 'Corredor / Banheiro',
    characters: 'Tsuki (Cadela detetive) & Simba (Gato observador)',
    summary: 'A porta do escritório se fechou misteriosamente sem ninguém no corredor. Tsuki investiga a mecânica do vento e do silêncio, decidindo dormir do lado de fora da porta.',
    climaxBeat: '"Alguns casos não se resolvem. Você só aprende a dormir do outro lado."',
    panels: [
      { panelNumber: 1, timecode: '00:00-00:01', framing: 'Wide Establishing', caption: 'Corredor vazio da casa ao entardecer. A porta do escritório ao fundo está entreaberta.', visualNote: 'Câmera na altura dos olhos de um cão' },
      { panelNumber: 2, timecode: '00:01-00:02', framing: 'Insert Detail', caption: 'Pata felina de Simba empurra levemente a janela do banheiro (3cm abertos no sol).', visualNote: 'Foco suave na luz solar batendo nos pelos' },
      { panelNumber: 3, timecode: '00:02-00:03', framing: 'Tracking Medium', caption: 'Corrente de ar súbita atravessa o corredor, soprando uma fresta de poeira dourada.', visualNote: 'Micro-movimento de ar visível na luz' },
      { panelNumber: 4, timecode: '00:03-00:04', framing: 'Extreme Close-up', caption: 'O trinco de latão da porta se engata com um clique seco e metálico.', visualNote: 'Som diegético do clique ecoando' },
      { panelNumber: 5, timecode: '00:04-00:05', framing: 'Medium Close-Up', caption: 'Tsuki na sala ergue bruscamente a cabeça do tapete. Orelhas em pé, pupilas dilatadas.', visualNote: 'Reação imediata e metódica' },
      { panelNumber: 6, timecode: '00:05-00:06', framing: 'Low Angle Tracking', caption: 'Tsuki caminha em passos lentos e calculados em direção ao corredor.', visualNote: 'Postura de investigadora particular' },
      { panelNumber: 7, timecode: '00:06-00:07', framing: 'Over-the-Shoulder / POV', caption: 'Ponto de vista de Tsuki: a porta do escritório agora está totalmente fechada.', visualNote: 'Linhas retas e sombras longas' },
      { panelNumber: 8, timecode: '00:07-00:08', framing: 'Macro Insert', caption: 'Focinho de Tsuki fareja a fresta inferior de 1cm sob a porta de madeira.', visualNote: 'Respiração visível no chão polido' },
      { panelNumber: 9, timecode: '00:08-00:09', framing: 'Direct Center Angle', caption: 'Tsuki senta ereta no centro exato do corredor, encarando a maçaneta imóvel.', visualNote: 'Silêncio absoluto' },
      { panelNumber: 10, timecode: '00:09-00:10', framing: 'Medium Reverse', caption: 'Corte para a janela do banheiro: Simba deitado no raio de sol, olhos semi-cerrados.', visualNote: 'Expressão de cumplicidade impassível' },
      { panelNumber: 11, timecode: '00:10-00:11', framing: 'Close-up Profile', caption: 'Simba pisca devagar. Sabe que foi o vento, mas observa a seriedade metódica dela.', visualNote: 'Luz quente 24fps' },
      { panelNumber: 12, timecode: '00:11-00:12', framing: 'Dynamic Action Angle', caption: 'Tsuki inclina a cabeça em 45 graus, catalogando a Hipótese 3: Agente Não Identificado.', visualNote: 'Tensão metódica de detetive' },
      { panelNumber: 13, timecode: '00:12-00:13', framing: 'Medium Shot', caption: 'Tsuki dobra as patas dianteiras e deita-se com o corpo rente à porta fechada.', visualNote: 'Aceitação tranquila do mistério' },
      { panelNumber: 14, timecode: '00:13-00:14', framing: 'High Angle Wide', caption: 'Plano zenital: Tsuki dormindo do lado de fora da porta. A tarde cai.', visualNote: '"Você só aprende a dormir do outro lado."' },
      { panelNumber: 15, timecode: '00:14-00:15', framing: 'Locked Closing Wide', caption: 'Quadro estático final. Carimbo sutil de arquivo: CASO Nº 003 — STATUS: ABERTO.', visualNote: 'Fechamento de caso estilo noir' }
    ]
  },
  {
    id: 'amc-ep-01',
    code: 'CASO Nº 001',
    title: 'O Biscoito Que Não Estava Lá',
    room: 'Cozinha',
    characters: 'Tsuki, Simba & Humana Pequena',
    summary: 'Tsuki cataloga um biscoito às 14h31. Às 14h37 o biscoito desaparece sem deixar migalhas. Interrogatório silencioso de 45 segundos com Simba.',
    climaxBeat: 'Tsuki interroga Simba a 40cm de distância sustentando contato visual absoluto.',
    panels: [
      { panelNumber: 1, timecode: '00:00-00:01', framing: 'Wide Establishing', caption: 'Cozinha iluminada às 14h30. Tigela de cerâmica azul com biscoito isolado.', visualNote: 'Ângulo de chão impecável' },
      { panelNumber: 2, timecode: '00:01-00:02', framing: 'Macro Insert', caption: 'Close no biscoito canino intacto. Posição perfeitamente alinhada.', visualNote: 'Catalogação visual' },
      { panelNumber: 3, timecode: '00:02-00:03', framing: 'POV / OTS', caption: 'Mãozinha rápida de criança estica-se e remove o biscoito silenciosamente.', visualNote: 'Movimento em desfoque no fundo' },
      { panelNumber: 4, timecode: '00:03-00:04', framing: 'Medium Close-Up', caption: 'Simba no topo da geladeira testemunha tudo em silêncio impassível.', visualNote: 'Testemunha silenciosa' },
      { panelNumber: 5, timecode: '00:04-00:05', framing: 'Medium Shot', caption: 'Tsuki retorna à cozinha às 14h37 com passos ritmados.', visualNote: 'Confiança investigativa' },
      { panelNumber: 6, timecode: '00:05-00:06', framing: 'Extreme Macro', caption: 'Tigela vazia. Nenhuma migalha. Zero perturbação de perímetro.', visualNote: 'Cena do crime imaculada' },
      { panelNumber: 7, timecode: '00:06-00:07', framing: 'Low Angle Medium', caption: 'Tsuki para bruscamente. Postura rígida, cabeça inclinada em choque.', visualNote: 'Momento de colapso lógico' },
      { panelNumber: 8, timecode: '00:07-00:08', framing: 'Close-up Profile', caption: 'Olhar de Tsuki sobe lentamente do chão até o topo dos armários.', visualNote: 'Rastreio de suspeito' },
      { panelNumber: 9, timecode: '00:08-00:09', framing: 'Direct Center Angle', caption: 'O Interrogatório: Tsuki posiciona-se a 40cm de Simba no chão.', visualNote: 'Contato visual sustentado' },
      { panelNumber: 10, timecode: '00:09-00:10', framing: 'Tight Insert', caption: 'Olhos de Tsuki sem piscar. Comprometimento total com o método.', visualNote: '45 segundos de silêncio' },
      { panelNumber: 11, timecode: '00:10-00:11', framing: 'Medium Reverse', caption: 'Simba pisca devagar apenas porque seus olhos estão secos.', visualNote: 'Pedagogia felina' },
      { panelNumber: 12, timecode: '00:11-00:12', framing: 'Dynamic Action Angle', caption: 'Tsuki anota mentalmente: linha paralela de linguagem codificada aberta.', visualNote: 'Dedução incorreta porém séria' },
      { panelNumber: 13, timecode: '00:12-00:13', framing: 'Medium Wide', caption: 'Tsuki deita-se pacificamente ao lado da tigela vazia de guarda.', visualNote: 'Vigilância contínua' },
      { panelNumber: 14, timecode: '00:13-00:14', framing: 'High Angle Wide', caption: 'Luz da cozinha diminui. A tigela continua no mesmo lugar.', visualNote: 'Caso aberto' },
      { panelNumber: 15, timecode: '00:14-00:15', framing: 'Locked Closing Wide', caption: 'Carimbo visual: CASO Nº 001 — STATUS: ABERTO.', visualNote: 'Fim do episódio' }
    ]
  }
];

export const ScriptEpisodeImporterModal: React.FC<ScriptEpisodeImporterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStoryboard
}) => {
  const { importScriptProject } = useProjects();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('amc-ep-03');
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [importMode, setImportMode] = useState<'preset' | 'custom'>('preset');

  if (!isOpen) return null;

  const handleImportPreset = () => {
    const ep = AMC_PRESET_EPISODES.find(e => e.id === selectedPresetId) || AMC_PRESET_EPISODES[0];
    soundFx.playActionConfirm();

    const newProject: ProjectData = {
      id: `proj-${ep.id}-${Date.now().toString(36)}`,
      name: `AMC — ${ep.code}: ${ep.title}`,
      category: 'non-ads',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aspectRatio: '2.39:1',
      selectedRegister: 'register-c', // Documentary Realism / Cinema Intimate
      storyboard: {
        titleWord: 'TSUKI',
        formatLabel: '15 SEC',
        subject: `Tsuki (cadela jovem investigadora) e Simba (gato) no caso "${ep.title}" (${ep.room})`,
        colourway: 'Piso de madeira nobre, luz natural da tarde, atmosfera doméstica cinematográfica film noir',
        aspectRatio: '2.39:1',
        selectedRegister: 'register-c',
        panels: ep.panels
      },
      scaleCalculator: {
        subjectName: 'Tsuki (Cadela Investigadora)',
        verifiedHeight: 38,
        verifiedLength: 52,
        verifiedWidth: 22,
        verifiedDepth: '',
        additionalNotes: 'Porte médio-pequeno, pelagem curta mista, olhar atento sem piscar',
        views: ['Sentada Alerta', 'Perfil 3/4', 'Farejando Chão', 'Deitada de Guarda'],
        unit: 'cm'
      },
      characterSheet: {
        characterId: 'AMC-CHAR-01',
        name: 'Tsuki',
        alias: 'Detetive Particular',
        role: 'Protagonista e Investigadora',
        species: 'Canina (Cadela sem raça definida / SRD)',
        ageRange: '1 a 2 anos',
        revision: 'v1.0 (AMC S01)',
        referenceSource: 'Foto anexada de referência da Tsuki',
        signatureProps: 'Coleira de nylon discreta, olhar fixo analítico, postura metódica',
        primaryExpressions: [
          'Atenção máxima / foco absoluto',
          'Focinho inclinado / processamento analítico',
          'Olhar sustentado sério (interrogatório)',
          'Calma serena ao dormir diante de caso aberto',
          'Faro de fresta atento',
          'Orelhas em pé receptivas'
        ],
        microExpressions: [
          'Pálpebras tensas em foco',
          'Focinho contraído farejando',
          'Orelha esquerda girada para som',
          'Suspiro resignado de procedimento'
        ],
        postures: [
          'Sentada em posição de vigilância perpendicular',
          'Caminhada lenta de rastreamento forense',
          'Deitada do lado de fora de porta fechada'
        ],
        handStudies: [
          'Pata dianteira apoiada no piso',
          'Posição de guarda com patas paralelas',
          'Cabeça apoiada sobre as patas',
          'Pata erguida em pausa'
        ],
        palette: [
          { label: 'Pelagem Principal', hex: '#8C6239' },
          { label: 'Pelagem Secundária', hex: '#E6D7C3' },
          { label: 'Focinho e Olhos', hex: '#1C1613' },
          { label: 'Coleira', hex: '#B83B26' },
          { label: 'Piso Madeira', hex: '#593B22' }
        ],
        paletteMode: 'auto',
        subjectType: 'animal',
        includeHands: false,
        voiceNotes: 'Voz seca, precisa, com pausas calculadas de film noir. Comprometimento total com o método.',
        designNotes: 'Preservar com fidelidade 100% as cores naturais, manchas e formato de olhos da foto enviada.'
      },
      depthBoard: {
        sceneSubject: `${ep.room} com Tsuki investigando a cena do crime de ${ep.title}`,
        selectedShot: 1
      }
    };

    importScriptProject(newProject);
    onClose();
    if (onNavigateToStoryboard) {
      onNavigateToStoryboard();
    }
  };

  const handleImportCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    soundFx.playActionConfirm();

    // Generate basic 15 beats from the custom text
    const lines = customText.split('\n').filter(l => l.trim().length > 0);
    const panels = Array.from({ length: 15 }, (_, i) => {
      const lineText = lines[i] || `Sequência de continuação dramática do plano #${i + 1}`;
      return {
        panelNumber: i + 1,
        timecode: `00:${i.toString().padStart(2, '0')}-00:${(i + 1).toString().padStart(2, '0')}`,
        framing: i % 4 === 0 ? 'Wide Establishing' : i % 4 === 1 ? 'Medium Close-Up' : i % 4 === 2 ? 'Macro Insert' : 'Low Angle Dynamic',
        caption: lineText.replace(/^[#\-*0-9.]+\s*/, '').slice(0, 120),
        visualNote: 'Movimento contínuo 24fps'
      };
    });

    const newProject: ProjectData = {
      id: `proj-custom-${Date.now().toString(36)}`,
      name: customTitle.trim(),
      category: 'non-ads',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aspectRatio: '2.39:1',
      selectedRegister: 'register-c',
      storyboard: {
        titleWord: customTitle.split(' ')[0].toUpperCase() || 'CENA',
        formatLabel: '15 SEC',
        subject: customTitle,
        colourway: 'Iluminação cinematográfica realista e motivada',
        aspectRatio: '2.39:1',
        selectedRegister: 'register-c',
        panels
      },
      scaleCalculator: {
        subjectName: customTitle,
        verifiedHeight: 35,
        verifiedLength: '',
        verifiedWidth: '',
        verifiedDepth: '',
        additionalNotes: '',
        views: ['Frontal', '3/4', 'Perfil', 'Traseira 3/4'],
        unit: 'cm'
      },
      characterSheet: {
        characterId: `CHAR-${Math.floor(Math.random() * 900 + 100)}`,
        name: 'Protagonista da Cena',
        alias: '',
        role: 'Protagonista',
        species: 'Indefinido',
        ageRange: '',
        revision: 'v1.0',
        referenceSource: 'Referência anexada',
        signatureProps: '',
        primaryExpressions: ['Foco', 'Surpresa', 'Seriedade', 'Relaxado', 'Tensão', 'Determinado'],
        microExpressions: ['Olhar atento', 'Respiração contida', 'Hesitação', 'Resolução'],
        postures: ['Postura ereta', 'Em movimento', 'De repouso'],
        handStudies: ['Mão relaxada', 'Mão em ação', 'Gesto habitual', 'Tensão'],
        palette: [{ label: 'Tom Primário', hex: '#555555' }],
        paletteMode: 'auto',
        includeHands: true,
        voiceNotes: '',
        designNotes: 'Fidelidade visual da imagem anexada'
      },
      depthBoard: {
        sceneSubject: customTitle,
        selectedShot: 1
      }
    };

    importScriptProject(newProject);
    onClose();
    if (onNavigateToStoryboard) {
      onNavigateToStoryboard();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-3xl rounded-2xl border border-amber-500/40 bg-[#171822] shadow-2xl shadow-black overflow-hidden font-sans flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#2a2c3a] bg-[#1a1b26] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Importar Roteiro / Ideia em Markdown (.md)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Transforme episódios de séries e ideias escritas em produções com 15 painéis de Storyboard
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252834] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="px-6 py-3 border-b border-[#272938] bg-[#14151e] flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playMicroClick();
                setImportMode('preset');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                importMode === 'preset'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-[#20222e] text-slate-400 hover:text-slate-200'
              }`}
            >
              Episódios da Série AMC (Arquivo Morto da Cozinha)
            </button>
            <button
              onClick={() => {
                soundFx.playMicroClick();
                setImportMode('custom');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                importMode === 'custom'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-[#20222e] text-slate-400 hover:text-slate-200'
              }`}
            >
              Colar Roteiro Livre (.md)
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {importMode === 'preset' ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-300 leading-relaxed bg-[#1d1f2b] p-3.5 rounded-xl border border-[#2f3244]">
                  💡 <strong>Detectamos o documento <code>AMC_02_Desenvolvimento_Serie.md</code> no workspace!</strong><br />
                  Selecione um episódio abaixo para criar imediatamente uma produção completa com a decupagem de 15 segundos dos beats dramáticos, personagens configurados e estilo cinematográfico travado.
                </div>

                <div className="space-y-3">
                  {AMC_PRESET_EPISODES.map((ep) => {
                    const isSelected = ep.id === selectedPresetId;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          soundFx.playMicroClick();
                          setSelectedPresetId(ep.id);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/15 via-[#222432] to-[#1c1e28] shadow-md shadow-amber-500/10'
                            : 'border-[#2c2f3f] bg-[#1a1b24] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {ep.code}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {ep.title}
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-[#14151e] px-2 py-0.5 rounded border border-[#2c2e3d]">
                            {ep.room}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {ep.summary}
                        </p>

                        <div className="pt-2 border-t border-[#292c3a] flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="truncate">Personagens: <strong className="text-slate-200">{ep.characters}</strong></span>
                          <span className="text-amber-400 font-bold shrink-0">15 Painéis Prontos</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleImportCustom} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-400 font-semibold">
                    Título do Episódio / Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Episódio 03 — A Porta Que Se Fechou Sozinha"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#14151e] border border-[#333647] text-white text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-400 font-semibold">
                    Conteúdo / Sinopse / Beats em Markdown (.md)
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Cole aqui o texto ou beats do seu episódio em Markdown..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#14151e] border border-[#333647] text-white text-xs font-mono focus:border-amber-500 focus:outline-hidden resize-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Dica: Cada linha de texto se tornará um dos 15 painéis do Storyboard.
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#2a2c3a] bg-[#1a1b26] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancelar
            </button>

            {importMode === 'preset' ? (
              <button
                onClick={handleImportPreset}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <span>Produzir Este Episódio Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleImportCustom}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <span>Criar Projeto a partir do Texto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
