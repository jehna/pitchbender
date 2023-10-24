import React, { useEffect } from "react";
import * as d3 from "d3";

export function Seeker({
  buffer,
  playing,
  marginTop,
  height,
  marginBottom,
  marginLeft,
  marginRight,
  width,
  audioContext,
}: {
  buffer: AudioBuffer;
  playing: boolean;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  height: number;
  width: number;
  audioContext: AudioContext;
}) {
  const xAudioLength = d3.scaleLinear(
    [0, buffer.duration],
    [marginLeft, width - marginRight]
  );
  const [currentTime, setCurrentTime] = React.useState(0);
  useEffect(() => {
    let playingNow = true;
    const updateLinePosition = () => {
      if (!playingNow) return;
      setCurrentTime(audioContext.currentTime);
      requestAnimationFrame(updateLinePosition);
    };
    if (playing) {
      updateLinePosition();
    }
    return () => {
      playingNow = false;
    };
  }, [playing]);

  return (
    <line
      x1={xAudioLength(currentTime % buffer.duration)}
      x2={xAudioLength(currentTime % buffer.duration)}
      y1={marginTop}
      y2={height - marginBottom}
      stroke="pink"
    />
  );
}
