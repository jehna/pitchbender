import React, { useMemo } from "react";
import * as d3 from "d3";
import Pitchfinder from "pitchfinder";
import { freqToNote, noteToFreq, notesBetween } from "./notes";

export function PitchEditor({
  width = 640,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 50,
  buffer,
}: {
  buffer: AudioBuffer;
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}) {
  const data = useMemo(() => toPitch(buffer), [buffer]);
  const x = d3.scaleLinear(
    [0, data.length - 1],
    [marginLeft, width - marginRight]
  );
  const FROM = "G2" as const;
  const TO = "A3" as const;
  const y = d3.scaleLog(
    [noteToFreq(FROM), noteToFreq(TO)],
    [height - marginBottom, marginTop]
  );
  const line = d3.line((d, i) => x(i), y).curve(d3.curveCatmullRom.alpha(0.5));

  return (
    <svg width={width} height={height}>
      <line
        x1={marginLeft}
        x2={marginLeft}
        y1={marginTop}
        y2={height - marginBottom}
        stroke="currentColor"
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
        d={line(data)!}
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
      quantization: 8, // samples per beat, defaults to 4 (i.e. 16th notes)
    }
  ) as number[];
}
