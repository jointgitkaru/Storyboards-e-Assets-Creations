# BLUEPRINT — De protocolos de prompt a sistema de produção

**Data:** 2026-09-05 · **Status:** v1.0 (aprovado para desenvolvimento) ·
**Escopo de prioridade:** linha completa de produção (etapas 1–5) ·
**Estratégia de integração:** híbrida (compilador primeiro, adaptadores depois)

Este documento define como transformar o que hoje são protocolos em markdown —
lock blocks, slots, gates — em um **sistema executável de produção de
conteúdo**: biblioteca de protocolos versionada, compilador de prompts com
verificação de fidelidade, orquestrador de produções com artefatos encadeados,
QC automático e, por fim, adaptadores de modelo e interface.

---

## 1. Diagnóstico — o que o repositório já é

O repositório **já especifica uma linha de produção completa**; o que falta é
execução. Os conceitos de engenharia estão todos presentes, em forma de texto:

| Conceito já existente | Onde está | Estado atual |
|---|---|---|
| **Lock blocks** (texto invariável, colado palavra por palavra) | engine 5×3 (7 blocks), IDENTITY LOCK, STYLE REGISTER, prompt de escala | Convenção documentada; nada impede edição acidental ou parafraseia |
| **Slots** (variáveis por produção) | `[SUBJECT]`, `[colour]`, `[title word]`, METADATA da character sheet… | Preenchimento manual, sem validação |
| **Gates** (parar e perguntar, nunca inventar) | gate de medidas da escala, "sem referência não gera" da character sheet, gate de 15s do clip | Regras escritas para um humano (ou agente) obedecer |
| **Fallback chains** de modelo | GPT Image 2 → Nano Banana 2 → Seedream 5 · Seedance → Veo 3.1 | Tabela no engine; escolha manual |
| **QC** | contar 15 painéis em 5×3 antes de apresentar; depth map grayscale; runtime 0:15 | Inspeção a olho |
| **Provenance** | gravar `storyboard_prompt.txt` + `animation_prompt.txt` junto dos renders | Hábito do engine agêntico; sem estrutura de produção |
| **Módulo de estilo** | `styles/cinematic-photorealistic.md` — BASE + 1 registro, colado integral em reference image e clip | Copy-paste manual entre arquivos |

**A lacuna central:** os protocolos são *dados sem máquina*. Nada valida se um
lock block foi colado integral, se um slot ficou vazio, se as medidas foram
confirmadas, se os 15 painéis saíram, ou quais artefatos pertencem a qual
produção.

---

## 2. Princípios de design (herdados, não inventados)

O sistema deve obedecer às regras que os próprios protocolos estabelecem:

1. **Lock block é invariável por definição.** O compilador nunca parafraseia,
   resume ou renumera texto travado — ele injeta slots e nada mais. Qualquer
   divergência entre template e fonte é erro, não warning.
2. **Slot é o único grau de liberdade.** Tudo que varia por produção é slot;
   tudo que não é slot é lock.
3. **Gate para, nunca adivinha.** Medida não confirmada → pergunta. Referência
   ausente → não gera. Clip acima do máximo do modelo → anuncia e divide em
   pontos nomeados, nunca encurta em silêncio.
4. **Um registro de estilo por produção**, colado palavra por palavra em todas
   as etapas que o aceitam (reference image + clip; nunca depth board, nunca
   sheets de produção).
5. **Provenance obrigatória.** Todo render guarda o prompt exato que o gerou
   (`*.txt` + metadados), para reproduzir ou reenviar a outra ferramenta.
6. **Fidelidade à fonte.** Os `.md` originais continuam sendo a verdade dos
   protocolos; o sistema os lê e verifica checksum — não os reescreve.

---

## 3. Arquitetura alvo

