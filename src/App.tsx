import React, { useCallback, useEffect, useRef } from "react";
import { InputFile } from "./InputFile";
import { PitchEditor } from "./PitchEditor";
import { PlayButton } from "./PlayButton";
import * as Tone from "tone";

export function App() {
  const [audioBuffer, setAudioBuffer] = React.useState<AudioBuffer | null>(
    null
  );
  const [audioBufferTransformed, setAudioBufferTransformed] =
    React.useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const audioContext = useRef(new AudioContext());
  const audioSource = useRef(audioContext.current.createBufferSource());
  const player = useRef<Tone.Player>();
  const once = useRef(false);
  const once2 = useRef(false);
  useEffect(() => {
    if (once2.current) return;
    once2.current = true;
    audioSource.current.loop = true;
    audioContext.current.suspend();
  }, []);

  useEffect(() => {
    if (once.current || !audioBuffer) return;
    once.current = true;
    audioSource.current.buffer = audioBuffer;
    audioSource.current.start();
    Tone.Offline(({ transport }) => {
      const pitchShift = new Tone.PitchShift(0).toDestination();
      const player = new Tone.Player(audioBuffer).connect(pitchShift);
      transport.schedule(() => {
        pitchShift.pitch = 5;
      }, 1);
      transport.start();
      player.start();
    }, 10).then((buff) => {
      setAudioBufferTransformed((buff as any)._buffer);
    });
  }, [audioBuffer]);

  return (
    <>
      {audioBufferTransformed ? (
        <>
          <PitchEditor
            buffer={audioBufferTransformed}
            width={1200}
            playing={playing}
            audioContext={audioContext.current}
          />
          <PlayButton
            onClick={() => {
              if (player.current?.state === "started") {
                player.current?.stop();
                setPlaying(false);
              } else {
                player.current?.start();
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
