# Academiaai AI Voicebot — SDE 6 (W2: Speech-to-Text)

**Workstream**: W2 — Speech-to-Text  
**Assigned Student**: Pavithra P (SDE 6, Member 2)  
**Milestones Delivered**: 
- **Week 1 (Days 1–7)**: Transcript Schemas, Fake Transcriber & Segment Accumulator
- **Week 2 (Days 8–14)**: Orchestration, Ordering & De-duplication, Retries & Preprocessing  
**Team Branch**: `team/sde-6-voicebot`  
**Feature Branch**: `feature/w2-speech-to-text`  
**Base Repository**: [https://github.com/Yashuudevang/acd_voicebot](https://github.com/Yashuudevang/acd_voicebot)

---

## 1. Overview & Architectural Boundaries

This module forms the foundation of the Speech-to-Text (STT) pipeline for SDE 6. It operates strictly in **Mock Mode by default**, requiring zero paid external API keys or credentials.

### Key Capabilities Delivered:

#### Week 1 (Foundation & Schemas)
1. **Contract Definition (`src/contracts/`)**:
   - `TranscriptSegment` and `TranscriptEvent` schemas strictly typed with runtime Zod validation.
   - Unified `EventEnvelope` (`event_id`, `event_type`, `schema_version`, `session_id`, `correlation_id`, `timestamp`, `producer`, `payload`).
   - Standard `ErrorEnvelope` (`code`, `message_safe_for_user`, `retryable`, `correlation_id`, `details_redacted`).
   - Defined once inside `projects/sde-6-voicebot/` to prevent duplicate schema sprawl.

2. **Provider-Neutral Adapter & Fake Transcriber (`src/providers/`)**:
   - `SpeechToTextAdapter` decoupled interface.
   - `DeterministicFakeTranscriber`: Bitwise-identical output on repeated runs without external API keys.

3. **Ordered Segment Accumulator (`src/accumulator/`)**:
   - Chronological sorting by `sequence_number` and `start_time_ms`.
   - Out-of-order reconciliation and duplicate suppression.
   - Interim-to-final replacement lifecycle.

#### Week 2 (Core Implementation & Orchestration)
4. **Audio Preprocessor (`src/preprocessing/`)**:
   - Resampling: Converts 8000Hz, 44100Hz, and 48000Hz audio to standardized 16000Hz.
   - Amplitude Normalization: Scales audio to optimal target peak (0.95) and eliminates clipping.
   - DC Offset Removal: Subtracts signal bias.
   - Stereo to Mono Downmixing: Averages 2-channel audio into a clean single channel.

5. **Resilience, Timeout & Bounded Retries (`src/resilience/`)**:
   - `RetryHandler`: Configurable `maxRetries`, `timeoutMs`, and exponential backoff with jitter.
   - Safe error normalization: Maps all exceptions into user-safe `ErrorEnvelope`s without leaking stack traces or credentials.

6. **Transcription Orchestrator (`src/orchestrator/`)**:
   - Connects: Audio Chunk (W1) ➔ Preprocessing ➔ Timeout/Retry Layer ➔ Provider Adapter ➔ Segment Accumulator.
   - Chunk-level duplicate suppression.
   - Live stream event broadcasting (`transcript.interim`, `transcript.final`, `transcript.error`).
   - Observability metrics tracking (chunks received, duplicates suppressed, retries, errors).

---

## 2. Directory Structure

```
projects/sde-6-voicebot/
├── README.md                      # Complete module documentation & PR evidence
├── package.json                   # Dependencies: Zod; Dev: TypeScript, Vitest, tsx
├── tsconfig.json                  # Strict TypeScript configuration (ES2022)
├── vitest.config.ts               # Test suite configuration
├── .gitignore                     # Git ignore rules (no secrets, recordings, or node_modules)
├── src/
│   ├── contracts/
│   │   ├── common.ts              # EventEnvelope, ErrorEnvelope, Session & Workflow state enums
│   │   ├── transcript.ts          # TranscriptSegment, TranscriptEvent, AudioChunk schemas & validators
│   │   └── index.ts
│   ├── providers/
│   │   ├── stt-adapter.ts         # Provider-neutral SpeechToTextAdapter interface
│   │   ├── fake-transcriber.ts    # Deterministic mock transcriber implementation
│   │   └── index.ts
│   ├── accumulator/
│   │   ├── segment-accumulator.ts # Ordered segment accumulator & interim/final reconciliation
│   │   └── index.ts
│   ├── preprocessing/
│   │   ├── audio-preprocessor.ts  # Resampling (48k/8k -> 16k), Normalization, Downmixing
│   │   └── index.ts
│   ├── resilience/
│   │   ├── retry-handler.ts       # Bounded retries, timeouts, and error normalizer
│   │   └── index.ts
│   ├── orchestrator/
│   │   ├── transcription-orchestrator.ts # Core pipeline coordinator & metrics
│   │   └── index.ts
│   ├── fixtures/
│   │   └── transcript-fixtures.ts # Repeatable synthetic audio and edge case fixtures
│   ├── demo/
│   │   ├── chunk-to-transcript.ts       # Week 1 live demo
│   │   └── week2-orchestrator-demo.ts   # Week 2 live demo
│   └── index.ts                   # Unified library entry point
└── tests/
    ├── contracts/
    │   └── transcript-schemas.test.ts        # 12 tests: schema validation, boundaries, invalid rejection
    ├── providers/
    │   └── fake-transcriber.test.ts          # 9 tests: determinism, interim/final emission, cancellation
    ├── accumulator/
    │   └── segment-accumulator.test.ts       # 8 tests: ordering, duplicate suppression, session boundary
    ├── preprocessing/
    │   └── audio-preprocessor.test.ts        # 5 tests: resampling (48k/8k), normalization, stereo downmix
    ├── resilience/
    │   └── retry-handler.test.ts             # 4 tests: timeouts, bounded retries, error normalization
    └── orchestrator/
        └── transcription-orchestrator.test.ts# 4 tests: end-to-end orchestration, duplicates, errors
```

---

## 3. How to Run

### Install Dependencies
```powershell
cd projects/sde-6-voicebot
npm install
```

### Typecheck (Zero Errors)
```powershell
npm run typecheck
```

### Run All 42 Tests
```powershell
npm run test
```

### Run Week 2 Live Demonstration
```powershell
npm run demo:week2
```

---

## 4. Week 2 Acceptance Checklist

| # | Acceptance Criteria | Status | Evidence / Location |
|---|---|:---:|---|
| 1 | Chunk to transcript events works end-to-end in mock mode | Passed | `src/orchestrator/transcription-orchestrator.ts` |
| 2 | Out-of-order and duplicate segments handled correctly | Passed | `tests/orchestrator/transcription-orchestrator.test.ts` |
| 3 | Interim results reconcile into final segments | Passed | `src/accumulator/segment-accumulator.ts` |
| 4 | Timeouts and bounded retries work safely | Passed | `tests/resilience/retry-handler.test.ts` |
| 5 | Provider errors are normalized (no raw exceptions leak) | Passed | `src/resilience/retry-handler.ts` |
| 6 | Resampling (48k/8k -> 16k) and Normalization tested | Passed | `tests/preprocessing/audio-preprocessor.test.ts` |
| 7 | Zero paid API keys needed (runs 100% locally in mock mode) | Passed | `src/providers/fake-transcriber.ts` |
| 8 | No duplicate schema definitions | Passed | Reuses Week 1 schemas in `src/contracts/` |
| 9 | 100% test pass rate across all suites | Passed | **42/42 tests passing** |

---

## 5. Daily Progress Report (Week 2: Days 8–14)

- **Day 8–9 (Orchestration Foundation)**:
  - Built `TranscriptionOrchestrator` connecting Audio Chunks to Provider and Accumulator.
  - Implemented event streaming listeners for interim and final segments.
- **Day 10–11 (Ordering, De-duplication & Reconciliation)**:
  - Added chunk-level and segment-level deduplication.
  - Verified out-of-order chunk arrival reordering via sequence numbers.
- **Day 12–13 (Timeouts, Retries & Audio Preprocessing)**:
  - Built `AudioPreprocessor` with linear interpolation resampling (8kHz / 44.1kHz / 48kHz ➔ 16kHz) and peak amplitude normalization.
  - Implemented `RetryHandler` with exponential backoff and timeout enforcement.
  - Created error normalizer converting all failures into standard `ErrorEnvelope`.
- **Day 14 (Contract Tests & PR Demo)**:
  - Added 13 new unit and contract tests (total 42 tests passing).
  - Built and verified `src/demo/week2-orchestrator-demo.ts` CLI demo.
