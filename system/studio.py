#!/usr/bin/env python3
"""M5 — Studio: painel web sobre M0–M4 (stdlib pura).

Uso:  python3 system/studio.py [--port 8080]
      PORT=... python3 system/studio.py

Endpoints (todos relativos — o browser nunca aponta para localhost):
  GET  /                        → studio.html (SPA)
  GET  /api/overview            → produções + fidelidade da biblioteca
  GET  /api/verify              → compute_verify() como dados
  GET  /api/ideas?category&seed → STATE 2 (10 ideias reproduzíveis)
  GET  /api/productions/{slug}  → detalhe (etapas, artefatos, qc, prompts)
  POST /api/productions         → init   {slug, title, register}
  POST /api/productions/{slug}/set     {pairs:[k=v,...]}
  POST /api/productions/{slug}/render  {stage}            (+snapshot p/ diff)
  POST /api/productions/{slug}/run     {stage, mode: auto|mock|manual}
  POST /api/productions/{slug}/qc      {check, stage}     (auto/register/all)
  POST /api/productions/{slug}/attach?stage=&name=  (corpo = bytes do arquivo)
  GET  /api/productions/{slug}/prompt/{stage}[?h=histórico]  → texto+meta+diff
  GET  /renders/{slug}/{arquivo} · /assets/{slug}/{arquivo}   → estáticos
"""
from __future__ import annotations

import argparse
import contextlib
import difflib
import io
import json
import mimetypes
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import engine  # noqa: E402

ROOT = engine.ROOT
PRODUCTIONS = engine.PRODUCTIONS
ANSI = re.compile(r"\x1b\[[0-9;]*m")
SAFE = re.compile(r"[A-Za-z0-9._-]+")
MUTEX = threading.RLock()  # reentrante: handlers chamam get_session() sob lock
_SESSION = None


def get_session(mode: str = "mock"):
    """Sessão do engine (Fase 3) — singleton por processo do Studio."""
    global _SESSION
    with MUTEX:
        if _SESSION is None:
            import session
            with contextlib.redirect_stdout(io.StringIO()):
                _SESSION = session.EngineSession(mode=mode)
        return _SESSION


def reset_session(mode: str = "mock"):
    global _SESSION
    import session
    with MUTEX, contextlib.redirect_stdout(io.StringIO()):
        _SESSION = session.EngineSession(mode=mode)
    return _SESSION

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4",
        ".mov": "video/quicktime", ".txt": "text/plain; charset=utf-8",
        ".md": "text/plain; charset=utf-8", ".json": "application/json"}


# ------------------------------------------------------------------ helpers ---

def _slug_ok(s: str) -> bool:
    return bool(SAFE.fullmatch(s)) and ".." not in s


def cap(fn, **ns):
    """Roda um cmd_* do engine capturando stdout; devolve dict p/ API."""
    buf = io.StringIO()
    code, err = 1, None
    with MUTEX, contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
        try:
            code = fn(argparse.Namespace(**ns))
        except SystemExit as e:
            code = 1
            err = ANSI.sub("", str(e)) or f"exit {e.code}"
        except Exception as e:  # noqa: BLE001
            code, err = 1, f"{type(e).__name__}: {e}"
    return {"ok": code == 0, "code": code, "log": ANSI.sub("", buf.getvalue()).strip(),
            "error": err}


def _stage(slug: str, stage_id: str) -> dict:
    reg = engine._load_registry()
    s = next((x for x in reg["stages"] if x["id"] == stage_id), None)
    if s is None:
        raise ValueError(f"etapa desconhecida: {stage_id}")
    return s


def _prompt_path(slug: str, stage: dict) -> Path:
    return engine._prod_path(slug) / "prompts" / f"{stage['order']:02d}-{stage['id']}.txt"


def _snapshot(slug: str, stage_id: str) -> dict:
    """Arquiva versão anterior do prompt (history/) p/ diff entre re-runs."""
    stage = _stage(slug, stage_id)
    p = _prompt_path(slug, stage)
    before = p.read_text(encoding="utf-8") if p.exists() else None
    return {"path": p, "before": before}


