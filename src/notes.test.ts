import { test } from 'node:test';
import assert from 'node:assert';
import { freqToNote } from './notes.js';

// Hardcoded frequency values from the original implementation
const expectedNotes = {
  C0: 16.35,
  "C#0": 17.32,
  D0: 18.35,
  "D#0": 19.45,
  E0: 20.6,
  F0: 21.83,
  "F#0": 23.12,
  G0: 24.5,
  "G#0": 25.96,
  A0: 27.5,
  "A#0": 29.14,
  B0: 30.87,
  C1: 32.7,
  "C#1": 34.65,
  D1: 36.71,
  "D#1": 38.89,
  E1: 41.2,
  F1: 43.65,
  "F#1": 46.25,
  G1: 49.0,
  "G#1": 51.91,
  A1: 55.0,
  "A#1": 58.27,
  B1: 61.74,
  C2: 65.41,
  "C#2": 69.3,
  D2: 73.42,
  "D#2": 77.78,
  E2: 82.41,
  F2: 87.31,
  "F#2": 92.5,
  G2: 98.0,
  "G#2": 103.83,
  A2: 110.0,
  "A#2": 116.54,
  B2: 123.47,
  C3: 130.81,
  "C#3": 138.59,
  D3: 146.83,
  "D#3": 155.56,
  E3: 164.81,
  F3: 174.61,
  "F#3": 185.0,
  G3: 196.0,
  "G#3": 207.65,
  A3: 220.0,
  "A#3": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  D5: 587.33,
  "D#5": 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  G5: 783.99,
  "G#5": 830.61,
  A5: 880.0,
  "A#5": 932.33,
  B5: 987.77,
  C6: 1046.5,
  "C#6": 1108.73,
  D6: 1174.66,
  "D#6": 1244.51,
  E6: 1318.51,
  F6: 1396.91,
  "F#6": 1479.98,
  G6: 1567.98,
  "G#6": 1661.22,
  A6: 1760.0,
  "A#6": 1864.66,
  B6: 1975.53,
  C7: 2093.0,
  "C#7": 2217.46,
  D7: 2349.32,
  "D#7": 2489.02,
  E7: 2637.02,
  F7: 2793.83,
  "F#7": 2959.96,
  G7: 3135.96,
  "G#7": 3322.44,
  A7: 3520.0,
  "A#7": 3729.31,
  B7: 3951.07,
  C8: 4186.01,
  "C#8": 4434.92,
  D8: 4698.63,
  "D#8": 4978.03,
  E8: 5274.04,
  F8: 5587.65,
  "F#8": 5919.91,
  G8: 6271.93,
  "G#8": 6644.88,
  A8: 7040.0,
  "A#8": 7458.62,
  B8: 7902.13,
} as const;

test('freqToNote should correctly identify all hardcoded frequencies', () => {
  for (const [expectedNoteName, frequency] of Object.entries(expectedNotes)) {
    const result = freqToNote(frequency);
    assert.strictEqual(
      result.note,
      expectedNoteName,
      `Frequency ${frequency} Hz should map to ${expectedNoteName}, got ${result.note}`
    );

    // Also verify the returned frequency is close to what we expect
    // Allow small rounding differences (within 0.1 Hz)
    assert.ok(
      Math.abs(result.frequency - frequency) < 0.1,
      `Returned frequency for ${expectedNoteName} should be close to ${frequency} Hz, got ${result.frequency} Hz`
    );
  }
});

test('freqToNote should handle frequencies above B8', () => {
  // Test a frequency well above B8 (7902.13 Hz)
  const highFreq = 10000; // 10 kHz
  const result = freqToNote(highFreq);

  // Should not throw and should return a valid note
  assert.ok(result.note, 'Should return a note name');
  assert.ok(result.frequency > 0, 'Should return a positive frequency');
  assert.ok(result.freqFrom > 0, 'Should return valid freqFrom');
  assert.ok(result.freqTo > 0, 'Should return valid freqTo');

  // The note should be higher than B8
  assert.ok(result.frequency > 7902.13, 'Frequency should be above B8');
});

test('freqToNote should handle frequencies below C0', () => {
  // Test a frequency well below C0 (16.35 Hz)
  const lowFreq = 10; // 10 Hz
  const result = freqToNote(lowFreq);

  // Should not throw and should return a valid note
  assert.ok(result.note, 'Should return a note name');
  assert.ok(result.frequency > 0, 'Should return a positive frequency');
  assert.ok(result.freqFrom > 0, 'Should return valid freqFrom');
  assert.ok(result.freqTo > 0, 'Should return valid freqTo');

  // The note should be lower than C0
  assert.ok(result.frequency < 16.35, 'Frequency should be below C0');
});

test('freqToNote should handle A4 (concert pitch) correctly', () => {
  const result = freqToNote(440);
  assert.strictEqual(result.note, 'A4', '440 Hz should be A4');
  assert.strictEqual(result.frequency, 440, 'A4 frequency should be exactly 440 Hz');
});

test('freqToNote should handle frequencies between notes', () => {
  // Test a frequency between A4 (440 Hz) and A#4 (466.16 Hz)
  const betweenFreq = 450;
  const result = freqToNote(betweenFreq);

  // Should round to the nearest note (closer to A4)
  assert.ok(['A4', 'A#4'].includes(result.note), 'Should round to nearest note');
});

test('freqToNote should throw error for zero or negative frequencies', () => {
  assert.throws(() => freqToNote(0), /Frequency must be positive/);
  assert.throws(() => freqToNote(-10), /Frequency must be positive/);
});

test('freqToNote should handle very high frequencies', () => {
  const veryHighFreq = 20000; // 20 kHz (above human hearing)
  const result = freqToNote(veryHighFreq);

  assert.ok(result.note, 'Should return a note name');
  assert.ok(result.frequency > 0, 'Should return a positive frequency');
});

test('freqToNote should handle very low frequencies', () => {
  const veryLowFreq = 1; // 1 Hz (subsonic)
  const result = freqToNote(veryLowFreq);

  assert.ok(result.note, 'Should return a note name');
  assert.ok(result.frequency > 0, 'Should return a positive frequency');
});
