# Character reference sheet (v2.0)

| Arquivo | Papel |
|---|---|
| `character-reference-sheet-prompt.md` | prompt original v2.0 — **usar palavra por palavra** (lock block) |

## O que é

Folha de produção única (horizontal, fundo cinza claro, grid organizado) com
11 seções que **travam a identidade** do personagem para todos os shots
futuros — sheet 5×3, depth boards e clipes Seedance:

1. **Main turnaround + scale sheet** — frente / ¾ / lado / costas, com régua
   de altura sutil e silhueta de stance sob a vista frontal
2. **Head turnaround** — 4 vistas da cabeça, traços idênticos
3. **Expression sheet** — 6 expressões primárias + 4 micro-expressões
   (direção de atuação)
4. **Posture variations** — 3 poses (neutro, relaxado, alerta)
5. **Hand gesture library** — 4 estudos de mão *(omitir se não houver mãos expressivas)*
6. **Close-up detail panels** — macro: olhos, boca, textura de pele/pelo,
   cabelo, orelhas/brincos, tecido
7. **Silhouette + depth reference** — silhuetas chapadas (frente/lado) +
   pass de profundidade aproximado (ver nota abaixo)
8. **Wardrobe, accessories & prop card** — itens separados + card do prop
   assinatura
9. **Color palette** — swatches com hex aproximado
10. **Voice & personality notes** *(opcional)*
11. **Design notes** — labels de referência (ID, revisão, data)

## Como usar

1. Anexar **uma** imagem de referência do personagem.
2. Preencher os campos `[ ]` de **METADATA** e **DESIGN NOTES**.
3. Rodar o prompt como está — `IDENTITY LOCK`, `CONTINUITY RULES` e `STYLE`
   não se parafraseiam.
4. Opcional (figura física que importa — criatura, boneco, miniatura):
   combinar com o protocolo de escala Coca-Cola
   (`../scale-can-2x2/`) para travar dimensões reais com a lata 33cl.

## Gates

- **Sem imagem de referência → não gerar.** O prompt v2.0 exige referência
  ("Attach one reference image of the character") e o identity lock é contra
  ela. Sem referência, monte a descrição completa primeiro (gerar o conceito
  com um estilo definido) e só então use a folha.
- **Seção 7B (depth) é aproximação estilizada** — o próprio prompt avisa:
  para depth map de produção, rodar a imagem final num pass dedicado
  (MiDaS / Depth Anything). No pipeline desta casa, o depth map oficial vem
  do `../depth-board-3x3/depth-map-prompt.md` (Nano Banana / GPT Image 2).

## Continuidade no resto da linha de produção

- A folha alimenta a etapa 5 do workflow de depth board (character sheets →
  clipes Seedance) e a fidelidade de referência do engine 5×3.
- O estilo cinematográfico (`../../styles/cinematic-photorealistic.md`)
  **não** se aplica a esta folha — a sheet de produção tem estilo próprio
  travado no prompt (estúdio neutro, sem cena, sem pose dramática).
