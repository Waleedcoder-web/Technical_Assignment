import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';

class EscrowChart extends StatelessWidget {
  const EscrowChart({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0C001637),
            offset: Offset(0, 4),
            blurRadius: 16,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ESCROW LEDGER',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.secondary,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Rent Flow Collection',
                    style: AppTypography.headlineSmall.copyWith(fontSize: 18),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'PKR 142.5M',
                    style: AppTypography.headlineSmall.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '98.4% on-time',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Legend
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text('Cleared Settlement', style: AppTypography.labelSmall),
                  ],
                ),
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text('In Escrow Transit', style: AppTypography.labelSmall),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Bar Chart Canvas
          SizedBox(
            height: 110,
            width: double.infinity,
            child: CustomPaint(
              painter: _ChartPainter(),
            ),
          ),

          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 8),

          // Footer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Disbursement Batch #09-28',
                style: AppTypography.labelSmall,
              ),
              Row(
                children: [
                  const Icon(Icons.bolt, color: AppColors.secondary, size: 14),
                  const SizedBox(width: 2),
                  Text(
                    'Auto-release in 4h',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = AppColors.surfaceContainerHigh
      ..strokeWidth = 0.8
      ..style = PaintingStyle.stroke;

    // Draw grid dashed lines
    for (double y = 15; y <= 85; y += 35) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final months = ['MAY', 'JUN', 'JUL', 'AUG', 'SEP'];
    final transitHeights = [54.0, 64.0, 72.0, 78.0, 84.0];
    final clearedHeights = [40.0, 50.0, 60.0, 70.0, 80.0];

    final barWidth = 22.0;
    final spacing = (size.width - (months.length * barWidth)) / (months.length + 1);

    final transitPaint = Paint()
      ..color = AppColors.primaryContainer.withValues(alpha: 0.9)
      ..style = PaintingStyle.fill;

    final clearedPaint = Paint()
      ..color = AppColors.secondary
      ..style = PaintingStyle.fill;

    final trendPoints = <Offset>[];

    for (int i = 0; i < months.length; i++) {
      final x = spacing + i * (barWidth + spacing);
      final transitH = transitHeights[i];
      final clearedH = clearedHeights[i];

      // Draw transit bar
      final transitRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, 90 - transitH, barWidth, transitH),
        const Radius.circular(4),
      );
      canvas.drawRRect(transitRect, transitPaint);

      // Draw cleared bar
      final clearedRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, 90 - clearedH, barWidth, clearedH),
        const Radius.circular(4),
      );
      canvas.drawRRect(clearedRect, clearedPaint);

      trendPoints.add(Offset(x + barWidth / 2, 90 - transitH));

      // Draw month label
      final textPainter = TextPainter(
        text: TextSpan(
          text: months[i],
          style: TextStyle(
            color: i == months.length - 1 ? AppColors.primary : AppColors.onSurfaceVariant,
            fontSize: 10,
            fontWeight: i == months.length - 1 ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(x + (barWidth - textPainter.width) / 2, 96),
      );
    }

    // Draw trend curve
    if (trendPoints.isNotEmpty) {
      final trendPaint = Paint()
        ..color = AppColors.secondaryContainer
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke;

      final path = Path();
      path.moveTo(trendPoints[0].dx, trendPoints[0].dy);
      for (int i = 1; i < trendPoints.length; i++) {
        path.lineTo(trendPoints[i].dx, trendPoints[i].dy);
      }
      canvas.drawPath(path, trendPaint);

      // Draw end circle
      final circlePaint = Paint()
        ..color = AppColors.secondary
        ..style = PaintingStyle.fill;
      canvas.drawCircle(trendPoints.last, 4, circlePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
