import React from "react";

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

    onAudioBuffer(await fileToAudioBuffer(file));
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
