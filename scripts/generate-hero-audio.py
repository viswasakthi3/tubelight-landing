"""Generate the three approved hero transcripts through the existing Vertex client.

Requires the sibling time2understand checkout's local credentials and Python deps.
Raw audio stays in ignored .media-work; no credentials or project IDs are copied.
"""
from pathlib import Path
import argparse
import concurrent.futures
import hashlib
import json
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
MODEL = "gemini-3.8-flash-tts"
VOICE = "Aoede"
STYLE = (
    "Warm, clear adult female voice explaining something to one curious person beside you. "
    "Natural conversational English, friendly and lightly smiling, with a clear smooth tone. "
    "Around 160 words per minute. Gentle curiosity on a question, relaxed confidence on its answer. "
    "Connect words fluidly. Brief natural pauses between ideas; a slightly longer pause between paragraphs. "
    "No sales-announcer delivery, exaggerated breathiness, vocal fry, theatrical amazement or sing-song rhythm. "
    "Read only the supplied transcript, with no introduction or added words."
)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=["rocket", "headaches", "black-hole"])
    parser.add_argument("--product-dir", type=Path, default=ROOT.parent / "time2understand")
    args = parser.parse_args()
    client_dir = args.product_dir / "scratch/filesgo_audio"
    sys.path.insert(0, str(client_dir))
    from vertex_audio import synth
    data = json.loads((ROOT / "public/previews/hero-2026-11-17/storyboards-v2.json").read_text(encoding="utf-8"))
    work = ROOT / ".media-work/hero-v3"
    work.mkdir(parents=True, exist_ok=True)
    def generate(topic):
        slug = topic["slug"]
        text = "\n\n".join(s["narration"] for s in topic["scenes"])
        signature = hashlib.sha256((MODEL + VOICE + STYLE + text).encode()).hexdigest()
        out = work / f"{slug}-master.wav"
        info = work / f"{slug}-request.json"
        if out.exists() and info.exists() and json.loads(info.read_text())["signature"] == signature:
            print(f"{slug}: reusing matching audio", flush=True)
            return
        if not synth(text, out, voice=VOICE, style=STYLE, model=MODEL):
            raise RuntimeError(f"Vertex speech generation failed for {slug}")
        with wave.open(str(out)) as audio:
            duration = audio.getnframes() / audio.getframerate()
        info.write_text(json.dumps(dict(provider="Google Vertex AI", model=MODEL, voice=VOICE,
                                       style=STYLE, transcript=text, signature=signature,
                                       duration=duration), indent=2, ensure_ascii=False), encoding="utf-8")
    topics = [t for t in data["storyboards"] if not args.only or t["slug"] == args.only]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(generate, topics))
    print("Requested hero narration saved locally.", flush=True)

if __name__ == "__main__":
    main()
