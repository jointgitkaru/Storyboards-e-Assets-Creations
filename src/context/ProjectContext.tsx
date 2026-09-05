import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectData, StoryboardData, ScaleCalculatorState, CharacterSheetState, StyleRegisterKey } from '../types';
import { INITIAL_STORYBOARD_PANELS } from '../data/protocolsData';

const STORAGE_PROJECTS_KEY = 'sbe_projects_data_v2';
const STORAGE_ACTIVE_ID_KEY = 'sbe_active_project_id_v2';

const DEFAULT_CHARACTER_STATE: CharacterSheetState = {
  characterId: 'CHAR-001',
  name: 'Kaelen Vance',
  alias: 'The Rift Walker',
  role: 'Protagonist / Field Specialist',
  species: 'Human',
  ageRange: '28-32',
  revision: 'v1.0',
  referenceSource: 'Attached reference image',
  signatureProps: 'Pulse chronometer wristwatch, weathered leather courier bag, magnetic visor',
  primaryExpressions: [
    'Neutral',
    'Slight smile',
    'Serious',
    'Surprised',
    'Thinking',
    'Calm / relaxed'
  ],
  microExpressions: [
    'Guarded / cautious',
    'Subtle smirk',
    'Brow furrowed / tension',
    'Jaw tightened / controlled intensity'
  ],
  postures: ['Neutral baseline stance', 'Relaxed / casual stance', 'Alert / tense combat-ready stance'],
  handStudies: ['Relaxed / open', 'Characteristic habitual gesture', 'Tension / gripping weapon', 'Open / inviting hand'],
  palette: [
    { label: 'Skin Tone', hex: '#D7A78A' },
    { label: 'Hair Color', hex: '#1E1B18' },
    { label: 'Eye Color', hex: '#3B6E7D' },
    { label: 'Primary Outfit', hex: '#2A3439' },
    { label: 'Accessory Tone', hex: '#C29B38' },
    { label: 'Accent Highlight', hex: '#E74C3C' }
  ],
  paletteMode: 'auto',
  visualStyle: 'photorealistic',
  includeHands: true,
  voiceNotes: 'Gravelly, measured baritone, speaks concisely with intentional pauses',
  designNotes: 'Consistent brass accents on hardware; asymmetric collar fold on left side'
};

const DEFAULT_SCALE_STATE: ScaleCalculatorState = {
  subjectName: 'Minimalist Aerospace Titanium Smartphone',
  verifiedHeight: 16.3,
  verifiedLength: 7.7,
  verifiedWidth: 0.86,
  verifiedDepth: '',
  additionalNotes: 'Polished silver bevel edge, matte obsidian back panel',
  views: ['Front', '3/4 Angle', 'Side Profile', 'Rear 3/4'],
  unit: 'cm'
};

