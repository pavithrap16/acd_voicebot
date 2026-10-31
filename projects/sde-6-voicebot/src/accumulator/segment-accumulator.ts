import type {
  TranscriptSegment,
  TranscriptEvent,
  ValidationResult,
} from "../contracts/transcript.js";
import {
  validateTranscriptSegment,
  validateTranscriptEvent,
} from "../contracts/transcript.js";
import type { ErrorEnvelope } from "../contracts/common.js";

export interface AccumulatorOptions {
  /**
   * Maximum history length of segments to retain in memory (default: 1000)
   */
  maxSegments?: number;
  /**
   * Session ID boundary
   */
  sessionId?: string;
}

export type AccumulatorListener = (
  segments: readonly TranscriptSegment[],
  activeInterim?: TranscriptSegment
) => void;

/**
 * OrderedSegmentAccumulator
 *
 * Core speech-to-text orchestration component that:
 * 1. Accumulates incoming transcript segments in strict sequence order.
 * 2. Reconciles interim hypotheses against finalized immutable segments.
 * 3. Suppresses duplicate arrivals.
 * 4. Rejects invalid payloads without corrupting internal transcript state.
 */
export class SegmentAccumulator {
  private readonly finalizedSegments: TranscriptSegment[] = [];
  private currentInterimSegment?: TranscriptSegment;
  private readonly processedSegmentIds = new Set<string>();
  private readonly listeners: Set<AccumulatorListener> = new Set();
  private readonly maxSegments: number;
  private readonly sessionId?: string;

  constructor(options?: AccumulatorOptions) {
    this.maxSegments = options?.maxSegments ?? 1000;
    this.sessionId = options?.sessionId;
  }

  /**
   * Process a single incoming TranscriptEvent
   */
  processEvent(event: TranscriptEvent): { success: boolean; error?: ErrorEnvelope } {
    // 1. Validate envelope integrity
    const valResult = validateTranscriptEvent(event, event.correlation_id);
    if (!valResult.success) {
      return { success: false, error: valResult.error };
    }

    // 2. Validate session association if bound
    if (this.sessionId && event.session_id !== this.sessionId) {
      return {
        success: false,
        error: {
          code: "SESSION_MISMATCH",
          message_safe_for_user: `Event session_id '${event.session_id}' does not match accumulator session '${this.sessionId}'`,
          retryable: false,
          correlation_id: event.correlation_id,
          details_redacted: { expected_session: this.sessionId },
        },
      };
    }

    // 3. Handle error events
    if (event.event_type === "transcript.error") {
      return { success: true };
    }

    // 4. Handle segment payload
    if (event.payload.segment) {
      return this.addSegment(event.payload.segment, event.correlation_id);
    }

    return { success: true };
  }

  /**
   * Directly ingest and reconcile a TranscriptSegment
   */
  addSegment(
    rawSegment: unknown,
    correlationId: string = "accumulator-corr"
  ): { success: boolean; error?: ErrorEnvelope } {
    // 1. Validate segment payload
    const valResult: ValidationResult<TranscriptSegment> = validateTranscriptSegment(
      rawSegment,
      correlationId
    );
    if (!valResult.success) {
      return { success: false, error: valResult.error };
    }

    const segment = valResult.data;

    // 2. Duplicate suppression check
    if (this.processedSegmentIds.has(segment.segment_id)) {
      // Already committed; safely suppress duplicate
      return { success: true };
    }

    // 3. Interim segment handling
    if (!segment.is_final) {
      this.currentInterimSegment = segment;
      this.notifyListeners();
      return { success: true };
    }

    // 4. Finalized segment handling
    // Check if this final segment resolves the current interim hypothesis
    if (
      this.currentInterimSegment &&
      this.currentInterimSegment.sequence_number === segment.sequence_number
    ) {
      this.currentInterimSegment = undefined;
    }

    // Insert into sorted order by sequence_number, then start_time_ms
    this.insertInOrder(segment);
    this.processedSegmentIds.add(segment.segment_id);

    // Enforce memory bounds
    if (this.finalizedSegments.length > this.maxSegments) {
      const removed = this.finalizedSegments.shift();
      if (removed) {
        this.processedSegmentIds.delete(removed.segment_id);
      }
    }

    this.notifyListeners();
    return { success: true };
  }

  /**
   * Inserts segment into sorted position (guaranteeing monotonic ordering)
   */
  private insertInOrder(segment: TranscriptSegment): void {
    // Fast path: append if strictly greater than latest segment
    const last = this.finalizedSegments[this.finalizedSegments.length - 1];
    if (!last || segment.sequence_number > last.sequence_number) {
      this.finalizedSegments.push(segment);
      return;
    }

    // Otherwise binary search or locate exact insertion index
    const index = this.finalizedSegments.findIndex(
      (s) =>
        s.sequence_number > segment.sequence_number ||
        (s.sequence_number === segment.sequence_number &&
          s.start_time_ms > segment.start_time_ms)
    );

    if (index === -1) {
      this.finalizedSegments.push(segment);
    } else {
      this.finalizedSegments.splice(index, 0, segment);
    }
  }

  /**
   * Returns copy of ordered finalized segments
   */
  getSegments(): readonly TranscriptSegment[] {
    return [...this.finalizedSegments];
  }

  /**
   * Returns active interim hypothesis if one exists
   */
  getInterimSegment(): TranscriptSegment | undefined {
    return this.currentInterimSegment ? { ...this.currentInterimSegment } : undefined;
  }

  /**
   * Assembles full finalized text transcript
   */
  getFullText(): string {
    return this.finalizedSegments
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Assembles live transcript including active interim segment
   */
  getLiveTranscript(): string {
    const finalized = this.getFullText();
    if (this.currentInterimSegment?.text.trim()) {
      return finalized
        ? `${finalized} ${this.currentInterimSegment.text.trim()}`
        : this.currentInterimSegment.text.trim();
    }
    return finalized;
  }

  /**
   * Register listener for state changes
   */
  subscribe(listener: AccumulatorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Reset the accumulator for a fresh session
   */
  clear(): void {
    this.finalizedSegments.length = 0;
    this.currentInterimSegment = undefined;
    this.processedSegmentIds.clear();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getSegments(), this.getInterimSegment());
      } catch (err) {
        console.error("Error in accumulator listener", err);
      }
    }
  }
}
