# Storyboard Sheet 5×3 Engine — Protocol

> Claude Code Edition v3 · TopView Pipeline

## O que faz

Produz uma storyboard sheet de 15 painéis (5×3) e a animação correspondente de 15 segundos.

## Geometria fixa

| Propriedade | Valor |
|---|---|
| Grid | 5×3 (cinco colunas, três linhas) |
| Painéis | 15 (panel 1 → panel 15) |
| Runtime | 0:15 (um segundo por painel) |
| Framings | 15 distintos — nunca dois consecutivos iguais |
| Motion | Presente em todos os 15 painéis |
| Estilo/Luz/Grade | Idênticos nos 15 painéis |
| Chrome | Nº de painel + timecode + caption + header block |

## Slots (variáveis por produção)

| Slot | Uso |
|---|---|
| `[colour]` | Tom do card onde os painéis assentam |
| `[SUBJECT]` | Descrição concreta e completa do sujeito |
| `[aspect ratio]` | 16:9 por defeito |
| `[framing]` | Um framing por painel (wide, medium, CU, macro, etc.) |
| `[title word]` | Palavra do header (ex: FORGED, DOWNHILL, PREP) |
| `[format label]` | Etiqueta do canto superior direito |
| `STYLE / LIGHTING / COLOUR GRADE` | Escrito uma vez, colado integralmente no prompt de animação |
| `[duration]` | 15s, limitado pelo max clip do modelo de vídeo |
| `[slug]` | Nome da pasta de output |

## Máquina de estados

| State | Acção | Gate |
|---|---|---|
| 0 | Verificação de ambiente (TopView auth, modelos disponíveis) | ■ STORYBOARD ANIMATION ENGINE — READY |
| 1 | Ads ou Non-Ads? | User responde 1 ou 2 |
| 2 | 10 ideias na categoria escolhida | User escolhe nº, MORE, ou custom |
| 3 | Compila prompt, gera sheet, valida nº de painéis | regenerate / revise / next |
| 4 | Compila prompt animação, gera via Seedance | regenerate / NEW |

## Lock blocks (7)

Cada lock block é colado palavra por palavra — nunca reescrito nem parafraseado.

| # | Lock Block | Ficheiro |
|---|---|---|
| 01 | HOW YOU RESPOND | [`lock-blocks/01-how-you-respond.md`](lock-blocks/01-how-you-respond.md) |
| 02 | QUALITY BAR | [`lock-blocks/02-quality-bar.md`](lock-blocks/02-quality-bar.md) |
| 03 | REFERENCE FIDELITY | [`lock-blocks/03-reference-fidelity.md`](lock-blocks/03-reference-fidelity.md) |
| 04 | STORYBOARD SHEET FORMAT | [`lock-blocks/04-storyboard-sheet-format.md`](lock-blocks/04-storyboard-sheet-format.md) |
| 05 | SHEET PROMPT TEMPLATE | [`lock-blocks/05-sheet-prompt-template.md`](lock-blocks/05-sheet-prompt-template.md) |
| 06 | UNIVERSAL ANIMATION PROMPT | [`lock-blocks/06-universal-animation-prompt.md`](lock-blocks/06-universal-animation-prompt.md) |
| 07 | ALWAYS / NEVER | [`lock-blocks/07-always-never.md`](lock-blocks/07-always-never.md) |

## Reference sheets (8)

As 8 sheets de referência visuais — o target que o engine tenta reproduzir.

| Sheet | Categoria | Sujeito | Ficheiro |
|---|---|---|---|
| 01 | ADS | FORGED — phone, white colourway | [`sheets/sheet-01-ads-forged-white.png`](sheets/sheet-01-ads-forged-white.png) |
| 02 | ADS | FORGED — phone, pink colourway | [`sheets/sheet-02-ads-forged-pink.png`](sheets/sheet-02-ads-forged-pink.png) |
| 03 | ADS | FORGED — phone, gold colourway | [`sheets/sheet-03-ads-forged-gold.png`](sheets/sheet-03-ads-forged-gold.png) |
| 04 | ADS | FORGED — phone, red colourway | [`sheets/sheet-04-ads-forged-red.png`](sheets/sheet-04-ads-forged-red.png) |
| 05 | NON-ADS | LOW-HANGING FRUIT — creature & grape tree | [`sheets/sheet-05-non-ads-low-hanging-fruit.png`](sheets/sheet-05-non-ads-low-hanging-fruit.png) |
| 06 | NON-ADS | PREP — chef & kitchen sequence | [`sheets/sheet-06-non-ads-prep-kitchen.png`](sheets/sheet-06-non-ads-prep-kitchen.png) |
| 07 | NON-ADS | DOWNHILL — snowboard run, 1977 register | [`sheets/sheet-07-non-ads-downhill-snowboard.png`](sheets/sheet-07-non-ads-downhill-snowboard.png) |
| 08 | NON-ADS | DOWNHILL — second pass | [`sheets/sheet-08-non-ads-downhill-second-pass.png`](sheets/sheet-08-non-ads-downhill-second-pass.png) |

### Registos visuais
- **Sheets 01–04 (ADS):** Fotorrealistas — usar Style Register B (Commercial)
- **Sheets 05–08 (NON-ADS):** Ilustrados — usar estilo hand-painted/anime conforme a sheet

## Model Fallback Chains

| Função | Cadeia |
|---|---|
| Imagem | GPT Image 2 → Nano Banana 2 → Seedream 5 |
| Vídeo | Seedance (Standard/2.0) → Veo 3.1 |

## File Layout (output)

```
./output/[slug]/
  storyboard_sheet.png      ← a sheet gerada (15 painéis, 5×3)
  animation.mp4             ← a animação gerada (0:15)
  storyboard_prompt.txt     ← o prompt exacto usado para a sheet
  animation_prompt.txt      ← o prompt exacto usado para a animação
```

## Origem

Desmontado a partir do pacote original `PROMPT STORYBOARD.md` (Claude Code Edition v3, ~3.3 MB com imagens base64 embutidas). A versão text-only do documento original está preservada em [`PROMPT STORYBOARD (text-only).md`](<PROMPT STORYBOARD (text-only).md>).
