import React from "react";
import { InputFile } from "./InputFile";
import { PitchEditor } from "./PitchEditor";
import { PlayButton } from "./PlayButton";

export function App() {
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(
    null
  );

  return (
    <>
      {audioBuffer ? (
        <PitchEditor initialBuffer={audioBuffer} width={1200} />
      ) : (
        <InputFile onAudioBuffer={setAudioBuffer} />
      )}
    </>
  );
}
