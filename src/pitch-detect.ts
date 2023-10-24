import Pitchfinder from "pitchfinder";

export type PitchNote = {
  frequency: number;
  startTime: number;
  endTime: number;
};

export function toPitch(
  data: AudioBuffer,
  tempo: number,
  quantization: number
): PitchNote[] {
  const freqs = Pitchfinder.frequencies(
    [Pitchfinder.ACF2PLUS(), Pitchfinder.AMDF()],
    data.getChannelData(0).slice(0, data.length),
    {
      tempo, // in BPM, defaults to 120
      quantization, // samples per beat, defaults to 4 (i.e. 16th notes)
    }
  ) as number[];
  return freqs.map((frequency, i) => ({
    frequency: frequency === -1 ? 1 : frequency,
    startTime: (i * 60) / (tempo * quantization),
    endTime: ((i + 1) * 60) / (tempo * quantization),
  }));
}
