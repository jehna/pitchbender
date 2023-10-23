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

interface Pitch {
  time: number; // Time in seconds
  frequency: number; // Pitch in Hz
}

function autocorrelation(data: AudioBuffer): Pitch[] {
  const pitches: Pitch[] = [];

  const buffer = data.getChannelData(0);
  const sampleRate = data.sampleRate;
  const minFrequency = 80; // Adjust based on your application
  const maxFrequency = 1200; // Adjust based on your application

  const bufferSize = buffer.length;
  const maxShift = Math.floor(sampleRate / minFrequency);
  const minShift = Math.floor(sampleRate / maxFrequency);

  for (let i = minShift; i < maxShift; i++) {
    let sum = 0;

    for (let j = 0; j < bufferSize - i; j++) {
      sum += (buffer[j] + 1) * (buffer[j + i] + 1);
    }

    pitches.push({
      time: i / sampleRate,
      frequency: sampleRate / i,
    });
  }

  return pitches;
}

function zeroCrossingRate(buffer: AudioBuffer): number[] {
  const rates: number[] = [];
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length - 1; i++) {
    if (
      (data[i] >= 0 && data[i + 1] < 0) ||
      (data[i] < 0 && data[i + 1] >= 0)
    ) {
      rates.push(i);
    }
  }

  return rates;
}

function calculatePitchFromZeroCrossings(
  zeroCrossingPositions: number[],
  sampleRate: number
): number[] {
  const pitches: number[] = [];
  const numZeroCrossings = zeroCrossingPositions.length;

  for (let i = 1; i < numZeroCrossings; i++) {
    const period =
      (zeroCrossingPositions[i] - zeroCrossingPositions[i - 1]) / sampleRate;
    const pitch = 1 / (2 * period);
    pitches.push(pitch);
  }

  return pitches;
}
