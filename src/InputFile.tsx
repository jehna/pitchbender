import React from "react";
import { applyPitches } from "./use-split-audio";

export function InputFile({
  onAudioBuffer,
}: {
  onAudioBuffer: (audioBuffer: AudioBuffer) => void;
}) {
  const onAudioFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const audioBuffer = await fileToAudioBuffer(file);
    const audioBufferDelayedUglyHackFix = await applyPitches([], audioBuffer);
    (audioBuffer as any).___audioBufferDelayedUglyHackFix =
      audioBufferDelayedUglyHackFix; // Pitch shifting introduces delay and I'm too tired to fix it properly rn
    // TODO: fix this 👆
    onAudioBuffer(audioBuffer);
  };

  return <input type="file" onChange={onAudioFileChange} />;
}
async function fileToAudioBuffer(file: File): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const audioContext = new AudioContext();
      audioContext
        .decodeAudioData(reader.result as ArrayBuffer)
        .then((audioBuffer) => {
          resolve(audioBuffer);
        })
        .catch((error) => {
          reject(error);
        });
    };
    reader.readAsArrayBuffer(file);
  });
}
