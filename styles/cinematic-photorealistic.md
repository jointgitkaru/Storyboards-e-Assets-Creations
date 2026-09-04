# STYLE MODULE — CINEMATIC PHOTO-REALISM (v1.0)

Módulo de estilo para todas as etapas da linha de produção. Formato da casa:
**bloco BASE + um REGISTER**, colados palavra por palavra (locked) nos prompts
de geração.

## Como usar

1. Escolha **um** registro (A, B ou C) para a produção — um só registro por
   filme, do início ao fim (regra do engine: *"Style, lighting, grade — 1 set,
   identical across all fifteen panels"*).
2. Cole `BASE` + o registro escolhido inteiros em:
   - a geração da **reference image** (etapa 3 da linha de produção);
   - a **character reference sheet** e a **scale sheet** (etapas 1–2);
   - o prompt de **animação** (Seedance) — no engine 5×3, é isso que preenche
     o slot `STYLE / LIGHTING / COLOUR GRADE` (*"written once, then pasted
     word for word into the animation prompt"*).
3. **NÃO** aplique a um depth board — o board é grayscale por design.

## 🔹 BASE — colar sempre

```
STYLE REGISTER: CINEMATIC PHOTO-REALISM (locked)
Photorealistic live-action cinematic look. Real camera optics, real
lighting physics, natural material and skin texture, true-to-life
environment colours.
Cinema-grade stills with a 24 fps temporal feel for animation.
Lighting is physically motivated: visible light-source logic, realistic
fall-off, correct shadow direction, no imaginary light.
Fine surface detail, micro-contrast, subtle natural imperfections.
NO illustration, NO anime, NO 3D render, NO cartoon, NO stylization,
NO plastic or waxy skin, NO oversharpened halos, NO duplicated anatomy,
NO fantasy lighting, NO neon overglow, NO HDR bloom abuse.
```

## 🔹 REGISTER A — FEATURE FILM

```
REGISTER: FEATURE FILM (locked)
Anamorphic cinematic framing with a 2.39:1 composition sense.
35mm film grain base, gentle highlight halation, deep controlled shadows.
One hero key plus motivated practicals; every light has a physical source.
Muted natural palette with a single intentional accent.
Shallow depth of field on close work; wide shots hold full-frame focus.
```

## 🔹 REGISTER B — PHOTOREALISTIC COMMERCIAL (ads)

```
REGISTER: PHOTOREALISTIC COMMERCIAL (locked)
High-end product-film lighting: soft controlled key, clean speculars,
accurate rendering of glossy and matte finishes, minimal spill.
Neutral-to-warm palette, high clarity, rich honest contrast.
Flawless but natural subject surfaces — never retouched plastic.
Reads like a paid broadcast spot. 16:9 or 9:16 as stated in the sheet.
```

## 🔹 REGISTER C — DOCUMENTARY REALISM

```
REGISTER: DOCUMENTARY REALISM (locked)
Available light first, minimal lighting intervention. Honest exposure:
clipped or crushed areas only where physically true. Handheld 24 fps
camera logic with natural micro-shake. Unretouched skin and textures,
subtle native sensor grain, no artificial grade, no beauty passes.
```

## Regras de uso

- **Um registro por produção**; repetir palavra por palavra em todas as etapas.
- Nunca parafrasear, resumir ou renumerar o bloco — mesma regra dos lock
  blocks do engine.
- O registro não pode contradizer o formato de um protocolo: a scale sheet
  continua com fundo neutro e câmera horizontal, o depth board continua
  grayscale — o estilo afeta textura, luz e grade, nunca a geometria do
  protocolo.