const INITIAL_PROJECTS: ProjectData[] = [
  {
    id: 'proj-titanium-ads',
    name: 'Titanium Phone Spot (15s Commercial)',
    category: 'ads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aspectRatio: '16:9',
    selectedRegister: 'register-b',
    storyboard: {
      titleWord: 'FORGED',
      formatLabel: '15 SEC',
      subject: 'Minimalist aerospace-grade titanium smartphone with precision bevels',
      colourway: 'Obsidian Matte & Polished Silver with Subtle Amber Flare',
      aspectRatio: '16:9',
      selectedRegister: 'register-b',
      panels: INITIAL_STORYBOARD_PANELS
    },
    scaleCalculator: DEFAULT_SCALE_STATE,
    characterSheet: DEFAULT_CHARACTER_STATE,
    depthBoard: {
      sceneSubject: 'Aerospace-grade titanium smartphone rotating on precision studio plinth',
      selectedShot: 1
    }
  },
  {
    id: 'proj-drone-action',
    name: 'Cybernetic Combat Drone (Feature Film)',
    category: 'non-ads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aspectRatio: '2.39:1',
    selectedRegister: 'register-a',
    storyboard: {
      titleWord: 'SWARM',
      formatLabel: '15 SEC',
      subject: 'Cybernetic autonomous tactical drone with quad-rotor carbon fiber body',
      colourway: 'Gunmetal Gray & Hazard Orange Optical Sensors',
      aspectRatio: '2.39:1',
      selectedRegister: 'register-a',
      panels: INITIAL_STORYBOARD_PANELS.map((p, idx) => ({
        ...p,
        caption: idx === 0 
          ? 'Derelict hangar interior. Tactical drone powers up sensor rings.' 
          : idx === 6 
          ? 'Accelerated pursuit down narrow ventilation shaft.' 
          : p.caption
      }))
    },
    scaleCalculator: {
      subjectName: 'Tactical Recon Drone',
      verifiedHeight: 46,
      verifiedLength: 60,
      verifiedWidth: 40,
      verifiedDepth: '',
      additionalNotes: 'Rotor span 55cm, reinforced carbon-titanium composite chassis',
      views: ['Front', '3/4', 'Side', 'Rear 3/4'],
      unit: 'cm'
    },
    characterSheet: {
      ...DEFAULT_CHARACTER_STATE,
      name: 'Vance-09 Drone Pilot',
      alias: 'Operator Nine',
      role: 'Remote Drone Commander'
    },
    depthBoard: {
      sceneSubject: 'Autonomous tactical drone scanning industrial hangar architecture',
      selectedShot: 1
    }
  },
  {
    id: 'proj-amc-ep03',
    name: 'AMC - Ep. 03: A Porta Que Se Fechou Sozinha (Tsuki & Simba)',
    category: 'non-ads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aspectRatio: '2.39:1',
    selectedRegister: 'register-c',
    storyboard: {
      titleWord: 'TSUKI',
      formatLabel: '15 SEC',
      subject: 'Tsuki (cadela investigadora sem raça definida) e Simba (gato idoso) diante de porta de escritório fechada por corrente de ar',
      colourway: 'Piso de madeira quente, luz dourada de fim de tarde, porta branca fechada, sombras longas',
      aspectRatio: '2.39:1',
      selectedRegister: 'register-c',
      panels: [
        { panelNumber: 1, timecode: '00:00-00:01', framing: 'Wide Establishing', caption: 'Corredor vazio da casa ao entardecer. A porta do escritório ao fundo está entreaberta.', visualNote: 'Câmera baixa na altura dos olhos de um cão' },
        { panelNumber: 2, timecode: '00:01-00:02', framing: 'Insert Detail', caption: 'Pata felina de Simba empurra levemente a janela do banheiro (3cm abertos).', visualNote: 'Foco suave na luz solar batendo nos pelos' },
        { panelNumber: 3, timecode: '00:02-00:03', framing: 'Tracking Medium', caption: 'Corrente de ar súbita atravessa o corredor, soprando uma fresta de poeira dourada.', visualNote: 'Micro-movimento de ar visível na luz' },
        { panelNumber: 4, timecode: '00:03-00:04', framing: 'Extreme Close-up', caption: 'O trinco de latão da porta se engata com um clique seco e metálico.', visualNote: 'Som diegético do clique ecoando' },
        { panelNumber: 5, timecode: '00:04-00:05', framing: 'Medium Close-Up', caption: 'Tsuki na sala ergue bruscamente a cabeça do tapete. Orelhas em pé, pupilas dilatadas.', visualNote: 'Reação imediata e metódica' },
        { panelNumber: 6, timecode: '00:05-00:06', framing: 'Low Angle Tracking', caption: 'Tsuki caminha em passos lentos e calculados em direção ao corredor.', visualNote: 'Postura de investigadora particular' },
        { panelNumber: 7, timecode: '00:06-00:07', framing: 'Over-the-Shoulder / POV', caption: 'Ponto de vista de Tsuki: a porta do escritório agora está totalmente fechada.', visualNote: 'Linhas retas e sombras longas' },
        { panelNumber: 8, timecode: '00:07-00:08', framing: 'Macro Insert', caption: 'Focinho de Tsuki fareja a fresta inferior de 1cm sob a porta de madeira.', visualNote: 'Respiração visível no chão polido' },
        { panelNumber: 9, timecode: '00:08-00:09', framing: 'Direct Center Angle', caption: 'Tsuki senta ereta no centro exato do corredor, encarando a maçaneta imóvel.', visualNote: 'Silêncio absoluto' },
        { panelNumber: 10, timecode: '00:09-00:10', framing: 'Medium Reverse', caption: 'Corte para a janela do banheiro: Simba deitado no raio de sol, olhos semi-cerrados.', visualNote: 'Expressão de cumplicidade impassível' },
        { panelNumber: 11, timecode: '00:10-00:11', framing: 'Close-up Profile', caption: 'Simba pisca devagar. Sabe que foi o vento, mas observa a seriedade dela.', visualNote: 'Luz quente de 24fps' },
        { panelNumber: 12, timecode: '00:11-00:12', framing: 'Dynamic Action Angle', caption: 'Tsuki inclina a cabeça em 45 graus, catalogando a Hipótese 3: Agente Não Identificado.', visualNote: 'Tensão metódica' },
        { panelNumber: 13, timecode: '00:12-00:13', framing: 'Medium Shot', caption: 'Tsuki dobra as patas dianteiras e deita-se com o corpo rente à porta fechada.', visualNote: 'Aceitação tranquila do mistério' },
        { panelNumber: 14, timecode: '00:13-00:14', framing: 'High Angle Wide', caption: 'Plano zenital: Tsuki dormindo do lado de fora da porta. A tarde cai.', visualNote: '"Você só aprende a dormir do outro lado."' },
        { panelNumber: 15, timecode: '00:14-00:15', framing: 'Locked Closing Wide', caption: 'Quadro estático final. Carimbo sutil de arquivo: CASO Nº 003 — STATUS: ABERTO.', visualNote: 'Fechamento de caso estilo noir' }
      ]
    },
    scaleCalculator: {
      subjectName: 'Tsuki (Cadela Detetive)',
      verifiedHeight: 38,
      verifiedLength: 52,
      verifiedWidth: 22,
      verifiedDepth: '',
      additionalNotes: 'Porte médio-pequeno, pelagem curta mista, postura atenta',
      views: ['Frontal em Sentada', '3/4 de Perfil', 'Farejando o Chão', 'Deitada de Guarda'],
      unit: 'cm'
    },
    characterSheet: {
      characterId: 'AMC-CHAR-01',
      name: 'Tsuki',
      alias: 'Detetive Particular',
      role: 'Protagonista / Investigadora Vocacional',
      species: 'Canina (Cadela sem raça definida / SRD)',
      ageRange: '1 a 2 anos',
      revision: 'v1.0 (AMC S01)',
      referenceSource: 'Foto de referência da Tsuki anexada',
      signatureProps: 'Coleira de nylon discreta, olhar fixo analítico, postura de sentar forense',
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
        'Pata dianteira apoiada no piso de tábua corrida',
        'Posição de guarda com patas paralelas',
        'Cabeça apoiada sobre as patas cruzadas',
        'Pata erguida em pausa de rastreamento'
      ],
      palette: [
        { label: 'Pelagem Principal', hex: '#8C6239' },
        { label: 'Pelagem Secundária / Peito', hex: '#E6D7C3' },
        { label: 'Focinho e Olhos', hex: '#1C1613' },
        { label: 'Coleira / Acessório', hex: '#B83B26' },
        { label: 'Ambiente Piso Madeira', hex: '#593B22' }
      ],
      paletteMode: 'auto',
      visualStyle: 'photorealistic',
      subjectType: 'animal',
      includeHands: false,
      voiceNotes: 'Voz seca, precisa, pausas calculadas de film noir dos anos 40. Comprometimento total com o método.',
      designNotes: 'Manter rigorosamente a pelagem natural, manchas e formato de olhos da foto anexada. Sem caricatura ou estética cartoon.'
    },
    depthBoard: {
      sceneSubject: 'Corredor residencial com porta de escritório fechada e Tsuki sentada no centro da perspectiva',
      selectedShot: 1
    }
  }
];