def _after_snapshot(snap: dict, res: dict) -> dict:
    p, before = snap["path"], snap["before"]
    changed = False
    if res.get("ok") and p.exists():
        now = p.read_text(encoding="utf-8")
        if before is not None and now != before:
            hdir = p.parent / "history"
            hdir.mkdir(exist_ok=True)
            stamp = time.strftime("%Y%m%d-%H%M%S")
            (hdir / f"{p.name}.{stamp}.txt").write_text(before, encoding="utf-8")
            changed = True
    res["changed"] = changed
    return res


def _listdir(pdir: Path, sub: str):
    d = pdir / sub
    if not d.exists():
        return []
    out = []
    for f in sorted(d.iterdir()):
        if f.is_file() and not f.name.startswith("."):
            st = f.stat()
            out.append({"name": f.name, "size": st.st_size,
                        "mtime": time.strftime("%Y-%m-%d %H:%M", time.localtime(st.st_mtime))})
    return out


# ------------------------------------------------------------------ dados ---

def overview() -> dict:
    prods = []
    if PRODUCTIONS.exists():
        for d in sorted(PRODUCTIONS.iterdir()):
            pj = d / "production.json"
            if not (d.is_dir() and pj.exists()):
                continue
            try:
                prod = json.loads(pj.read_text(encoding="utf-8"))
            except Exception:
                continue
            stages = prod.get("stages", {})
            done = sum(1 for s in stages.values() if s.get("status") == "rendered")
            waiting = sum(1 for s in stages.values() if s.get("status") == "awaiting_artifact")
            qc_fail = any(not e.get("pass") for s in stages.values() for e in s.get("qc", []))
            qc_n = sum(len(s.get("qc", [])) for s in stages.values())
            prods.append({"slug": prod["slug"], "title": prod.get("title"),
                          "register": prod.get("register"), "created": prod.get("created"),
                          "done": done, "waiting": waiting, "total": 8,
                          "qc_fail": qc_fail, "qc_n": qc_n})
    v = engine.compute_verify()
    return {"productions": prods,
            "verify": {"problems": v["problems"], "entries": len(v["entries"])}}


def detail(slug: str) -> dict:
    prod = engine._load_prod(slug)
    reg = engine._load_registry()
    pdir = engine._prod_path(slug)
    stages = []
    for s in reg["stages"]:
        st = prod.get("stages", {}).get(s["id"], {})
        qc = st.get("qc", [])
        stages.append({
            "id": s["id"], "order": s["order"], "name": s["name"],
            "optional": bool(s.get("optional")),
            "alt": s["id"] in ("storyboard-sheet", "clip-5x3"),
            "kind": s["kind"], "tool": s["tool_hint"],
            "status": st.get("status", "pending"),
            "prompt": st.get("prompt"), "artifact": st.get("artifact"),
            "adapter": st.get("adapter"), "rendered_at": st.get("rendered_at"),
            "qc": qc[-4:],
            "qc_pass": (all(e["pass"] for e in qc) if qc else None),
        })
    renders = _listdir(pdir, "renders")
    assets = _listdir(pdir, "assets")
    prompts = []
    pdir_p = pdir / "prompts"
    if pdir_p.exists():
        for f in sorted(pdir_p.glob("*.txt")):
            meta_f = f.with_name(f.name + ".meta.json")
            meta = json.loads(meta_f.read_text(encoding="utf-8")) if meta_f.exists() else None
            hist = list((pdir_p / "history").glob(f.name + ".*.txt")) if (pdir_p / "history").exists() else []
            stage_id = f.stem.split("-", 1)[1] if "-" in f.stem else f.stem
            prompts.append({"file": f.name, "stage": stage_id,
                            "meta": meta, "history": len(hist)})
    return {"production": prod, "stages": stages, "renders": renders,
            "assets": assets, "prompts": prompts,
            "pending": [r["name"] for r in renders if r["name"].endswith(".pending.md")]}


