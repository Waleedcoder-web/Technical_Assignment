import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../widgets/booking_sheet.dart';
import '../widgets/app_network_image.dart';

class PropertyDetailsScreen extends StatefulWidget {
  final PropertyModel property;

  const PropertyDetailsScreen({super.key, required this.property});

  @override
  State<PropertyDetailsScreen> createState() => _PropertyDetailsScreenState();
}

class _PropertyDetailsScreenState extends State<PropertyDetailsScreen> {
  final PageController _pageController = PageController();
  int _currentImageIndex = 0;

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final currentProperty = appState.properties.firstWhere(
      (p) => p.id == widget.property.id,
      orElse: () => widget.property,
    );
    final images = currentProperty.images.isNotEmpty
        ? currentProperty.images
        : [currentProperty.imageUrl];

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface.withValues(alpha: 0.95),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          currentProperty.title,
          style: AppTypography.titleMedium.copyWith(fontSize: 16),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Swipeable Photo Gallery Carousel
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 11,
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
                        itemCount: images.length,
                        itemBuilder: (ctx, i) {
                          return AppNetworkImage(
                            url: images[i],
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: AppColors.surfaceContainer,
                              child: const Icon(Icons.apartment, size: 54, color: AppColors.outline),
                            ),
                          );
                        },
                      ),
                    ),
                    // Gradient scrim
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.2),
                              Colors.transparent,
                              AppColors.primary.withValues(alpha: 0.7),
                            ],
                            stops: const [0.0, 0.5, 1.0],
                          ),
                        ),
                      ),
                    ),
                    // Photo counter pill
                    Positioned(
                      bottom: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.photo_camera, size: 13, color: Colors.white),
                            const SizedBox(width: 5),
                            Text(
                              '${_currentImageIndex + 1} / ${images.length} Photos',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Indicator Dots
                    Positioned(
                      bottom: 14,
                      right: 14,
                      child: Row(
                        children: List.generate(images.length, (i) {
                          final isCurrent = i == _currentImageIndex;
                          return Container(
                            margin: const EdgeInsets.only(left: 4),
                            width: isCurrent ? 8 : 6,
                            height: isCurrent ? 8 : 6,
                            decoration: BoxDecoration(
                              color: isCurrent ? Colors.white : Colors.white38,
                              shape: BoxShape.circle,
                            ),
                          );
                        }),
                      ),
                    ),
                    if (currentProperty.isReserved)
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFBA1A1A),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: const [
                              BoxShadow(color: Colors.black38, blurRadius: 6),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock, color: Colors.white, size: 14),
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
                      ),
                  ],
                ),
              ),
            ),

            // 2. Badges & Headline & Price Block
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (currentProperty.isReserved) ...[
                    Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF0F0),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFFB4AB)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.lock, color: Color(0xFFBA1A1A), size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Property Reserved',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFBA1A1A), fontSize: 13),
                                ),
                                Text(
                                  'This property has been reserved and is currently locked for new bookings.',
                                  style: TextStyle(color: Color(0xFFBA1A1A), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: currentProperty.isReserved ? const Color(0xFFBA1A1A) : AppColors.secondaryContainer,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          currentProperty.isReserved ? 'RESERVED' : 'Instant Lease Available',
                          style: TextStyle(
                            color: currentProperty.isReserved ? Colors.white : AppColors.onSecondaryContainer,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          currentProperty.listingType == 'sale' ? 'For Sale' : 'For Rent',
                          style: const TextStyle(
                            color: AppColors.onSurfaceVariant,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    currentProperty.title,
                    style: AppTypography.headlineMedium.copyWith(fontSize: 22),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.secondary, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          currentProperty.address.isNotEmpty && currentProperty.address != currentProperty.location
                              ? '${currentProperty.address}, ${currentProperty.location}'
                              : currentProperty.location,
                          style: AppTypography.bodySmall,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Pricing Module
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: const [
                        BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 2)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(currentProperty.listingType == 'sale' ? 'TOTAL PRICE' : 'MONTHLY RENT', style: AppTypography.labelSmall),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  currentProperty.priceFormatted,
                                  style: AppTypography.metricLarge.copyWith(fontSize: 24),
                                ),
                                if (currentProperty.pricePeriod != null)
                                  Text(
                                    currentProperty.pricePeriod!,
                                    style: AppTypography.bodySmall,
                                  ),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.shield, color: AppColors.secondary, size: 14),
                                SizedBox(width: 2),
                                Text(
                                  'HavenAssure',
                                  style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ],
                            ),
                            Text('Zero Hidden Fees', style: AppTypography.bodySmall.copyWith(fontSize: 11)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 3. Quick Architectural Specs (4 Columns)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6)],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _DetailSpecBox(icon: Icons.bed_outlined, value: '${widget.property.beds}', label: 'Bedrooms'),
                    _DetailSpecBox(icon: Icons.bathtub_outlined, value: '${widget.property.baths}', label: 'Baths'),
                    _DetailSpecBox(icon: Icons.square_foot, value: '3,800', label: 'Sq Ft (14M)'),
                    const _DetailSpecBox(icon: Icons.layers_outlined, value: '18/22', label: 'Penthouse'),
                  ],
                ),
              ),
            ),

            // 4. Architectural Narrative & Orientation
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Architectural Overview', style: AppTypography.titleMedium),
                    const SizedBox(height: 6),
                    Text(
                      widget.property.description,
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.onSurfaceVariant, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Orientation', style: AppTypography.labelSmall),
                                const Text('Margalla North View', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Furnishing', style: AppTypography.labelSmall),
                                const Text('Semi-Furnished Luxury', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // 5. Verified Amenities Bento Grid (6 items)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Verified Amenities', style: AppTypography.titleMedium),
                        Text('100% Inspected', style: AppTypography.labelSmall.copyWith(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Row(
                      children: [
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.bolt,
                            title: '24/7 Power Backup',
                            subtitle: 'Dual CAT Gensets',
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.elevator,
                            title: 'KONE Smart Lifts',
                            subtitle: 'Service Car Included',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.pool,
                            title: 'Heated Infinity Pool',
                            subtitle: 'Level 12 Deck Access',
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.fitness_center,
                            title: 'Technogym Studio',
                            subtitle: 'Resident Key Access',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.key,
                            title: 'Smart RFID Lock',
                            subtitle: 'Keyless Entry Log',
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: _AmenityTile(
                            icon: Icons.ev_station,
                            title: '22kW EV Chargers',
                            subtitle: '2 Reserved Slots',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Asset Manager Card (No WhatsApp)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6)],
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 26,
                          backgroundColor: AppColors.primaryContainer,
                          child: const Text('FM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(currentProperty.agentName, style: AppTypography.titleMedium),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified, color: AppColors.secondary, size: 16),
                                ],
                              ),
                              Text(currentProperty.agentRole, style: AppTypography.bodySmall),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(Icons.star, color: AppColors.tertiaryFixedDim, size: 15),
                                  const SizedBox(width: 2),
                                  Text(
                                    '${currentProperty.agentRating} (48 verified transactions)',
                                    style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Calling concierge at ${currentProperty.agentPhone}...')),
                          );
                        },
                        icon: const Icon(Icons.call, size: 16, color: AppColors.primary),
                        label: const Text('Call Dedicated Concierge', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Fixed Bottom Action Bar (No Video Tour; Disabled when Reserved)
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          boxShadow: const [
            BoxShadow(color: Color(0x10001637), offset: Offset(0, -4), blurRadius: 16),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            height: 48,
            child: currentProperty.isReserved
                ? ElevatedButton.icon(
                    onPressed: null,
                    icon: const Icon(Icons.lock, size: 16, color: Colors.white70),
                    label: const Text(
                      'Reserved • Property Not Available',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13.5),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFBA1A1A),
                      disabledBackgroundColor: const Color(0xFFBA1A1A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                  )
                : ElevatedButton.icon(
                    onPressed: () {
                      BookingSheet.show(context, currentProperty, initialType: 'in_person');
                    },
                    icon: const Icon(Icons.calendar_month, size: 16, color: Colors.white),
                    label: Text(
                      currentProperty.listingType.toLowerCase() == 'rent'
                          ? 'Book & Reserve Property'
                          : 'Book Purchase Token',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13.5),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF076A64),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _DetailSpecBox extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _DetailSpecBox({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.secondary, size: 20),
        const SizedBox(height: 3),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
        Text(label, style: AppTypography.labelSmall.copyWith(fontSize: 10)),
      ],
    );
  }
}

class _AmenityTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _AmenityTile({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: AppColors.secondaryFixed,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.onSecondaryFixed, size: 16),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.primary), maxLines: 1),
                Text(subtitle, style: AppTypography.labelSmall.copyWith(fontSize: 9.5), maxLines: 1),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
