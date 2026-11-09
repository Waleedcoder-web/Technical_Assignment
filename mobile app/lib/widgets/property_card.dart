import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../models/property_model.dart';
import '../screens/property_details_screen.dart';
import 'app_network_image.dart';

class PropertyCard extends StatelessWidget {
  final PropertyModel property;
  final VoidCallback? onScheduleTour;

  const PropertyCard({
    super.key,
    required this.property,
    this.onScheduleTour,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 18),
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
        border: Border.all(color: AppColors.surfaceContainerHigh, width: 0.8),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Photo Hero Section
          GestureDetector(
            onTap: () => _openDetails(context),
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 10,
                  child: AppNetworkImage(
                    url: property.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppColors.surfaceContainer,
                      child: const Center(
                        child: Icon(Icons.apartment, size: 48, color: AppColors.outline),
                      ),
                    ),
                  ),
                ),
                // Gradient Scrim
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.2),
                          Colors.transparent,
                          AppColors.primary.withValues(alpha: 0.85),
                        ],
                        stops: const [0.0, 0.45, 1.0],
                      ),
                    ),
                  ),
                ),
                // Top Badges
                Positioned(
                  top: 12,
                  left: 12,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.secondary,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [
                            BoxShadow(color: Colors.black26, blurRadius: 4),
                          ],
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.verified, color: Colors.white, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'HavenVerified',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: property.listingType == 'sale'
                              ? AppColors.tertiaryFixed
                              : AppColors.surfaceContainerLowest.withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          property.listingType == 'sale' ? 'For Sale' : 'For Rent',
                          style: TextStyle(
                            color: property.listingType == 'sale'
                                ? AppColors.onTertiaryFixed
                                : AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                      if (property.isReserved) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFBA1A1A),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: const [
                              BoxShadow(color: Colors.black26, blurRadius: 4),
                            ],
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.lock, color: Colors.white, size: 13),
                              SizedBox(width: 4),
                              Text(
                                'RESERVED',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                // Bottom Price & Marla Strip on Image
                Positioned(
                  bottom: 12,
                  left: 12,
                  right: 12,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            property.listingType == 'sale' ? 'Asking Price' : 'Monthly Lease',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 1),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                property.priceFormatted,
                                style: const TextStyle(
                                  color: AppColors.secondaryFixed,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              if (property.pricePeriod != null)
                                Text(
                                  property.pricePeriod!,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          property.areaUnit,
                          style: const TextStyle(
                            color: AppColors.secondaryFixed,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 2. Card Content Details
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => _openDetails(context),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property.title,
                        style: AppTypography.headlineSmall.copyWith(fontSize: 17),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on, color: AppColors.secondary, size: 15),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              property.location,
                              style: AppTypography.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Specs Badges Row (Beds, Baths, Sqft/Marla)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _SpecItem(
                        icon: Icons.bed_outlined,
                        label: '${property.beds} Beds',
                      ),
                      _SpecItem(
                        icon: Icons.bathtub_outlined,
                        label: '${property.baths} Baths',
                      ),
                      _SpecItem(
                        icon: Icons.aspect_ratio,
                        label: property.areaUnit.contains('Marla')
                            ? '${property.areaValue.toStringAsFixed(0)} Marla'
                            : '${property.areaValue.toStringAsFixed(0)} Kanal',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // Quick Amenities Tags
                if (property.amenities.isNotEmpty)
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: property.amenities.take(3).map((a) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          a,
                          style: AppTypography.labelSmall.copyWith(fontSize: 10.5),
                        ),
                      );
                    }).toList(),
                  ),

                const SizedBox(height: 12),

                // Action CTAs
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _openDetails(context),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.outlineVariant),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.visibility_outlined, size: 16, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text(
                              'View Details',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: property.isReserved ? null : (onScheduleTour ?? () => _openDetails(context)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: property.isReserved ? Colors.grey[400] : AppColors.secondary,
                          disabledBackgroundColor: const Color(0xFFBA1A1A).withValues(alpha: 0.15),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              property.isReserved ? Icons.lock : Icons.chat_bubble_outline,
                              size: 14,
                              color: property.isReserved ? const Color(0xFFBA1A1A) : Colors.white,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              property.isReserved ? 'Reserved' : 'Inquire Now',
                              style: TextStyle(
                                color: property.isReserved ? const Color(0xFFBA1A1A) : Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openDetails(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PropertyDetailsScreen(property: property),
      ),
    );
  }
}

class _SpecItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SpecItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.secondary),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTypography.labelMedium.copyWith(fontSize: 12),
        ),
      ],
    );
  }
}
