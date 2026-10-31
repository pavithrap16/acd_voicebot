"""Audio module contracts and utilities."""

from src.audio.mock_source import DeterministicAudioChunker, MockMicrophoneSource
from src.audio.schemas import (
    AudioChunk,
    AudioError,
    AudioFormat,
    SUPPORTED_BIT_DEPTHS,
    SUPPORTED_SAMPLE_RATES,
)

__all__ = [
    "AudioChunk",
    "AudioError",
    "AudioFormat",
    "DeterministicAudioChunker",
    "MockMicrophoneSource",
    "SUPPORTED_BIT_DEPTHS",
    "SUPPORTED_SAMPLE_RATES",
]