```
┌───────────────────────────────────────────────────────────────────┐
│  M5 · STUDIO          CLI evoluída → painel web: produções,       │
│                       galeria de assets, re-runs, diffs de prompt │
├───────────────────────────────────────────────────────────────────┤
│  M4 · ADAPTADORES     GPT Image 2 · Nano Banana · Seedream ·      │
│                       Seedance · Veo — com fallback chain e       │
│                       registro de "qual par renderizou"           │
├───────────────────────────────────────────────────────────────────┤
│  M3 · QC              contar painéis (5×3=15 / 3×3=9), grayscale  │
│                       do depth map, runtime, gates de saída       │
├───────────────────────────────────────────────────────────────────┤
│  M2 · ORQUESTRADOR    produção = entidade; etapas 1→5 com estado, │
│                       artefatos encadeados, gates e histórico     │
├───────────────────────────────────────────────────────────────────┤
│  M1 · COMPILADOR      slots + locks → prompt final renderizado,   │
│                       verificação de fidelidade (sha256), meta    │
├───────────────────────────────────────────────────────────────────┤
│  M0 · BIBLIOTECA      protocolos como dados versionados:          │
│                       registry + extração dos .md originais       │
└───────────────────────────────────────────────────────────────────┘
```

Cada camada só conversa com a de baixo. O compilador (M1) funciona sem
adaptadores (modo copy-paste); os adaptadores (M4) entram sem mudar M0–M2.

---

## 4. Modelo de dados

### 4.1 Entidades

| Entidade | Definição | Exemplo |
|---|---|---|
| **Protocol** | Um `.md` original + regra de extração + hash de fidelidade | `character-reference-sheet v2.0` |
| **LockBlock** | Segmento travado extraído do protocolo (verificado por sha256) | bloco `IDENTITY LOCK`, `BASE` do estilo |
| **Slot** | Variável de produção: id, placeholder exato na fonte, required/optional, validação | `scale_height_cm` → `[xx] cm` |
| **Gate** | Regra que bloqueia render: campo obrigatório, arquivo presente, flag de verificação, valor numérico | medidas confirmadas antes da escala |
| **StyleRegister** | BASE + um registro (A/B/C) de um módulo de estilo | `PHOTOREALISTIC COMMERCIAL` |
| **Production** | Um filme/peça: slug, sujeito, registro de estilo, slots, etapas, artefatos | `productions/forged-gold/` |
| **StageRun** | Execução de uma etapa: status, prompt gerado, hash, timestamp | `03-reference-image · rendered` |
| **Artifact** | Arquivo de produção com papel declarado (reference, depth-map, board, sheet, clip) | `renders/depth-map.png` |

### 4.2 Layout de diretórios (produção)

```
productions/<slug>/
├── production.json        ← estado da produção: slots, estilo, etapas, gates
├── assets/                ← inputs do operador (ex.: referência do personagem)
├── prompts/               ← prompts compilados (01-character-sheet.txt …)
│   └── *.meta.json        ← provenance: template, hash, slots usados, data
└── renders/               ← artefatos gerados (colados aqui no modo híbrido)
    ├── reference-image.png
    ├── depth-map.png
    ├── depth-board.png
    ├── storyboard-sheet.png
    └── animation.mp4
```

No modo híbrido (fase A), `renders/` é alimentado à mão — o operador cola o
prompt compilado na ferramenta e traz o arquivo de volta. Com adaptadores
(fase B), o próprio sistema escreve ali.

---

## 5. Pipeline da linha completa

