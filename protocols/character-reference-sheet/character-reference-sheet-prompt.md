# PROMPT DE CHARACTER REFERENCE SHEET v1.0 — Folha de Referência de Personagem

> ⚠️ **Status:** v1.0 reconstruída em 04/09/2026 no padrão da casa (mesmo
> formato do protocolo de escala Coca-Cola: invocação curta + bloco de dados +
> checklist + master). O arquivo original anexado
> `character-reference-sheet-prompt.md` ainda não chegou ao repositório —
> quando chegar, substituir o texto de invocação e do bloco de dados pelo
> original, mantendo o cabeçalho de uso e o master.

Folha única que **trava a identidade** do personagem (rosto, cabelo, roupa,
acessórios, proporções, marcas) para uso em todos os shots seguintes —
sheet 5×3, depth boards e clipes Seedance.

## Como usar

1. Cole o **PROMPT DE INVOCAÇÃO** antes de qualquer pedido de geração.
2. Preencha o **BLOCO DE DADOS** com o personagem.
3. **Gate:** se não houver imagem de referência **e** a descrição do bloco
   for insuficiente (faltar rosto, cabelo ou roupa), **PARE e pergunte** —
   não invente identidade.
4. (Opcional) Se a figura física importar (criatura, boneco, miniatura),
   combine com o protocolo de escala Coca-Cola: marque `SCALE REFERENCE: Y`
   no bloco de dados e as regras de escala passam a valer.
5. (Opcional) Estilo: padrão = fotorrealista (BASE do módulo). Para outro
   registro, cole `BASE` + um `REGISTER` de
   `../../styles/cinematic-photorealistic.md` inteiro no bloco de dados.

---

## 🔹 PROMPT DE INVOCAÇÃO (colar sempre)

```
Apply the Character Reference Sheet Protocol v1.0.

Generate ONE unified character reference sheet that LOCKS the appearance of
the subject for every future shot of this production.

This sheet is the identity source of truth: face, hair, build, clothing,
accessories and distinctive marks shown here are FIXED in all later
storyboards, depth boards and clips.

STRUCTURE (default — override with the data block):
- ROW 1 — TURNAROUND: FRONT / THREE-QUARTER / SIDE / REAR. Four full-body
  panels, same relaxed neutral A-pose, same scale, same ground plane.
- ROW 2 — EXPRESSION SET (only if requested): five head-and-shoulders
  panels: neutral, smile, surprise, anger, sadness.
- ROW 3 — DETAIL INSERTS (only if requested): close details of the face,
  the hands, costume pieces, accessories, silhouette.

IDENTITY LOCK — fixed across every panel, no exceptions:
species or character type, facial structure, hairstyle and hair colour,
build and proportions, clothing, accessories, distinctive marks
(scars, tattoos, markings, damage).

CAMERA AND ENVIRONMENT:
Same camera height, same focal length, level horizon in every panel.
Plain neutral gray background. Soft, even, diffuse studio lighting,
identical in every panel. No forced perspective. No stylization unless a
style register is supplied.

OUTPUT RULES:
One image per request. No text, labels, captions, arrows, rulers or grids
beyond the cells described. No new characters. No added objects that are
not part of the locked identity.
```

---

## 🔹 BLOCO DE DADOS (preencher)

```
CHARACTER:
Name: [nome]
Type: [humano / criatura / personagem — espécie, modelo ou base]
Reference image: [anexada? Y/N — se N, a descrição abaixo é obrigatória e completa]
Verified height: [XX] cm
Build / proportions: [ex: 1,75 m, atlético, ombros largos]
Face: [traços, idade aparente]
Hair: [cor, corte, textura]
Clothing: [peça por peça]
Accessories: [óculos, mochila, ferramenta, arma — ou "none"]
Distinctive marks: [cicatrizes, tatuagens, marcas — ou "none"]

Rows:
Row 1 — turnaround (front, 3/4, side, rear): [Y — default Y]
Row 2 — expression set (neutral, smile, surprise, anger, sadness): [Y/N]
Row 3 — detail inserts: [listar — ex: "face close-up, left hand, belt buckle"]

Style register: [cinematic photo-realism — BASE + REGISTER A/B/C, colado
inteiro de styles/cinematic-photorealistic.md — default: BASE + REGISTER A]

Scale reference (optional): [Y/N — se Y, vale o protocolo de escala
Coca-Cola: lata 33cl (11,5 cm) ao lado do sujeito, mesma escala em todos
os painéis, medidas reais confirmadas]
```

---

## 🔹 CHECKLIST RÁPIDO (antes de gerar)

- [ ] Imagem de referência anexada **ou** descrição completa no bloco (senão, perguntar)
- [ ] Altura/proporções declaradas — não estimadas
- [ ] Cada item do identity lock preenchido (ou "none" explícito)
- [ ] 4 vistas do turnaround com MESMA escala, MESMO fundo, MESMA luz
- [ ] Sem texto/labels/grid além das células pedidas
- [ ] STYLE REGISTER colado inteiro (se aplicar)
- [ ] Se `SCALE REFERENCE: Y` — medidas reais confirmadas (gate do protocolo de escala)

---

## 🔹 MASTER — regras completas (consultar se o modelo errar)

### IDENTITY FIDELITY

A referência (imagem ou descrição) é a ÚNICA fonte de verdade para: tipo ou
espécie, anatomia, estrutura facial, proporções, silhueta, coloração,
roupas, acessórios e traços distintivos.
NÃO redesenhar, "embelezar", estilizizar, antropomorfizar ou cartunizar o
sujeito. NÃO alterar proporções para facilitar a composição.

### PANEL CONSISTENCY

- Mesma identidade em todos os painéis — sem exceção.
- O ângulo muda; o personagem não muda.
- Não espelhar o personagem sem motivo narrativo.
- Não duplicar a mesma pose em painéis que pedem vistas diferentes.

### EXPRESSION SET (se pedido)

- Mesma cabeça, mesmo cabelo, mesma roupa em todas as 5 células.
- Mudar apenas a expressão (olhos, sobrancelhas, boca, pescoço).
- Sem cenários, sem props extras, sem mudança de luz entre células.

### SCALE COMBINATION (se `SCALE REFERENCE: Y`)

Valem as regras do protocolo de escala Coca-Cola
(`../scale-can-2x2/`): lata 33cl fixa (11,5 × 6,6 × 5,2 cm), distância
5–10 cm entre a lata e o sujeito, mesmo plano de chão, mesma escala em
todos os painéis, sem perspectiva forçada. O gate de medidas do protocolo
de escala continua valendo: sem medida real confirmada, PARE e pergunte.

### ABSOLUTE PROHIBITIONS

- NÃO inventar identidade (rosto, cabelo, roupa) quando não fornecida.
- NÃO trocar roupa, cabelo ou proporções entre painéis.
- NÃO adicionar texto, labels, captions, setas, réguas ou grids.
- NÃO adicionar personagens ou objetos que não fazem parte da identidade travada.
- NÃO mudar a escala do personagem entre painéis.

### FINAL VALIDATION (antes de aceitar a imagem)

1. Referência ou descrição completa estava disponível.
2. Todos os painéis mostram a MESMA identidade.
3. Escala idêntica entre as vistas do turnaround.
4. Fundo e iluminação idênticos em todos os painéis.
5. As células pedidas existem — sem falta, sem sobra.
6. Nenhum texto/label/grid extra.
7. Se escala: a lata está presente, com as dimensões corretas, em todos os painéis.

Se qualquer item falhar: **regenerar, não apresentar**.