# ------------------------------------------------------------------ handler ---

class Handler(BaseHTTPRequestHandler):
    server_version = "SaeStudio/1.0"

    def log_message(self, fmt, *args):  # silencia access-log
        pass

    # ---- utilidades ----
    def _send(self, code: int, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj, code: int = 200):
        self._send(code, json.dumps(obj, ensure_ascii=False).encode("utf-8"),
                   "application/json; charset=utf-8")

    def _bad(self, msg: str, code: int = 400):
        self._json({"ok": False, "error": msg}, code)

    def _body_json(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        if not n:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return {}

    def _serve_file(self, path: Path):
        if not (path.exists() and path.is_file()):
            self._bad("arquivo não encontrado", 404)
            return
        ctype = MIME.get(path.suffix.lower()) or (mimetypes.guess_type(path.name)[0] or "application/octet-stream")
        size = path.stat().st_size
        rng = self.headers.get("Range")
        if rng and ctype.startswith("video/"):
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            start = int(m.group(1) or 0) if m else 0
            end = int(m.group(2) or size - 1) if m else size - 1
            end = min(end, size - 1)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.end_headers()
            with open(path, "rb") as fh:
                fh.seek(start)
                self.wfile.write(fh.read(end - start + 1))
            return
        self._send(200, path.read_bytes(), ctype)

    # ---- rotas ----
    def do_GET(self):
        try:
            u = urlparse(self.path)
            q = parse_qs(u.query)
            parts = [unquote(p) for p in u.path.split("/") if p]

            if u.path in ("/", "/index.html"):
                self._serve_file(Path(__file__).parent / "studio.html")
            elif u.path == "/api/overview":
                self._json(overview())
            elif u.path == "/api/verify":
                self._json(engine.compute_verify())
            elif u.path == "/api/ideas":
                cat = (q.get("category", ["ads"])[0])
                seed = int(q.get("seed", [0])[0]) or engine.random.randrange(1, 10 ** 6)
                self._json({"category": cat, "seed": seed,
                            "ideas": engine.generate_ideas(cat, seed)})
            elif u.path == "/api/session":
                self._json(get_session().snapshot())
            elif len(parts) == 3 and parts[0] == "api" and parts[1] == "productions":
                self._json(detail(parts[2])) if _slug_ok(parts[2]) else self._bad("slug inválido")
            elif (len(parts) == 5 and parts[0] == "api" and parts[1] == "productions"
                  and parts[3] == "prompt"):
                slug, stage_id = parts[2], parts[4]
                if not _slug_ok(slug):
                    return self._bad("slug inválido")
                stage = _stage(slug, stage_id)
                p = _prompt_path(slug, stage)
                if not p.exists():
                    return self._bad("prompt ainda não compilado", 404)
                text = p.read_text(encoding="utf-8")
                meta_f = p.with_name(p.name + ".meta.json")
                meta = json.loads(meta_f.read_text(encoding="utf-8")) if meta_f.exists() else None
                hdir = p.parent / "history"
                hist = sorted(hdir.glob(p.name + ".*.txt")) if hdir.exists() else []
                diff = None
                hf = q.get("h", [None])[0]
                if hf:
                    hpath = hdir / hf
                    if not (_slug_ok(hf) and hpath.exists()):
                        return self._bad("histórico não encontrado", 404)
                    old = hpath.read_text(encoding="utf-8").splitlines()
                    diff = list(difflib.unified_diff(old, text.splitlines(),
                                                     fromfile=hf, tofile="atual", lineterm=""))
                self._json({"stage": stage_id, "text": text, "meta": meta,
                            "history": [h.name for h in hist], "diff": diff})
            elif len(parts) == 3 and parts[0] in ("renders", "assets") :
                slug, name = parts[1], parts[2]
                if not (_slug_ok(slug) and _slug_ok(name)):
                    return self._bad("caminho inválido")
                self._serve_file(PRODUCTIONS / slug / parts[0] / name)
            else:
                self._bad("rota não encontrada", 404)
        except Exception as e:  # noqa: BLE001
            self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, 500)

    def do_POST(self):
        try:
            u = urlparse(self.path)
            q = parse_qs(u.query)
            parts = [unquote(p) for p in u.path.split("/") if p]

            if u.path == "/api/session":
                b = self._body_json()
                with MUTEX:
                    res = get_session().step(b.get("input", ""))
                return self._json(res)
            if u.path == "/api/session/reset":
                b = self._body_json()
                s = reset_session(mode=b.get("mode", "mock"))
                return self._json(s.snapshot())

            if u.path == "/api/productions":
                b = self._body_json()
                if not _slug_ok(b.get("slug", "")):
                    return self._bad("slug inválido (a-z, 0-9, hífen)")
                res = cap(engine.cmd_init, slug=b["slug"], title=b.get("title"),
                          register=b.get("register") or None)
                return self._json(res, 200 if res["ok"] else 400)

            if not (len(parts) >= 3 and parts[0] == "api" and parts[1] == "productions"
                    and _slug_ok(parts[2])):
                return self._bad("rota não encontrada", 404)
            slug, action = parts[2], parts[3]

            if action == "attach":
                stage_id = (q.get("stage", [""])[0])
                name = q.get("name", ["arquivo"])[0]
                n = int(self.headers.get("Content-Length") or 0)
                data = self.rfile.read(n)
                if not (stage_id and data):
                    return self._bad("faltam stage ou arquivo")
                tmp = Path("/tmp") / f"studio-upload-{int(time.time())}-{name}"
                tmp.write_bytes(data)
                res = cap(engine.cmd_attach, slug=slug, stage=stage_id, file=str(tmp))
                with contextlib.suppress(FileNotFoundError):
                    tmp.unlink()
                return self._json(res, 200 if res.get("ok") else 400)

            b = self._body_json()
            if action == "set":
                pairs = b.get("pairs", [])
                res = cap(engine.cmd_set, slug=slug, pairs=pairs)
            elif action == "render":
                snap = _snapshot(slug, b.get("stage", ""))
                res = cap(engine.cmd_render, slug=slug, stage=b.get("stage", ""))
                res = _after_snapshot(snap, res)
            elif action == "run":
                mode = b.get("mode", "auto")
                snap = _snapshot(slug, b.get("stage", ""))
                res = cap(engine.cmd_run, slug=slug, stage=b.get("stage", ""),
                          mock=(mode == "mock"), manual=(mode == "manual"))
                res = _after_snapshot(snap, res)
            elif action == "qc":
                check, stage_id = b.get("check", ""), b.get("stage", "")
                if check in ("panels", "grayscale"):
                    res = cap(engine.cmd_qc_image, slug=slug, check=check,
                              stage=stage_id, expected=None)
                elif check == "runtime":
                    res = cap(engine.cmd_qc_video, slug=slug, stage=stage_id)
                elif check == "register":
                    res = cap(engine.cmd_qc_register, slug=slug)
                elif check == "all":
                    res = cap(engine.cmd_qc_all, slug=slug)
                else:
                    return self._bad("check inválido")
            else:
                return self._bad("ação desconhecida", 404)
            self._json(res, 200 if res.get("ok") else 400)
        except Exception as e:  # noqa: BLE001
            self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, 500)


def main() -> int:
    ap = argparse.ArgumentParser(prog="studio.py", description=__doc__)
    ap.add_argument("--port", type=int, default=int(__import__("os").environ.get("PORT", "8080")))
    ap.add_argument("--host", default="0.0.0.0")
    args = ap.parse_args()
    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"■ STORYBOARD ANIMATION ENGINE — STUDIO\n  http://{args.host}:{args.port}  (bind {args.host})")
    print(f"  produções: {PRODUCTIONS}  · API: /api/overview")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n■ studio encerrado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
