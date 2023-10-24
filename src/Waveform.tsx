import React from "react";
import * as d3 from "d3";

export function Waveform({
  width = 640,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20,
  data,
  extent,
}: {
  data: Float32Array;
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  extent: [number, number];
}) {
  const x = d3.scaleLinear(
    [0, data.length - 1],
    [marginLeft, width - marginRight]
  );
  const y = d3.scaleLinear(extent, [height - marginBottom, marginTop]);
  const line = d3.line((d, i) => x(i), y);

  return (
    <path fill="none" stroke="currentColor" strokeWidth="1" d={line(data)!} />
  );
}
