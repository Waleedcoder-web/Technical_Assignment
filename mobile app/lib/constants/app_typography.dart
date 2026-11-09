import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  // Headlines - Plus Jakarta Sans
  static TextStyle displayLarge = GoogleFonts.plusJakartaSans(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.025,
    color: AppColors.primary,
  );

  static TextStyle headlineLarge = GoogleFonts.plusJakartaSans(
    fontSize: 26,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.02,
    color: AppColors.primary,
  );

  static TextStyle headlineMedium = GoogleFonts.plusJakartaSans(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.02,
    color: AppColors.primary,
  );

  static TextStyle headlineSmall = GoogleFonts.plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.015,
    color: AppColors.primary,
  );

  static TextStyle metricLarge = GoogleFonts.plusJakartaSans(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.02,
    color: AppColors.primary,
  );

  // Body & Titles - Inter
  static TextStyle titleMedium = GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.01,
    color: AppColors.primary,
  );

  static TextStyle bodyLarge = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    letterSpacing: -0.01,
    color: AppColors.onSurface,
  );

  static TextStyle bodyMedium = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    letterSpacing: -0.005,
    color: AppColors.onSurface,
  );

  static TextStyle bodySmall = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.onSurfaceVariant,
  );

  static TextStyle labelMedium = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.02,
    color: AppColors.onSurface,
  );

  static TextStyle labelSmall = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.02,
    color: AppColors.onSurfaceVariant,
  );

  // Convenience aliases
  static TextStyle get h1 => displayLarge;
  static TextStyle get h2 => headlineLarge;
  static TextStyle get h3 => headlineSmall;
  static TextStyle get caption => labelSmall;
}
