"""M3 — QC automático (análise de saídas), stdlib pura.

- Painéis de sheet: detecção de grid por atividade de linhas/colunas
  (gutters uniformes entre painéis ativos). PNG nativo; JPEG/WEBP se
  Pillow estiver instalada (opcional).
- Grayscale: desvio máximo por canal ~ 0 (depth map).
- Runtime MP4: parse dos boxes (moov/mvhd) — sem decodificar vídeo.
- Consistência de registro: BASE + registro colados palavra por palavra
  nas etapas de estilo e AUSENTES nas etapas travadas (depth/sheets).

Limitações honestas (ver BLUEPRINT §6/M3): contagem de painéis é
heurística — header/chrome muito ativo pode gerar banda extra; o laudo
sempre imprime a geometria detectada para julgamento do operador.
"""
from __future__ import annotations

import re
import struct
import zlib
from pathlib import Path

# ------------------------------------------------------------- carga PNG ---

_PNG_SIG = b"\x89PNG\r\n\x1a\n"


class Img:
    def __init__(self, w: int, h: int, gray: list, dev: list):
        self.w, self.h, self.gray, self.dev = w, h, gray, dev  # gray/dev: h×w ints


def _load_png(data: bytes) -> Img:
    if not data.startswith(_PNG_SIG):
        raise ValueError("não é PNG")
    pos, idat, plte, ihdr = 8, b"", None, None
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        ctype = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        if ctype == b"IHDR":
            ihdr = struct.unpack(">IIBBBBB", body)
        elif ctype == b"PLTE":
            plte = [tuple(body[i:i + 3]) for i in range(0, len(body), 3)]
        elif ctype == b"IDAT":
            idat += body
        elif ctype == b"IEND":
            break
        pos += 12 + length
    if not ihdr:
        raise ValueError("PNG sem IHDR")
    w, h, depth, ctype, _comp, filt, inter = ihdr
    if depth != 8 or inter != 0:
        raise ValueError(f"PNG não suportado (depth={depth}, interlace={inter}) — instale Pillow")
    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * nch
    if len(raw) != h * (stride + 1):
        raise ValueError("PNG inconsistente")
    # defiltro por scanline
    out = bytearray()
    prev = bytearray(stride)
    p = 0
    for _ in range(h):
        f = raw[p]
        line = bytearray(raw[p + 1:p + 1 + stride])
        p += 1 + stride
        if f == 1:
            for i in range(nch, stride):
                line[i] = (line[i] + line[i - nch]) & 0xFF
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif f == 3:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                b, c = prev[i], (prev[i - nch] if i >= nch else 0)
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out += line
        prev = line
    gray, dev = [], []
    for y in range(h):
        grow, drow = [], []
        base = y * stride
        for x in range(w):
            o = base + x * nch
            if ctype in (0, 4):            # grayscale(+alpha)
                g = out[o]
                d = 0
            elif ctype == 3:               # palette
                r, gg, b = plte[out[o]]
                g = (299 * r + 587 * gg + 114 * b) // 1000
                d = max(r, gg, b) - min(r, gg, b)
            else:                          # truecolor(+alpha)
                r, gg, b = out[o], out[o + 1], out[o + 2]
                g = (299 * r + 587 * gg + 114 * b) // 1000
                d = max(r, gg, b) - min(r, gg, b)
            grow.append(g)
            drow.append(d)
        gray.append(grow)
        dev.append(drow)
    return Img(w, h, gray, dev)


def load_image(path: Path) -> Img:
    data = Path(path).read_bytes()
    if data.startswith(_PNG_SIG):
        return _load_png(data)
    try:                                    # aceleração opcional
        from PIL import Image as _PIL       # type: ignore
        im = _PIL.open(Path(path)).convert("RGB")
        w, h = im.size
        px = list(im.getdata())
        gray = [[(299 * px[y * w + x][0] + 587 * px[y * w + x][1] + 114 * px[y * w + x][2]) // 1000
                 for x in range(w)] for y in range(h)]
        dev = [[max(px[y * w + x]) - min(px[y * w + x]) for x in range(w)] for y in range(h)]
        return Img(w, h, gray, dev)
    except ImportError:
        raise ValueError("formato não-PNG e Pillow não instalada (pip install pillow) — "
                         "ou exporte o render como PNG")


# --------------------------------------------------------- contagem grid ---

def _bands(activity: list, n: int, min_band_frac: float = 0.03):
    """Bandas ativas separadas por gaps >= min_gap; bandas finas demais caem fora."""
    s = sorted(activity)
    thr = max(3.0, 0.05 * (s[int(len(s) * 0.99)] if s else 0))
    min_gap = max(2, int(n * 0.005))
    min_band = max(3, int(n * min_band_frac))
    runs, start = [], None
    for i, a in enumerate(activity):
        if a > thr and start is None:
            start = i
        elif a <= thr and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, n))
    merged = []
    for r in runs:                          # une bandas separadas por gap curto
        if merged and r[0] - merged[-1][1] < min_gap:
            merged[-1] = (merged[-1][0], r[1])
        else:
            merged.append(list(r))
    return [r for r in merged if r[1] - r[0] >= min_band], thr


