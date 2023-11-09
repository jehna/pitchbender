import 'dart:math';
import 'dart:typed_data';
import 'package:fftea/stft.dart';
import 'package:fftea/util.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:wav/wav_file.dart';

class Spectogram extends StatefulWidget {
  const Spectogram({super.key});

  @override
  State<Spectogram> createState() => _SpectogramState();
}

class _SpectogramState extends State<Spectogram> {
  Float64List? wav;
  double threshold = 100;

  @override
  void initState() {
    super.initState();
    createSpectogram();
  }

  void createSpectogram() async {
    final wav = await readAssetAsWav("assets/audios/sample.wav");
    setState(() {
      this.wav = wav;
    });
  }

  Future<Float64List> readAssetAsWav(String assetName) async {
    final file = await rootBundle.load(assetName);
    return Wav.read(file.buffer.asUint8List()).toMono();
  }

  @override
  Widget build(BuildContext context) {
    final wav = this.wav;
    final logarihmicallyRisingValue =
        pow(threshold - 20, 5) / pow(1000 - 20, 5) * (1000 - 20) + 20;
    return Column(children: [
      Slider(
        value: threshold,
        min: 10,
        max: 1000,
        onChanged: (value) {
          setState(() {
            threshold = value;
          });
        },
      ),
      wav != null
          ? Stack(children: [
              CustomPaint(
                painter: SpectogramPainer(wav: wav),
                size: const Size(700, 400),
              ),
              CustomPaint(
                painter: LinegramPainer(
                    wav: wav, threshold: logarihmicallyRisingValue),
                size: const Size(700, 400),
              ),
            ])
          : const SizedBox()
    ]);
  }
}

class SpectogramPainer extends CustomPainter {
  Float64List wav;
  SpectogramPainer({required this.wav});

  @override
  void paint(Canvas canvas, Size size) {
    // Mirror canvas horizontally
    canvas.scale(1, -1);
    canvas.translate(0, -size.height);
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = Colors.black,
    );
    if (1 == 1) return;
    const chunkSize = 2048;
    final stft = STFT(chunkSize, Window.hanning(chunkSize));
    var chunkIndex = 0;
    final chunkWidth = size.width / (wav.length / chunkSize);
    stft.run(wav, (Float64x2List chunk) {
      final data = chunk.discardConjugates().magnitudes();
      final x = chunkIndex * chunkWidth;
      final chunkItemHeight = data.length / size.height;
      for (var i = 0; i < data.length; i++) {
        final y = i / data.length * size.height;
        final logY = log(i + 1) / log(data.length) * size.height;
        final yMel = linearToMel(i.toDouble()) / data.length * size.height;
        final chunkItemHeightLog =
            log(i + 2) / log(data.length) * size.height - logY;
        final chunkItemHeightMel =
            linearToMel((i + 1).toDouble()) / data.length * size.height - yMel;
        canvas.drawRect(
          Rect.fromLTWH(x, yMel, chunkWidth, chunkItemHeightMel),
          Paint()
            ..color = data[i] < 0.01
                ? Colors.black
                : data[i] < 0.1
                    ? Colors.deepPurple
                    : data[i] < 0.5
                        ? Colors.pink
                        : data[i] < 5
                            ? Colors.orangeAccent
                            : data[i] < 7
                                ? Colors.yellow
                                : Colors.white
            //..maskFilter = MaskFilter.blur(BlurStyle.normal, 0.1 / data[i])
            ..isAntiAlias = true,
        );
      }
      chunkIndex++;
    });
  }

  @override
  bool shouldRepaint(SpectogramPainer oldDelegate) {
    return wav != oldDelegate.wav;
  }
}

class LinegramPainer extends CustomPainter {
  Float64List wav;
  double threshold;
  LinegramPainer({required this.wav, required this.threshold});

  @override
  void paint(Canvas canvas, Size size) {
    // Mirror canvas horizontally
    canvas.scale(1, -1);
    canvas.translate(0, -size.height);

    const chunkSize = 2048;
    final stft = STFT(chunkSize, Window.hanning(chunkSize));
    var chunkIndex = 0;
    final chunkWidth = size.width / (wav.length / chunkSize);

    List<List<int>> points = [];
    stft.run(wav, (Float64x2List chunk) {
      final data = chunk.discardConjugates().magnitudes();
      points.add(groupByValues(data, threshold));
    });

    final hairs = pointsToHairs(points);
    for (final hair in hairs) {
      if (hair.length == 1) continue;

      final points = hair.map((point) {
        final x = point.x * chunkWidth;
        final y =
            log(point.y) / log(20000) * size.height + Random().nextDouble() * 0;
        return Offset(x, y);
      }).toList();
      drawCatmullRomSpline(
        canvas,
        points,
        Paint()
          ..color = Colors.white10
          ..strokeWidth = 1
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..blendMode = BlendMode.plus
          ..isAntiAlias = true,
      );
    }
  }

  @override
  bool shouldRepaint(LinegramPainer oldDelegate) {
    return wav != oldDelegate.wav;
  }
}