| # | Etapa | Protocolo/Template | Entradas | Gate | Saída | Ferramenta (fase A) |
|---|---|---|---|---|---|---|
| 1 | Character sheet | `character-reference-sheet` v2.0 (palavra por palavra) | imagem de referência do personagem | sem referência → **não gera** | `01-character-sheet.txt` + sheet em `renders/` | GPT Image 2 / Nano Banana |
| 2 | Escala 2×2 *(opcional)* | escala Coca-Cola v1 (invocação) | medidas **confirmadas** do sujeito | medida não verificada → **para e pergunta** | `02-scale-sheet.txt` | GPT Image 2 / Nano Banana |
| 3 | Reference image | template da casa + **BASE + registro** do módulo de estilo | sujeito + cena | registro de estilo escolhido (1 por produção) | `03-reference-image.txt` + `renders/reference-image.png` | Midjourney / GPT Image 2 / Nano Banana |
| 4a | Depth map | `depth-map-prompt` (verbatim) | reference image | reference image presente | `04a-depth-map.txt` + `renders/depth-map.png` | Nano Banana / GPT Image 2 |
| 4b | Depth board 3×3 | `storyboard-prompt` 8 fases (verbatim) | reference + depth map | os dois arquivos presentes | `04b-depth-board.txt` + `renders/depth-board.png` | Nano Banana / GPT Image 2 |
| 4* | *ou* Sheet 5×3 | template do engine 5×3 (15 painéis, chrome, 0:15) | sujeito + 15 beats | sujeito definido; estilo auto-colado do registro | `04-storyboard-sheet.txt` + `renders/storyboard-sheet.png` | GPT Image 2 (TopView) |
| 5 | Clip | template clip (depth path) **ou** engine 5×3 com abertura travada | look + câmera + identidade (+ registro colado integral) | artefatos das etapas 1, 3, 4 presentes | `05-clip.txt` + `renders/animation.mp4` | Seedance 2.0 (→ Veo 3.1) |

Regra de ouro codificada no orquestrador: **reference = look · board = câmera ·
sheets = identidade** — e o MESMO STYLE REGISTER da etapa 3 é colado palavra
por palavra no clip (o compilador faz isso mecanicamente).

---

## 6. Módulos

### M0 — Biblioteca de protocolos
- **Responsabilidade:** tornar cada protocolo legível por máquina **sem
  editar os originais**: um `registry.json` declara fonte, regra de extração
  (`whole_file`, `first_code_block`, `code_block_after <heading>`), slots
  (placeholder exato + required), gates e hash sha256 do texto extraído.
- **Contrato:** `engine.py verify` re-extrai tudo e compara hashes → detecta
  qualquer edição não intencional nos protocolos. `verify --fix` regrava
  hashes após uma edição *intencional*.
- **Aceite:** edição de um único caractere num lock block quebra o `verify`.

### M1 — Compilador de prompts
- **Responsabilidade:** dado `production.json`, renderizar o prompt final de
  uma etapa: injeta slots nos placeholders exatos, cola BASE + registro de
  estilo nos pontos definidos, grava `prompts/NN-*.txt` + `.meta.json`
  (provenance) e imprime relatório (slots preenchidos, gates, ferramenta
  sugerida).
- **Regras embutidas:** nunca parafraseia; slot opcional vazio mantém o texto
  de orientação da fonte (com aviso); slot obrigatório vazio = gate.
- **Aceite:** re-render da mesma produção produz byte-a-byte o mesmo prompt
  (reprodutibilidade); o texto fora de slots é idêntico à fonte.

### M2 — Orquestrador
- **Responsabilidade:** ciclo de vida da produção: `init`, `set`, `render
  <etapa>`, `status`; encadeia artefatos (a etapa 4b só compila com reference
  + depth map em `renders/`); registra histórico de StageRuns.
- **Evolução futura:** concorrência de versões (branch de produção), múltiplos
  personagens por produção, sheets 01–08 do pack como referência de registro.
- **Aceite:** uma produção nova sai de `init` até `05-clip.txt` com todos os
  gates exercitados (incluindo pelo menos um gate bloqueando corretamente).

### M3 — QC automático
- **Responsabilidade:** validar **saídas** contra as regras dos protocolos:
  contar painéis da sheet (15 em 5×3; 9 em 3×3) antes de aceitar; depth map
  realmente grayscale; runtime do clip vs. máximo do modelo (regra de split
  nomeado, nunca encurtar em silêncio); registro de estilo igual entre
  `03-reference-image.txt` e `05-clip.txt`.
- **Implementação (entregue, fase 1):** `system/qc.py` — detecção de grid por
  atividade de linhas/colunas (gutters uniformes), grayscale por desvio máximo
  de canal, runtime por parse dos boxes mp4 (moov/mvhd), consistência de
  registro por comparação verbatim entre prompts. Tudo stdlib; Pillow opcional
  para formatos não-PNG. `qc` declarativo permanece como fallback.