def count_panels(img: Img) -> dict:
    """Conta colunas×linhas do grid. Linhas: faixa central (evita header);
    colunas: apenas dentro da banda de linha do meio (evita chrome)."""
    cx0, cx1 = int(img.w * 0.2), int(img.w * 0.8)          # centro 60%
    row_act = [sum(abs(r[i + 1] - r[i]) for i in range(cx0, cx1 - 1)) / max(1, (cx1 - cx0 - 1))
               for r in img.gray]
    row_bands, thr_r = _bands(row_act, img.h)
    big = [b for b in row_bands if (b[1] - b[0]) >= 0.55 * max(y - x for x, y in row_bands)] if row_bands else []
    rows = len(big)
    cols = 0
    if rows:
        mid = big[len(big) // 2]                            # banda central
        ys = range(mid[0], mid[1])
        col_act = []
        for x in range(img.w - 1):
            s = 0
            for y in ys:
                g = img.gray[y]
                s += abs(g[x + 1] - g[x])
            col_act.append(s / max(1, len(ys)))
        col_bands, _ = _bands(col_act, img.w)
        if col_bands:
            cols = len([b for b in col_bands if (b[1] - b[0]) >= 0.55 * max(y - x for x, y in col_bands)])
    return {"cols": cols, "rows": rows, "panels": cols * rows,
            "row_bands": [list(b) for b in row_bands], "rows_kept": [list(b) for b in big],
            "thresholds": {"row": round(thr_r, 2)}}


def check_grayscale(img: Img, tol: int = 8, min_ok: float = 0.995) -> dict:
    total = ok = 0
    for drow in img.dev:
        for d in drow:
            total += 1
            ok += d <= tol
    return {"ok": ok / max(1, total) >= min_ok, "ratio": round(ok / max(1, total), 5),
            "tolerance": tol}


# ------------------------------------------------------------- mp4 boxes ---

def mp4_duration(path: Path) -> float | None:
    data = Path(path).read_bytes()

    def find_box(start: int, end: int, target: bytes):
        pos = start
        while pos + 8 <= end:
            size = struct.unpack(">I", data[pos:pos + 4])[0]
            typ = data[pos + 4:pos + 8]
            hdr = 8
            if size == 1:
                size = struct.unpack(">Q", data[pos + 8:pos + 16])[0]
                hdr = 16
            elif size == 0:
                size = end - pos
            if typ == target:
                return pos, pos + hdr, pos + size, size
            if size < 8:
                break
            pos += size
        return None

    moov = find_box(0, len(data), b"moov")
    if not moov:
        return None
    _p, body, end, _s = moov
    mvhd = find_box(body, end, b"mvhd")
    if not mvhd:
        return None
    _p, body2, _e2, _s2 = mvhd
    ver = data[body2]
    if ver == 0:
        timescale, dur = struct.unpack(">II", data[body2 + 12:body2 + 20])
    else:
        timescale, dur = struct.unpack(">IQ", data[body2 + 20:body2 + 32])
    return dur / timescale if timescale else None


def fmt_runtime(sec: float) -> str:
    s = round(sec)
    return f"{s // 60}:{s % 60:02d}"


# ---------------------------------------------- consistência de registro ---

def _norm(text: str) -> str:
    return re.sub(r"[ \t]+\n", "\n", text).strip()


STYLE_STAGES = ("reference-image", "storyboard-sheet", "clip", "clip-5x3")
NOSTYLE_STAGES = ("character-sheet", "scale-sheet", "depth-map", "depth-board")


def register_consistency(prod: dict, prod_dir: Path, base_block: str, register_block: str,
                         register_id: str) -> list:
    """BASE + registro presentes (verbatim) nas etapas de estilo; ausentes nas travadas."""
    out = []
    base_n, reg_n = _norm(base_block), _norm(register_block)
    for sid, st in sorted(prod.get("stages", {}).items()):
        pfile = prod_dir / st.get("prompt", "")
        if not pfile.exists():
            continue
        text = _norm(pfile.read_text(encoding="utf-8"))
        if sid in STYLE_STAGES:
            ok = base_n in text and reg_n in text
            out.append({"stage": sid, "check": f"BASE+{register_id} colados", "ok": ok,
                        "note": "" if ok else "bloco de estilo ausente/alterado no prompt"})
        elif sid in NOSTYLE_STAGES:
            ok = reg_n not in text and base_n not in text
            out.append({"stage": sid, "check": "sem estilo (por design)", "ok": ok,
                        "note": "" if ok else "estilo vazou para etapa que deveria ser travada"})
    return out
