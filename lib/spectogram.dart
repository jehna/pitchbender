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
                size: const Size(500, 300),
              ),
              CustomPaint(
                painter: LinegramPainer(
                    wav: wav, threshold: logarihmicallyRisingValue),
                size: const Size(500, 300),
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
      final path = Path();
      if (hair.length == 1) continue;
      path.moveTo(hair.first.x * chunkWidth,
          log(hair.first.y) / log(41000) * size.height);
      for (final point in hair) {
        final x = point.x * chunkWidth;
        final y =
            log(point.y) / log(41000) * size.height + Random().nextDouble() * 0;
        path.lineTo(x, y);
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = Colors.white30
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
  for (var i = 0; i < data.length; i++) {
    current += data[i];
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