- **Aceite:** sheet com 9 painéis é rejeitada com mensagem "off-geometry —
  regenerate", espelhando o STATE 3 do engine.

### M4 — Adaptadores de modelo (fase B)
- **Responsabilidade:** enviar o prompt compilado ao modelo certo e trazer o
  artefato para `renders/`, seguindo as fallback chains do engine:
  imagem: GPT Image 2 → Nano Banana 2 → Seedream 5 · vídeo: Seedance → Veo 3.1.
  Cada render registra qual par produziu o arquivo (o engine exige anunciar
  fallback — nunca substituição silenciosa).
- **Formas:** chamada direta de API (chaves via ambiente, nunca no repo) ou
  skill agêntica (TopView) — o compilador não muda em nenhum dos casos.
- **Aceite:** pipeline ponta a ponta sem copy-paste; fallback anunciado em log.

### M5 — Studio (fase C) — ✅ entregue
- **Responsabilidade:** UI sobre M0–M4: criar produções, ver linha de
  produção como trilha de etapas, galeria de assets, diff entre versões de
  prompt, re-run de etapa, e o "STATE 2" de ideias (10 ideias por categoria).
- **Implementação (fase 4):** `system/studio.py` (HTTP stdlib, JSON API que
  encapsula os cmd_* do engine com captura de log) + `system/studio.html`
  (SPA vanilla, dark). Histórico de prompt arquivado a cada re-run em
  `prompts/history/` com diff unificado; attach por upload binário; estáticos
  de renders/assets com suporte a Range para vídeo.
- **Aceite:** um operador novo completa uma produção sem ler os READMEs —
  trilha de etapas, gates e QC visíveis e operáveis na UI.

---

## 7. Integração híbrida com os modelos

| Fase | Como renders acontecem | O que o sistema garante |
|---|---|---|
| **A — Compilador + copy-paste** (MVP, ativo) | Operador cola o `.txt` compilado na ferramenta (Midjourney, Nano Banana, Seedance…) e traz o arquivo para `renders/` | Prompt fiel, gates respeitados, provenance gravada, encadeamento correto |
| **B — Adaptadores** | Sistema chama API/skill com o mesmo `.txt` | Idem + fallback chain automática, sem copy-paste |

A fase A já elimina os erros dominantes do fluxo manual (paráfrase de lock
block, slot esquecido, medida inventada, estilo inconsistente entre etapas).
A fase B é pura substituição do transporte — nenhum protocolo muda.

---

## 8. Roadmap

| Fase | Entregas | Critério de saída |
|---|---|---|
| **0 — Fundação** ✅ | `docs/BLUEPRINT.md`; `system/` com M0 (registry + verify) e M1+M2 (compilador + orquestrador CLI); produção de demonstração ponta a ponta | `verify` verde; demo renderiza etapas 1→5 com gates exercitados |
| **1 — QC** ✅ | M3 entregue (`system/qc.py`, stdlib): contagem automática de painéis (gutters→colunas×linhas), grayscale por desvio de canal, runtime por parse de boxes (moov/mvhd), consistência de registro entre etapas; `qc-image`/`qc-video`/`qc-register`/`qc-all` | sheet off-geometry rejeitada automaticamente — testado: grid 3×3 no lugar da 5×3 falha com "regenerate" |
| **2 — Adaptadores** ✅ *scaffold* | M4 (`system/adapters.py` + `synth.py`): cadeia `openai-image/video → mock → manual` com anúncio de fallback e adaptador gravado por artefato; `run`/`attach`; fixtures sintéticos (grid/png/mp4) | E2E validado via mock (imagem + vídeo + fluxo manual com `.pending.md`); produção sem copy-paste quando as env vars de API estiverem ativas (HTTP experimental) |
| **3 — Engine agêntico 5×3** ✅ | Máquina de estados 0–4 entregue (`system/session.py`): STATE 0 environment check com linha READY exata (modelos da cadeia M4 + max clip) e parada se a biblioteca tiver drift; STATE 1 tipo com gate `Pick 1 or 2. ↓`; STATE 2 dez ideias (seed reproduzível, MORE); STATE 3 sheet 5×3 — compila, imprime o prompt integral, renderiza pela cadeia, **conta os painéis** (off-geometry → regenerate automático, nunca apresenta como pronto), gates `regenerate / revise [slots] / next`; STATE 4 clip com abertura travada + QC de runtime, gates `regenerate / NEW` (NEW → STATE 1, STATE 0 não re-executa). CLI: `engine.py session [--mock]` · Studio: console **ENGINE · SESSION** | um comando (`engine.py session`) atravessa os estados 0→4 gerando sheet 15 painéis + clip 0:15 — validado em CLI e via API do Studio |
| **4 — Studio** ✅ | M5 entregue (`system/studio.py` + `studio.html`, stdlib): painel web com produções, trilha de etapas, galeria, prompts com histórico e diff, STATE 2, verify e QC — tudo sobre a API relativa `/api/*` | operador novo completa produção sem ler docs — trilha, gates e QC visíveis na UI |

