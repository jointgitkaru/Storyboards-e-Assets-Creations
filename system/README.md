# System — biblioteca, compilador, orquestrador, QC, adaptadores e Studio

Implementação das camadas do [`docs/BLUEPRINT.md`](../docs/BLUEPRINT.md):

| Camada | Arquivo | O que faz |
|---|---|---|
| M0 | `engine.py` + `registry.json` | protocolos como dados; `verify` de fidelidade (sha256) |
| M1 | `engine.py` | compilador: slots + lock blocks → prompt final + provenance |
| M2 | `engine.py` | orquestrador: produções, etapas, gates, artefatos encadeados |
| M3 | `qc.py` | QC automático: contagem de painéis, grayscale, runtime mp4, consistência de registro |
| M4 | `adapters.py` + `synth.py` | cadeia de render com fallback (manual / mock / API) + fixtures sintéticos |
| M5 | `studio.py` + `studio.html` | painel web sobre M0–M4 (produções, trilha, galeria, prompts com diff, QC) |

Núcleo em stdlib (Python 3.9+). `qc.py` lê PNG nativamente (JPEG/WEBP se
Pillow instalada — opcional).

```
python3 system/engine.py <comando>   # CLI
python3 system/studio.py [--port N]  # Studio (padrão 8080, bind 0.0.0.0)
```

## Studio (M5)

Painel web que cobre a linha de produção inteira sem precisar dos READMEs
(critério de aceite da fase 4):

- **Produções** — lista com progresso (n/8), registro, estado de QC e ◐ aguardando artefato
- **Trilha de etapas** — cada etapa com compilar · run (auto/mock/manual) · QC contextual · attach
- **Galeria** — renders e assets (imagem/vídeo) servidos pelo próprio Studio
- **Prompts com provenance** — meta (fonte, sha, slots, registro) + histórico arquivado a cada re-run e **diff unificado** entre versões
- **STATE 2** — gerador de ideias com seed reproduzível e "virar produção" em um clique
- **Verify** — fidelidade da biblioteca (M0) como tabela no navegador
- **Gates na UI** — as mesmas regras do CLI (medida sem confirmação, clip sem sheet etc.) bloqueiam e explicam
- **ENGINE · SESSION (Fase 3)** — console conversacional com a máquina de estados 0–4 do engine v3:
  STATE 0 exibe a linha READY (modelos da cadeia + max clip), um estado por vez,
  prompt impresso integral (QUALITY BAR), QC de painéis antes de apresentar a sheet
  (off-geometry → regenerate), `next` anima, `NEW` volta ao STATE 1 sem re-executar
  o STATE 0. Modo mock (stubs) ou auto (API→mock→manual), reset a qualquer momento.
  Endpoints: `GET /api/session` · `POST /api/session {input}` · `POST /api/session/reset {mode}`

API (todas relativas — o browser nunca aponta para localhost):
`GET /api/overview` · `GET /api/verify` · `GET /api/ideas?category&seed` ·
`GET/POST /api/productions[/slug]` · `POST .../set|render|run|qc|attach` ·
`GET .../prompt/{stage}[?h=histórico]` · estáticos em `/renders/{slug}/…` e
`/assets/{slug}/…`.

## Comandos

### Biblioteca e produção (M0–M2)

| Comando | O que faz |
|---|---|
| `verify [--fix]` | confere sha256 de cada lock block/template contra as fontes `.md`; `--fix` grava hashes **após edição intencional** |
| `protocols` | lista protocolos, módulo de estilo e templates |
| `init <slug> [--title T] [--register A\|B\|C]` | cria `productions/<slug>/` |
| `set <slug> chave=valor…` | define slots (`subject=…`), `title=…`, `register=A\|B\|C` |
| `render <slug> <etapa>` | compila o prompt da etapa (grava `.txt` + `.meta.json`) |
| `status <slug>` | mapa de etapas (● renderizado · ◐ aguardando artefato · ○ pendente), renders e assets |
| `ideas [-c ads\|non-ads] [--seed N]` | STATE 2 do engine: 10 ideias reproduzíveis por seed |
| `session [--mock]` | **Fase 3 — engine interativo STATE 0–4**: environment check → tipo → 10 ideias → sheet 5×3 (com QC de painéis e regenerate automático) → clip; gates exatos do engine v3 (`Pick 1 or 2. ↓`, `regenerate/revise/next`, `NEW`) |

### Render com fallback (M4)

| Comando | O que faz |
|---|---|
| `run <slug> <etapa> [--mock\|--manual]` | compila e envia pela cadeia (registry → `model_chains`); anuncia o adaptador que renderizou — **nunca substituição silenciosa** |
| `attach <slug> <etapa> <arquivo>` | registra um arquivo gerado à mão como artefato da etapa (fecha o ciclo do modo híbrido) |

Cadeia padrão: `openai-image → mock → manual` (imagem) e
`openai-video → mock → manual` (vídeo). O adaptador **manual** grava
`renders/<etapa>.pending.md` com ferramenta sugerida, prompt, referências e
comando de registro — e a etapa fica `◐ awaiting_artifact` até o `attach`.

Variáveis de ambiente (fase B, experimental):

