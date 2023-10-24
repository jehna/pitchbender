import React, { useMemo } from "react";
import * as d3 from "d3";
import { noteToFreq, notesBetween } from "./notes";
import { Waveform } from "./Waveform";
import { Seeker } from "./Seeker";
import { useSplitAudio } from "./use-split-audio";
import { PitchNote } from "./pitch-detect";

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
  return (
    <svg width={width} height={height}>
      {state.clips.map(({ note, data, startTime, transposed, id, endTime }) => (
        <React.Fragment key={id}>
          <rect
            x={x(startTime)}
            y={
              y(note.freqTo) - (y(note.freqFrom) - y(note.freqTo)) * transposed
            }
            width={x(endTime) - x(startTime)}
            height={y(note.freqFrom) - y(note.freqTo)}
            fill="#FFE0F7"
          />
          <g
            transform={`translate(${x(startTime)}, ${
              y(note.freqTo) - (y(note.freqFrom) - y(note.freqTo)) * transposed
            } )`}
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
      ))}
      <line
        x1={marginLeft}
        x2={marginLeft}
        y1={marginTop}
        y2={height - marginBottom}
        stroke="currentColor"
      />
      {/* <Seeker
        buffer={state.audioBuffer}
        playing={false} // TODO
        marginTop={marginTop}
        height={height}
        marginBottom={marginBottom}
        marginLeft={marginLeft}
        marginRight={marginRight}
        width={width}
        audioContext={audioContext}
      />*/}
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
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        d={line(state.pitchData)!}
        shapeRendering={"crispEdges"}
        color="red"
      />
    </svg>
  );
}
