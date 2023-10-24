import React, { useEffect, useMemo } from "react";
import * as d3 from "d3";
import Pitchfinder from "pitchfinder";
import { noteToFreq, notesBetween, splitToNotes } from "./notes";
import { Waveform } from "./Waveform";
import { Seeker } from "./Seeker";

export function PitchEditor({
  width = 640,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 50,
  buffer,
  playing,
  audioContext,
}: {
  buffer: AudioBuffer;
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  playing: boolean;
  audioContext: AudioContext;
}) {
  const pitchData = useMemo(() => toPitch(buffer), [buffer]);
  const splitAudioData = useMemo(
    () => splitToNotes(pitchData, buffer),
    [pitchData, buffer]
  );
  const audioDataExtent = d3.extent(buffer.getChannelData(0)) as [
    number,
    number
  ];
  const xPitch = d3.scaleLinear(
    [0, pitchData.length + 1],
    [marginLeft, width - marginRight]
  );
  const xAudioData = d3.scaleLinear(
    [0, buffer.length - 1],
    [marginLeft, width - marginRight]
  );
  const FROM = "G2" as const;
  const TO = "A3" as const;
  const y = d3.scaleLog(
    [noteToFreq(FROM), noteToFreq(TO)],
    [height - marginBottom, marginTop]
  );
  const line = d3.line((d, i) => xPitch(i), y).curve(d3.curveBumpX);

  return (
    <svg width={width} height={height}>
      {splitAudioData.map(({ note, data, start }, i) => (
        <React.Fragment key={i}>
          <rect
            x={xAudioData(start)}
            y={y(note.freqTo)}
            width={xAudioData(start + data.length) - xAudioData(start)}
            height={y(note.freqFrom) - y(note.freqTo)}
            fill="#FFE0F7"
          />
          <g transform={`translate(${xAudioData(start)}, ${y(note.freqTo)})`}>
            <Waveform
              data={data}
              width={xAudioData(start + data.length) - xAudioData(start)}
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
      <Seeker
        buffer={buffer}
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
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        d={line(pitchData)!}
        shapeRendering={"crispEdges"}
        color="red"
      />
    </svg>
  );
}

function toPitch(data: AudioBuffer): number[] {
  return Pitchfinder.frequencies(
    [Pitchfinder.ACF2PLUS(), Pitchfinder.AMDF()],
    data.getChannelData(0),
    {
      tempo: 130, // in BPM, defaults to 120
      quantization: 10, // samples per beat, defaults to 4 (i.e. 16th notes)
    }
  ) as number[];
}
