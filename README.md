# Storyboard Animation Engine

Sistema de produção de conteúdo assistido por IA — storyboards cinematográficos,
folhas de referência de assets (identidade e escala física) e clipes animados.
Tudo parte de protocolos de prompt versionados: **lock blocks** (texto que se
cola palavra por palavra, nunca parafraseado) + **slots** (valores que variam
por produção).

> O pacote original do engine (edição agêntica, com os 8 sheets de referência
> embutidos em base64) está em
> [`protocols/storyboard-sheet-5x3/PROMPT STORYBOARD.md`](protocols/storyboard-sheet-5x3/PROMPT%20STORYBOARD.md).

---

## A linha de produção

Os protocolos se combinam nesta ordem — cada um trava uma dimensão do problema:

```
ETAPA 1   CHARACTER REFERENCE SHEET ........... trava a IDENTIDADE
          (rosto, cabelo, roupa, proporções, marcas)
ETAPA 2   ESCALA 2×2 COM LATA 33CL [opcional] . trava as DIMENSÕES FÍSICAS REAIS
ETAPA 3   REFERENCE IMAGE ..................... define o LOOK do filme
          (com um STYLE REGISTER de styles/cinematic-photorealistic.md)
ETAPA 4   DEPTH MAP + DEPTH BOARD 3×3 ......... define CÂMERA E COMPOSIÇÃO
          — ou — SHEET 5×3 (15 shots, 0:15) na edição agêntica do engine
ETAPA 5   CLIP (SEEDANCE 2.0) ................. anima a sequência
          (o MESMO STYLE REGISTER da etapa 3 é colado palavra por palavra)
```

Regra de ouro do depth workflow (pacote OAK): **a referência controla o look;
o board de profundidade controla a câmera; as character sheets controlam a
identidade.**

## Estrutura do repositório

```
├── README.md                          ← este arquivo
├── protocols/
│   ├── storyboard-sheet-5x3/
│   │   └── PROMPT STORYBOARD.md       engine completo: 5 estados, 7 lock blocks, 8 sheets
│   ├── depth-board-3x3/
│   │   ├── README.md                  uso do workflow em 5 etapas
│   │   ├── workflow.md                registro original (thread OAK) com exemplos
│   │   ├── depth-map-prompt.md        prompt de extração de depth map
│   │   └── storyboard-prompt.md       prompt 3×3 em 8 fases
│   ├── scale-can-2x2/
│   │   ├── protocolo-escala-coca-cola-v1.md            uso no dia a dia
│   │   └── protocolo-escala-coca-cola-MASTER-completo.md  regras completas
│   └── character-reference-sheet/
│       ├── character-reference-sheet-prompt.md          original v2.0 (palavra por palavra)
│       └── README.md                                    uso, gates e continuidade
└── styles/
    └── cinematic-photorealistic.md    3 registros de estilo fotorrealista
```

**Mapeamento antigo → novo**

| Antes (raiz) | Agora |
|---|---|
| `PROMPT STORYBOARD.md` | `protocols/storyboard-sheet-5x3/PROMPT STORYBOARD.md` |
| `depth_maps_boards.md` | `protocols/depth-board-3x3/storyboard-prompt.md` |
| `cinematic storyboard generator working.md.txt` | `protocols/depth-board-3x3/workflow.md` |
| `protocolo-escala-coca-cola-v1.md` | `protocols/scale-can-2x2/protocolo-escala-coca-cola-v1.md` |
| `protocolo-escala-coca-cola-MASTER-completo.md` | `protocols/scale-can-2x2/protocolo-escala-coca-cola-MASTER-completo.md` |

## Protocolos — resumo de uso

### 1. Sheet 5×3 — engine agêntica (`protocols/storyboard-sheet-5x3/`)

