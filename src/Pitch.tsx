import React from "react";
import * as d3 from "d3";
import Pitchfinder from "pitchfinder";

export function Pitch({
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
  const data = Pitchfinder.frequencies(
    [Pitchfinder.ACF2PLUS(), Pitchfinder.AMDF()],
    buffer.getChannelData(0),
    {
      tempo: 130, // in BPM, defaults to 120
      quantization: 8, // samples per beat, defaults to 4 (i.e. 16th notes)
    }
  ) as number[];
  const x = d3.scaleLinear(
    [0, data.length - 1],
    [marginLeft, width - marginRight]
  );
  const y = d3.scaleLinear(d3.extent(data) as [number, number], [
    height - marginBottom,
    marginTop,
  ]);
  const line = d3.line((d, i) => x(i), y).curve(d3.curveCatmullRom.alpha(0.5));

  return (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      d={line(data)!}
      shapeRendering={"crispEdges"}
      color="red"
    />
  );
}
