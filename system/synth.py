"""Geradores sintéticos determinísticos — fixtures para testar gates e QC
sem gastar chamadas de modelo. Substitua pelos renders reais."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))


def _write_png(path: Path, w: int, h: int, raw_rows: list[bytes]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    png = (b"\x89PNG\r\n\x1a\n"
           + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
           + _chunk(b"IDAT", zlib.compress(b"".join(b"\x00" + r for r in raw_rows)))
           + _chunk(b"IEND", b""))
    path.write_bytes(png)


def png_solid(path, w: int = 96, h: int = 64, v: int = 128) -> None:
    """PNG cinza uniforme (placeholder de artefato)."""
    _write_png(Path(path), w, h, [bytes([v, v, v]) * w for _ in range(h)])


def png_grid(path, cols: int = 5, rows: int = 3, gutter: int = 8, W: int = 1280,
             H: int = 768, card: tuple = (34, 34, 38)) -> None:
    """Grid cols×rows com painéis texturados (ruído determinístico) e gutters
    uniformes — imita a geometria de uma sheet para o QC contar painéis."""
    raw = []
    pw = (W - gutter * (cols + 1)) // cols
    ph = (H - gutter * (rows + 1)) // rows
    for y in range(H):
        row = bytearray()
        in_row_gutter = True
        py = -1
        for r in range(rows):
            y0 = gutter + r * (ph + gutter)
            if y0 <= y < y0 + ph:
                in_row_gutter, py = False, r
                break
        for x in range(W):
            px = -1
            in_col_gutter = True
            for c in range(cols):
                x0 = gutter + c * (pw + gutter)
                if x0 <= x < x0 + pw:
                    in_col_gutter, px = False, c
                    break
            if in_row_gutter or in_col_gutter:
                row += bytes(card)
            else:
                n = ((x * 73856093) ^ (y * 19349663) ^ (px * 83492791) ^ (py * 2971215073)) & 0xFF
                base = 50 + (px * 37 + py * 53) % 60
                v = max(8, min(247, base + (n % 90) - 45))
                row += bytes((v, v, v))
        raw.append(bytes(row))
    _write_png(Path(path), W, H, raw)


def _box(tag: bytes, payload: bytes) -> bytes:
    """Box MP4: [size(4, inclui header)][type(4)][payload] — sem CRC (não é PNG)."""
    return struct.pack(">I", len(payload) + 8) + tag + payload


def mp4_stub(path, seconds: float = 15.0) -> None:
    """MP4 mínimo (ftyp+moov/mvhd+mdat) com duração declarada — válido para o
    QC de runtime (parse de boxes), não para reprodução."""
    timescale = 1000
    mvhd = (b"\x00\x00\x00\x00"                                  # version+flags
            + struct.pack(">II", 0, 0)                           # created/modified
            + struct.pack(">II", timescale, int(seconds * timescale))
            + struct.pack(">I", 0x00010000) + struct.pack(">H", 0x0100)
            + b"\x00" * 10
            + struct.pack(">9i", 0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000)
            + b"\x00" * 24 + struct.pack(">I", 2))
    ftyp = _box(b"ftyp", b"isom" + struct.pack(">I", 512) + b"isomiso2mp41")
    moov = _box(b"moov", _box(b"mvhd", mvhd))
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_bytes(ftyp + moov + _box(b"mdat", b""))