Máquina de estados 0–4: checagem de ambiente → ads (1) ou non-ads (2) → 10
ideias → sheet 5×3 (15 painéis, 1 s/panel, 0:15) via GPT Image 2 → animação
via Seedance. Slots: `[colour]`, `[SUBJECT]`, `[aspect ratio]`, `[framing]`,
`[title word]`, `[format label]`, `STYLE / LIGHTING / COLOUR GRADE`,
`[duration]`, `[slug]`.

O slot `STYLE / LIGHTING / COLOUR GRADE` é exatamente onde entra o módulo de
estilo — no engine ele é "written once, then pasted word for word into the
animation prompt".

### 2. Depth board 3×3 (`protocols/depth-board-3x3/`)

5 etapas: reference image → depth map (grayscale) → board 3×3 só de
profundidade (9 shots: establishing → movimento → descoberta → reação →
preparação → insert → ação → consequência → resolução) → character sheets
para travar identidade → clipes Seedance 2.0 (referência = look, board =
câmera, sheets = identidade).

### 3. Escala 2×2 Coca-Cola (`protocols/scale-can-2x2/`)

Folha de referência dimensional 2×2 com a lata 33cl (11,5 × 6,6 × 5,2 cm)
como objeto-mestre. **Gate de medidas**: sem medida real confirmada, o
protocolo para e pergunta — nunca inventa. Use o v1 no dia a dia; quando o
modelo deixar de respeitar uma regra específica, copie só a seção do MASTER
correspondente e cole junto do prompt de invocação.

### 4. Character reference sheet v2.0 (`protocols/character-reference-sheet/`)

Folha de produção com 11 seções que travam a identidade: turnaround + régua,
head turnaround, expressões (6 primárias + 4 micro), posturas, gestos de
mão, detalhes macro, silhueta + depth placeholder, wardrobe/props card,
paleta com hex, notas de voz/personalidade e design notes. Prompt original
**v2.0, palavra por palavra** — `IDENTITY LOCK` e `CONTINUITY RULES` são
parte do lock. Gate: sem imagem de referência, não gera.
Pode combinar com o protocolo de escala quando a figura física importar.

## Estilo — cinematic fotorealista (`styles/`)

`styles/cinematic-photorealistic.md` define o bloco **BASE** + 3 registros
coláveis (um registro por produção, do início ao fim):

- **A — FEATURE FILM** · anamórfico, grão 35mm, luz motivada, sombras profundas
- **B — PHOTOREALISTIC COMMERCIAL (ads)** · registro comercial — casa com as
  sheets 01–04 do pack (os quatro ads fotorrealistas)
- **C — DOCUMENTARY REALISM** · luz disponível, handheld honesto, sem retoque

Uso: cole `BASE` + um registro inteiros em (a) a reference image e
(b) o prompt de animação do Seedance. Não se aplica a depth boards
(grayscale por design) nem a sheets de produção (character/scale) —
estas têm estilo próprio travado no próprio prompt.

## Ferramentas (estado atual)

| Função | Ferramenta |
|---|---|
| Render da sheet 5×3 | GPT Image 2 (via TopView skill na edição agêntica) |
| Reference image / depth map | Midjourney (manual) ou GPT Image 2 / Nano Banana |
| Animação | Seedance 2.0 |

## Changelog

- **2026-09-04 (2)** — Incorporado o **original do character reference
  sheet v2.0** (upload em `main_karu`), movido para
  `protocols/character-reference-sheet/` com README de uso; removido o
  placeholder v1.0 e o duplicado do thread OAK que estava na raiz. Módulo
  de estilo ajustado: aplica a reference image + clip, não a sheets de
  produção (character/scale).
- **2026-09-04** — Projeto renomeado para *Storyboard Animation Engine*.
  Reestruturação em `protocols/` + `styles/`. Novo protocolo
  character-reference-sheet (v1.0 — substituído pelo original v2.0 acima).
  Novo módulo de estilo cinematic-photorealistic (BASE + 3 registros).
  Correção do ponteiro do MASTER no protocolo de escala. Extração do
  prompt de depth map para arquivo próprio.
