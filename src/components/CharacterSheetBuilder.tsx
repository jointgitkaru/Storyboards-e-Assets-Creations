import React, { useState } from 'react';
import { 
  UserCheck, 
  Copy, 
  Palette, 
  AlertCircle, 
  Check, 
  Layers, 
  Tag, 
  FileText,
  Link2,
  FileDown,
  Camera,
  Sparkles,
  Brush,
  Film,
  Box,
  Dog,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProjects } from '../context/ProjectContext';
import { downloadFile } from '../utils/exportHelpers';
import { soundFx } from '../utils/audio';
import { VisualStyle } from '../types';

interface CharacterSheetBuilderProps {
  onCopy: (text: string, label: string) => void;
}

const AVAILABLE_MICRO_EXPRESSIONS = [
  'Guarded / cautious',
  'Subtle smirk',
  'Brow furrowed / tension',
  'Jaw tightened / controlled intensity',
  'Skeptical squint',
  'Momentary hesitation',
  'Quiet satisfaction',
  'Suppressed amusement'
];

interface VisualStyleOption {
  id: VisualStyle;
  label: string;
  sublabel: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VISUAL_STYLE_OPTIONS: VisualStyleOption[] = [
  {
    id: 'photorealistic',
    label: 'Fotografia Realista',
    sublabel: 'Live-Action / Foto Real',
    badge: 'Sem Ilustração (Strict)',
    desc: 'Câmera cinema 50mm, luz difusa de estúdio. Textura real de pelos, pele e olhos. Proíbe qualquer traço cartoon ou 3D.',
    icon: Camera
  },
  {
    id: '3d-cgi',
    label: '3D Cinematic',
    sublabel: 'Pixar / Unreal Engine 5',
    badge: 'CGI Raytracing',
    desc: 'Render 3D estilizado com subsurface scattering, model sheet volumétrico e iluminação de estúdio digital.',
    icon: Box
  },
  {
    id: '2d-animation',
    label: 'Animação 2D',
    sublabel: 'Concept Art / Toon',
    badge: 'Estilo Ilustração',
    desc: 'Model sheet clássico de animação e jogos, linhas limpas e pintura digital expressiva.',
    icon: Brush
  },
  {
    id: 'vintage-film',
    label: 'Película 35mm',
    sublabel: 'Cinema Noir Analógico',
    badge: 'Grão 35mm',
    desc: 'Fotografia analógica 35mm com grão orgânico Kodak Vision3, halação suave e iluminação prática.',
    icon: Film
  }
];

export const CharacterSheetBuilder: React.FC<CharacterSheetBuilderProps> = ({ onCopy }) => {
  const { activeProject, updateActiveCharacter, syncCharacterToStoryboard } = useProjects();
  const formData = activeProject.characterSheet;

  const [hasRefImageConfirmed, setHasRefImageConfirmed] = useState(true);

  const selectedStyle: VisualStyle = formData.visualStyle || 'photorealistic';
  const isAnimal = (formData.subjectType || 'human') === 'animal';

  const toggleMicroExpression = (expr: string) => {
    const exists = formData.microExpressions.includes(expr);
    let next: string[];
    if (exists) {
      next = formData.microExpressions.filter(e => e !== expr);
    } else {
      if (formData.microExpressions.length >= 4) {
        next = [...formData.microExpressions.slice(1), expr];
      } else {
        next = [...formData.microExpressions, expr];
      }
    }
    updateActiveCharacter({ microExpressions: next });
  };

  const handleUpdatePalette = (index: number, hex: string) => {
    const copy = [...formData.palette];
    copy[index] = { ...copy[index], hex };
    updateActiveCharacter({ palette: copy });
  };

  const handleSelectSubjectType = (type: 'human' | 'animal' | 'creature') => {
    updateActiveCharacter({ 
      subjectType: type,
      includeHands: type === 'human'
    });
  };

  const styleLayoutText = {
    photorealistic: 'Single horizontal photographic character reference sheet, multiple clearly labeled panels on a neutral light gray photo studio background, clean sans-serif typography labels, consistent margins, professional cinematic live-action turnaround board.',
    '3d-cgi': 'Single horizontal 3D digital model character reference sheet, multiple clearly labeled panels on a neutral light gray background, clean sans-serif labels, consistent margins, professional 3D animation/VFX studio turnaround board.',
    '2d-animation': 'Single horizontal production-style character reference sheet, multiple clearly labeled panels on a neutral light gray background, clean sans-serif labels, consistent margins, professional animation/game concept art production board.',
    'vintage-film': 'Single horizontal photographic 35mm film character reference sheet, multiple clearly labeled panels on a neutral light gray studio background, clean sans-serif labels, consistent margins, authentic 35mm analog film aesthetic.'
  }[selectedStyle];

  const styleRenderingDirectives = {
    photorealistic: `## VISUAL RENDERING STYLE: 100% PHOTOREALISTIC LIVE-ACTION (STRICT MANDATE)
- MANDATORY RENDERING RULE: Every panel MUST be rendered as an AUTHENTIC LIVE-ACTION PHOTOGRAPH, NOT an illustration, NOT concept art, NOT a digital painting, NOT a cartoon, NOT a 3D digital model.
- CAMERA & LIGHTING: Shot on high-end cinema camera with a 50mm/85mm portrait prime lens, ultra-sharp optical fidelity, authentic physical light falloff, studio softbox diffuse flash on clean neutral light gray studio backdrop.
- ANATOMICAL & SURFACE REALISM: Authentic physical skin/fur micro-texture, individual distinct hair follicles, real specular eye cornea reflections, natural wet nose texture, authentic physical anatomy and natural weight distribution.
- ZERO CARTOON / NO STYLIZATION: Absolutely NO 2D illustration, NO digital painting brushstrokes, NO anime/manga stylization, NO Disney/Pixar cartoon caricature, NO cel-shading, NO 3D CGI plastic render artifacts. Every single panel must look like a genuine studio photograph of the living subject.`,
    '3d-cgi': `## VISUAL RENDERING STYLE: CINEMATIC 3D CGI ANIMATION
- MANDATORY RENDERING RULE: High-end 3D CGI character model turnaround in the style of feature animated films (Pixar/Dreamworks/Unreal Engine 5).
- SHADING & TEXTURING: Subsurface scattering (SSS) on skin/materials, advanced fur/hair groom simulation, physical raytraced global illumination, clean studio key and rim lights.
- POLISH: High-poly production asset quality with defined silhouette, clean topology appearance, and expressive stylized anatomical proportions.`,
    '2d-animation': `## VISUAL RENDERING STYLE: 2D ANIMATION / CONCEPT ART BOARD
- MANDATORY RENDERING RULE: High-end 2D animation and game production model sheet with clean character design.
- ARTWORK STYLE: Clean visual development linework, smooth cel-shading or painterly digital art finish, consistent model proportions across all turnaround angles.
- CLARITY: Crisp silhouette, legible posture reads, professional animation studio model sheet aesthetics.`,
    'vintage-film': `## VISUAL RENDERING STYLE: 35MM VINTAGE ANALOG FILM PHOTOGRAPHY
- MANDATORY RENDERING RULE: Authentic 35mm photographic production sheet with organic analog film texture.
- FILM CHARACTERISTICS: Subtle Kodak Vision3 / Eastman film grain, gentle vintage lens halation, rich analog shadow roll-off, natural film color science.
- REALISM: Genuine practical live-action film photography. No digital painting or cartoon styling.`
  }[selectedStyle];

  // Compile the official v2.0 Character Reference Sheet Prompt
  const compiledPrompt = `# CHARACTER REFERENCE SHEET — GENERATION PROMPT v2.0

## HOW TO USE
Attach one reference image of the character. Fill in the bracketed fields in METADATA and DESIGN NOTES before running. Everything else can be used as-is.

## METADATA
CHARACTER ID: [${formData.characterId}]
NAME: [${formData.name}]
ALIAS: [${formData.alias}]
ROLE: [${formData.role}]
SPECIES: [${formData.species}]
AGE RANGE: [${formData.ageRange}]
REVISION: [${formData.revision}]
REFERENCE SOURCE: [${formData.referenceSource}]

## IDENTITY LOCK (non-negotiable — never alter)
Use strictly the same character identity as the uploaded reference image: same face, same age range, same hairstyle, same hair texture and color, same skin tone, same facial features, same body proportions, same outfit, same accessories, same color palette, same overall build. Do not redesign, reinterpret, or stylize the character. Do not change ethnicity, species, gender presentation, or body type.

${styleRenderingDirectives}

## LAYOUT
${styleLayoutText}

### 1. MAIN TURNAROUND + SCALE SHEET
Full-body views, same lighting, same distance, same lens, same ground line across all four:
- Front
- 3/4 front
- Side
- Back

Include a faint height-reference ruler or scale ticks beside the front view, and a small neutral gray silhouette guide underneath indicating stance. Identical proportions and outfit across all four views.

### 2. HEAD TURNAROUND
Close-up head-only views: front face, 3/4 face, side profile, back of head/hair detail. Facial structure, eyes, nose, mouth, jaw, ears, and hairline must match exactly across all four.

### 3. EXPRESSION SHEET
Primary expressions (6 small close-up portraits):
${formData.primaryExpressions.map(e => `- ${e}`).join('\n')}

Micro-expressions (4 additional close-ups, acting-direction style):
${formData.microExpressions.map(e => `- "${e}"`).join('\n')}

All expressions subtle and natural, without altering skull shape, eye size, or identity.

### 4. POSTURE VARIATIONS
3 small full-body poses showing the same character in:
${formData.postures.map(p => `- ${p}`).join('\n')}
Same outfit, same proportions, same identity — only weight distribution and body language change.

${isAnimal ? `### 5. PAW & STANCE STUDIES (ANIMAL SUBJECT)
4 close-up paw/stance studies:
- Front paws planted firmly on studio floor surface
- Sitting guard stance with symmetrical front legs
- Head resting comfortably over crossed front paws
- One paw slightly lifted in active tracking pause
Natural fur texture down to pads and claws, authentic anatomy.` : (formData.includeHands ? `### 5. HAND GESTURE LIBRARY
4 close-up hand studies:
${formData.handStudies.map(h => `- ${h}`).join('\n')}
Same skin tone, proportions, and any rings/gloves/accessories.` : '### 5. HAND GESTURE LIBRARY\n*(Omitted — character has no expressive hands)*')}

### 6. CLOSE-UP DETAIL PANELS
Macro shots of:
- Eyes, iris detail, specular highlights and authentic reflections
- ${isAnimal ? 'Wet nose, muzzle micro-texture and whisker follicles' : 'Mouth and facial micro-texture'}
- ${isAnimal ? 'Fur texture, coarse/soft hair transitions and flow lines' : 'Hair texture and flow lines'}
- Ear anatomy, cartilage and micro-fur details
${isAnimal ? '- Collar / harness hardware, stitching, buckle and tag details' : '- Clothing fabric detail (seams, buttons, material weave, weathering)'}

### 7. SILHOUETTE + DEPTH REFERENCE
A) Silhouette: two flat, solid-gray anatomical silhouettes (front and side) on a neutral background, no internal detail — pure outline and proportion reference.
B) Depth pass placeholder: grayscale approximation only (white = nearest, black = farthest), no lighting, texture, or shading baked in.
*Note: treat this panel as a stylized approximation. For production-accurate depth, use dedicated depth map pass afterward.*

### 8. WARDROBE, ACCESSORIES & PROP CARD
Signature Props: ${formData.signatureProps || '[Specify key props]'}
Flat/laid-out views of each clothing item and accessory with distinguishing traits and narrative purpose.

${formData.paletteMode === 'manual' 
  ? `### 9. COLOR PALETTE
Extracted swatches with approximate hex values:
${formData.palette.map(p => `- ${p.label}: ${p.hex}`).join('\n')}` 
  : `### 9. COLOR PALETTE
EXTRACT PALETTE DIRECTLY FROM ATTACHED REFERENCE IMAGE:
- Extract and display color swatches sampled directly from the uploaded reference photograph.
- Identify and swatch the primary pigmentation/fur/skin tone, secondary markings, eye color, and key accents visible in the image.
- Label each swatch with its authentic approximate hex value derived from the image.
- STRICT REQUIREMENT: Do NOT invent or substitute colors. Preserve the exact natural tones of the reference photo.`}

### 10. VOICE & PERSONALITY NOTES
${formData.voiceNotes}

### 11. DESIGN NOTES
ID: ${formData.characterId} | Rev: ${formData.revision}
${formData.designNotes}
${selectedStyle === 'photorealistic' 
  ? 'STRICT PHOTOGRAPHY REQUIREMENT: Do NOT apply painterly effects, digital smoothing, or cartoon filters. Maintain 100% photographic live-action camera realism with neutral studio diffuse lighting.' 
  : selectedStyle === 'vintage-film'
  ? 'FILM PRODUCTION NOTE: Preserve authentic 35mm analog film grain and organic tone curve. Neutral studio lighting without artificial digital filters.'
  : 'Do NOT apply cinematic dramatic grades to this production sheet. Keep lighting neutral studio diffuse.'}`;

  const handleSendToStoryboard = () => {
    soundFx.playActionConfirm();
    syncCharacterToStoryboard();
    onCopy('', 'Personagem e Paleta Sincronizados com o Storyboard 5×3!');
  };

  const handleDownloadMd = () => {
    soundFx.playActionConfirm();
    const filename = `character-${(formData.name || 'sheet').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    downloadFile(compiledPrompt, filename, 'text/markdown');
  };

  const handleDownloadTxt = () => {
    soundFx.playActionConfirm();
    const filename = `character-${(formData.name || 'sheet').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    downloadFile(compiledPrompt, filename, 'text/plain');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto py-2"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#1e2326] to-[#1a1b22] shadow-xl shadow-black/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              Protocolo v2.0 Oficial
            </span>
            <span className="text-xs text-slate-400 font-mono">11 Seções · Identity Lock</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs font-mono text-amber-400 font-semibold">{activeProject.name}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            Character Reference Sheet (v2.0)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Trava a identidade do personagem em todos os shots subsequentes: turnaround com régua, expressões sutis, micro-atuação e swatches com hex real.
          </p>
        </div>

        {/* Reference Image Gate confirmation toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 text-xs font-mono text-slate-200 cursor-pointer bg-[#181920] px-3.5 py-2 rounded-xl border border-[#2c2e3b] shadow-xs">
            <input
              type="checkbox"
              checked={hasRefImageConfirmed}
              onChange={e => setHasRefImageConfirmed(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-[#14151a]"
            />
            <span className="font-semibold">Imagem de Referência Anexada</span>
          </label>
        </div>
      </div>

      {/* Cross-Pipeline Action Bar */}
      <div className="p-3 rounded-xl border border-[#2e313f] bg-[#1a1b24] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Link2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Integração com o Storyboard:</span>
          <span className="text-slate-400 hidden sm:inline">Envie este personagem e sua paleta visual diretamente para o Subject do Storyboard 5×3</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMd}
            title="Baixar Character Sheet em Markdown"
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
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all text-xs shadow-xs"
          >
            <span>🔗 Enviar para Storyboard 5×3</span>
          </button>
        </div>
      </div>

      {/* Mandatory Gate Warning if unconfirmed */}
      {!hasRefImageConfirmed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border border-red-500/40 bg-red-950/30 text-red-200 flex items-start gap-3 shadow-md"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold font-mono">GATE ATIVO: NÃO GERAR SEM IMAGEM DE REFERÊNCIA</p>
            <p className="text-slate-300">
              O prompt v2.0 exige imagem de referência anexada (&ldquo;Attach one reference image of the character&rdquo;). O <code>IDENTITY LOCK</code> depende dessa âncora visual para impedir alucinações de traços faciais ou proporções.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Form & Configuration Grid in Dark Gray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Metadata & Sections */}
        <div className="lg:col-span-6 space-y-5">
          {/* Visual Style & Subject Selector Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-[#1f212a] via-[#1a1b24] to-[#161720] p-5 space-y-4 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between border-b border-[#2d3040] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Estilo Visual do Character Sheet
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Anti-Animation Lock
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Define a técnica de renderização para a IA. Para fotos reais (ex: cães, pessoas), escolha <strong className="text-emerald-400">Fotografia Realista</strong> para forçar câmera real e proibir que o modelo gere animação ou desenho.
            </p>

            {/* Visual Style Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VISUAL_STYLE_OPTIONS.map((style) => {
                const IconComponent = style.icon;
                const isSelected = selectedStyle === style.id;
                return (
                  <motion.button
                    key={style.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      soundFx.playActionConfirm();
                      updateActiveCharacter({ visualStyle: style.id });
                    }}
                    className={`p-3 rounded-xl text-left transition-all border relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                        : 'bg-[#181920] border-[#2c2e3b] text-slate-300 hover:border-slate-600 hover:bg-[#1c1e28]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-[#252736] text-slate-400'}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {style.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {style.sublabel}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {style.desc}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Subject Type Toggle (Humano vs Animal vs Criatura) */}
            <div className="pt-2 border-t border-[#2a2c3a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                {isAnimal ? <Dog className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
                Tipo de Sujeito:
              </span>

              <div className="flex items-center bg-[#14151c] p-0.5 rounded-xl border border-[#2b2d3d] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleSelectSubjectType('animal')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    isAnimal
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Dog className="w-3 h-3" />
                  <span>Animal / Pet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSubjectType('human')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    !isAnimal && formData.subjectType !== 'creature'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Humano</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Metadata Section */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-4 shadow-md"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#2a2c3a] pb-3">
              <Tag className="w-4 h-4 text-emerald-400" />
              Campos de Metadados (v2.0)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  CHARACTER ID
                </label>
                <input
                  type="text"
                  value={formData.characterId}
                  onChange={e => updateActiveCharacter({ characterId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  NOME DO PERSONAGEM
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateActiveCharacter({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  ALIAS / CODINOME
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={e => updateActiveCharacter({ alias: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  PAPEL NARRATIVO
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={e => updateActiveCharacter({ role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  ESPÉCIE
                </label>
                <input
                  type="text"
                  value={formData.species}
                  onChange={e => updateActiveCharacter({ species: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                  FAIXA ETÁRIA
                </label>
                <input
                  type="text"
                  value={formData.ageRange}
                  onChange={e => updateActiveCharacter({ ageRange: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1 font-semibold">
                PROPS E ACESSÓRIOS CHAVE
              </label>
              <input
                type="text"
                value={formData.signatureProps}
                onChange={e => updateActiveCharacter({ signatureProps: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#181920] border border-[#2c2e3b] text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                placeholder="ex: relógio, espada, jaqueta com insígnia"
              />
            </div>
          </motion.div>

          {/* Micro-Expressions Selector */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-2">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Micro-Expressões (Escolha 4 para Atuação)
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {formData.microExpressions.length}/4 Selecionadas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MICRO_EXPRESSIONS.map(expr => {
                const isSelected = formData.microExpressions.includes(expr);
                return (
                  <motion.button
                    key={expr}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleMicroExpression(expr)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-[#181920] border-[#2c2e3b] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate">{expr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Color Palette Swatches */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2a2c3a] pb-2 gap-2">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Seção 9: Color Palette (Paleta de Cores)
              </h4>

              {/* Mode Toggle: Auto vs Manual */}
              <div className="flex items-center bg-[#151620] p-0.5 rounded-lg border border-[#2d3040] text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => updateActiveCharacter({ paletteMode: 'auto' })}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    (formData.paletteMode || 'auto') === 'auto'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Auto (Da Foto)
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveCharacter({ paletteMode: 'manual' })}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    formData.paletteMode === 'manual'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual (Hex Fixo)
                </button>
              </div>
            </div>

            {(formData.paletteMode || 'auto') === 'auto' ? (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Extração Automática da Foto de Referência Ativa</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  O prompt comanda a IA a <strong>amostrar as cores reais diretamente da imagem anexada</strong> (pelagem/pele, marcas, olhos, nariz e adereços), sem impor códigos hex rígidos que poderiam desvirtuar o personagem da foto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.palette.map((color, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#181920] border border-[#2c2e3b] flex items-center gap-3">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={e => handleUpdatePalette(idx, e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent shadow-xs"
                    />
                    <div className="overflow-hidden">
                      <span className="block text-[10px] text-slate-400 font-medium truncate">
                        {color.label}
                      </span>
                      <span className="block text-[11px] font-mono text-white font-bold uppercase">
                        {color.hex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>


        {/* Right Form: 11 Sections Inventory & Compiled Prompt */}
        <div className="lg:col-span-6 space-y-5">
          {/* 11 Sections Checklist */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md"
          >
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-[#2a2c3a] pb-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              11 Seções Padronizadas da Sheet v2.0
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">01.</span>
                <span>Turnaround + Régua Escala</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">02.</span>
                <span>Head Turnaround (4 Vistas)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">03.</span>
                <span>6 Expressões + 4 Micros</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">04.</span>
                <span>3 Variações de Postura</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">05.</span>
                <span>Livraria de Mãos (4 Estudos)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">06.</span>
                <span>Panels Macro (Olho, Pele, Tecido)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">07.</span>
                <span>Silhueta + Depth Pass</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">08.</span>
                <span>Wardrobe & Prop Card</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">09.</span>
                <span>Paleta com Hex Real</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b]">
                <span className="text-emerald-400 font-bold">10.</span>
                <span>Notas de Voz e Atuação</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181920] border border-[#2c2e3b] sm:col-span-2">
                <span className="text-emerald-400 font-bold">11.</span>
                <span>Design Notes (ID, Versão, Métricas)</span>
              </div>
            </div>
          </motion.div>

          {/* Compiled Prompt Display */}
          <div className="rounded-2xl border border-[#2e313f] bg-[#1f2029] p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#2a2c3a] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Prompt v2.0 Compilado (Word-for-Word)
                </h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onCopy(compiledPrompt, 'Prompt v2.0 copiado com sucesso!')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt v2.0</span>
              </motion.button>
            </div>

            <pre className="p-4 rounded-xl bg-[#14151a] text-slate-200 border border-[#282a35] font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
              {compiledPrompt}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
