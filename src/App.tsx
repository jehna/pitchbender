import React, { useCallback, useEffect, useRef } from "react";
import { InputFile } from "./InputFile";
import { PitchEditor } from "./PitchEditor";
import { PlayButton } from "./PlayButton";

export function App() {
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(
    null
  );
  const [playing, setPlaying] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  const audioContext = useRef(new AudioContext());
  const audioSource = useRef(audioContext.current.createBufferSource());
  const once = useRef(false);
  const once2 = useRef(false);
  useEffect(() => {
    if (once2.current) return;
    once2.current = true;
    audioSource.current.loop = true;
    audioSource.current.connect(audioContext.current.destination);
    audioContext.current.suspend();
  }, []);

  useEffect(() => {
    if (once.current || !audioBuffer) return;
    once.current = true;
    audioSource.current.buffer = audioBuffer;
    audioSource.current.start();
  }, [audioBuffer]);

  return (
    <>
      {audioBuffer ? (
        <>
          <PitchEditor
            buffer={audioBuffer}
            width={1200}
            playing={playing}
            audioContext={audioContext.current}
          />
          <PlayButton
            onClick={() => {
              if (audioContext.current.state === "running") {
                audioContext.current.suspend();
                setPlaying(false);
              } else {
                audioContext.current.resume();
                setPlaying(true);
              }
            }}
          />
        </>
      ) : (
        <InputFile onAudioBuffer={setAudioBuffer} />
      )}
    </>
  );
}
