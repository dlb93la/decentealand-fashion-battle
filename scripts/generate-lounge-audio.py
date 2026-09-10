"""Original synthesized lounge loop and three-second transition chime (no external samples)."""
import math, wave, array
from pathlib import Path
RATE = 22050
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'Audio'
def render(name, seconds, notes):
    buf = [0.0] * int(seconds * RATE)
    for start, duration, midi, gain, tone in notes:
        freq = 440 * 2 ** ((midi - 69) / 12)
        for j in range(int(duration * RATE)):
            k = int(start * RATE) + j
            t = j / RATE
            attack = min(1, t / .015)
            release = min(1, max(0, duration - t) / .18)
            env = attack * release * math.exp(-t * (2.6 if tone == 'bell' else 1.5))
            sample = math.sin(2 * math.pi * freq * t) + .22 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 3)
            buf[k % len(buf)] += gain * env * sample
    peak = max(abs(x) for x in buf) or 1
    samples = array.array('h', (int(x / peak * 24000) for x in buf))
    with wave.open(str(OUT / name), 'wb') as f:
        f.setparams((1, 2, RATE, 0, 'NONE', 'not compressed')); f.writeframes(samples.tobytes())
render('transition.wav', 3, [(0, 2.8, 76, .35, 'bell'), (.42, 2.5, 79, .3, 'bell'), (.84, 2.16, 83, .25, 'bell')])
notes = []
# 16 bars, 96 BPM: warm major-seventh harmony, soft bass and a sparse melody.
chords = [[48,55,59,64], [45,52,55,60], [50,57,60,65], [43,50,53,59]]
for bar in range(16):
    start = bar * 2.5
    chord = chords[bar % 4]
    for beat in [0, 1.5, 3]:
        for n in chord[1:]: notes.append((start + beat * .625, 1.7, n+12, .09, 'keys'))
    for beat in [0, 2]: notes.append((start + beat * .625, .9, chord[0]-12, .18, 'bass'))
    for beat, n in [(1, chord[2]+24), (2.5, chord[1]+24)]:
        notes.append((start + beat*.625, .9, n, .07, 'bell'))
render('lounge.wav', 40, notes)
