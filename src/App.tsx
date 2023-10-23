import React from "react";
import { InputFile } from "./InputFile";
import { Waveform } from "./Waveform";
import { Pitch } from "./Pitch";

export function App() {
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(
    null
  );

  return (
    <>
      {audioBuffer ? (
        <>
          <Waveform buffer={audioBuffer} width={1200} />
        </>
      ) : (
        <InputFile onAudioBuffer={setAudioBuffer} />
      )}
    </>
  );
}
