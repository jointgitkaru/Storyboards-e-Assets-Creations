# Depth board 3×3 — workflow

| Arquivo | Papel |
|---|---|
| `depth-map-prompt.md` | converte a reference image em depth map grayscale |
| `storyboard-prompt.md` | prompt do board 3×3 em 8 fases (recebe referência + depth map) |
| `workflow.md` | registro original (thread OAK) com exemplos e contexto |

## Etapas

1. **Reference image** — a imagem que define o look do filme. Gere com
   `BASE` + um `REGISTER` de `../../styles/cinematic-photorealistic.md` se
   quiser fotorrealismo cinematográfico. (Midjourney, GPT Image 2 ou
   Nano Banana.)
2. **Depth map** — cole `depth-map-prompt.md` junto da referência (Nano
   Banana ou GPT Image 2). Saída: grayscale, **branco = perto, preto =
   longe**, sem cor, textura, luz ou AO.
3. **Board 3×3** — envie referência + depth map com `storyboard-prompt.md`
   (prompt em 8 fases). Saída: 9 painéis só de profundidade, sequência
   1–9: establishing → movimento → descoberta → reação → preparação →
   insert → ação → consequência → resolução.
4. **Character sheets** — travar aparência (rosto, roupa, proporções) com
   o protocolo de `../character-reference-sheet/` — ajuda a preservar
   identidade em todos os shots.
5. **Clips (Seedance 2.0)** — referência = look, board = composição/câmera,
   character sheets = identidade. Cole o MESMO STYLE REGISTER da etapa 1
   inteiro no prompt de animação.

**Nota:** o board é grayscale por design — o estilo cinematográfico se aplica
à reference image e ao clip, nunca ao board.
