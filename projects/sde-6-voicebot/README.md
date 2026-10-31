# Academiaai AI Voicebot — Team SDE 6

## Workstream W1: Audio & Voice Activity Detection (Week 1)
- **Assignee:** Rakshitha J Raikar
- **Team:** SDE 6
- **Branch:** `feature/w1-audio-schemas` (targeted to `team/sde-6-voicebot`)
- **Status:** Week 1 Complete (Days 1–7)

---

## 1. Overview & Architecture

Workstream W1 provides the audio ingestion foundation for the Academiaai Voicebot. All downstream components (Voice Activity Detection, Speech-to-Text adapter in W2, and session orchestration) rely on these standardized contracts.

```
+-------------------------------------------------------------------+
|                        Audio Pipeline (W1)                        |
|                                                                   |
|   +-----------------------+           +-----------------------+   |
|   | MockMicrophoneSource  |           |     Raw PCM Data      |   |
|   |  (Synthetic Waveform) |           |   (Continuous Stream) |   |
|   +-----------+-----------+           +-----------+-----------+   |
|               |                                   |               |
|               +-----------------+   +-------------+               |
|                                 |   |                             |
|                                 v   v                             |
|                 +-------------------------------+                 |
|                 |  DeterministicAudioChunker    |                 |
|                 +---------------+---------------+                 |
|                                 |                                 |
|                                 v                                 |
|                     [ AudioChunk Stream ]                         |
|                     - Monotonic Sequence IDs                      |
|                     - Continuous Timestamps                       |
|                     - Validated AudioFormat                       |
|                                 |                                 |
|                                 v                                 |
|                 +-------------------------------+                 |
|                 |   W2: Speech-to-Text Adapter  |                 |
|                 +-------------------------------+                 |
+-------------------------------------------------------------------+
```

---

## 2. Core Modules & Contracts

Defined once in `src/audio/schemas.py` without duplication:

1. **`AudioError`**:
   - Structured exception envelope conforming to project engineering standards (`code`, `message_safe_for_user`, `details_redacted`).
2. **`AudioFormat`**:
   - Sample rates supported: `8000`, `11025`, `16000`, `22050`, `24000`, `32000`, `44100`, `48000 Hz`.
   - Channels: `1` (mono) or `2` (stereo).
   - Bit depth: `16`, `24`, `32` bits.
   - Computes frame sizes, byte throughput per second, and millisecond durations.
3. **`AudioChunk`**:
   - Monotonically increasing `sequence_id` (`0, 1, 2, ...`).
   - Millisecond `timestamp_ms` (`0.0, 20.0, 40.0, ...`).
   - Frame alignment validation ensuring zero corrupt or misaligned bytes.
4. **`MockMicrophoneSource`**:
   - Pure software synthesizer generating clean harmonic audio signals deterministically with zero external audio hardware or cloud dependencies.
5. **`DeterministicAudioChunker`**:
   - Slices continuous byte streams into exact time slices with deterministic output guarantees.

---

## 3. Quick Start & Setup

### Install Dependencies
```bash
python -m pip install -r projects/sde-6-voicebot/requirements.txt
```

### Run CLI Audio Streaming Demo
Run the standalone CLI demonstration tool:
```bash
python projects/sde-6-voicebot/src/cli/audio_stream_demo.py --count 10
```

Custom configurations:
```bash
# 48 kHz stereo stream
python projects/sde-6-voicebot/src/cli/audio_stream_demo.py --rate 48000 --channels 2 --count 8

# Real-time pacing simulation
python projects/sde-6-voicebot/src/cli/audio_stream_demo.py --realtime --count 10
```

### Run Automated Unit Tests
```bash
python -m pytest projects/sde-6-voicebot/tests/ -v
```

---

## 4. Week 1 Acceptance Criteria Checklist

- [x] All three schemas (`AudioChunk`, `AudioFormat`, `AudioError`) exist, are defined once, and are fully documented.
- [x] Invalid sample rate / channel count is rejected with `AudioError`.
- [x] Mock source output is 100% deterministic (two runs on identical inputs yield bit-for-bit identical chunks).
- [x] Every chunk has an accurate timestamp and strictly increasing sequence ID.
- [x] CLI runs with a single documented command and displays formatted stream metadata.
- [x] Unit test suite covers valid happy paths, invalid configs, empty payloads, and corrupt/misaligned frames (34 passed).
- [x] Work is on feature branch `feature/w1-audio-schemas` (never direct pushes to `main`).
- [x] No secrets, private recordings, or environment files committed.
