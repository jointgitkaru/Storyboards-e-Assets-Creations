# GUIA DE UTILIZAÇÃO COMPLETO — Storyboard Animation Engine · Production System

> Sistema de produção de conteúdo assistido por IA construído sobre os
> protocolos deste repositório. Este guia cobre: conceitos, linha de produção,
> fases de desenvolvimento, camadas do sistema, **todos os comandos CLI**,
> **todos os endpoints da API**, **funções Python por módulo**, receitas
> passo a passo e solução de problemas.
>
> Pré-requisitos: **Python 3.9+** · zero dependências (Pillow opcional para
> JPEG/WEBP no QC). Nada precisa ser instalado.

**Índice**

1. [Os conceitos](#1-os-conceitos)
2. [A linha de produção (etapas)](#2-a-linha-de-produção-etapas)
3. [As fases de desenvolvimento (roadmap 0–4)](#3-as-fases-de-desenvolvimento-roadmap-04)
4. [As camadas do sistema (M0–M5)](#4-as-camadas-do-sistema-m05)
5. [Referência de comandos CLI](#5-referência-de-comandos-cli)
6. [Referência de slots e gates por etapa](#6-referência-de-slots-e-gates-por-etapa)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Receitas passo a passo](#8-receitas-passo-a-passo)
9. [Studio — guia da interface web](#9-studio--guia-da-interface-web)
10. [Referência da API HTTP](#10-referência-da-api-http)
11. [Referência de funções Python (por módulo)](#11-referência-de-funções-python-por-módulo)
12. [Estrutura de arquivos de uma produção](#12-estrutura-de-arquivos-de-uma-produção)
13. [Solução de problemas](#13-solução-de-problemas)
14. [Glossário](#14-glossário)

---

## 1. Os conceitos

O sistema transforma os protocolos markdown do repositório (que continuam
sendo a **verdade**, nunca editados) em um pipeline executável. Quatro
conceitos governam tudo:

| Conceito | Definição | Onde o sistema garante |
|---|---|---|
| **Lock block** | Texto travado, colado palavra por palavra, nunca parafraseado (IDENTITY LOCK, STYLE REGISTER, prompts verbatim, abertura travada do clip) | `verify` confere sha256 contra a fonte; compilador só injeta slots — o resto sai byte-a-byte igual |
| **Slot** | Valor que varia por produção, injetado em um placeholder exato (`[SUBJECT]`, `Verified height: [xx] cm`, `{{SCENE}}`) | Compilador valida obrigatórios, preserva rótulos, rejeita não-numéricos em campos numéricos |
| **Gate** | Regra que **para e pergunta** em vez de inventar (sem referência não gera; medida não confirmada não passa; clip sem câmera não compila) | `_check_gates` roda antes de toda compilação — CLI e Studio |
| **Provenance** | Todo prompt compilado é arquivado com metadados (fonte, sha256, slots, registro, data) | `prompts/*.txt` + `*.meta.json` + `history/` com diff entre versões |

Complementares: **registro de estilo** (BASE + A/B/C, um por produção, colado
integralmente na reference image, sheet 5×3 e clip — nunca em depth
board/sheets de produção), **fallback chain** (API → mock → manual, sempre
anunciada — nunca substituição silenciosa) e **off-geometry** (sheet com
painéis ≠ 15/9 é rejeitada e regenerada, nunca apresentada como pronta).

## 2. A linha de produção (etapas)

Cada etapa trava uma dimensão do problema. Ordem: **1 → 6** (etapa 2 opcional;
na etapa 5 escolha *depth board* **ou** *sheet 5×3*; a 6 acompanha a escolha).

```
1. CHARACTER SHEET ── trava IDENTIDADE (rosto, roupa, proporções, 11 seções)
2. ESCALA 2×2 ────── trava DIMENSÃO FÍSICA (lata 33cl como objeto-mestre) [opcional]
3. REFERENCE IMAGE ─ define o LOOK (BASE + 1 registro de estilo)
4. DEPTH MAP ──────── converte a reference em grayscale (branco=perto)
5. DEPTH BOARD 3×3 ── trava CÂMERA/COMPOSIÇÃO (9 shots, 8 fases)
   ── ou ──
5*. SHEET 5×3 ─────── engine v3: 15 painéis, 1 s/painel, 0:15, chrome completo
6. CLIP ───────────── anima (depth: look+câmera+identidade · 5×3: abertura travada)
```

Detalhe por etapa (id usado nos comandos entre colchetes):

### Etapa 1 — `character-sheet`
Protocolo v2.0 **palavra por palavra** (11 seções: turnaround, head, expressões,
posturas, mãos, macros, silhueta+depth, wardrobe, paleta, voz, design notes).
**Gate**: exige imagem de referência do personagem em `assets/` registrada no
slot `reference_image` — sem referência, não gera.
**Slots**: `character_id`, `name`, `role`, `species`, `age_range`,
`reference_source` (obrigatórios) e `alias` (opcional).

### Etapa 2 — `scale-sheet` *(opcional)*
Invocação da Escala Coca-Cola v1: lata 33 cl (11,5 × 6,6 × 5,2 cm) fixa ao
lado do sujeito, grid 2×2, câmera horizontal. **Gate**: `dimensions_verified=true`
— medida real confirmada; nunca inventar dimensão. `scale_height_cm` é
numérico e validado. Multiplicador: `altura ÷ 11,5`.

### Etapa 3 — `reference-image`
Template da casa: uma still que define o look do filme (LOOK master).
**Gate**: registro de estilo escolhido (`register=A|B|C`). O compilador cola
**BASE + registro integralmente** no prompt — é o mesmo bloco que irá para a
etapa 6 (regra: escrito uma vez, colado palavra por palavra).
**Slots**: `subject` (obrigatório), `scene`, `framing`, `aspect_ratio` (16:9).

### Etapa 4 — `depth-map`
Prompt verbatim de extração: grayscale linear, branco=perto/preto=longe, sem
cor/textura/luz. **Gate**: reference image presente em `renders/`.
Zero slots — 100% travado.

### Etapa 5 — `depth-board`
Prompt 8 fases (analisar → beat → 9 shots → continuidade → depth → render →
grid 3×3 → QC). Sequência fixa: establishing → movimento → descoberta →
reação → preparação → insert → ação → consequência → resolução.
**Gates**: reference + depth map em `renders/`. Zero slots.

### Etapa 5* — `storyboard-sheet` (alternativa, engine v3)
Template extraído do engine: grid **5×3 = 15 painéis**, 1 s/painel, 0:15,
chrome (número + timecode + caption + header). **Slots**: `subject`
(obrigatório, concreto: modelo exato, colourway, acabamento), `subject_long`,
`colour` (card), `title_word`, `format_label`, `aspect_ratio`, `beat_1`…`beat_15`.
Com `register` definido, o bloco STYLE/LIGHTING/COLOUR GRADE é substituído
pelo BASE+registro colados integralmente.

### Etapa 6 — `clip` (depth) ou `clip-5x3` (engine)
- `clip`: regra de ouro — **reference = LOOK · board = CÂMERA · sheets = IDENTIDADE**;
  mesma BASE+registro da etapa 3 colada palavra por palavra.
- `clip-5x3`: abre com as **duas linhas travadas** do engine v3 ("Use the
  reference storyboard to make a full animation movie. / Audio: diegetic
  sound only…") e usa a sheet como referência.
**Gates**: artefatos de entrada presentes e etapas predecessoras renderizadas.
Audio sempre diegético; chrome nunca vira conteúdo; runtime curto → divide em
beats nomeados, nunca encurta em silêncio.

## 3. As fases de desenvolvimento (roadmap 0–4)

| Fase | Nome | Entregou | Status |
|---|---|---|---|
| **0** | Fundação | `docs/BLUEPRINT.md` (arquitetura M0–M5, modelo de dados, integração híbrida); M0 registry+verify; M1 compilador; M2 orquestrador; produção demo ponta a ponta | ✅ |
| **1** | QC automático (M3) | `system/qc.py` — contagem real de painéis (detecção de grid por gutters), grayscale por desvio de canal, runtime por parse `moov/mvhd`, consistência BASE+registro entre prompts; comandos `qc-image/qc-video/qc-register/qc-all`; teste negativo: 3×3 no lugar da 5×3 → falha + regenerate | ✅ |
| **2** | Adaptadores (M4) | `system/adapters.py` — cadeia `openai-image/video → mock → manual` com fallback **anunciado** e adaptador gravado por artefato; `run`/`attach`; `synth.py` (fixtures: PNG sólido, grid, mp4 com duração) | ✅ |
| **3** | Engine agêntico | `system/session.py` — máquina de estados 0–4 do engine v3: READY line, gates exatos, prompt integral, off-geometry→regenerate automático, `NEW` sem re-executar STATE 0; CLI `session` + console do Studio | ✅ |
| **4** | Studio (M5) | `system/studio.py` + `studio.html` — painel web: produções, trilha de etapas, galeria, prompts com histórico+diff, STATE 2, verify, QC e console ENGINE·SESSION; API relativa `/api/*` | ✅ |

Fora do roadmap (próximo natural): validar adaptadores HTTP com chaves reais
de API (GPT Image 2 / Seedance), polling assíncrono de jobs de vídeo.

## 4. As camadas do sistema (M0–M5)

| Camada | Arquivo(s) | Responsabilidade |
|---|---|---|
| **M0** Biblioteca | `engine.py` + `registry.json` | Protocolos como dados versionados: regra de extração por protocolo (`whole_file`, `first_code_block`, `code_block_after <heading>`), slots declarados, gates e **hashes sha256** de fidelidade |
| **M1** Compilador | `engine.py` | Slots + lock blocks → prompt final; comentários de template removidos; provenance `.meta.json`; re-render byte-a-byte idêntico |
| **M2** Orquestrador | `engine.py` | Produções (`productions/<slug>/`), etapas com estado (`rendered`/`awaiting_artifact`/pendente), encadeamento de artefatos, gates |
| **M3** QC | `qc.py` | Validação de **saídas**: painéis, grayscale, runtime, consistência de registro (importação preguiçosa) |
| **M4** Adaptadores | `adapters.py` + `synth.py` | Envio ao modelo com fallback chain + fixtures sintéticos para testar sem gastar API |
| **M5** Studio | `studio.py` + `studio.html` | HTTP stdlib (JSON API + estáticos com Range) + SPA vanilla dark |

Regra de dependência: cada camada só conversa com a de baixo; o compilador
funciona sem adaptadores (modo híbrido) e os adaptadores não mudam protocolos.

## 5. Referência de comandos CLI

Todos: `python3 system/engine.py <comando>` (a partir da raiz do repo).

### Biblioteca (M0)

| Comando | Sintaxe | Descrição |
|---|---|---|
| `verify` | `verify [--fix]` | Confere sha256 de cada lock block/template/registro contra os `.md` originais + cross-checks (abertura travada do clip; placeholders de slots). Saída `OK`/`DRIFT` por entrada. **`--fix`**: grava hashes atuais — use **apenas** após editar um protocolo de propósito |
| `protocols` | `protocols` | Lista protocolos registrados (com nº de slots), módulo de estilo (BASE+A/B+C) e templates da casa |

### Produção (M2)

| Comando | Sintaxe | Descrição |
|---|---|---|
| `init` | `init <slug> [--title T] [--register A\|B\|C]` | Cria `productions/<slug>/` com `production.json`, `prompts/`, `renders/`, `assets/`. Slug: `a-z0-9-` |
| `set` | `set <slug> chave=valor [k2=v2 …]` | Define slots (`subject=…`, `beat_5=…`) e reservados `title=…` e `register=A\|B\|C`. Valores `true/false/1/0` viram booleanos |
| `status` | `status <slug>` | Mapa: ● renderizado · ◐ aguardando artefato · ○ pendente, com prompt/via-adaptador, renders e assets |

### Compilação e render

| Comando | Sintaxe | Descrição |
|---|---|---|
| `render` | `render <slug> <etapa>` | Compila o prompt da etapa (gates primeiro), grava `prompts/NN-*.txt` + `.meta.json`, imprime slots usados e ferramenta sugerida. **Modo híbrido**: cole o .txt na ferramenta e traga o arquivo |
| `run` | `run <slug> <etapa> [--mock\|--manual]` | Compila **e** renderiza pela cadeia M4 (`--mock` força stub sintético; `--manual` força instruções `.pending.md`; sem flag: API se houver env → mock se `ENGINE_MOCK=1` → manual). Registra o adaptador usado em `production.json` |
| `attach` | `attach <slug> <etapa> <arquivo>` | Registra um arquivo gerado manualmente como artefato da etapa (copia para `renders/`, marca `rendered` via `manual`) |

### QC (M3)

| Comando | Sintaxe | Descrição |
|---|---|---|
| `qc-image` | `qc-image <slug> panels <etapa> [esperado]` | **Conta painéis de verdade** (decoder PNG + detecção de grid). Esperados: sheet=15, board=9 (ou passe o número). Falha → "off-geometry → regenerate" |
| | `qc-image <slug> grayscale <etapa>` | Depth map sem cor: ≥99,5% dos pixels com desvio de canal ≤ 8 |
| `qc-video` | `qc-video <slug> <etapa>` | Runtime lido dos boxes `moov/mvhd` do mp4; esperado ~0:15, tolerância 1 s |
| `qc-register` | `qc-register <slug>` | BASE+registro **presentes** (verbatim) nas etapas de estilo e **ausentes** nas travadas (character/scale/depth) |
| `qc-all` | `qc-all <slug>` | Roda todos os QC aplicáveis + resumo final |
| `qc` | `qc <slug> <check> <etapa> <valor>` | Registra verificação **declarada** pelo operador (fallback quando não há artefato analisável) |

### Engine interativo (Fase 3)

| Comando | Sintaxe | Descrição |
|---|---|---|
| `session` | `session [--mock]` | Máquina de estados 0–4 (ver §8 Receita 2). `--mock` renderiza com stubs |

### Ideias e fixtures

| Comando | Sintaxe | Descrição |
|---|---|---|
| `ideas` | `ideas [-c ads\|non-ads] [--seed N]` | STATE 2: 10 ideias (ads: produto+colourway exato+hook; non-ads: cena+hook). Mesmo seed = mesmas ideias |
| `stub` | `stub <caminho.png>` | PNG cinza 96×64 — para testar gates de artefato |
| `stub-grid` | `stub-grid <caminho.png> [--cols 5] [--rows 3]` | Grid texturizado — para testar QC de painéis sem gastar API |

## 6. Referência de slots e gates por etapa

| Etapa (id) | Slots (✱ = obrigatório) | Gates |
|---|---|---|
| `character-sheet` | ✱`character_id` ✱`name` `alias` ✱`role` ✱`species` ✱`age_range` ✱`reference_source` · `reference_image` (nome do arquivo em `assets/`) | imagem de referência existe em `assets/` |
| `scale-sheet` | ✱`scale_subject` ✱`scale_height_cm` (numérico) `scale_length_cm` `scale_width_cm` `scale_depth_cm` `scale_additional` `views` | `dimensions_verified=true` |
| `reference-image` | ✱`subject` `scene` `framing` `aspect_ratio` | registro escolhido (`register`) |
| `depth-map` | — | `renders/reference-image.*` |
| `depth-board` | — | `renders/reference-image.*` + `renders/depth-map.*` |
| `storyboard-sheet` | ✱`subject` `subject_long` `colour` `title_word` `format_label` `aspect_ratio` `beat_1`…`beat_15` | `subject` definido |
| `clip` | ✱`subject` `duration` `aspect_ratio` | reference + board em `renders/` · etapa 1 renderizada |
| `clip-5x3` | ✱`subject` `duration` `aspect_ratio` | sheet renderizada + `renders/storyboard-sheet.*` |

Chaves de produção (fora dos slots): `title`, `register` (A · B · C).

## 7. Variáveis de ambiente

| Variável | Uso | Default |
|---|---|---|
| `IMAGE_API_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL` | Adaptador de imagem compatível com API (fallback automático para `OPENAI_API_KEY` + endpoint OpenAI) | — (sem API, cadeia cai no mock/manual) |
| `VIDEO_API_URL` / `VIDEO_API_KEY` / `VIDEO_MODEL` | Adaptador de vídeo (ex.: Seedance) | — |
| `ENGINE_MOCK=1` | Habilita o mock na cadeia sem `--mock` | off |
| `PORT` | Porta do Studio (`studio.py --port` sobrepõe) | 8080 |
| `VIDEO_MAX_CLIP` | Max clip do STATE 0 da sessão (s) — abaixo de 15 dispara divisão em beats nomeados | 15 |

Chaves **nunca** vão para o repo — só no ambiente.

## 8. Receitas passo a passo

### Receita 1 — Linha completa em modo híbrido (copy-paste assistido)

```bash
# produção + registro de estilo (B = commercial; A = feature; C = documentary)
python3 system/engine.py init minha-peca --register B --title "FORGED — Gold"
python3 system/engine.py set minha-peca subject="FORGED flagship phone, gold colourway, polished titanium"

# 1) character sheet — gate: referência em assets/
cp ~/Downloads/personagem.png productions/minha-peca/assets/
python3 system/engine.py set minha-peca reference_image=personagem.png \
    character_id=CHAR-001 name="Ana" role=protagonist species=human age_range="28–34" reference_source="uploaded photo"
python3 system/engine.py render minha-peca character-sheet   # cole o .txt na ferramenta
python3 system/engine.py attach minha-peca character-sheet ~/Downloads/sheet.png

# 2) escala (opcional) — gate: medidas confirmadas
python3 system/engine.py set minha-peca scale_subject="protagonista de pé" \
    scale_height_cm=170 dimensions_verified=true
python3 system/engine.py render minha-peca scale-sheet

# 3) reference image — estilo colado integral
python3 system/engine.py set minha-peca scene="blackout studio, stone pedestal" framing="product hero"
python3 system/engine.py render minha-peca reference-image
python3 system/engine.py attach minha-peca reference-image ~/Downloads/ref.png

# 4/5) depth map → depth board (gates exigem os artefatos em renders/)
python3 system/engine.py render minha-peca depth-map
python3 system/engine.py attach minha-peca depth-map ~/Downloads/depth.png
python3 system/engine.py render minha-peca depth-board
python3 system/engine.py attach minha-peca depth-board ~/Downloads/board.png

# 6) clip + QC
python3 system/engine.py render minha-peca clip
python3 system/engine.py attach minha-peca clip ~/Downloads/clip.mp4
python3 system/engine.py qc-all minha-peca
```

### Receita 2 — Sessão do engine (um comando, estados 0–4)

```bash
python3 system/engine.py session            # modo auto (API→mock→manual)
python3 system/engine.py session --mock     # com stubs (sem gastar API)
```

Transcrição típica:

```
■ STORYBOARD ANIMATION ENGINE — READY
Image model: … · Video model: … · Max clip: 15s · Sheet: 5×3, 15 panels, 15s
Pick 1 or 2. ↓                    ← STATE 1: responda 1 (ADS) ou 2 (NON-ADS)
Pick a number (1–10)… ↓           ← STATE 2: nº da ideia · MORE · ou descreva
[compila + imprime o prompt INTEGRAL + renderiza + CONTA painéis]
Reply "regenerate"…, "revise [what to change]"…, or "next"…. ↓
  · revise subject=…; beat_5=…; register=C   (ponto-e-vírgula separa slots)
  · next → STATE 4 (clip, abertura travada, QC de runtime) → ■ Done.
  · NEW → volta ao STATE 1 (STATE 0 não re-executa) · quit → sai
```

### Receita 3 — Caminho engine 5×3 direto (sem sessão)

```bash
python3 system/engine.py ideas -c ads --seed 42
python3 system/engine.py init spot-001 --register B
python3 system/engine.py set spot-001 subject="gold iPhone 17 Pro" \
    title_word=FORGED format_label="15 SEC — PRODUCT FILM" beat_1="…" beat_15="…"
python3 system/engine.py run spot-001 storyboard-sheet --mock   # ou sem flag p/ API
python3 system/engine.py qc-image spot-001 panels storyboard-sheet
python3 system/engine.py run spot-001 clip-5x3 --mock
python3 system/engine.py qc-video spot-001 clip-5x3
```

### Receita 4 — Com API real (fase B)

```bash
export IMAGE_API_URL="https://…/v1/images/generations" IMAGE_API_KEY="sk-…" IMAGE_MODEL="gpt-image-2"
export VIDEO_API_URL="https://…/videos"        VIDEO_API_KEY="sk-…" VIDEO_MODEL="seedance-2.0"
python3 system/engine.py run spot-001 storyboard-sheet   # usa API; falha → mock/manual anunciado
```

## 9. Studio — guia da interface web

Subir: `python3 system/studio.py [--port 8080]` (bind 0.0.0.0; preview ao vivo
em desenvolvimento). Tudo pela API relativa — o browser nunca aponta para
localhost.

| Área | O que fazer |
|---|---|
| **Topbar** | Pill `verify` (fidelidade da biblioteca — clique abre a tabela sha) · **ENGINE · SESSION** · **IDEIAS · STATE 2** · **+ Nova produção** |
| **Sidebar** | Cards de produção: progresso n/8, registro, QC ✓/✗, ◐ aguardando artefato |
| **Trilha de etapas** | Por etapa: dot de estado, badges (opcional/alternativa/via-adaptador), botões **compilar** · **run·auto/mock/manual** · **qc contextual** · **attach** (upload) · **prompt** |
| **Prompt modal** | Texto compilado + chips de provenance (fonte, sha, slots, registro) · seletor de **histórico** + **diff unificado** entre versões · copiar |
| **Galeria** | Renders + assets (imagem/vídeo com player), servidos pelo Studio |
| **Slots** | Tabela `production.json` + formulário `set` (chave/valor) |
| **+ Nova produção** | Slug, título, registro A/B/C (segmented) |
| **IDEIAS** | Categoria ADS/NON-ADS, seed editável, ↻ mais 10, **"virar produção →"** (init + subject em um clique) |
| **ENGINE · SESSION** | Console dos estados 0–4: seletor de modo (mock/auto), reset, quick-buttons por estado, prompts verbatim em collapsible, links para artefatos |

## 10. Referência da API HTTP

Base: `http://<host>:8080` · JSON em `/api/*` · estáticos em `/renders/{slug}/…`
e `/assets/{slug}/…` (Range support para vídeo).

| Método | Rota | Corpo/Query | Descrição |
|---|---|---|---|
| GET | `/` | — | `studio.html` |
| GET | `/api/overview` | — | Produções (progresso, registro, QC) + verify resumido |
| GET | `/api/verify` | — | `compute_verify()` completo: entries com `drift`/`sha` |
| GET | `/api/ideas` | `?category=ads\|non-ads&seed=N` | 10 ideias do STATE 2 |
| GET | `/api/session` | — | Snapshot da sessão (estado + linhas) |
| POST | `/api/session` | `{input}` | Envia resposta ao gate atual; devolve novo snapshot |
| POST | `/api/session/reset` | `{mode}` | Reinicia sessão (`mock`/`auto`) |
| GET | `/api/productions/{slug}` | — | Detalhe: etapas, renders, assets, prompts, pending |
| POST | `/api/productions` | `{slug,title,register}` | init |
| POST | `/api/productions/{slug}/set` | `{pairs:[k=v,…]}` | set |
| POST | `/api/productions/{slug}/render` | `{stage}` | compila (arquiva versão anterior p/ diff) |
| POST | `/api/productions/{slug}/run` | `{stage,mode:auto\|mock\|manual}` | compila+renderiza pela cadeia |
| POST | `/api/productions/{slug}/qc` | `{check,stage}` | check: `panels`/`grayscale`/`runtime`/`register`/`all` |
| POST | `/api/productions/{slug}/attach` | query `?stage=&name=` + corpo binário | registra artefato |
| GET | `/api/productions/{slug}/prompt/{stage}` | `?h=<arquivo-histórico>` | texto + meta + histórico (+diff se `h`) |

Respostas seguem `{ok, code, log, error?, changed?}` para ações.

## 11. Referência de funções Python (por módulo)

### `system/engine.py` (M0–M2 · CLI)
| Função | Assinatura | Descrição |
|---|---|---|
| `extract` | `(spec: dict, source_rel: str) -> str` | Extrai texto do protocolo conforme regra do registry (`whole_file`/`first_code_block`/`code_block_after`) |
| `style_blocks` | `(reg, register) -> (base, regblock)` | BASE + registro do módulo de estilo (verbatim) |
| `compute_verify` | `() -> {entries, problems}` | Fidelidade sha256 como dados (CLI e API) |
| `generate_ideas` | `(category, seed) -> list[str]` | STATE 2 determinístico |
| `_check_gates` | `(stage, prod, reg)` | Avalia gates (`file_exists`/`flag`/`artifact`/`stage_rendered`/`style_register`/`slot_set`); levanta `GateStop` |
| `_fill_protocol` | `(text, proto, slots) -> (text, filled, missing)` | Injeta slots preservando rótulos; valida numéricos |
| `_render_template` | `(stage, tpl_text, prod, reg)` | Substitui placeholders `[...]`/`{{...}}`; cola BASE+registro; preenche beats com timecodes |
| `_compile_stage` | `(slug, stage_id) -> dict` | Gates → prompt → grava `.txt`+`.meta.json` → registra estado (usado por render/run/sessão) |
| `_stage_inputs` | `(stage, prod, pdir) -> list[Path]` | Referências da etapa derivadas dos gates |
| `cmd_*` | `(args) -> int` | Handlers CLI (um por comando da §5) |

### `system/qc.py` (M3 · análise de saídas)
| Função | Descrição |
|---|---|
| `load_image(path) -> Img` | Carrega imagem como luminância + desvio por pixel (PNG nativo; JPEG/WEBP via Pillow opcional) |
| `count_panels(img) -> {cols, rows, panels, …}` | Detecção de grid por atividade de linhas/colunas (bandas + filtros de chrome; laudo incluído) |
| `check_grayscale(img, tol=8, min_ok=.995)` | Proporção de pixels com desvio de canal ≤ tol |
| `mp4_duration(path) -> float\|None` | Duração pelos boxes `moov/mvhd` (sem decodificar) |
| `fmt_runtime(sec) -> "m:ss"` | Formatação |
| `register_consistency(prod, dir, base, regblock, id)` | BASE+registro verbatim presentes/ausentes por etapa |

### `system/adapters.py` (M4 · cadeia de render)
| Item | Descrição |
|---|---|
| `ManualAdapter` | Grava `<artefato>.pending.md` (ferramenta, prompt, referências, comando attach); devolve aguardando |
| `MockAdapter` | Stub sintético conforme saída: mp4 15 s · grid 5×3/3×3 · PNG cinza |
| `OpenAICompatImage` / `OpenAICompatVideo` | POST JSON síncrono (env §7); lê `b64_json`/`url` |
| `build_chain(kind, force_mock, force_manual) -> list` | Monta cadeia por disponibilidade; manual sempre por último |

### `system/synth.py` (fixtures)
`png_solid` (cinza) · `png_grid(cols, rows)` (painéis texturizados + gutters)
· `mp4_stub(seconds)` (ftyp+moov/mvhd+mdat com duração declarada).

### `system/session.py` (Fase 3 · estados 0–4)
| Método | Descrição |
|---|---|
| `EngineSession(mode)` | Construtor roda STATE 0 (verify + cadeia + READY line) e cai no STATE 1 |
| `step(raw) -> snapshot` | Aplica a resposta do gate e avança de estado (1→2→3→4; NEW→1; halt) |
| `snapshot()` | `{state, category, slug, seed, mode, lines[]}` — `lines` tipadas: `sys/ask/opt/gate/prompt/artifact/info/err` |
| `reset()` | Zera e re-executa o STATE 0 |

### `system/studio.py` (M5 · HTTP)
`Handler` (rotas da §10, Range p/ vídeo, upload binário) · `cap(fn, **ns)`
(executa cmd_* capturando log) · `overview()`/`detail()` (dados da UI) ·
`get_session()`/`reset_session()` (singleton da sessão, `RLock`).

## 12. Estrutura de arquivos de uma produção

```
productions/<slug>/
├── production.json          estado: título, registro, slots, etapas (status,
│                            prompt, artifact, adapter, qc[])
├── assets/                  inputs do operador (ex.: referência do personagem)
├── prompts/
│   ├── 01-character-sheet.txt        prompt compilado (colável)
│   ├── 01-character-sheet.txt.meta.json   provenance: fonte, sha256, slots, registro, data
│   ├── …05-storyboard-sheet.txt …
│   └── history/            versões anteriores (re-runs) p/ diff
└── renders/                 artefatos (run/attach): reference-image.png,
                             depth-map.png, depth-board.png,
                             storyboard-sheet.png, clip.mp4, clip-5x3.mp4,
                             *.pending.md (instruções do modo manual)
```

## 13. Solução de problemas

| Sintoma | Causa | O que fazer |
|---|---|---|
| `■ GATE: …` vermelho | Regra do protocolo bloqueando (by design) | Leia a mensagem — ela diz o slot/flag/arquivo faltante e o comando `set`/`attach` que resolve |
| `verify` mostra `DRIFT` | Um `.md` de protocolo foi editado (até 1 caractere) | Edição acidental? `git checkout -- <arquivo>`. Intencional? `engine.py verify --fix` |
| `run` termina em "aguardando artefato manual" | Sem API no ambiente e sem mock — cadeia caiu no manual (comportamento correto, anunciado) | Siga o `.pending.md` e rode `attach`; ou `--mock` para testar; ou configure env §7 |
| `qc-image panels` dá valor estranho | Heurística de grid vs chrome muito ativo (o laudo imprime bandas detectadas) | Confira a geometria impressa; ajustes finos em `qc.py::_bands`; contagem declarada via `qc` |
| `ERRO: formato não-PNG e Pillow não instalada` | QC recebeu JPEG/WEBP sem Pillow | `pip install pillow` (opcional) ou exporte PNG |
| `moov/mvhd não encontrado` | MP4 sem metadata de duração | Reexporte o vídeo; ou registre runtime declarado: `qc <slug> runtime clip 0:15` |
| `off-geometry` no STATE 3 | Modelo devolveu ≠ 15 painéis | A sessão regenera sozinha (1 retry); persistindo, revise o prompt (`revise subject=…`) — geometria errada nunca é apresentada |
| Porta 8080 ocupada | Outro processo | `python3 system/studio.py --port 8081` |

## 14. Glossário

- **Lock block** — texto travado, colado palavra por palavra, nunca parafraseado.
- **Slot** — valor que varia por produção, injetado em placeholder exato.
- **Gate** — regra que interrompe o fluxo e pergunta em vez de inventar.
- **Registro (A/B/C)** — FEATURE FILM · PHOTOREALISTIC COMMERCIAL · DOCUMENTARY REALISM; um por produção, sempre com o BASE.
- **Chrome** — numeração, timecode, caption e header da sheet 5×3 (scaffolding — nunca vira conteúdo do clip).
- **Provenance** — prompt exato + metadados arquivados junto de cada render.
- **Artefato** — arquivo de saída de uma etapa em `renders/`.
- **Fallback chain** — ordem de adaptadores (API → mock → manual) com anúncio explícito de quem renderizou.
- **Off-geometry** — sheet fora da geometria exigida (≠15/9 painéis) → regenerate.
- **Modo híbrido** — compilação pelo sistema + geração manual (copy-paste) + `attach`.
- **STATE 0–4** — máquina de estados do engine v3 (environment → tipo → ideias → sheet → clip).

---

*Guia gerado em 2026-09-05 · branch `arena/01a06ee1-storyboards-e-assets-creations` ·
ver também [`docs/BLUEPRINT.md`](BLUEPRINT.md) (arquitetura) e [`system/README.md`](../system/README.md) (referência rápida).*
