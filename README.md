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
├── docs/
│   └── BLUEPRINT.md                   arquitetura do sistema de produção (M0–M5)
├── system/                            sistema: biblioteca + compilador + QC + adaptadores + Studio
│   ├── engine.py                      CLI (verify·init·set·render·run·attach·status·qc*·ideas)
│   ├── registry.json                  protocolos como dados + hashes + model_chains
│   ├── qc.py / adapters.py / synth.py M3 (QC automático) · M4 (fallback) · fixtures
│   ├── session.py                    Fase 3 — estados 0–4 do engine (CLI session + Studio)
│   ├── studio.py / studio.html        M5 — painel web (API JSON + SPA vanilla)
│   └── templates/                     templates da casa (reference · 5×3 · clips)
├── productions/
│   └── demo-forged-gold/              produção de demonstração (linha completa)
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

## Sistema — blueprint + compilador + QC + adaptadores

Os protocolos agora têm uma camada executável (linha completa, modo híbrido):

1. **[`docs/GUIA-DE-UTILIZACAO.md`](docs/GUIA-DE-UTILIZACAO.md)** — **guia completo de utilização**:
   conceitos, linha de produção, fases 0–4, camadas M0–M5, todos os comandos CLI,
   slots/gates por etapa, variáveis de ambiente, receitas passo a passo, interface do
   Studio, referência da API HTTP, funções Python por módulo e solução de problemas.
2. **[`docs/BLUEPRINT.md`](docs/BLUEPRINT.md)** — arquitetura do sistema de
   produção: biblioteca de protocolos → compilador → orquestrador → QC →
   adaptadores → studio (M0–M5), com modelo de dados e roadmap.
3. **`system/`** — implementação (stdlib Python): `verify` checa fidelidade
   sha256 dos lock blocks; `init`/`set`/`render` compilam prompts com gates e
   provenance; **M3** `qc-image`/`qc-video`/`qc-register`/`qc-all` fazem QC
   automático (conta painéis de verdade, grayscale, runtime do mp4,
   consistência do registro entre etapas); **M4** `run`/`attach` renderizam
   pela cadeia de adaptadores (API → mock → manual) com fallback anunciado;
   `ideas` gera as 10 ideias do STATE 2 (seed reproduzível); **M5**
   `studio.py` + `studio.html` são o **Studio** — painel web com produções,
   trilha de etapas, galeria, prompts com histórico e diff, STATE 2 e QC,
   tudo pela API relativa `/api/*`. Ver [`system/README.md`](system/README.md).
4. **`productions/demo-forged-gold/`** — produção de demonstração com os dois
   caminhos (depth board 3×3 e sheet 5×3), gates exercitados e `qc-all` verde.

## Ferramentas (estado atual)

| Função | Ferramenta |
|---|---|
| Render da sheet 5×3 | GPT Image 2 (via TopView skill na edição agêntica) |
| Reference image / depth map | Midjourney (manual) ou GPT Image 2 / Nano Banana |
| Animação | Seedance 2.0 |

## Changelog

- **2026-09-05 (5)** — **Guia de utilização completo**
  (`docs/GUIA-DE-UTILIZACAO.md`): conceitos, linha de produção etapa a etapa,
  fases 0–4, camadas M0–M5, referência dos 17 comandos CLI, slots/gates por
  etapa, variáveis de ambiente, 4 receitas passo a passo, guia da UI do Studio,
  referência da API HTTP, funções Python por módulo, estrutura de produção,
  troubleshooting e glossário.
- **2026-09-05 (4)** — **Fase 3: engine agêntico 5×3** — máquina de estados
  0–4 do engine v3 em `system/session.py`, dirigível por CLI
  (`engine.py session [--mock]`) e pelo Studio (console **ENGINE · SESSION**
  com endpoints `/api/session*`). States com gates exatos do spec, prompt
  impresso integral, QC de painéis com regenerate automático, `NEW` sem
  re-executar o environment check, e parada imediata se a biblioteca tiver
  drift. Roadmap 0–4 completo.
- **2026-09-05 (3)** — **Fase 4: Studio (M5)** entregue: `system/studio.py`
  (servidor HTTP stdlib com JSON API que encapsula os comandos do engine,
  estáticos de renders/assets com Range para vídeo) e `system/studio.html`
  (SPA vanilla — produções, trilha de etapas com compilar/run/QC/attach,
  galeria, prompts com provenance + histórico arquivado e diff unificado,
  STATE 2 com "virar produção", verify e gates na UI). Refactor no engine:
  `compute_verify()` e `generate_ideas()` expostos como dados para a API.
- **2026-09-05 (2)** — Fases 1–2 do roadmap + STATE 2: **M3 QC automático**
  (`system/qc.py` — contagem real de painéis por detecção de grid, grayscale
  por desvio de canal, runtime lido dos boxes do mp4, consistência
  BASE+registro entre etapas; `qc-all`); **M4 adaptadores** com fallback
  chain anunciado (`system/adapters.py`: openai-compat experimental → mock →
  manual com `.pending.md`; comandos `run`/`attach`); `ideas` (STATE 2, 10
  ideias reproduzíveis por seed) e fixtures sintéticos (`system/synth.py`).
- **2026-09-05** — Adicionada a camada de sistema: `docs/BLUEPRINT.md`
  (arquitetura em 6 módulos, M0–M5, com roadmap) e MVP `system/` (registry
  com hashes de fidelidade dos protocolos, compilador de prompts com gates e
  estilo colado palavra por palavra, orquestrador de produções, QC de
  painéis/runtime/grayscale). Produção de demonstração
  `productions/demo-forged-gold/` cobrindo a linha completa e os dois
  caminhos da etapa 4.

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
