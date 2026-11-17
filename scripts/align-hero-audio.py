"""Transcribe generated narration locally and align approved captions to real words."""
from pathlib import Path
import argparse
import concurrent.futures
import difflib
import hashlib
import json
import re
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / ".media-work/hero-v3"

def clean(word):
    return re.sub(r"[^a-z0-9]", "", word.lower())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path)
    args = parser.parse_args()
    if args.model_dir:
        model_dir = args.model_dir
    else:
        cached = ROOT.parent / "time2understand/scratch/filesgo_audio/revision_3/work/asr_models/models--Systran--faster-whisper-small.en/snapshots"
        model_dir = next(cached.iterdir())
    model = WhisperModel(str(model_dir), device="cpu", compute_type="int8", cpu_threads=4, num_workers=2, local_files_only=True)
    data = json.loads((ROOT / "public/previews/hero-2026-11-17/storyboards-v2.json").read_text(encoding="utf-8"))
    def align(topic):
        slug = topic["slug"]
        audio_path = WORK / f"{slug}-master.wav"
        signature = hashlib.sha256(audio_path.read_bytes()).hexdigest()
        out = WORK / f"{slug}-alignment.json"
        if out.exists() and json.loads(out.read_text(encoding="utf-8")).get("audioSha256") == signature:
            print(f"{slug}: reusing matching word alignment", flush=True)
            return
        audio, sr = sf.read(audio_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        samples = resample_poly(audio, 16000, sr).astype(np.float32)
        segments, _ = model.transcribe(samples, language="en", beam_size=5, word_timestamps=True, condition_on_previous_text=False)
        segments = list(segments)
        words = [dict(word=w.word.strip(), start=w.start, end=w.end) for segment in segments for w in (segment.words or [])]
        expected = [word for scene in topic["scenes"] for word in scene["narration"].split()]
        matcher = difflib.SequenceMatcher(None, [clean(w) for w in expected], [clean(w["word"]) for w in words], autojunk=False)
        anchors = {}
        for block in matcher.get_matching_blocks():
            for offset in range(block.size):
                anchors[block.a + offset] = block.b + offset
        coverage = len(anchors) / len(expected)
        if coverage < .93:
            raise RuntimeError(f"{slug}: transcript coverage only {coverage:.1%}; inspect narration before release")
        aligned = []
        for i, text in enumerate(expected):
            if i in anchors:
                timing = words[anchors[i]]
                start, end = timing["start"], timing["end"]
            else:
                before = max((k for k in anchors if k < i), default=None)
                after = min((k for k in anchors if k > i), default=None)
                lo = words[anchors[before]]["end"] if before is not None else 0
                hi = words[anchors[after]]["start"] if after is not None else len(audio) / sr
                count = (after if after is not None else len(expected)) - (before if before is not None else -1) - 1
                rank = i - (before if before is not None else -1) - 1
                start = lo + max(0, hi - lo) * rank / max(1, count)
                end = lo + max(0, hi - lo) * (rank + 1) / max(1, count)
            aligned.append(dict(word=text, start=round(start, 4), end=round(end, 4), matched=i in anchors))
        result = dict(audioSha256=signature, duration=len(audio) / sr, coverage=coverage,
                      transcript=" ".join(s.text.strip() for s in segments), words=aligned,
                      unmatched=[expected[i] for i in range(len(expected)) if i not in anchors])
        out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"{slug}: {coverage:.1%} words aligned; {result['transcript']}", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(align, data["storyboards"]))

if __name__ == "__main__":
    main()
