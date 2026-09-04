# DEPTH MAP EXTRACTION PROMPT

Prompt para extrair o depth map a partir da reference image.
Uso: cole junto da imagem na Nano Banana ou GPT Image 2 (etapa 2 do
workflow — ver `README.md` desta pasta).

```
Convert this image into a physically accurate grayscale linear depth map.
White = nearest, black = farthest. Preserve geometry, silhouettes, and
occlusion boundaries. Use smooth surface depth gradients and crisp object
edges. Remove all color, texture, lighting, shading, outlines, normals,
and ambient occlusion. Output only the clean depth map.
```

Convenção fixa em todo o pipeline: **branco = superfície mais próxima,
preto = mais distante** — a mesma convenção usada pelo
`storyboard-prompt.md` nas 8 fases.