interface ProjectContextType {
  projects: ProjectData[];
  activeProjectId: string;
  activeProject: ProjectData;
  lastSavedTime: string | null;
  createProject: (name: string, category?: 'ads' | 'non-ads') => string;
  switchProject: (id: string) => void;
  updateActiveProject: (updates: Partial<ProjectData>) => void;
  updateActiveStoryboard: (updates: Partial<StoryboardData>) => void;
  updateActiveScale: (updates: Partial<ScaleCalculatorState>) => void;
  updateActiveCharacter: (updates: Partial<CharacterSheetState>) => void;
  updateActiveDepth: (updates: Partial<{ sceneSubject: string; selectedShot: number }>) => void;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => boolean;
  exportProjectJson: (id: string) => string;
  importProjectJson: (jsonString: string) => boolean;
  importScriptProject: (newProject: ProjectData) => string;
  syncCharacterToStoryboard: () => void;
  syncScaleToStoryboard: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (savedId) {
        return savedId;
      }
    }
    return INITIAL_PROJECTS[0].id;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Auto-save whenever projects list changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeProjectId);
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        console.error('Failed to save projects to localStorage', e);
      }
    }
  }, [projects, activeProjectId]);

  const activeProject: ProjectData = 
    projects.find(p => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  const switchProject = (id: string) => {
    const exists = projects.some(p => p.id === id);
    if (exists) {
      setActiveProjectId(id);
    }
  };

  const createProject = (name: string, category: 'ads' | 'non-ads' = 'ads'): string => {
    const newId = `proj-${Date.now().toString(36)}`;
    const newProj: ProjectData = {
      id: newId,
      name: name.trim() || 'Novo Projeto Audiovisual',
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aspectRatio: category === 'ads' ? '16:9' : '2.39:1',
      selectedRegister: category === 'ads' ? 'register-b' : 'register-a',
      storyboard: {
        titleWord: 'CINEMA',
        formatLabel: '15 SEC',
        subject: 'Novo sujeito cinematográfico',
        colourway: 'Neutro e Motivado',
        aspectRatio: category === 'ads' ? '16:9' : '2.39:1',
        selectedRegister: category === 'ads' ? 'register-b' : 'register-a',
        panels: INITIAL_STORYBOARD_PANELS.map(p => ({ ...p }))
      },
      scaleCalculator: {
        subjectName: 'Novo Objeto de Produção',
        verifiedHeight: 25,
        verifiedLength: '',
        verifiedWidth: '',
        verifiedDepth: '',
        additionalNotes: '',
        views: ['Front', '3/4 Angle', 'Side Profile', 'Rear 3/4'],
        unit: 'cm'
      },
      characterSheet: {
        ...DEFAULT_CHARACTER_STATE,
        characterId: `CHAR-${Math.floor(Math.random() * 900 + 100)}`,
        name: 'Novo Personagem'
      },
      depthBoard: {
        sceneSubject: 'Novo ambiente ou cena principal',
        selectedShot: 1
      }
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newId);
    return newId;
  };

  const updateActiveProject = (updates: Partial<ProjectData>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }));
  };

  const updateActiveStoryboard = (updates: Partial<StoryboardData>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        storyboard: {
          ...p.storyboard,
          ...updates
        }
      };
    }));
  };

  const updateActiveScale = (updates: Partial<ScaleCalculatorState>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        scaleCalculator: {
          ...p.scaleCalculator,
          ...updates
        }
      };
    }));
  };

  const updateActiveCharacter = (updates: Partial<CharacterSheetState>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        characterSheet: {
          ...p.characterSheet,
          ...updates
        }
      };
    }));
  };

  const updateActiveDepth = (updates: Partial<{ sceneSubject: string; selectedShot: number }>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        updatedAt: new Date().toISOString(),
        depthBoard: {
          ...p.depthBoard,
          ...updates
        }
      };
    }));
  };

  const duplicateProject = (id: string): string => {
    const source = projects.find(p => p.id === id) || activeProject;
    const newId = `proj-${Date.now().toString(36)}`;
    const copy: ProjectData = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects(prev => [copy, ...prev]);
    setActiveProjectId(newId);
    return newId;
  };

  const deleteProject = (id: string): boolean => {
    if (projects.length <= 1) {
      alert('Não é possível excluir o único projeto restante.');
      return false;
    }
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id) {
      setActiveProjectId(remaining[0].id);
    }
    return true;
  };

  const exportProjectJson = (id: string): string => {
    const target = projects.find(p => p.id === id) || activeProject;
    return JSON.stringify(target, null, 2);
  };

  const importProjectJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.name && parsed.storyboard) {
        const newProj: ProjectData = {
          ...parsed,
          id: `proj-${Date.now().toString(36)}`,
          name: `${parsed.name} (Importado)`,
          updatedAt: new Date().toISOString()
        };
        setProjects(prev => [newProj, ...prev]);
        setActiveProjectId(newProj.id);
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  };

  const importScriptProject = (newProj: ProjectData): string => {
    setProjects(prev => [newProj, ...prev.filter(p => p.id !== newProj.id)]);
    setActiveProjectId(newProj.id);
    return newProj.id;
  };


  // Cross-pipeline integration helpers
  const syncCharacterToStoryboard = () => {
    const char = activeProject.characterSheet;
    const paletteStr = char.palette.map(p => p.label).join(', ');
    const newSubject = `${char.name} (${char.alias || char.role}) — ${char.species}, ${char.ageRange} anos. Props: ${char.signatureProps}`;
    const newColourway = `Identidade travada: Palette [${paletteStr}]. Visual notes: ${char.designNotes || 'Fidelidade visual estrita'}`;

    updateActiveStoryboard({
      subject: newSubject,
      colourway: newColourway
    });
  };

  const syncScaleToStoryboard = () => {
    const sc = activeProject.scaleCalculator;
    const numH = typeof sc.verifiedHeight === 'number' ? sc.verifiedHeight : 0;
    const ratio = numH > 0 ? (numH / 11.5).toFixed(2) : '1.0';
    const newSubject = `${sc.subjectName} (Proporção travada: ${numH}cm, ${ratio}x lata Coca-Cola 33cl). ${sc.additionalNotes || ''}`.trim();

    updateActiveStoryboard({
      subject: newSubject
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        lastSavedTime,
        createProject,
        switchProject,
        updateActiveProject,
        updateActiveStoryboard,
        updateActiveScale,
        updateActiveCharacter,
        updateActiveDepth,
        duplicateProject,
        deleteProject,
        exportProjectJson,
        importProjectJson,
        importScriptProject,
        syncCharacterToStoryboard,
        syncScaleToStoryboard
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
