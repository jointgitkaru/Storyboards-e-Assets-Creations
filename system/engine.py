#!/usr/bin/env python3
"""Storyboard Animation Engine — Production System CLI.

Camadas do blueprint (docs/BLUEPRINT.md):
  M0  biblioteca de protocolos  — registry.json + verify (fidelidade sha256)
  M1  compilador de prompts     — slots + lock blocks -> prompt final
  M2  orquestrador              — produções, etapas, gates, artefatos
  M3  QC automático             — qc.py: painéis, grayscale, runtime, registro
  M4  adaptadores               — adapters.py: cadeia manual/mock/API (fallback)

Núcleo stdlib (Python 3.9+); qc.py e adapters.py são importados sob demanda.
Uso: ver system/README.md.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import glob
import hashlib
import json
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SYSTEM = ROOT / "system"
REGISTRY = SYSTEM / "registry.json"
PRODUCTIONS = ROOT / "productions"

GREEN, RED, YELLOW, DIM, BOLD = "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[1m"
RESET = "\033[0m"


def _c(color: str, text: str) -> str:
    return f"{color}{text}{RESET}"


# ---------------------------------------------------------------- helpers ---

def _now() -> str:
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(_c(RED, f"ERRO: arquivo-fonte ausente: {rel}"))
    return path.read_text(encoding="utf-8").replace("\r\n", "\n")


def _load_registry() -> dict:
    return json.loads(REGISTRY.read_text(encoding="utf-8"))


def _save_registry(reg: dict) -> None:
    REGISTRY.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _prod_path(slug: str) -> Path:
    return PRODUCTIONS / slug


def _load_prod(slug: str) -> dict:
    path = _prod_path(slug) / "production.json"
    if not path.exists():
        raise SystemExit(_c(RED, f"ERRO: produção '{slug}' não existe (veja: engine.py init {slug})"))
    return json.loads(path.read_text(encoding="utf-8"))


def _save_prod(prod: dict) -> None:
    path = _prod_path(prod["slug"]) / "production.json"
    path.write_text(json.dumps(prod, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _parse_value(raw: str):
    low = raw.strip().lower()
    if low in ("true", "yes", "1"):
        return True
    if low in ("false", "no", "0"):
        return False
    return raw


# ------------------------------------------------------------ extraction ---

def extract(spec: dict, source_rel: str) -> str:
    """Extrai o texto do protocolo conforme a regra declarada no registry."""
    kind = spec["kind"]
    text = _read(source_rel)
    if kind == "whole_file":
        return text
    if kind == "first_code_block":
        blocks = re.findall(r"```[a-zA-Z]*\n(.*?)\n```", text, flags=re.S)
        if len(blocks) != 1:
            raise SystemExit(_c(RED, f"ERRO: esperava 1 bloco de código em {source_rel}, achei {len(blocks)}"))
        return blocks[0]
    if kind == "code_block_after":
        idx = text.find(spec["heading"])
        if idx < 0:
            raise SystemExit(_c(RED, f"ERRO: heading não achado em {source_rel}: {spec['heading']}"))
        sub = text[idx:]
        m = re.search(r"```[a-zA-Z]*\n(.*?)\n```", sub, flags=re.S)
        if not m:
            raise SystemExit(_c(RED, f"ERRO: bloco de código não achado após heading em {source_rel}"))
        return m.group(1)
    raise SystemExit(_c(RED, f"ERRO: extração desconhecida: {kind}"))


def style_blocks(reg: dict, register: str) -> tuple[str, str]:
    mod = reg["style_module"]
    if register not in mod["registers"]:
        raise SystemExit(_c(RED, f"ERRO: registro inválido '{register}' (use A, B ou C)"))
    base = extract(mod["base"]["extract"], mod["source"])
    regblock = extract(mod["registers"][register]["extract"], mod["source"])
    return base, regblock


# ---------------------------------------------------------------- verify ---

def _norm(s: str) -> str:
    return re.sub(r"[ \t]+\n", "\n", s)


def compute_verify() -> dict:
    """Fidelidade da biblioteca como dados (CLI e Studio usam isto).

    Retorna {"entries": [...], "problems": int}; cada entry carrega
    {kind, id, sha, drift, unfixed, note?}.
    """
    reg = _load_registry()
    entries: list = []
    problems = 0

    def check(kind: str, label: str, current: str, stored) -> None:
        nonlocal problems
        digest = _sha(current)
        drift = stored is not None and stored != digest
        if drift:
            problems += 1
        entries.append({"kind": kind, "id": label, "sha": digest[:16],
                        "drift": drift, "unfixed": stored is None})

    for proto in reg["protocols"]:
        text = extract(proto["extraction"], proto["source"])
        check("protocol", proto["id"], text, proto.get("sha256"))
        for slot_id, slot in proto.get("slots", {}).items():
            if slot["find"] not in text:
                entries.append({"kind": "slot", "id": proto["id"] + "." + slot_id, "sha": "",
                                "drift": True, "unfixed": False,
                                "note": "placeholder não está na fonte"})
                problems += 1

    mod = reg["style_module"]
    check("style", "BASE", extract(mod["base"]["extract"], mod["source"]), mod["base"].get("sha256"))
    for key, entry in mod["registers"].items():
        check("style", "REGISTER " + key, extract(entry["extract"], mod["source"]), entry.get("sha256"))

    for tpl in reg["templates"]:
        text = (ROOT / tpl["file"]).read_text(encoding="utf-8").replace("\r\n", "\n")
        check("template", tpl["id"], text, tpl.get("sha256"))

    locked = (
        "Use the reference storyboard to make a full animation movie.\n"
        "Audio: diegetic sound only — natural ambience, environmental foley, "
        "and subject-driven sound. No text."
    )
    engine_doc = _read("protocols/storyboard-sheet-5x3/PROMPT STORYBOARD.md").replace("\\", "")
    tpl_clip = (ROOT / "system/templates/clip-engine-5x3.md").read_text(encoding="utf-8")
    ok_doc = locked in _norm(engine_doc)
    ok_tpl = locked in _norm(tpl_clip)
    entries.append({"kind": "cross", "id": "abertura travada do clip (engine v3)", "sha": "",
                    "drift": not (ok_doc and ok_tpl), "unfixed": False,
                    "note": "" if (ok_doc and ok_tpl) else "doc: " + str(ok_doc) + ", template: " + str(ok_tpl)})
    if not (ok_doc and ok_tpl):
        problems += 1
    return {"entries": entries, "problems": problems}


def cmd_verify(args) -> int:
    data = compute_verify()
    entries, problems = data["entries"], data["problems"]
    sections = [("protocol", "M0 · fidelidade dos protocolos"),
                ("slot", "M0 · slots declarados"),
                ("style", "M0 · módulo de estilo"),
                ("template", "M1 · templates da casa"),
                ("cross", "cross-checks entre protocolos")]
    for kind, title in sections:
        part = [e for e in entries if e["kind"] == kind]
        if not part:
            continue
        print(_c(BOLD, "\n{title}"))
        for e in part:
            status = _c(RED, "DRIFT") if e["drift"] else _c(GREEN, "OK   ")
            sha = "  " + _c(DIM, e["sha"]) if e["sha"] else ""
            note = "  " + _c(RED, e["note"]) if e.get("note") else ""
            print("  " + status + " " + e["id"] + sha + note)

    unfixed = [e for e in entries if e["unfixed"] and not e["drift"]]
    if problems:
        print(_c(RED, "\n✗ " + str(problems) + " problema(s) de fidelidade — lock block alterado sem --fix?"))
        return 1
    if args.fix and unfixed:
        reg = _load_registry()
        for proto in reg["protocols"]:
            proto["sha256"] = _sha(extract(proto["extraction"], proto["source"]))
        mod = reg["style_module"]
        mod["base"]["sha256"] = _sha(extract(mod["base"]["extract"], mod["source"]))
        for key, entry in mod["registers"].items():
            entry["sha256"] = _sha(extract(entry["extract"], mod["source"]))
        for tpl in reg["templates"]:
            tpl["sha256"] = _sha((ROOT / tpl["file"]).read_text(encoding="utf-8").replace("\r\n", "\n"))
        reg["updated"] = _dt.date.today().isoformat()
        _save_registry(reg)
        print(_c(YELLOW, "\n↻ " + str(len(unfixed)) + " hash(es) gravados no registry (edição intencional registrada)."))
    elif unfixed:
        print(_c(YELLOW, "\nℹ " + str(len(unfixed)) + " entrada(s) sem hash — rode engine.py verify --fix para gravar."))

    print(_c(GREEN, "\n✓ biblioteca íntegra — lock blocks batem com as fontes."))
    return 0


# ------------------------------------------------------------ protocols ---

def cmd_protocols(args) -> int:
    reg = _load_registry()
    print(_c(BOLD, "protocolos registrados (M0)"))
    for p in reg["protocols"]:
        n = len(p.get("slots", {}))
        print(f"  · {p['id']:<22} v?  slots: {n:<2}  {_c(DIM, p['source'])}")
    print(_c(BOLD, "\nmódulo de estilo"))
    m = reg["style_module"]
    print(f"  · {m['id']:<22} BASE + registros A/B/C  {_c(DIM, m['source'])}")
    print(_c(BOLD, "\ntemplates da casa (não travados)"))
    for t in reg["templates"]:
        print(f"  · {t['id']:<22} {_c(DIM, t['file'])}")
    return 0


# ---------------------------------------------------------------- init/set ---

def cmd_init(args) -> int:
    reg = _load_registry()
    slug = args.slug
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise SystemExit(_c(RED, "ERRO: slug só com a-z, 0-9 e hífen"))
    pdir = _prod_path(slug)
    if pdir.exists():
        raise SystemExit(_c(RED, f"ERRO: produção '{slug}' já existe"))
    if args.register and args.register not in reg["style_module"]["registers"]:
        raise SystemExit(_c(RED, "ERRO: --register deve ser A, B ou C"))
    for sub in ("prompts", "renders", "assets"):
        (pdir / sub).mkdir(parents=True)
    prod = {
        "slug": slug,
        "title": args.title or slug.replace("-", " ").title(),
        "created": _now(),
        "register": args.register or None,
        "slots": {},
        "stages": {},
    }
    _save_prod(prod)
    print(_c(GREEN, f"✓ produção '{slug}' criada em productions/{slug}/"))
    if not args.register:
        print(_c(YELLOW, "  próximo passo: escolha o registro de estilo (um por produção):"))
        print("    engine.py set " + slug + " register=B   # A feature · B commercial · C documentary")
    return 0


def cmd_set(args) -> int:
    prod = _load_prod(args.slug)
    reserved = {"title", "register"}
    for pair in args.pairs:
        if "=" not in pair:
            raise SystemExit(_c(RED, f"ERRO: esperava chave=valor, veio '{pair}'"))
        key, _, raw = pair.partition("=")
        if key in reserved:
            if key == "register":
                reg = _load_registry()
                if raw not in reg["style_module"]["registers"]:
                    raise SystemExit(_c(RED, "ERRO: register deve ser A, B ou C"))
                prod["register"] = raw
            else:
                prod[key] = raw
        else:
            prod["slots"][key] = _parse_value(raw)
    _save_prod(prod)
    print(_c(GREEN, f"✓ {len(args.pairs)} campo(s) gravado(s) em {args.slug}"))
    return 0


# ---------------------------------------------------------------- render ---

BEATS = (["opening beat: what we see, the framing, what is moving"]
         + ["next beat, different framing, real motion"] * 6
         + ["midpoint beat, different framing, real motion"]
         + ["next beat, different framing, real motion"] * 5
         + ["penultimate beat, different framing, real motion"]
         + ["closing beat: the payoff frame, different framing, real motion"])


def _tc(i: int) -> str:
    return f"00:{i - 1:02d}–00:{i:02d}"


class GateStop(Exception):
    pass


def _gate_msg(msg: str) -> None:
    print(_c(RED, f"\n■ {msg}"))


def _check_gates(stage: dict, prod: dict, reg: dict) -> None:
    for gate in stage.get("gates", []):
        t, slots = gate["type"], prod["slots"]
        if t == "file_exists":
            fname = slots.get(gate["slot"])
            ok = bool(fname) and (_prod_path(prod["slug"]) / "assets" / str(fname)).exists()
        elif t == "flag":
            ok = slots.get(gate["slot"]) == gate["value"]
        elif t == "artifact":
            ok = bool(glob.glob(str(_prod_path(prod["slug"]) / gate["in"] / gate["pattern"])))
        elif t == "stage_rendered":
            ok = prod.get("stages", {}).get(gate["stage"], {}).get("status") == "rendered"
        elif t == "style_register":
            ok = prod.get("register") in reg["style_module"]["registers"]
        elif t == "slot_set":
            ok = bool(slots.get(gate["slot"]))
        else:
            ok = False
        if not ok:
            raise GateStop(gate["message"])


def _fill_protocol(text: str, proto: dict, slots: dict) -> tuple[str, list, list]:
    missing, filled = [], []
    for slot_id, slot in proto.get("slots", {}).items():
        val = slots.get(slot_id)
        if val in (None, ""):
            if slot["required"]:
                missing.append(slot_id)
            continue
        val = str(val)
        if slot.get("numeric"):
            try:
                float(val)
            except ValueError:
                raise SystemExit(_c(RED, f"ERRO: slot '{slot_id}' precisa ser numérico — veio '{val}'"))
        if slot["find"] not in text:
            raise SystemExit(_c(RED, f"ERRO: placeholder de '{slot_id}' sumiu da fonte — rode engine.py verify"))
        # troca só o segmento [ ... ] do placeholder, preservando o rótulo do campo;
        # sem colchetes no anchor (ex.: bloco de views), substitui o bloco inteiro
        seg = re.search(r"\[[^\[\]]*\]", slot["find"])
        new = slot["find"].replace(seg.group(0), val, 1) if seg else val
        text = text.replace(slot["find"], new, 1)
        filled.append(slot_id)
    return text, filled, missing


def _style_paste(reg: dict, prod: dict) -> str:
    base, regblock = style_blocks(reg, prod["register"])
    return base + "\n\n" + regblock


def _render_template(stage: dict, tpl_text: str, prod: dict, reg: dict) -> tuple[str, list, list]:
    slots = prod["slots"]
    filled, missing = [], []

    def use(key, default=None, required=False):
        val = slots.get(key, default)
        if val in (None, ""):
            if required:
                missing.append(key)
            return None
        filled.append(key)
        return str(val)

    if stage["template"] == "storyboard-sheet-5x3":
        subject = use("subject", required=True)
        colour = use("colour", default="near-black")
        subject_long = use("subject_long", default=subject)
        title_word = use("title_word", default=prod["title"])
        format_label = use("format_label", default="15 SEC — FILM")
        ar = use("aspect_ratio", default="16:9")
        if subject:
            tpl_text = tpl_text.replace("the same [SUBJECT] throughout", f"the same {subject} throughout")
            tpl_text = tpl_text.replace(
                "THE SUBJECT: [Full concrete description. For a product: exact model, "
                "exact colourway, finish, every surface detail, every proportion.]",
                f"THE SUBJECT: {subject_long}")
        if colour:
            tpl_text = tpl_text.replace("one [colour] card", f"one {colour} card")
        if title_word:
            tpl_text = tpl_text.replace("[title word]", title_word)
        if format_label:
            tpl_text = tpl_text.replace("[format label]", format_label)
        if ar:
            tpl_text = tpl_text.replace("[aspect ratio]", ar)
        for i, desc in enumerate(BEATS, start=1):
            beat = use(f"beat_{i}")
            if beat:
                tpl_text = tpl_text.replace(f"Panel {i} — {_tc(i)} — [{desc}]", f"Panel {i} — {_tc(i)} — {beat}")
        style_lines = ("STYLE: [Full render language, named explicitly — e.g. ultra-photorealistic "
                       "cinematic product photography, 8K, shallow depth of field. Or: hand-painted "
                       "anime storyboard, aged paper card, ink and gouache.]\n"
                       "LIGHTING: [Exact setup — identical across all fifteen panels.]\n"
                       "COLOUR GRADE: [Exact grade — identical across all fifteen panels.]")
        if prod.get("register"):
            tpl_text = tpl_text.replace(style_lines,
                                        "STYLE / LIGHTING / COLOUR GRADE (locked — written once, "
                                        "pasted word for word):\n\n" + _style_paste(reg, prod))
            filled.append("@style_module")
        else:
            print(_c(YELLOW, "  ⚠ sem registro de estilo — preencha STYLE/LIGHTING/COLOUR GRADE à mão "
                             "ou: engine.py set " + prod["slug"] + " register=B"))
        return tpl_text, filled, missing

    # templates {{PLACEHOLDER}}
    mapping = {
        "TITLE": lambda: prod.get("title", prod["slug"]),
        "SUBJECT": lambda: use("subject", required=True),
        "SCENE": lambda: use("scene", default="(mesmo ambiente do sujeito — completar)"),
        "FRAMING": lambda: use("framing", default="wide establishing, subject legível no ambiente"),
        "ASPECT_RATIO": lambda: use("aspect_ratio", default="16:9"),
        "DURATION": lambda: use("duration", default="15s"),
    }

    def repl(match: re.Match) -> str:
        name = match.group(1)
        if name == "STYLE_BASE":
            if not prod.get("register"):
                raise GateStop("GATE (módulo de estilo): um registro por produção. "
                               "engine.py set " + prod["slug"] + " register=B")
            return style_blocks(reg, prod["register"])[0]
        if name == "STYLE_REGISTER":
            if not prod.get("register"):
                raise GateStop("GATE (módulo de estilo): um registro por produção. "
                               "engine.py set " + prod["slug"] + " register=B")
            return style_blocks(reg, prod["register"])[1]
        fn = mapping.get(name)
        if fn is None:
            return match.group(0)
        val = fn()
        return match.group(0) if val is None else str(val)

    tpl_text = re.sub(r"\{\{(\w+)\}\}", repl, tpl_text)
    return tpl_text, filled, missing


def _compile_stage(slug: str, stage_id: str) -> dict:
    """Compila a etapa: gates → prompt → grava .txt + .meta.json → registra.

    Retorna {"gate": msg} se um gate bloqueou, {"missing": [...]} se faltou
    slot obrigatório, ou o pacote completo da compilação.
    """
    reg = _load_registry()
    prod = _load_prod(slug)
    stage = next((s for s in reg["stages"] if s["id"] == stage_id), None)
    if stage is None:
        ids = ", ".join(s["id"] for s in reg["stages"])
        raise SystemExit(_c(RED, f"ERRO: etapa '{stage_id}' não existe. Disponíveis: {ids}"))

    try:
        _check_gates(stage, prod, reg)
    except GateStop as g:
        return {"gate": str(g)}

    filled: list = []
    missing: list = []
    if stage["kind"] == "protocol":
        proto = next(p for p in reg["protocols"] if p["id"] == stage["protocol"])
        text = extract(proto["extraction"], proto["source"])
        text, filled, missing = _fill_protocol(text, proto, prod["slots"])
        source_desc = f"protocolo {proto['id']} ({_c(DIM, proto['source'])})"
    else:
        tpl = next(t for t in reg["templates"] if t["id"] == stage["template"])
        text = (ROOT / tpl["file"]).read_text(encoding="utf-8").replace("\r\n", "\n")
        text = re.sub(r"<!--.*?-->\n", "", text, flags=re.S).lstrip("\n")  # comentários não vão ao modelo
        try:
            text, filled, missing = _render_template(stage, text, prod, reg)
        except GateStop as g:
            return {"gate": str(g)}
        source_desc = f"template {tpl['id']} ({_c(DIM, tpl['file'])})"

    if missing:
        return {"missing": missing}

    pdir = _prod_path(slug)
    fname = f"{stage['order']:02d}-{stage['id']}.txt"
    (pdir / "prompts" / fname).write_text(text, encoding="utf-8")
    (pdir / "prompts" / (fname + ".meta.json")).write_text(json.dumps({
        "stage": stage["id"],
        "source": source_desc,
        "template_sha256": _sha(text),
        "slots_used": filled,
        "style_register": prod.get("register"),
        "rendered_at": _now(),
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    prod.setdefault("stages", {})[stage["id"]] = {
        "status": "rendered", "prompt": f"prompts/{fname}", "rendered_at": _now(),
    }
    _save_prod(prod)
    return {"reg": reg, "prod": prod, "stage": stage, "text": text,
            "source": source_desc, "filled": filled, "fname": fname}


def _print_compiled(slug: str, r: dict) -> None:
    stage = r["stage"]
    fname = r["fname"]
    print(_c(BOLD, f"\n▸ {stage['order']}. {stage['name']}"))
    print(f"  fonte    : {r['source']}")
    print(f"  slots    : {', '.join(r['filled']) if r['filled'] else _c(DIM, 'nenhum (prompt 100% travado)')}")
    if "@style_module" in r["filled"]:
        print(_c(GREEN, "  estilo   : BASE + registro colados palavra por palavra (regra da casa)"))
    print(f"  saída    : {_c(GREEN, f'productions/{slug}/prompts/{fname}')}"
          f"  {_c(DIM, '+ .meta.json (provenance)')}")
    print(f"  ferramenta: {stage['tool_hint']}")


def cmd_render(args) -> int:
    r = _compile_stage(args.slug, args.stage)
    if "gate" in r:
        _gate_msg(r["gate"])
        return 2
    if "missing" in r:
        print(_c(RED, f"\n■ GATE: slots obrigatórios ausentes → {', '.join(r['missing'])}"))
        print(_c(DIM, "  preencha com: engine.py set " + args.slug + " <slot>=<valor>"))
        return 2
    _print_compiled(args.slug, r)
    print(_c(DIM, "  modo híbrido: cole o .txt na ferramenta e traga o arquivo para renders/"))
    return 0


# ---------------------------------------------------------------- run (M4) ---

def _stage_inputs(stage: dict, prod: dict, pdir: Path) -> list:
    """Arquivos de entrada da etapa (derivados dos gates de artefato/asset)."""
    refs = []
    for gate in stage.get("gates", []):
        if gate["type"] == "artifact":
            refs += [Path(f) for f in glob.glob(str(pdir / gate["in"] / gate["pattern"]))]
        elif gate["type"] == "file_exists":
            fname = prod["slots"].get(gate["slot"])
            f = pdir / "assets" / str(fname)
            if fname and f.exists():
                refs.append(f)
    return sorted(set(refs))


def cmd_run(args) -> int:
    import adapters  # M4 — import lazy: camada opcional
    r = _compile_stage(args.slug, args.stage)
    if "gate" in r:
        _gate_msg(r["gate"])
        return 2
    if "missing" in r:
        print(_c(RED, f"\n■ GATE: slots obrigatórios ausentes → {', '.join(r['missing'])}"))
        print(_c(DIM, "  preencha com: engine.py set " + args.slug + " <slot>=<valor>"))
        return 2
    _print_compiled(args.slug, r)
    stage = r["stage"]
    pdir = _prod_path(args.slug)
    kind = "video" if stage["id"].startswith("clip") else "image"
    ext = ".mp4" if kind == "video" else ".png"
    out = pdir / "renders" / f"{stage['id']}{ext}"
    refs = _stage_inputs(stage, r["prod"], pdir)
    prompt_file = pdir / "prompts" / r["fname"]

    chain = adapters.build_chain(kind, force_mock=args.mock, force_manual=args.manual)
    print(_c(BOLD, f"\nrender via cadeia ({kind}): " + " → ".join(a.id for a in chain)))
    for i, ad in enumerate(chain):
        if i:
            print(_c(YELLOW, f"  ↻ fallback → {ad.id}"))
        ok, note = ad.generate(prompt_file, out, refs, stage["tool_hint"])
        if ok:
            prod = _load_prod(args.slug)
            prod["stages"][stage["id"]]["artifact"] = f"renders/{out.name}"
            prod["stages"][stage["id"]]["adapter"] = ad.id
            _save_prod(prod)
            print(_c(GREEN, f"  ✓ {ad.id}: {note}"))
            print(f"  artefato : productions/{args.slug}/renders/{out.name}")
            if stage["id"] in ("storyboard-sheet", "depth-board"):
                print(_c(DIM, f"  próximo  : python3 system/engine.py qc-image {args.slug} panels {stage['id']}"))
            return 0
        print(_c(RED, f"  ✗ {ad.id}: {note}"))
    prod = _load_prod(args.slug)   # cadeia terminou no manual → aguardando artefato
    prod["stages"][stage["id"]]["status"] = "awaiting_artifact"
    _save_prod(prod)
    print(_c(YELLOW, f"\n■ produção aguardando artefato manual — instruções em renders/{out.name}.pending.md"))
    print(_c(DIM, f"  depois de gerar: engine.py attach {args.slug} {stage['id']} <arquivo>"))
    return 3


def cmd_attach(args) -> int:
    import shutil
    prod = _load_prod(args.slug)
    reg = _load_registry()
    stage = next((s for s in reg["stages"] if s["id"] == args.stage), None)
    if stage is None:
        raise SystemExit(_c(RED, "ERRO: etapa desconhecida"))
    src = Path(args.file)
    if not src.exists():
        raise SystemExit(_c(RED, f"ERRO: arquivo não encontrado: {args.file}"))
    kind = "video" if stage["id"].startswith("clip") else "image"
    ext = ".mp4" if kind == "video" else (src.suffix or ".png")
    dst = _prod_path(args.slug) / "renders" / f"{stage['id']}{ext}"
    shutil.copy2(src, dst)
    st = prod.setdefault("stages", {}).setdefault(stage["id"], {})
    st.update({"status": "rendered", "artifact": f"renders/{dst.name}", "adapter": "manual"})
    _save_prod(prod)
    print(_c(GREEN, f"✓ artefato registrado: productions/{args.slug}/{dst.name}"))
    return 0


# ---------------------------------------------------------------- status ---

def cmd_status(args) -> int:
    prod = _load_prod(args.slug)
    reg = _load_registry()
    pdir = _prod_path(args.slug)
    print(_c(BOLD, f"produção: {prod['slug']}") + _c(DIM, f"  · criada {prod['created'][:10]}"))
    print(f"título   : {prod['title']}")
    print(f"registro : {prod.get('register') or _c(YELLOW, 'não escolhido (A/B/C)')}")
    print(f"slots    : {len(prod['slots'])} definidos")
    print(_c(BOLD, "\netapas:"))
    for s in reg["stages"]:
        st = prod.get("stages", {}).get(s["id"], {})
        if st.get("status") == "rendered":
            mark = _c(GREEN, "●")
        elif st.get("status") == "awaiting_artifact":
            mark = _c(YELLOW, "◐")
        else:
            mark = _c(DIM, "○")
        alt = _c(YELLOW, " (alternativa)") if s["id"] in ("storyboard-sheet", "clip-5x3") else ""
        opt = _c(DIM, " (opcional)") if s.get("optional") else ""
        print(f"  {mark} {s['order']}. {s['id']:<17}{opt}{alt}")
        if st.get("prompt"):
            extras = f"  via {st['adapter']}" if st.get("adapter") else ""
            print(f"      {_c(DIM, st['prompt'])}{extras}")
    renders = sorted(x.name for x in (pdir / "renders").iterdir()) if (pdir / "renders").exists() else []
    assets = sorted(x.name for x in (pdir / "assets").iterdir()) if (pdir / "assets").exists() else []
    print(_c(BOLD, "\nrenders:"), ", ".join(renders) or _c(DIM, "vazio"))
    print(_c(BOLD, "assets :"), ", ".join(assets) or _c(DIM, "vazio"))
    return 0


# ---------------------------------------------------------------- qc ------

QC_EXPECTED = {
    "panels": {"storyboard-sheet": 15, "depth-board": 9},
    "runtime": {"clip": "0:15", "clip-5x3": "0:15"},
    "grayscale": {"depth-map": True},
}


def cmd_qc(args) -> int:
    prod = _load_prod(args.slug)
    check, stage_id = args.check, args.stage
    expected = QC_EXPECTED.get(check, {}).get(stage_id)
    if expected is None:
        raise SystemExit(_c(RED, f"ERRO: QC '{check}' não se aplica a '{stage_id}'"))
    if stage_id not in prod.get("stages", {}):
        raise SystemExit(_c(RED, f"ERRO: etapa '{stage_id}' ainda não foi renderizada"))
    val = _parse_value(args.value)
    passed = (val == expected) if isinstance(expected, bool) else (str(val) == str(expected))
    entry = {"check": check, "value": str(val), "expected": str(expected),
             "pass": passed, "at": _now()}
    prod["stages"][stage_id].setdefault("qc", []).append(entry)
    _save_prod(prod)
    if passed:
        print(_c(GREEN, f"✓ QC {check} passou para {stage_id} ({val})"))
        return 0
    print(_c(RED, f"✗ QC {check} FALHOU para {stage_id}: veio {val}, esperado {expected}"))
    print(_c(DIM, "  regra do engine: off-geometry → regenerate, nunca apresentar como pronto."))
    return 1


# ------------------------------------------------------- qc automático (M3) ---

def _find_render(pdir: Path, stage_id: str):
    import adapters  # MEDIA_EXT
    for ext in adapters.MEDIA_EXT:
        p = pdir / "renders" / f"{stage_id}{ext}"
        if p.exists():
            return p
    return None


def _record_qc(prod: dict, stage_id: str, entry: dict) -> None:
    prod["stages"][stage_id].setdefault("qc", []).append(entry)
    _save_prod(prod)


def cmd_qc_image(args) -> int:
    import qc as qcmod
    prod = _load_prod(args.slug)
    pdir = _prod_path(args.slug)
    if args.stage not in prod.get("stages", {}):
        raise SystemExit(_c(RED, f"ERRO: etapa '{args.stage}' ainda não foi renderizada"))
    art = _find_render(pdir, args.stage)
    if art is None:
        raise SystemExit(_c(RED, f"ERRO: sem artefato renders/{args.stage}.* — use `run`/`attach` primeiro"))
    try:
        img = qcmod.load_image(art)
    except ValueError as e:
        raise SystemExit(_c(RED, f"ERRO: {e}"))
    if args.check == "panels":
        res = qcmod.count_panels(img)
        expected = int(args.expected) if args.expected else QC_EXPECTED["panels"].get(args.stage)
        if expected is None:
            raise SystemExit(_c(RED, "ERRO: QC panels não se aplica à etapa — passe o esperado como argumento"))
        value = f"{res['cols']}x{res['rows']}={res['panels']}"
        ok = res["panels"] == expected
        print(f"  artefato : renders/{art.name} ({img.w}×{img.h})")
        print(f"  detectado: {res['cols']} colunas × {res['rows']} linhas = {res['panels']} painéis  "
              + _c(DIM, f"bandas de linha: {len(res['row_bands'])} → mantidas {len(res['rows_kept'])} "
                         f"(filtros de chrome/fino)"))
        if ok:
            print(_c(GREEN, f"✓ QC panels passou para {args.stage} ({value} = esperado)"))
        else:
            print(_c(RED, f"✗ QC panels FALHOU para {args.stage}: {value}, esperado {expected}"))
            print(_c(DIM, "  regra do engine: off-geometry → regenerate, nunca apresentar como pronto."))
        _record_qc(prod, args.stage, {"check": "panels", "value": value, "expected": str(expected),
                                      "pass": ok, "mode": "auto", "artifact": art.name, "at": _now()})
        return 0 if ok else 1
    if args.check == "grayscale":
        res = qcmod.check_grayscale(img)
        pct = f"{res['ratio']:.2%}"
        print(f"  artefato : renders/{art.name} ({img.w}×{img.h}) — {pct} dos pixels com desvio ≤ {res['tolerance']}")
        if res["ok"]:
            print(_c(GREEN, f"✓ QC grayscale passou para {args.stage}"))
        else:
            print(_c(RED, f"✗ QC grayscale FALHOU para {args.stage} — depth map com cor"))
        _record_qc(prod, args.stage, {"check": "grayscale", "value": pct, "expected": "≥99.5%",
                                      "pass": res["ok"], "mode": "auto", "artifact": art.name, "at": _now()})
        return 0 if res["ok"] else 1
    raise SystemExit(_c(RED, "ERRO: check deve ser panels|grayscale"))


def _secs(fmt: str) -> float:
    parts = [float(p) for p in str(fmt).split(":")]
    return parts[0] * 60 + parts[1] if len(parts) > 1 else parts[0]


def cmd_qc_video(args) -> int:
    import qc as qcmod
    prod = _load_prod(args.slug)
    if args.stage not in prod.get("stages", {}):
        raise SystemExit(_c(RED, f"ERRO: etapa '{args.stage}' ainda não foi renderizada"))
    art = _find_render(_prod_path(args.slug), args.stage)
    if art is None or art.suffix not in (".mp4", ".mov"):
        raise SystemExit(_c(RED, f"ERRO: sem renders/{args.stage}.mp4 — use `run`/`attach` primeiro"))
    dur = qcmod.mp4_duration(art)
    if dur is None:
        raise SystemExit(_c(RED, "ERRO: moov/mvhd não encontrado no mp4"))
    expected = _secs(QC_EXPECTED["runtime"].get(args.stage, "0:15"))
    ok = abs(dur - expected) <= 1.0
    print(f"  artefato : renders/{art.name} — duração {dur:.2f}s ({qcmod.fmt_runtime(dur)})")
    if ok:
        print(_c(GREEN, f"✓ QC runtime passou para {args.stage} (esperado ~{qcmod.fmt_runtime(expected)}, tol 1s)"))
    else:
        print(_c(RED, f"✗ QC runtime FALHOU: {dur:.2f}s vs esperado {expected:.0f}s"))
        print(_c(DIM, "  regra do engine: nunca encurtar em silêncio — divida em beats nomeados ou pergunte."))
    _record_qc(prod, args.stage, {"check": "runtime", "value": f"{dur:.2f}s",
                                  "expected": f"~{expected:.0f}s", "pass": ok, "mode": "auto",
                                  "artifact": art.name, "at": _now()})
    return 0 if ok else 1


def cmd_qc_register(args) -> int:
    import qc as qcmod
    reg = _load_registry()
    prod = _load_prod(args.slug)
    if not prod.get("register"):
        raise SystemExit(_c(YELLOW, "ERRO: produção sem registro de estilo — engine.py set "
                                    + args.slug + " register=A|B|C"))
    base, regblock = style_blocks(reg, prod["register"])
    rows = qcmod.register_consistency(prod, _prod_path(args.slug), base, regblock, prod["register"])
    if not rows:
        print(_c(DIM, "  nenhuma etapa com prompt compilado ainda"))
        return 0
    print(_c(BOLD, f"consistência do registro {prod['register']} (BASE + registro, palavra por palavra):"))
    fails = 0
    for row in rows:
        mark = _c(GREEN, "✓") if row["ok"] else _c(RED, "✗")
        note = f"  {_c(RED, row['note'])}" if row["note"] else ""
        print(f"  {mark} {row['stage']:<17} {row['check']}{note}")
        fails += 0 if row["ok"] else 1
    return 1 if fails else 0


def cmd_qc_all(args) -> int:
    prod = _load_prod(args.slug)
    pdir = _prod_path(args.slug)
    print(_c(BOLD, f"QC completo — {args.slug}\n"))
    code = 0
    for sid in ("storyboard-sheet", "depth-board", "depth-map"):
        if sid in prod.get("stages", {}) and _find_render(pdir, sid):
            check = "grayscale" if sid == "depth-map" else "panels"
            code |= cmd_qc_image(argparse.Namespace(slug=args.slug, check=check, stage=sid, expected=None))
            print()
    for sid in ("clip", "clip-5x3"):
        if sid in prod.get("stages", {}) and (pdir / "renders" / f"{sid}.mp4").exists():
            code |= cmd_qc_video(argparse.Namespace(slug=args.slug, stage=sid))
            print()
    code |= cmd_qc_register(argparse.Namespace(slug=args.slug))
    print(_c(GREEN if code == 0 else RED,
             "\n✓ QC completo: todas as checagens passaram" if code == 0 else "\n✗ QC completo: falha(s)"))
    return code


# ---------------------------------------------------------------- ideas -----

IDEA_PRODUCTS = ["iPhone 17 Pro", "Samsung Galaxy S26 Ultra", "Google Pixel 10 Pro",
                 "MacBook Air M4", "iPad Pro 13\u2033", "AirPods Pro 3", "Apple Watch Series 11",
                 "Sony WH-1000XM6", "Nike Air Max 95", "Dyson V12"]
IDEA_COLOURWAYS = ["white", "pink", "gold", "red", "matte black", "natural titanium",
                   "navy", "silver", "desert sand", "deep green"]
IDEA_AD_HOOKS = [
    "rotating reveal on black marble as light rakes the edges",
    "macro texture tour: glass, metal, stitch, grain",
    "slow-motion drop onto a water surface, splash crown",
    "unboxing loop with paper folds and a ribbon pull",
    "night-city glide with reflections rippling across the body",
    "liquid chrome pour that solidifies into the product",
    "freeze-frame burst through flour and petals",
    "top-down studio orbit with hard shadow sweeps",
    "dark stone pedestal with haze rim light building to hero",
    "kinetic beat cut: one detail per panel, no type",
]
IDEA_SCENES = ["downhill skate run through old-town stairs", "anime kitchen at dawn: knife work and steam",
               "creature harvesting grapes from a giant tree", "parkour rooftop crossing at dusk",
               "rain-soaked neon alley with a stray cat", "lighthouse keeper against a building storm",
               "desert convoy kicking dust at golden hour", "surfer's last wave as the sun dies",
               "maker's workshop: sawdust, sparks, quiet focus", "first snowboard tracks through a silent forest"]
IDEA_SCENE_HOOKS = [
    "held wide opening, then tighter and tighter framing to the end",
    "a discovery beat that flips the mood of the sequence",
    "camera chases low and close, dust in the lens",
    "silhouette play against one big natural light source",
    "weather as the antagonist, the subject fighting through",
    "one hero prop carries the whole arc",
    "sound-first beats: every panel has a foley anchor",
    "slow build into a single kinetic burst, then stillness",
    "aftermath quiet: two panels of breath at the end",
    "final frame recontextualizes the first",
]


def generate_ideas(category: str, seed: int) -> list:
    """STATE 2 - 10 ideias deterministicas por seed (CLI e Studio)."""
    rng = random.Random(seed)
    if category == "ads":
        prods, cols = IDEA_PRODUCTS[:], IDEA_COLOURWAYS[:]
        rng.shuffle(prods)
        rng.shuffle(cols)
        hooks = IDEA_AD_HOOKS[:]
        rng.shuffle(hooks)
        return [col + " " + p + " — " + h for p, col, h in zip(prods, cols, hooks)]
    scenes = IDEA_SCENES[:]
    rng.shuffle(scenes)
    hooks = IDEA_SCENE_HOOKS[:]
    rng.shuffle(hooks)
    return [s + " — " + h for s, h in zip(scenes, hooks)]


def cmd_ideas(args) -> int:
    seed = args.seed if args.seed is not None else random.randrange(1, 10 ** 6)
    ideas = generate_ideas(args.category, seed)
    label = "ADS" if args.category == "ads" else "NON-ADS"
    print(_c(BOLD, "STATE 2 — 10 ideias · " + label) + _c(DIM, "  · seed " + str(seed) + " (reproduzível)\n"))
    for i, idea in enumerate(ideas, 1):
        print("  " + str(i).rjust(2) + ". " + idea)
    print("\nPick a number, type MORE for 10 fresh ideas (--seed N), or describe your own. ↓")
    print(_c(DIM, "\n  para virar produção:"))
    print(_c(DIM, "    engine.py init <slug> --register B"))
    print(_c(DIM, "    engine.py set <slug> subject=… title_word=… format_label=\"15 SEC — PRODUCT FILM\""))
    print(_c(DIM, "    engine.py run <slug> storyboard-sheet   # compila + renderiza pela cadeia"))
    return 0


# ---------------------------------------------------------------- stub ----

def cmd_stub(args) -> int:
    import synth
    synth.png_solid(ROOT / args.path)
    print(_c(GREEN, f"✓ stub criado: {args.path} (96×64, cinza — substitua pelo render real)"))
    return 0


def cmd_stub_grid(args) -> int:
    import synth
    synth.png_grid(ROOT / args.path, cols=args.cols, rows=args.rows)
    print(_c(GREEN, f"✓ stub-grid criado: {args.path} ({args.cols}×{args.rows} — painéis texturizados para testar qc-image panels)"))
    return 0


# ---------------------------------------------------------------- session ---

def cmd_session(args) -> int:
    import session  # Fase 3 — máquina de estados 0–4 (import lazy)
    return session.run_cli(mode="mock" if args.mock else "auto")


# ---------------------------------------------------------------- main ----



def main() -> int:
    ap = argparse.ArgumentParser(prog="engine.py", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    v = sub.add_parser("verify", help="verifica fidelidade da biblioteca vs fontes (sha256)")
    v.add_argument("--fix", action="store_true", help="grava hashes após edição intencional")
    v.set_defaults(fn=cmd_verify)

    sub.add_parser("protocols", help="lista protocolos/templates registrados").set_defaults(fn=cmd_protocols, args=None)

    i = sub.add_parser("init", help="cria uma produção")
    i.add_argument("slug")
    i.add_argument("--title")
    i.add_argument("--register", help="A, B ou C")
    i.set_defaults(fn=cmd_init)

    s = sub.add_parser("set", help="define slots/título/registro")
    s.add_argument("slug")
    s.add_argument("pairs", nargs="+", metavar="chave=valor")
    s.set_defaults(fn=cmd_set)

    r = sub.add_parser("render", help="compila o prompt de uma etapa (modo híbrido)")
    r.add_argument("slug")
    r.add_argument("stage")
    r.set_defaults(fn=cmd_render)

    ru = sub.add_parser("run", help="compila e renderiza pela cadeia de adaptadores (M4)")
    ru.add_argument("slug")
    ru.add_argument("stage")
    ru.add_argument("--mock", action="store_true", help="força adaptador mock (stub sintético)")
    ru.add_argument("--manual", action="store_true", help="força modo manual (grava .pending.md)")
    ru.set_defaults(fn=cmd_run)

    at = sub.add_parser("attach", help="registra um arquivo gerado manualmente como artefato da etapa")
    at.add_argument("slug")
    at.add_argument("stage")
    at.add_argument("file")
    at.set_defaults(fn=cmd_attach)

    st = sub.add_parser("status", help="estado da produção")
    st.add_argument("slug")
    st.set_defaults(fn=cmd_status)

    q = sub.add_parser("qc", help="registra verificação declarada (panels|runtime|grayscale)")
    q.add_argument("slug")
    q.add_argument("check")
    q.add_argument("stage")
    q.add_argument("value")
    q.set_defaults(fn=cmd_qc)

    qi = sub.add_parser("qc-image", help="QC automático de imagem: conta painéis / checa grayscale (M3)")
    qi.add_argument("slug")
    qi.add_argument("check", choices=["panels", "grayscale"])
    qi.add_argument("stage")
    qi.add_argument("expected", nargs="?", help="painéis esperados (default: QC_EXPECTED)")
    qi.set_defaults(fn=cmd_qc_image)

    qv = sub.add_parser("qc-video", help="QC automático de runtime (parse moov/mvhd do mp4)")
    qv.add_argument("slug")
    qv.add_argument("stage")
    qv.set_defaults(fn=cmd_qc_video)

    qr = sub.add_parser("qc-register", help="consistência BASE+registro entre as etapas (palavra por palavra)")
    qr.add_argument("slug")
    qr.set_defaults(fn=cmd_qc_register)

    qa = sub.add_parser("qc-all", help="roda todos os QC aplicáveis da produção")
    qa.add_argument("slug")
    qa.set_defaults(fn=cmd_qc_all)

    id_ = sub.add_parser("ideas", help="STATE 2 do engine: 10 ideias (ads|non-ads), seed reproduzível")
    id_.add_argument("--category", "-c", choices=["ads", "non-ads"], default="ads")
    id_.add_argument("--seed", type=int, default=None)
    id_.set_defaults(fn=cmd_ideas)

    sb = sub.add_parser("stub", help="cria PNG cinza para testar gates de artefato")
    sb.add_argument("path")
    sb.set_defaults(fn=cmd_stub)

    sg = sub.add_parser("stub-grid", help="cria PNG grid cols×rows texturizado para testar QC de painéis")
    sg.add_argument("path")
    sg.add_argument("--cols", type=int, default=5)
    sg.add_argument("--rows", type=int, default=3)
    sg.set_defaults(fn=cmd_stub_grid)

    se = sub.add_parser("session", help="Fase 3: engine interativo STATE 0–4 (ads/non-ads → ideias → sheet → clip)")
    se.add_argument("--mock", action="store_true", help="renderiza via mock (stub sintético)")
    se.set_defaults(fn=cmd_session)

    args = ap.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
