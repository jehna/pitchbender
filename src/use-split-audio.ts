import { useReducer, useRef } from "react";
import { Note, splitToNotes } from "./notes";
import { PitchNote, toPitch } from "./pitch-detect";
import * as Tone from "tone";

export function useSplitAudio(audioBuffer: AudioBuffer) {
  const [state, dispatch] = useReducer(reduce, audioBuffer, initializeState);
  useSideEffect(
    async () => {
      const newBuffer = await applyPitches(
        state.clips,
        state.initialAudioBuffer
      );
      dispatch({ type: "set_audio_buffer", audioBuffer: newBuffer });
    },
    state.clips.map((clip) => clip.transposed)
  );
  return { state, dispatch };
}

type Clip = {
  note: Note;
  transposed: number;
  startTime: number;
  endTime: number;
  data: Float32Array;
  id: number;
};

type State = {
  tempo: number;
  quantization: number;
  clips: Clip[];
  pitchData: PitchNote[];
  audioBuffer: AudioBuffer;
  initialAudioBuffer: AudioBuffer;
};

type Action<T extends string, P> = { type: T } & P;
type Actions =
  | Action<"transpose", { id: number; amount: number }>
  | Action<"set_audio_buffer", { audioBuffer: AudioBuffer }>;

function reduce(state: State, action: Actions): State {
  switch (action.type) {
    case "transpose": {
      const { id, amount } = action;
      const clip = state.clips.find((clip) => clip.id === id)!;
      const newClip = { ...clip, transposed: amount };
      const newClips = state.clips.map((clip) =>
        clip.id === id ? newClip : clip
      );
      return { ...state, clips: newClips };
    }
    case "set_audio_buffer": {
      const pitchData = toPitch(
        action.audioBuffer,
        state.tempo,
        state.quantization
      );
      return { ...state, audioBuffer: action.audioBuffer, pitchData };
    }
  }
}

function initializeState(audioBuffer: AudioBuffer): State {
  const DEFAULT_TEMPO = 120;
  const DEFAULT_QUANTIZATION = 10;
  const initialPitchData = toPitch(
    audioBuffer,
    DEFAULT_TEMPO,
    DEFAULT_QUANTIZATION
  );
  const notes = splitToNotes(
    initialPitchData,
    audioBuffer,
    audioBuffer.length,
    DEFAULT_QUANTIZATION,
    DEFAULT_TEMPO
  );

  return {
    clips: notes.map(({ note, startTime, endTime, data }, i) => ({
      note,
      transposed: 0,
      startTime,
      endTime,
      data,
      id: i,
    })),
    pitchData: initialPitchData,
    audioBuffer,
    initialAudioBuffer: audioBuffer,
    tempo: DEFAULT_TEMPO,
    quantization: DEFAULT_QUANTIZATION,
  };
}

function useSideEffect(fn: () => void, deps: any[]) {
  const ref = useRef<any[]>(deps);
  if (!shallowEqual(ref.current, deps)) {
    ref.current = deps;
    fn();
  }
}
const shallowEqual = (a: any[], b: any[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

async function applyPitches(
  clips: Clip[],
  audioBuffer: AudioBuffer
): Promise<AudioBuffer> {
  const result = await Tone.Offline(
    ({ transport }) => {
      const pitchShift = new Tone.PitchShift(0).toDestination();
      const player = new Tone.Player(audioBuffer).connect(pitchShift);
      for (const clip of clips) {
        transport.schedule(() => {
          pitchShift.pitch = clip.transposed;
        }, clip.startTime);
      }
      transport.start();
      player.start();
    },
    audioBuffer.duration,
    2,
    audioBuffer.sampleRate
  );
  return (result as any)._buffer;
}
