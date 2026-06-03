#!/usr/bin/env python3
"""Generate or sync bundled notification sounds for all dog/cat tone × tier profiles."""

from __future__ import annotations

import argparse
import math
import shutil
import struct
import subprocess
import wave
from pathlib import Path

try:
    import lameenc
except ImportError as exc:  # pragma: no cover
    raise SystemExit('Install lameenc: pip3 install lameenc') from exc

ROOT = Path(__file__).resolve().parents[1]
ANDROID_RAW = ROOT / 'android' / 'app' / 'src' / 'main' / 'res' / 'raw'
IOS_DIR = ROOT / 'ios' / 'paw_fect'

SPECIES = ('dog', 'cat')
TONES = ('meal', 'active', 'care', 'health')
TIERS = ('soft', 'standard', 'urgent')

SPECIES_BASE = {'dog': 150.0, 'cat': 340.0}
TONE_OFFSET = {'meal': -30.0, 'active': 40.0, 'care': 0.0, 'health': 90.0}
TIER_GAIN = {'soft': 0.45, 'standard': 0.72, 'urgent': 0.95}
TIER_DUR = {'soft': 0.28, 'standard': 0.42, 'urgent': 0.58}
RATE = 22050


def env(i: int, n: int, attack: float = 0.04, release: float = 0.22) -> float:
    t = i / n
    if t < attack:
        return t / attack
    if t > 1 - release:
        return max(0.0, (1 - t) / release)
    return 1.0


def synthesize(profile: str) -> list[float]:
    species, tone, tier = profile.split('_')
    base = SPECIES_BASE[species] + TONE_OFFSET[tone]
    gain = TIER_GAIN[tier]
    dur = TIER_DUR[tier]
    n = int(RATE * dur)
    pulses = 1 if tier == 'soft' else 2 if tier == 'standard' else 3
    out: list[float] = []

    for i in range(n):
        t = i / RATE
        body = 0.0
        for p in range(pulses):
            center = (p + 0.55) / (pulses + 0.35) * dur * 0.85
            width = dur * (0.11 if tier == 'soft' else 0.09)
            d = abs(t - center)
            if d >= width:
                continue
            bump = math.cos((d / width) * math.pi * 0.5)
            f = base + (80 if species == 'cat' else 40) * bump
            if tone == 'health' and tier == 'urgent':
                f += 60 * math.sin(2 * math.pi * 9 * t)
            wave = math.sin(2 * math.pi * f * t)
            if tone == 'active':
                wave += 0.25 * math.sin(2 * math.pi * (f * 1.5) * t)
            body = max(body, wave * bump)
        out.append(body * gain * env(i, n))
    return out


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'w') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        frames = b''.join(
            struct.pack('<h', max(-32767, min(32767, int(s * 32767 * 0.88))))
            for s in samples
        )
        handle.writeframes(frames)


def write_mp3(path: Path, samples: list[float]) -> None:
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(RATE)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = b''.join(
        struct.pack('<h', max(-32767, min(32767, int(s * 32767 * 0.88))))
        for s in samples
    )
    path.write_bytes(enc.encode(pcm) + enc.flush())


def _is_wav_payload(path: Path) -> bool:
    with path.open('rb') as handle:
        return handle.read(4) == b'RIFF'


def sync_ios_wav_from_android_raw() -> None:
    """Copy Android `res/raw` assets into iOS bundle WAVs (same audio, iOS format)."""
    afconvert = shutil.which('afconvert')
    if afconvert is None:
        raise SystemExit('afconvert not found (macOS only)')

    IOS_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(ANDROID_RAW.glob('*.mp3'))
    if not sources:
        raise SystemExit(f'No *.mp3 files in {ANDROID_RAW}')

    tmp_dir = IOS_DIR / '.sync_tmp'
    tmp_dir.mkdir(exist_ok=True)
    profiles: list[str] = []

    try:
        for src in sources:
            profile = src.stem
            profiles.append(profile)
            out = IOS_DIR / f'{profile}.wav'
            input_path = src
            if _is_wav_payload(src):
                input_path = tmp_dir / f'{profile}.wav'
                shutil.copy2(src, input_path)
            subprocess.run(
                [afconvert, str(input_path), str(out), '-d', 'LEI16', '-c', '1', '-f', 'WAVE'],
                check=True,
            )
            print(f'synced {profile}')
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    manifest = IOS_DIR / 'notification_sound_profiles.txt'
    manifest.write_text('\n'.join(profiles) + '\n', encoding='utf-8')
    print(f'wrote {len(profiles)} iOS wav files from Android raw')


def generate_synthetic_assets() -> None:
    ANDROID_RAW.mkdir(parents=True, exist_ok=True)
    IOS_DIR.mkdir(parents=True, exist_ok=True)

    for old in ANDROID_RAW.glob('*.mp3'):
        old.unlink()
    for old in IOS_DIR.glob('*.wav'):
        if old.name.startswith(('dog_', 'cat_')) or old.name.endswith('_notification.wav'):
            old.unlink()

    profiles: list[str] = []
    for species in SPECIES:
        for tone in TONES:
            for tier in TIERS:
                profiles.append(f'{species}_{tone}_{tier}')

    for profile in profiles:
        samples = synthesize(profile)
        write_mp3(ANDROID_RAW / f'{profile}.mp3', samples)
        write_wav(IOS_DIR / f'{profile}.wav', samples)
        print(f'generated {profile}')

    manifest = IOS_DIR / 'notification_sound_profiles.txt'
    manifest.write_text('\n'.join(profiles) + '\n', encoding='utf-8')
    print(f'wrote {len(profiles)} profiles')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--sync-ios-from-android',
        action='store_true',
        help='Convert Android res/raw assets to iOS bundle WAVs (keeps Android files)',
    )
    args = parser.parse_args()
    if args.sync_ios_from_android:
        sync_ios_wav_from_android_raw()
    else:
        generate_synthetic_assets()


if __name__ == '__main__':
    main()