| Env | Uso |
|---|---|
| `IMAGE_API_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL` | endpoint compatível com API de imagens (fallback automático para `OPENAI_API_KEY` + endpoint OpenAI) |
| `VIDEO_API_URL` / `VIDEO_API_KEY` / `VIDEO_MODEL` | endpoint de vídeo (ex.: Seedance) |
| `ENGINE_MOCK=1` | habilita o mock sem flag |

### QC automático (M3)

| Comando | O que faz |
|---|---|
| `qc-image <slug> panels <etapa> [esperado]` | **conta painéis de verdade**: detecta colunas×linhas por atividade de gutters (5×3=15 na sheet, 3×3=9 no board); off-geometry → falha + "regenerate" |
| `qc-image <slug> grayscale <etapa>` | depth map realmente grayscale (≥99,5% dos pixels com desvio ≤8) |
| `qc-video <slug> <etapa>` | runtime do mp4 lido dos boxes (moov/mvhd), tolerância 1s para 0:15 |
| `qc-register <slug>` | BASE + registro colados palavra por palavra nas etapas de estilo e **ausentes** nas travadas (depth/sheets) |
| `qc-all <slug>` | roda tudo que se aplica + resumo |
| `qc <slug> <check> <etapa> <valor>` | registra verificação **declarada** (fallback quando não há artefato analisável) |

### Fixtures

| Comando | O que faz |
|---|---|
| `stub <caminho.png>` | PNG cinza — testa gates de artefato |
| `stub-grid <caminho.png> [--cols 5] [--rows 3]` | grid texturizado — testa QC de painéis sem gastar modelo |

## Fluxo típico

```bash
# ideia → produção
python3 system/engine.py ideas -c ads --seed 42
python3 system/engine.py init minha-peca --register B --title "FORGED — Gold"
python3 system/engine.py set minha-peca subject="…" title_word=FORGED format_label="15 SEC — PRODUCT FILM"

# caminho engine 5×3 (modo API quando configurada, manual caso contrário)
python3 system/engine.py run minha-peca storyboard-sheet
python3 system/engine.py qc-image minha-peca panels storyboard-sheet   # 5×3=15
python3 system/engine.py run minha-peca clip-5x3
python3 system/engine.py qc-video minha-peca clip-5x3                  # ~0:15

# modo manual (híbrido): run → .pending.md → cole na ferramenta → attach
python3 system/engine.py run minha-peca reference-image
python3 system/engine.py attach minha-peca reference-image ~/Downloads/render.png

# tudo de uma vez
python3 system/engine.py qc-all minha-peca
```

## Etapas registradas (linha completa)

| Etapa | id | Fonte | Gates |
|---|---|---|---|
| 1 | `character-sheet` | protocolo v2.0 palavra por palavra | imagem de referência em `assets/` |
| 2 *(opcional)* | `scale-sheet` | invocação da escala Coca-Cola v1 | `dimensions_verified=true` + medidas numéricas |
| 3 | `reference-image` | template da casa + **BASE + registro** | registro de estilo escolhido |
| 4 | `depth-map` | prompt verbatim | reference image em `renders/` |
| 5 | `depth-board` | prompt 8 fases verbatim | reference + depth map em `renders/` |
| 5 *(alt.)* | `storyboard-sheet` | template engine 5×3 (15 painéis, 0:15) | `subject` definido; estilo auto-colado |
| 6 | `clip` | template caminho depth (regra de ouro) | look + câmera + identidade presentes |
| 6 *(alt.)* | `clip-5x3` | template com abertura travada do engine v3 | sheet 5×3 renderizada e em `renders/` |

## Garantias mecânicas

- **Lock block invariável**: texto fora de slots sai byte-a-byte igual à fonte;
  `verify` detecta qualquer edição acidental nos `.md`.
- **Slot obrigatório vazio = gate** (para e pergunta); opcional vazio mantém a
  orientação original; rótulos de campo preservados (`Verified height: 170 cm`).
- **Um registro por produção**, colado palavra por palavra (qc-register confere
  entre etapas; estilo proibido em depth board/sheets de produção).
- **Provenance**: cada prompt grava `.meta.json`; re-render é byte-a-byte idêntico.
- **Fallback anunciado**: `run` registra em `production.json` qual adaptador
  renderizou cada artefato (`stages.<id>.adapter`).

## Limitações conhecidas

- Contagem de painéis é heurística (atividade de linhas/colunas): chrome muito
  ativo pode gerar banda extra — o laudo imprime a geometria detectada para
  conferência; ajustes finos → `qc.py::_bands`.
- Adaptadores `openai-*` são experimentais (chamada síncrona única; APIs de
  vídeo reais costumam ser assíncronas — job polling entra na fase B de fato).
- MP4 do mock declara duração no `mvhd` mas não é reproduzível — é fixture de QC.

## Demo

`productions/demo-forged-gold/` — linha completa com os dois caminhos
(depth 3×3 e engine 5×3), gates exercitados, QC automático verde
(`engine.py qc-all demo-forged-gold`). Renders são fixtures sintéticos
(`stub`/`stub-grid`/mock) — substitua pelos renders reais.