List<int> groupByValues(Float64List data, double threshold) {
  final result = <int>[];
  var current = 0.0;
  var last = 0;
  for (var i = 0; i < data.length; i++) {
    current += data[i];
    if (current > threshold) {
      final sum = data.sublist(last, i).reduce((a, b) => a + b);
      var currentMedian = 0.0;
      for (var j = last; j <= i; j++) {
        currentMedian += data[j];
        if (currentMedian > sum / 2) {
          result.add(j);
          last = j;
          break;
        }
      }
      current -= threshold;
    }
    if (current > threshold) {
      result.add(i);
      current -= threshold;
    }
    if (current > threshold) {
      result.add(i);
      current -= threshold;
    }
    if (current > threshold) {
      result.add(i);
      current -= threshold;
    }
  }
  return result;
}

const MAX_DISTANCE_LOG_MULTIPLIER = 1.1;
(int distance, List<Point<int>> connector, int connectee) EMPTY =
    const (-1, [], -1);
List<List<Point<int>>> pointsToHairs(List<List<int>> points) {
  final result = points[0].map((v) => [Point(0, v)]).toList();

  for (var currentIndex = 1; currentIndex < points.length; currentIndex++) {
    //if (currentIndex > 58) break;

    final connectors =
        result.where((hair) => hair.last.x == currentIndex - 1).toList();
    final connectees = [...points[currentIndex]];
    while (connectees.isNotEmpty) {
      var shortest = EMPTY;
      for (final connector in connectors) {
        for (final connectee in connectees) {
          final distance = (connectee - connector.last.y).abs();
          if ((shortest == EMPTY || distance < shortest.$1) &&
              absLogMultiplier(connector.last.y, connectee) <
                  MAX_DISTANCE_LOG_MULTIPLIER) {
            shortest = (distance, connector, connectee);
          }
        }
      }
      if (shortest == EMPTY) {
        for (final connectee in connectees) {
          result.add([Point(currentIndex, connectee)]);
        }
        break;
      }
      shortest.$2.add(Point(currentIndex, shortest.$3));
      connectors.remove(shortest.$2);
      connectees.remove(shortest.$3);
    }
  }
  return result;
}

double absLogMultiplier(int a, int b) =>
    log(a) / log(b) > log(b) / log(a) ? log(a) / log(b) : log(b) / log(a);
double log10(double number) => log(number) / ln10;
double linearToMel(double linear) => 2595 * log10(1 + linear / 700);

Color lerpMultiple(List<Color> colors, double percent) {
  percent = min(percent, 0.999999);
  final step = 1 / (colors.length - 1);
  final index = (percent / step).floor();
  final percentRelative = (percent - index * step) / step;
  return Color.lerp(colors[index], colors[index + 1], percentRelative)!;
}

void drawCatmullRomSpline(Canvas canvas, List<Offset> points, Paint paint) {
  /**
   * Stolen from:
   * https://github.com/mohamed-aly1/catmull_rom_spline_curve/blob/716fcf95ded746b063ca420d4b4f9b5b93aa9ebb/lib/catmull_rom_spline_curve.dart
   * MIT license:
   * https://github.com/mohamed-aly1/catmull_rom_spline_curve/blob/716fcf95ded746b063ca420d4b4f9b5b93aa9ebb/LICENSE
   */
  final path = Path();
  const magic1 = 1.5;
  const magic2 = 6.0;

  for (int i = 0; i < points.length - 1; i++) {
    Offset p1;
    Offset p2;
    Offset p3;

    Offset p1Spline;
    Offset p2Spline;
    Offset p3Spline;
    Offset p4Spline;
    if (points.length < 3) {
      p1 = points[i];
      p2 = points[i + 1];
      p3 = points[i];
      p1Spline = p1;
      p2Spline = p1;
      p3Spline = p2;
      p4Spline = p2;
    } else if (i == 0) {
      p1 = points[i];
      p2 = points[i + 1];
      p3 = points[i + 2];
      p1Spline = p1;
      p2Spline = p1 - ((p1 - p2) / magic1);
      p3Spline = p2 - ((p3 - p1) / magic2);
      p4Spline = p2;
    } else if (i == points.length - 1) {
      p1 = points[i - 1];
      p2 = points[i];
      p3 = points[i + 1];
      p1Spline = p2;
      p2Spline = p2 + ((p2 - p1) / magic1);
      p3Spline = p3 - ((p3 - p2) / magic2);
      p4Spline = p3;
    } else {
      p1 = points[i - 1];
      p2 = points[i];
      p3 = points[i + 1];
      p1Spline = p2;
      p2Spline = p2 + ((p2 - p1) / magic1);
      p3Spline = p3 - ((p3 - p1) / magic2);
      p4Spline = p3;
    }

    path.moveTo(p1Spline.dx, p1Spline.dy);
    path.cubicTo(p2Spline.dx, p2Spline.dy, p3Spline.dx, p3Spline.dy,
        p4Spline.dx, p4Spline.dy);

    canvas.drawPath(path, paint);
  }
}
