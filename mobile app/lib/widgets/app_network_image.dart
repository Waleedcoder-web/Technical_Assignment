import 'dart:convert';
import 'package:flutter/material.dart';

/// A robust image widget that displays both remote HTTP/HTTPS URLs and base64 data URIs
/// with seamless loading and fallback error builder.
class AppNetworkImage extends StatelessWidget {
  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Widget? placeholder;
  final Widget Function(BuildContext, Object, StackTrace?)? errorBuilder;

  const AppNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.placeholder,
    this.errorBuilder,
  });

  @override
  Widget build(BuildContext context) {
    final trimmed = url.trim();

    if (trimmed.isEmpty) {
      return _buildFallback(context);
    }

    if (trimmed.startsWith('data:image')) {
      try {
        final commaIdx = trimmed.indexOf(',');
        final base64Data = commaIdx != -1 ? trimmed.substring(commaIdx + 1) : trimmed;
        final bytes = base64Decode(base64Data);
        return Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: errorBuilder ?? (_, __, ___) => _buildFallback(context),
        );
      } catch (e) {
        return _buildFallback(context);
      }
    }

    return Image.network(
      trimmed,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: errorBuilder ?? (_, __, ___) => _buildFallback(context),
      loadingBuilder: placeholder != null
          ? (ctx, child, progress) {
              if (progress == null) return child;
              return placeholder!;
            }
          : null,
    );
  }

  Widget _buildFallback(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: const Color(0xFFF0F1F3),
      child: const Center(
        child: Icon(Icons.apartment, size: 36, color: Color(0xFF75777F)),
      ),
    );
  }
}
