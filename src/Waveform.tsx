import React from "react";
import * as d3 from "d3";
import { Pitch } from "./Pitch";

export function Waveform({
  width = 640,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20,
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
  const data = buffer.getChannelData(0);
  const x = d3.scaleLinear(
    [0, data.length - 1],
    [marginLeft, width - marginRight]
  );
  const y = d3.scaleLinear(d3.extent(data) as [number, number], [
    height - marginBottom,
    marginTop,
  ]);
  const line = d3.line((d, i) => x(i), y);

  return (
    <svg width={width} height={height}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        d={line(data)!}
      />
      <Pitch
        buffer={buffer}
        width={width}
        height={height}
        marginTop={marginTop}
        marginRight={marginRight}
        marginBottom={marginBottom}
        marginLeft={marginLeft}
      />
    </svg>
  );
}
