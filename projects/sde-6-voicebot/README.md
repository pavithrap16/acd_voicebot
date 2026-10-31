# Academiaai AI Voicebot — SDE 6 (W2: Speech-to-Text)

**Workstream**: W2 — Speech-to-Text  
**Assigned Student**: Pavithra P (SDE 6, Member 2)  
**Milestone**: Week 1 (Days 1–7) — Transcript Schemas, Fake Transcriber & Segment Accumulator  
**Team Branch**: `team/sde-6-voicebot`  
**Feature Branch**: `feature/w2-transcript-schemas`  
**Base Repository**: [https://github.com/Yashuudevang/acd_voicebot](https://github.com/Yashuudevang/acd_voicebot)

---

## 1. Overview & Architectural Boundaries

This module forms the foundation of the Speech-to-Text (STT) pipeline for SDE 6. It operates strictly in **Mock Mode by default**, requiring zero paid external API keys or credentials.

### Key Capabilities Delivered in Week 1:
1. **Contract Definition (`src/contracts/`)**:
   - `TranscriptSegment` and `TranscriptEvent` schemas strictly typed with runtime Zod validation.
   - Implements the team's unified `EventEnvelope` (`event_id`, `event_type`, `schema_version`, `session_id`, `correlation_id`, `timestamp`, `producer`, `payload`).
   - Implements the team's standard `ErrorEnvelope` (`code`, `message_safe_for_user`, `retryable`, `correlation_id`, `details_redacted`).
   - Defined once inside `projects/sde-6-voicebot/` to prevent duplicate schema sprawl.

2. **Provider-Neutral Adapter & Deterministic Fake Transcriber (`src/providers/`)**:
   - `SpeechToTextAdapter`: decoupled contract supporting lifecycle initialization, typed input/output, health checks, cancellation, and timeouts.
   - `DeterministicFakeTranscriber`: Bitwise-identical output on repeated runs given identical audio inputs; supports interim hypotheses, final segments, silence handling, and fault-injection error envelopes.

3. **Ordered Segment Accumulator (`src/accumulator/`)**:
   - Automatic chronological sorting by `sequence_number` and `start_time_ms`.
   - Out-of-order packet reconciliation and duplicate suppression.
   - Interim-to-final replacement lifecycle (provisional live transcript smoothly replaced by finalized speech).
   - Rejection of malformed or foreign-session payloads without corrupting internal state.

4. **Synthetic Test Fixtures (`src/fixtures/`)**:
   - Deterministic 16kHz mono audio chunks, multi-turn utterances, silence chunks, and fault-injection scenarios.

5. **Live Mock Mode Demo (`src/demo/chunk-to-transcript.ts`)**:
   - Runnable CLI demonstrating the chunk-to-transcript pipeline from start to finish.

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
│   ├── fixtures/
│   │   └── transcript-fixtures.ts # Repeatable synthetic audio and edge case fixtures
│   ├── demo/
│   │   └── chunk-to-transcript.ts # Day 7 live executable CLI demonstration
│   └── index.ts                   # Unified library entry point
└── tests/
    ├── contracts/
    │   └── transcript-schemas.test.ts  # 12 unit tests verifying schema constraints & error envelopes
    ├── providers/
    │   └── fake-transcriber.test.ts    # 9 unit tests verifying determinism, interim/final, & cancellation
    └── accumulator/
        └── segment-accumulator.test.ts # 8 unit tests verifying ordering, de-duplication, & errors
```

---

## 3. How to Run

### Install Dependencies
```powershell
cd projects/sde-6-voicebot
npm install
```

### Run All Unit and Contract Tests
```powershell
npm run test
```

### Run the Day 7 Live Chunk-to-Transcript Demo
```powershell
npm run demo
```

---

## 4. Week 1 Acceptance Checklist

| # | Acceptance Criteria | Status | Evidence / Location |
|---|---|:---:|---|
| 1 | Both schemas (`TranscriptSegment`, `TranscriptEvent`) exist, defined once, documented | Passed | `src/contracts/transcript.ts` |
| 2 | Invalid payloads rejected with clear, user-safe error envelopes | Passed | `tests/contracts/transcript-schemas.test.ts` |
| 3 | Fake transcriber is deterministic (identical output on repeated runs) | Passed | `src/providers/fake-transcriber.ts`, tested in `fake-transcriber.test.ts` |
| 4 | Adapter is provider-neutral; zero paid API keys needed | Passed | `src/providers/stt-adapter.ts` |
| 5 | Accumulator returns segments in order, with edge case handling | Passed | `src/accumulator/segment-accumulator.ts` |
| 6 | Unit test suite passing 100% | Passed | 29/29 passing tests across 3 test suites |
| 7 | Work is on a feature branch (`feature/w2-transcript-schemas`) | Passed | Verified with `git branch` |
| 8 | No secrets, private recordings, or audio files committed | Passed | Enforced via `.gitignore` and sanitized fixtures |
| 9 | Day 7 demo runnable in mock mode via single command | Passed | `npm run demo` executes cleanly |

---

## 5. Daily Progress Report (Day 7 Summary)

- **Completed work**:
  - Implemented all Day 1–7 deliverables for W2 Speech-to-Text.
  - Built strict Zod schemas for `TranscriptSegment`, `TranscriptEvent`, and base `EventEnvelope`/`ErrorEnvelope`.
  - Created provider-neutral `SpeechToTextAdapter` and `DeterministicFakeTranscriber`.
  - Created `SegmentAccumulator` with monotonic sorting, duplicate suppression, and interim reconciliation.
  - Created 29 automated unit tests with 100% pass rate.
  - Built and verified live CLI demo (`npm run demo`).
- **Files changed**:
  - `projects/sde-6-voicebot/src/contracts/common.ts`
  - `projects/sde-6-voicebot/src/contracts/transcript.ts`
  - `projects/sde-6-voicebot/src/contracts/index.ts`
  - `projects/sde-6-voicebot/src/providers/stt-adapter.ts`
  - `projects/sde-6-voicebot/src/providers/fake-transcriber.ts`
  - `projects/sde-6-voicebot/src/providers/index.ts`
  - `projects/sde-6-voicebot/src/accumulator/segment-accumulator.ts`
  - `projects/sde-6-voicebot/src/accumulator/index.ts`
  - `projects/sde-6-voicebot/src/fixtures/transcript-fixtures.ts`
  - `projects/sde-6-voicebot/src/demo/chunk-to-transcript.ts`
  - `projects/sde-6-voicebot/src/index.ts`
  - `projects/sde-6-voicebot/tests/contracts/transcript-schemas.test.ts`
  - `projects/sde-6-voicebot/tests/providers/fake-transcriber.test.ts`
  - `projects/sde-6-voicebot/tests/accumulator/segment-accumulator.test.ts`
  - `projects/sde-6-voicebot/package.json`
  - `projects/sde-6-voicebot/tsconfig.json`
  - `projects/sde-6-voicebot/vitest.config.ts`
  - `projects/sde-6-voicebot/.gitignore`
  - `.gitignore` (root)
- **Tests run**: `npm run test` -> 3 test files passed, 29 tests passed.
- **GitHub branch**: `feature/w2-transcript-schemas`
- **Blockers**: None.
- **Next steps**: Ready to review and commit to feature branch, open PR into `team/sde-6-voicebot`.
