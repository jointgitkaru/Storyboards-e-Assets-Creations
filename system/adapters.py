"""M4 — adaptadores de modelo com fallback chain.

Regra do engine: **nunca substituição silenciosa** — o par que renderizou é
sempre anunciado e gravado no production.json (`stages.<id>.adapter`).

Adaptadores:
  manual        modo híbrido (fase A): grava instruções .pending.md e aguarda
                o operador colar o prompt na ferramenta e trazer o arquivo
                (`engine.py attach` registra o artefato).
  mock          stub sintético (ENGINE_MOCK=1 ou --mock) — testa a cadeia e o
                QC sem gastar chamadas de modelo.
  openai-image  endpoint compatível com a API de imagens (env IMAGE_API_URL/
                IMAGE_KEY/IMAGE_MODEL — experimental, fase B).
  openai-video  endpoint de vídeo compatível (env VIDEO_API_URL/VIDEO_KEY/
                VIDEO_MODEL — experimental, fase B; APIs reais costumam ser
                assíncronas, este adaptador faz a chamada síncrona simples).

Cadeia (registry.json → model_chains), última = manual sempre.
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

import synth

MEDIA_EXT = (".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov")


class Adapter:
    id, kind = "?", "image"

    def available(self) -> tuple:  # (bool, motivo)
        raise NotImplementedError

    def generate(self, prompt: Path, out: Path, refs: list, hint: str) -> tuple:
        """Retorna (sucesso, nota). Sucesso = arquivo escrito em `out`."""
        raise NotImplementedError


class ManualAdapter(Adapter):
    id, kind = "manual", "any"

    def available(self):
        return True, "modo híbrido — copy-paste assistido"

    def generate(self, prompt, out, refs, hint):
        pend = out.with_name(out.name + ".pending.md")
        lines = [
            f"# RENDER MANUAL — {out.stem}", "",
            f"Ferramenta sugerida : {hint}",
            f"Prompt (cole integral): `{prompt}`",
        ]
        if refs:
            lines.append("Anexar referências   : " + ", ".join(f"`{r}`" for r in refs))
        lines += [
            f"Salvar o render como : `{out}`", "",
            "Depois registre:  python3 system/engine.py attach <slug> "
            f"{out.stem} <arquivo-gerado>", "",
        ]
        pend.parent.mkdir(parents=True, exist_ok=True)
        pend.write_text("\n".join(lines), encoding="utf-8")
        return False, f"aguardando artefato manual — instruções em {pend.name}"


class MockAdapter(Adapter):
    id = "mock"

    def __init__(self, kind="image"):
        self.kind = kind

    def available(self):
        return os.environ.get("ENGINE_MOCK") == "1", "ENGINE_MOCK=1 (ou --mock)"

    def generate(self, prompt, out, refs, hint):
        out = Path(out)
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.suffix == ".mp4":
            synth.mp4_stub(out, seconds=15.0)
            return True, "mp4 sintético 15.0s (mvhd) — substitua pelo render real"
        stem = out.stem
        if stem == "storyboard-sheet":
            synth.png_grid(out, cols=5, rows=3)
            return True, "PNG grid 5×3 sintético (painéis texturizados) para QC de painéis"
        if stem == "depth-board":
            synth.png_grid(out, cols=3, rows=3)
            return True, "PNG grid 3×3 sintético para QC de painéis"
        synth.png_solid(out)
        return True, "PNG cinza sintético (placeholder)"


def _env_url(key_url: str, fallback_key: str, fallback_url: str):
    url = os.environ.get(key_url)
    key = os.environ.get(key_url.replace("_URL", "_KEY"), "")
    if not url and os.environ.get(fallback_key):
        url, key = fallback_url, os.environ.get(fallback_key, "")
    return url, key


def _post_json(url: str, key: str, payload: dict, timeout: int = 600) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _save_b64_or_url(data: dict, out: Path) -> str:
    item = (data.get("data") or data.get("images") or [{}])[0]
    if item.get("b64_json"):
        Path(out).write_bytes(base64.b64decode(item["b64_json"]))
        return "salvo de b64_json"
    url = item.get("url") or (data.get("video") or {}).get("url") if isinstance(data.get("video"), dict) else item.get("url")
    if url:
        urllib.request.urlretrieve(url, out)
        return f"baixado de {url[:60]}…"
    raise ValueError(f"resposta sem imagem/vídeo: {str(data)[:200]}")


class OpenAICompatImage(Adapter):
    id = "openai-image"

    def available(self):
        url, key = _env_url("IMAGE_API_URL", "OPENAI_API_KEY",
                            "https://api.openai.com/v1/images/generations")
        return bool(url and key), ("IMAGE_API_URL/IMAGE_API_KEY (ou OPENAI_API_KEY) configurados"
                                   if url and key else "sem IMAGE_API_URL/KEY no ambiente")

    def generate(self, prompt, out, refs, hint):
        url, key = _env_url("IMAGE_API_URL", "OPENAI_API_KEY",
                            "https://api.openai.com/v1/images/generations")
        payload = {"model": os.environ.get("IMAGE_MODEL", "gpt-image-2"),
                   "prompt": Path(prompt).read_text(encoding="utf-8")[:32000], "n": 1}
        if refs:
            payload["image_b64"] = base64.b64encode(
                Path(refs[0]).read_bytes()).decode("ascii")   # experimental
        try:
            data = _post_json(url, key, payload)
            note = _save_b64_or_url(data, Path(out))
            return True, f"render via {payload['model']} ({note})"
        except (urllib.error.URLError, ValueError, KeyError) as e:
            return False, f"openai-image falhou: {e}"


class OpenAICompatVideo(Adapter):
    id, kind = "openai-video", "video"

    def available(self):
        ok = bool(os.environ.get("VIDEO_API_URL") and os.environ.get("VIDEO_API_KEY"))
        return ok, ("VIDEO_API_URL/VIDEO_API_KEY configurados" if ok
                    else "sem VIDEO_API_URL/KEY no ambiente")

    def generate(self, prompt, out, refs, hint):
        payload = {"model": os.environ.get("VIDEO_MODEL", "seedance-2.0"),
                   "prompt": Path(prompt).read_text(encoding="utf-8")[:32000],
                   "duration": 15}
        if refs:
            payload["image_b64"] = base64.b64encode(
                Path(refs[0]).read_bytes()).decode("ascii")
        try:
            data = _post_json(os.environ["VIDEO_API_URL"], os.environ["VIDEO_API_KEY"], payload,
                              timeout=1200)
            note = _save_b64_or_url(data, Path(out))
            return True, f"render via {payload['model']} ({note})"
        except (urllib.error.URLError, ValueError, KeyError) as e:
            return False, f"openai-video falhou: {e}"


_REGISTRY = {"manual": ManualAdapter(), "mock": MockAdapter()}
CHAINS = {"image": ["openai-image", "mock", "manual"],
          "video": ["openai-video", "mock", "manual"]}


def build_chain(kind: str, force_mock=False, force_manual=False) -> list:
    order = list(CHAINS[kind])
    if force_manual:
        return [_REGISTRY["manual"]]
    if force_mock:
        order = ["mock"] + [a for a in order if a != "mock"]
    chain = []
    for aid in order:
        ad = _REGISTRY.get(aid) or {"openai-image": OpenAICompatImage,
                                    "openai-video": OpenAICompatVideo}[aid]()
        _REGISTRY[aid] = ad
        ok, _ = ad.available()
        if ok or (aid == "mock" and force_mock):
            chain.append(ad)
    if not chain or chain[-1].id != "manual":
        chain.append(_REGISTRY["manual"])
    return chain
