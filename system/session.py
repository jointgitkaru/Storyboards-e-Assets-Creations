"""Fase 3 — sessão interativa do engine 5×3 (STATE 0–4).

Máquina de estados do "Storyboard Animation Engine v3" (Claude Code Edition)
sobre o orquestrador desta casa (M0–M4):

  STATE 0  environment check (silencioso) → linha READY exata + STATE 1
  STATE 1  storyboard type — "Pick 1 or 2. ↓"          (gate: 1|2)
  STATE 2  10 ideias (seed reproduzível; MORE = +10)     (gate: nº|MORE|custom)
  STATE 3  sheet 5×3 — compila, imprime o prompt INTEGRAL, renderiza pela
           cadeia, CONTA OS PAINÉIS (off-geometry → regenerate, nunca
           apresenta como pronto)                        (gate: regenerate|revise|next)
  STATE 4  clip — abertura travada + sheet como referência + QC de runtime
                                                          (gate: regenerate|NEW)

Regras do engine respeitadas: um estado por vez, sem preambles; prompt
totalmente standalone (nunca truncado); erros relatórios com franqueza;
nunca substituição silenciosa de modelo — a cadeia (M4) anuncia o adaptador.
Camadas: produtor cria productions/<slug>/ (layout da casa; o ./output/[slug]/
do spec original mapeia para renders/ + prompts/).
"""
from __future__ import annotations

import argparse
import contextlib
import io
import os
import random
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import adapters  # noqa: E402
import engine  # noqa: E402

REGISTER_BY_CATEGORY = {"ads": "B", "non-ads": "A"}
FORMAT_LABEL = {"ads": "15 SEC — PRODUCT FILM", "non-ads": "15 SEC — FILM"}


# ------------------------------------------------------------- utilidades ---

def _quiet(fn, **ns):
    """Roda um cmd_* do engine calado; devolve (código, log, erro)."""
    buf = io.StringIO()
    code, err = 1, None
    with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
        try:
            code = fn(argparse.Namespace(**ns))
        except SystemExit as e:
            code = 1
            err = str(e) or f"exit {e.code}"
        except Exception as e:  # noqa: BLE001
            code, err = 1, f"{type(e).__name__}: {e}"
    return code, buf.getvalue(), err


def _fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


