import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  freqToNote,
  noteDifferenceInSemotones,
  noteToFreq,
  notesBetween,
} from "./notes";
import { Waveform } from "./Waveform";
import { Seeker } from "./Seeker";
import { useSplitAudio } from "./use-split-audio";
import { PitchNote } from "./pitch-detect";
import { PlayButton } from "./PlayButton";
import { DownloadButton } from "./DownloadButton";

export function PitchEditor({
  width = 640,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 50,
  initialBuffer,
}: {
  initialBuffer: AudioBuffer;
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}) {
  const { state, dispatch } = useSplitAudio(initialBuffer);
  (window as any).dispath = dispatch;
  const audioDataExtent = d3.extent(state.audioBuffer.getChannelData(0)) as [
    number,
    number
  ];
  const x = d3.scaleLinear(
    [0, initialBuffer.duration],
    [marginLeft, width - marginRight]
  );
  const FROM = "G2" as const;
  const TO = "A3" as const;
  const y = d3.scaleLog(
    [noteToFreq(FROM), noteToFreq(TO)],
    [height - marginBottom, marginTop]
  );
  const line = d3
    .line<PitchNote>(
      (data) => x((data.startTime + data.endTime) / 2),
      (data) => y(data.frequency)
    )
    .curve(d3.curveBumpX);

  const audioContext = useMemo(() => {
    const ctx = new AudioContext();
    ctx.suspend();
    return ctx;
  }, []);
  const audioSource = useRef(audioContext.createBufferSource());

  useEffect(() => {
    const source = audioContext.createBufferSource();
    source.buffer = state.audioBuffer;
    source.loop = true;
    source.connect(audioContext.destination);
    source.start(0, audioContext.currentTime % source.buffer.duration);
    audioSource.current = source;
    return () => {
      source.stop();
      source.disconnect();
    };
  }, [audioContext, state.audioBuffer]);

  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (playing) {
      audioContext.resume();
    } else {
      audioContext.suspend();
    }
  }, [playing, audioSource]);

  return (
    <>
      <svg width={width} height={height}>
        {state.clips.map(
          ({ note, data, startTime, transposed, id, endTime }, i) => (
            <React.Fragment key={id}>
              <rect
                x={x(startTime)}
                y={
                  y(note.freqTo) -
                  (y(note.freqFrom) - y(note.freqTo)) * transposed
                }
                width={x(endTime) - x(startTime)}
                height={y(note.freqFrom) - y(note.freqTo)}
                fill="#FFE0F7"
                tabIndex={i}
                onKeyUp={(e) => {
                  switch (e.key) {
                    case "ArrowUp":
                      dispatch({
                        type: "transpose",
                        id,
                        amount: e.shiftKey
                          ? transposed + 0.1
                          : Math.ceil(transposed + 0.1),
                      });
                      break;
                    case "ArrowDown":
                      dispatch({
                        type: "transpose",
                        id,
                        amount: e.shiftKey
                          ? transposed - 0.1
                          : Math.floor(transposed - 0.1),
                      });
                      break;
                  }
                }}
              />
              <g
                transform={`translate(${x(startTime)}, ${
                  y(note.freqTo) -
                  (y(note.freqFrom) - y(note.freqTo)) * transposed
                } )`}
                style={{ pointerEvents: "none" }}
              >
                <Waveform
                  data={data}
                  width={x(endTime) - x(startTime)}
                  height={y(note.freqFrom) - y(note.freqTo)}
                  marginTop={0}
                  marginRight={0}
                  marginBottom={0}
                  marginLeft={0}
                  extent={audioDataExtent}
                />
              </g>
            </React.Fragment>
          )
        )}
        <line
          x1={marginLeft}
          x2={marginLeft}
          y1={marginTop}
          y2={height - marginBottom}
          stroke="currentColor"
        />
        <Seeker
          buffer={state.audioBuffer}
          playing={playing}
          marginTop={marginTop}
          height={height}
          marginBottom={marginBottom}
          marginLeft={marginLeft}
          marginRight={marginRight}
          width={width}
          audioContext={audioContext}
        />
        <line
          x1={marginLeft}
          x2={width - marginRight}
          y1={height - marginBottom}
          y2={height - marginBottom}
          stroke="currentColor"
        />
        {notesBetween(FROM, TO).map(({ note, frequency, freqTo }) => (
          <g key={note}>
            <line
              x1={marginLeft}
              x2={marginLeft - 6}
              y1={y(frequency)}
              y2={y(frequency)}
              stroke="currentColor"
            />
            <line
              x1={marginLeft}
              x2={width - marginRight}
              y1={y(freqTo)}
              y2={y(freqTo)}
              stroke="#CCC"
              strokeDasharray="2 2"
            />
            <text
              x={marginLeft - 9}
              y={y(frequency) + 3}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
            >
              {note}
            </text>
          </g>
        ))}
        {splitPitchData(state.pitchData).map((data) => (
          <path
            key={data[0].startTime}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            d={line(data)!}
            shapeRendering={"crispEdges"}
            color="red"
          />
        ))}
      </svg>
      <PlayButton onClick={() => setPlaying((p) => !p)} />
      <DownloadButton audioBuffer={state.audioBuffer} />
    </>
  );
}

function splitPitchData(pitchData: PitchNote[]): PitchNote[][] {
  const separateLines: PitchNote[][] = [];
  let currentLine: PitchNote[] = [];
  let prevNote = freqToNote(pitchData[0].frequency);
  for (const pitch of pitchData) {
    const currentNote = freqToNote(pitch.frequency);
    if (noteDifferenceInSemotones(currentNote, prevNote) > 2) {
      separateLines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(pitch);
    prevNote = currentNote;
  }
  if (currentLine.length > 0) {
    separateLines.push(currentLine);
  }
  return separateLines;
}
