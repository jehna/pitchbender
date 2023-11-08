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
    return wav != null
        ? CustomPaint(
            painter: SpectogramPainer(wav: wav),
            size: const Size(500, 300),
          )
        : const SizedBox();
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

double log10(double number) => log(number) / ln10;
double linearToMel(double linear) => 2595 * log10(1 + linear / 700);

Color lerpMultiple(List<Color> colors, double percent) {
  percent = min(percent, 0.999999);
  final step = 1 / (colors.length - 1);
  final index = (percent / step).floor();
  final percentRelative = (percent - index * step) / step;
  return Color.lerp(colors[index], colors[index + 1], percentRelative)!;
}