def _slug_from(idea: str) -> str:
    words = [w for w in re.findall(r"[A-Za-z0-9]+", _fold(idea)) if len(w) > 2][:3]
    base = "-".join(w.lower() for w in words)[:28] or "engine"
    slug, n = base, 2
    while (engine.PRODUCTIONS / slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _title_word(idea: str) -> str:
    for w in re.findall(r"[A-Za-z0-9]+", _fold(idea.split(" — ")[0])):
        if len(w) > 2:
            return w.upper()[:14]
    return "SEQ"


def _model_label(adapter) -> str:
    if adapter.id == "openai-image":
        return os.environ.get("IMAGE_MODEL", "openai-image (compat)")
    if adapter.id == "openai-video":
        return os.environ.get("VIDEO_MODEL", "openai-video (compat)")
    if adapter.id == "mock":
        return "mock (stub sintético)"
    return "manual (copy-paste)"


# ---------------------------------------------------------------- sessão ----

class EngineSession:
    """Estado em memória — CLI (`engine.py session`) e Studio partilham disto."""

    def __init__(self, mode: str = "auto"):
        self.mode = mode  # auto | mock
        self.reset()

    def reset(self) -> None:
        self.state = "0"
        self.category = None
        self.ideas: list = []
        self.seed = None
        self.slug = None
        self.idea = None
        self.pipeline: dict = {}
        self.output: list = []
        self._state0()

    # ---- saída acumulada ----
    def _say(self, t: str, text: str) -> None:
        self.output.append({"t": t, "text": text})

    # ---- STATE 0 ----
    def _state0(self) -> None:
        v = engine.compute_verify()
        if v["problems"]:
            self._say("err", "■ ENGINE PARADO — biblioteca com drift "
                             f"({v['problems']} problema(s)). Rode: engine.py verify")
            self.state = "halt"
            return
        img = adapters.build_chain("image", force_mock=(self.mode == "mock"))
        vid = adapters.build_chain("video", force_mock=(self.mode == "mock"))
        self.pipeline = {
            "image": [_model_label(a) for a in img],
            "video": [_model_label(a) for a in vid],
            "max_clip": int(os.environ.get("VIDEO_MAX_CLIP", "15")),
        }
        self._say("sys", "■ STORYBOARD ANIMATION ENGINE — READY")
        self._say("sys", f"Image model: {self.pipeline['image'][0]}"
                         f" · Video model: {self.pipeline['video'][0]}"
                         f" · Max clip: {self.pipeline['max_clip']}s"
                         f" · Sheet: 5×3, 15 panels, 15s")
        for kind, chain in (("image", img), ("video", vid)):
            if chain[0].id not in ("openai-image", "openai-video"):
                self._say("info", f"■■ {kind}: sem API primária no ambiente — "
                                  f"cadeia selecionada: {' → '.join(a.id for a in chain)}")
        if self.pipeline["max_clip"] < 15:
            self._say("info", f"■■ max clip {self.pipeline['max_clip']}s < 15s — "
                              "o clip será dividido em beats nomeados no STATE 4.")
        self._state1()

    # ---- STATE 1 ----
    def _state1(self) -> None:
        self._say("ask", "What kind of storyboard are you making?")
        self._say("opt", "1. ADS — product and brand spots (phones, tech, beauty, food, fashion, UGC-style)")
        self._say("opt", "2. NON-ADS — narrative and scene work (skaters, anime, animals, action, atmosphere)")
        self._say("gate", "Pick 1 or 2. ↓")
        self.state = "1"

    # ---- STATE 2 ----
    def _state2(self) -> None:
        self.seed = random.randrange(1, 10 ** 6)
        self.ideas = engine.generate_ideas(self.category, self.seed)
        self._dump_ideas()
        self.state = "2"

    def _dump_ideas(self) -> None:
        self._say("sys", f"STATE 2 — 10 ideias · {self.category.upper()} · seed {self.seed} (reproduzível)")
        for i, idea in enumerate(self.ideas, 1):
            self._say("opt", f"{i:>2}. {idea}")
        self._say("gate", "Pick a number (1–10), type MORE for 10 fresh ideas, or describe your own. ↓")

    # ---- STATE 3 (sheet) ----
    def _goto3(self, idea: str) -> None:
        self.idea = idea
        self.slug = _slug_from(idea)
        register = REGISTER_BY_CATEGORY[self.category]
        code, log, err = _quiet(engine.cmd_init, slug=self.slug, title=idea.split(" — ")[0][:40],
                                register=register)
        if code != 0:
            self._say("err", err or log or "falha ao criar produção")
            self.state = "halt"
            return
        subject = idea.split(" — ")[0]
        pairs = [f"subject={subject}", f"title_word={_title_word(idea)}",
                 f"format_label={FORMAT_LABEL[self.category]}"]
        _quiet(engine.cmd_set, slug=self.slug, pairs=pairs)
        self._say("info", f"produção '{self.slug}' criada · registro {register} "
                          f"({'commercial' if register == 'B' else 'feature'} — troque com: revise register=C)")
        self._sheet(initial=True)

    def _sheet(self, initial: bool = False) -> None:
        comp = engine._compile_stage(self.slug, "storyboard-sheet")
        if "gate" in comp or "missing" in comp:
            self._say("err", "GATE: " + comp.get("gate", "slots: " + ", ".join(comp.get("missing", []))))
            self.state = "halt"
            return
        # QUALITY BAR: o prompt é impresso integral — nunca truncado
        self._say("sys", f"STATE 3 — BUILD AND GENERATE THE STORYBOARD SHEET"
                         f"{' (regenerate)' if not initial else ''}")
        self._say("prompt", comp["text"])
        attempt, panels_ok, log = 0, False, ""
        while attempt < 2 and not panels_ok:
            attempt += 1
            code, log, err = _quiet(engine.cmd_run, slug=self.slug, stage="storyboard-sheet",
                                    mock=(self.mode == "mock"), manual=False)
            if err:
                self._say("err", err)
                break
            if "aguardando artefato manual" in log:
                self._say("info", "■ aguardando artefato manual — instruções em "
                                  f"productions/{self.slug}/renders/storyboard-sheet.png.pending.md")
                self._say("info", "traga o arquivo (engine.py attach ou Studio) e siga com regenerate/next.")
                break
            qcode, qlog, _ = _quiet(engine.cmd_qc_image, slug=self.slug, check="panels",
                                    stage="storyboard-sheet", expected=None)
            panels_ok = qcode == 0
            if not panels_ok and attempt < 2:
                det = next((l.strip() for l in qlog.splitlines() if "detectado" in l), "")
                self._say("info", f"off-geometry — {det or 'painéis ≠ 15'}; regenerando (nunca apresentar como pronto)…")
        prod = engine._load_prod(self.slug)
        art = prod.get("stages", {}).get("storyboard-sheet", {}).get("artifact", "")
        adapter = prod.get("stages", {}).get("storyboard-sheet", {}).get("adapter", "?")
        if panels_ok:
            self._say("artifact", f"Storyboard sheet generated → productions/{self.slug}/{art}   (via {adapter})")
            self._say("gate", "Panels: 15 · Grid: 5×3 · Runtime: 0:15")
        elif art:
            self._say("err", f"sheet fora da geometria após {attempt} tentativa(s) — "
                             f"productions/{self.slug}/{art} NÃO está pronta.")
        self._say("gate", 'Reply "regenerate" for another pass, "revise [what to change]" '
                          'to adjust the prompt, or "next" to animate it. ↓')
        self._say("info", "revisões mecânicas: revise subject=… · colour=… · title_word=… · "
                          "beat_1…beat_15=… · register=A|B|C")
        self.state = "3"

    # ---- STATE 4 (clip) ----
    def _clip(self) -> None:
        comp = engine._compile_stage(self.slug, "clip-5x3")
        if "gate" in comp or "missing" in comp:
            self._say("err", "GATE: " + comp.get("gate", "slots: " + ", ".join(comp.get("missing", []))))
            self._state1()
            return
        self._say("sys", "STATE 4 — BUILD AND GENERATE THE ANIMATION")
        self._say("prompt", comp["text"])
        if self.pipeline["max_clip"] < 15:
            n = self.pipeline["max_clip"]
            self._say("info", f"max clip {n}s < 15s — dividindo em beats nomeados: "
                              f"panels 1–{n} e {n + 1}–15 (trim/join fora da cadeia).")
        code, log, err = _quiet(engine.cmd_run, slug=self.slug, stage="clip-5x3",
                                mock=(self.mode == "mock"), manual=False)
        if err:
            self._say("err", err)
        elif "aguardando artefato manual" in log:
            self._say("info", "■ aguardando artefato manual — instruções em "
                              f"productions/{self.slug}/renders/clip-5x3.mp4.pending.md")
        qcode, qlog, _ = _quiet(engine.cmd_qc_video, slug=self.slug, stage="clip-5x3")
        prod = engine._load_prod(self.slug)
        st = prod.get("stages", {})
        sheet = st.get("storyboard-sheet", {}).get("artifact", "")
        clip = st.get("clip-5x3", {}).get("artifact", "")
        self._say("sys", "■ Done.")
        self._say("artifact", f"Sheet → productions/{self.slug}/{sheet}")
        self._say("artifact", f"Animation → productions/{self.slug}/{clip}   "
                              f"(runtime {'ok' if qcode == 0 else 'FORA DO ESPERADO'})")
        self._say("gate", "15 panels · 5×3 · 0:15")
        self._say("gate", 'Reply "regenerate" for another animation pass, or NEW to start another storyboard. ↓')
        self.state = "4"

    # ---- API da sessão ----
    def step(self, raw: str) -> dict:
        self.output = []
        text = (raw or "").strip()
        low = text.lower()
        if low in ("quit", "exit", "sair"):
            self._say("sys", "■ sessão encerrada (produções permanecem em productions/).")
            self.state = "halt"
            return self.snapshot()
        if self.state == "halt":
            self._say("err", "sessão parada — reinicie (reset).")
            return self.snapshot()
        if not text:
            self._say("err", "entrada vazia — responda o gate da etapa.")
            return self.snapshot()

        if self.state == "1":
            if low in ("1", "ads"):
                self.category = "ads"
            elif low in ("2", "non-ads", "2. non-ads"):
                self.category = "non-ads"
            else:
                self._say("err", 'responda 1 (ADS) ou 2 (NON-ADS).')
                self._state1()
                return self.snapshot()
            self._state2()

        elif self.state == "2":
            if low == "more":
                self._state2()  # +10 ideias, novo seed
            elif low.isdigit() and 1 <= int(low) <= len(self.ideas):
                self._goto3(self.ideas[int(low) - 1])
            elif text.lower().startswith("custom:") or len(text) > 3:
                idea = text.removeprefix("custom:").removeprefix("CUSTOM:").strip()
                self._say("info", "ideia própria registrada — subject completo.")
                self._goto3(idea if " — " in idea else f"{idea} — custom sequence")
            else:
                self._say("err", "escolha um número (1–10), MORE, ou descreva a sua ideia.")
                self._dump_ideas()

        elif self.state == "3":
            if low == "regenerate":
                self._sheet(initial=False)
            elif low == "next":
                self._clip()
            elif low.startswith("revise"):
                payload = text[6:].strip()
                if "=" in payload:
                    pairs = [p.strip() for p in payload.split(";") if p.strip()]
                    code, log, err = _quiet(engine.cmd_set, slug=self.slug, pairs=pairs)
                    if code == 0:
                        self._say("info", f"revisado: {', '.join(pairs)}")
                        self._sheet(initial=False)
                    else:
                        self._say("err", err or log)
                        self._say("gate", 'Reply "regenerate" …, "revise [what to change]" …, or "next" …. ↓')
                else:
                    self._say("err", "revise mecânica usa slots: revise subject=…; beat_5=…; register=C "
                                     "(ponto-e-vírgula separa vários).")
                    self._say("gate", 'Reply "regenerate" …, "revise [what to change]" …, or "next" …. ↓')
            else:
                self._say("err", 'responda regenerate, revise <slots>, ou next.')
                self._say("gate", 'Reply "regenerate" for another pass, "revise [what to change]" '
                                  'to adjust the prompt, or "next" to animate it. ↓')

        elif self.state == "4":
            if low == "regenerate":
                self._clip()
            elif low == "new":
                self.slug, self.idea, self.ideas = None, None, []
                self._say("sys", "NEW — voltando ao STATE 1 (environment check não re-executa).")
                self._state1()
            else:
                self._say("err", 'responda regenerate ou NEW.')
                self._say("gate", 'Reply "regenerate" for another animation pass, or NEW to start another storyboard. ↓')
        return self.snapshot()

    def snapshot(self) -> dict:
        return {"state": self.state, "category": self.category, "slug": self.slug,
                "seed": self.seed, "mode": self.mode, "lines": self.output}


# ------------------------------------------------------------------- CLI ----

def render_line(ln: dict) -> str:
    t, text = ln["t"], ln["text"]
    if t == "err":
        return engine._c(engine.RED, text)
    if t == "gate":
        return engine._c(engine.YELLOW, text)
    if t in ("sys", "ask"):
        return engine._c(engine.BOLD, text)
    if t == "artifact":
        return engine._c(engine.GREEN, text)
    if t == "info":
        return engine._c(engine.DIM, text)
    return text


def run_cli(mode: str) -> int:
    s = EngineSession(mode=mode)
    print("\n".join(render_line(l) for l in s.snapshot()["lines"]))
    while s.state not in ("halt",):
        try:
            raw = input("\n› ")
        except (EOFError, KeyboardInterrupt):
            print("\n" + render_line({"t": "sys", "text": "■ sessão encerrada."}))
            break
        print("\n".join(render_line(l) for l in s.step(raw)["lines"]))
    return 0