## 9. O que existe nesta branch (MVP + fases 1–2 + 4, STATE 2)

```
system/
├── README.md            uso do CLI (comandos, env vars, garantias)
├── engine.py            M0+M1+M2 — CLI stdlib: verify·protocols·init·set·
│                        render·run·attach·status·qc*·ideas·stub*
├── registry.json        protocolos como dados + hashes + model_chains
├── qc.py                M3 — análise de imagem (PNG nativo), boxes mp4,
│                        consistência de registro (import lazy)
├── adapters.py          M4 — cadeia manual/mock/openai-compat com fallback
│                        anunciado (import lazy)
├── synth.py             fixtures determinísticos: PNG sólido, grid cols×rows,
│                        mp4 com duração declarada
├── session.py           Fase 3 — máquina de estados 0–4 do engine v3
│                        (CLI session + endpoints do Studio)
├── studio.py            M5 — servidor HTTP (JSON API + estáticos), stdlib
├── studio.html          M5 — SPA vanilla (produções, trilha, galeria, diff)
└── templates/           templates compostos pela casa (não travados):
    ├── reference-image.md         etapa 3 (sujeito + BASE + registro)
    ├── storyboard-sheet-5x3.md    etapa 4* (extraído do engine v3)
    ├── clip-depth.md              etapa 5, caminho depth (regra de ouro)
    └── clip-engine-5x3.md         etapa 5, caminho engine (abertura travada)
productions/demo-forged-gold/      demo da linha completa (fixtures sintéticos,
                                   qc-all verde, dois caminhos da etapa 4)
```

Comandos: ver [`system/README.md`](../system/README.md).

---

## 10. Riscos e decisões em aberto

1. **Templates da casa vs. originais** — reference image e clip (depth path)
   não têm prompt travado no repo; o MVP usa templates claramente marcados
   como *house-composed*. Decisão em aberto: promovê-los a protocolo v1.0
   travado depois de validados em produção real.
2. **Template 5×3 extraído do PDF** — o texto do engine vem do doc embutido
   (com artefatos de escape); foi limpo manualmente. Decisão: manter o doc
   como fonte visual e o template limpo como fonte operacional, com hash
   próprio no registry.
3. **QC automático de painéis** exige visão computacional (dependência nova —
   OpenCV ou API). Alternativa interim: contagem declarada (já no MVP).
4. **Chaves de API** ficam fora do repo (ambiente); política de custos por
   produção entra com M4.
5. **Multi-personagem / multi-cena** por produção: modelo de dados já comporta
   (artefatos por papel), UI e gates ainda não — decidir na fase 3.

## 11. Glossário

- **Lock block** — texto travado, colado palavra por palavra, nunca parafraseado.
- **Slot** — valor que varia por produção, injetado em um placeholder exato.
- **Gate** — regra que interrompe o fluxo e pergunta em vez de inventar.
- **Register** — um dos registros de estilo (A/B/C); um só por produção.
- **Chrome** — numeração, timecode, caption e header da sheet 5×3.
- **Provenance** — prompt exato + metadados gravados junto de cada render.
