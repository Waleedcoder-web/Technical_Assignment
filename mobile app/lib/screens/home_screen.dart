import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';
import '../services/mock_data.dart';
import '../widgets/top_header.dart';
import '../widgets/search_hero.dart';
import '../widgets/property_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final allProperties = appState.properties;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const TopHeader(),
      body: RefreshIndicator(
        onRefresh: () => appState.refreshProperties(),
        color: AppColors.secondary,
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Live Market & City Selector Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppColors.secondary,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'LIVE MARKET • PAKISTAN',
                              style: AppTypography.labelSmall.copyWith(
                                color: AppColors.secondary,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.secondaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.verified, size: 13, color: AppColors.onSecondaryContainer),
                              SizedBox(width: 4),
                              Text(
                                '100% Verified',
                                style: TextStyle(
                                  color: AppColors.onSecondaryContainer,
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Welcome back,', style: AppTypography.bodySmall),
                            Text(
                              'Explore HavenKey',
                              style: AppTypography.headlineMedium.copyWith(fontSize: 22),
                            ),
                          ],
                        ),
                        // Interactive City Dropdown Pill
                        _CityDropdownPill(
                          selectedCity: appState.selectedCity,
                          onCitySelected: (city) => appState.setCity(city),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. Omni-Search Hero Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: SearchHero(
                  onSearchSubmitted: () => appState.setTabIndex(1),
                ),
              ),

              // AI Real Estate Copilot Banner Card
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                child: InkWell(
                  onTap: () => appState.setTabIndex(4),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF001637), Color(0xFF076A64)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x18001637),
                          blurRadius: 8,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.smart_toy_outlined,
                            color: Color(0xFFA1F1E9),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'HavenKey AI Copilot',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    '• Qwen 2.5 RAG',
                                    style: TextStyle(
                                      color: Color(0xFFA1F1E9),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Find properties, verify tenancy policies & dispute rules',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward_ios,
                          color: Color(0xFFA1F1E9),
                          size: 13,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 3. Quick Filter Horizon Chips
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _QuickFilterChip(
                        icon: Icons.villa_outlined,
                        label: 'DHA Villas',
                        isSelected: appState.selectedCategory == 'villas',
                        onTap: () => appState.setCategory(
                          appState.selectedCategory == 'villas' ? null : 'villas',
                        ),
                      ),
                      const SizedBox(width: 8),
                      _QuickFilterChip(
                        icon: Icons.apartment_outlined,
                        label: '3-Bed Flats',
                        isSelected: appState.selectedCategory == 'apartments',
                        onTap: () => appState.setCategory(
                          appState.selectedCategory == 'apartments' ? null : 'apartments',
                        ),
                      ),
                      const SizedBox(width: 8),
                      _QuickFilterChip(
                        icon: Icons.straighten_outlined,
                        label: '10 Marla',
                        isSelected: false,
                        onTap: () => appState.setTabIndex(1),
                      ),
                      const SizedBox(width: 8),
                      _QuickFilterChip(
                        icon: Icons.deck_outlined,
                        label: 'Penthouses',
                        isSelected: appState.selectedCategory == 'flats',
                        onTap: () => appState.setCategory(
                          appState.selectedCategory == 'flats' ? null : 'flats',
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 4. Property Categories Carousel
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 22, 16, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Property Categories', style: AppTypography.headlineSmall.copyWith(fontSize: 17)),
                        Text('Curated portfolios across Pakistan', style: AppTypography.bodySmall),
                      ],
                    ),
                    TextButton(
                      onPressed: () => appState.setTabIndex(1),
                      child: const Row(
                        children: [
                          Text(
                            'All (9.9k)',
                            style: TextStyle(
                              color: AppColors.secondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Icon(Icons.chevron_right, size: 16, color: AppColors.secondary),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 170,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: MockData.categories.length,
                  itemBuilder: (ctx, i) {
                    final cat = MockData.categories[i];
                    return _CategoryCard(
                      category: cat,
                      onTap: () {
                        appState.setCategory(cat['id']);
                        appState.setTabIndex(1);
                      },
                    );
                  },
                ),
              ),

              // 5. Featured Verified Properties Section
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 22, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.stars, color: AppColors.secondary, size: 20),
                        const SizedBox(width: 6),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Featured Verified', style: AppTypography.headlineSmall.copyWith(fontSize: 17)),
                            Text('Verified title deeds', style: AppTypography.bodySmall),
                          ],
                        ),
                      ],
                    ),
                    OutlinedButton(
                      onPressed: () => appState.setTabIndex(1),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.surfaceContainerHigh),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      child: const Text(
                        'See All',
                        style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: appState.isLoading
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: CircularProgressIndicator(color: AppColors.secondary),
                        ),
                      )
                    : allProperties.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLowest,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Center(
                              child: Text(
                                'No properties found in database for current filter.',
                                style: TextStyle(color: AppColors.onSurfaceVariant),
                              ),
                            ),
                          )
                        : Column(
                            children: allProperties.map((p) {
                              return PropertyCard(property: p);
                            }).toList(),
                          ),
              ),

              // 6. Fresh on Market Feed
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.radar, color: AppColors.secondary, size: 20),
                        const SizedBox(width: 6),
                        Text('Fresh on Market', style: AppTypography.headlineSmall.copyWith(fontSize: 17)),
                      ],
                    ),
                    Text(
                      'Live Supabase Feed',
                      style: AppTypography.labelSmall.copyWith(color: AppColors.secondary, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: allProperties.isEmpty
                    ? const SizedBox.shrink()
                    : Column(
                        children: allProperties.take(3).map((p) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _MicroListingCard(
                              title: p.title,
                              location: '${p.city} • ${p.location}',
                              price: p.priceFormatted,
                              specs: '${p.beds > 0 ? '${p.beds} Beds • ' : ''}${p.areaValue.toStringAsFixed(0)} ${p.areaUnit}',
                              timeAgo: 'Live',
                              imageUrl: p.imageUrl,
                            ),
                          );
                        }).toList(),
                      ),
              ),

              const SizedBox(height: 20),

              // 7. Trust Highlights Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.policy, color: AppColors.secondary, size: 22),
                          const SizedBox(width: 8),
                          Text('Built on Guaranteed Trust', style: AppTypography.headlineSmall.copyWith(fontSize: 16)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerLowest,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 30,
                                    height: 30,
                                    decoration: BoxDecoration(
                                      color: AppColors.secondaryContainer,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Icon(Icons.gavel, color: AppColors.onSecondaryContainer, size: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('100% Digitized Legal', style: AppTypography.titleMedium.copyWith(fontSize: 13)),
                                  const SizedBox(height: 4),
                                  Text(
                                    'FBR compliant, smart e-stamped tenancy agreements.',
                                    style: AppTypography.bodySmall.copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerLowest,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 30,
                                    height: 30,
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryFixed,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Icon(Icons.verified_user, color: AppColors.onPrimaryFixed, size: 18),
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Verified Identity', style: AppTypography.titleMedium.copyWith(fontSize: 13)),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Institutional CNIC identity and title deed validation.',
                                    style: AppTypography.bodySmall.copyWith(fontSize: 11),
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
              ),

              const SizedBox(height: 16),

              // 8. Landlord Promotion Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(color: Color(0x20001637), blurRadius: 16, offset: Offset(0, 6)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'OWNERS & INVESTORS',
                                style: AppTypography.labelSmall.copyWith(
                                  color: AppColors.secondaryFixed,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Are You a Property Owner?',
                                style: AppTypography.headlineSmall.copyWith(
                                  color: Colors.white,
                                  fontSize: 17,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            width: 38,
                            height: 38,
                            decoration: const BoxDecoration(
                              color: AppColors.primaryContainer,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.real_estate_agent, color: AppColors.secondaryFixed, size: 20),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'List free in 3 minutes. Reach over 120,000 pre-screened buyers and verified expatriate tenants today.',
                        style: AppTypography.bodySmall.copyWith(color: AppColors.primaryFixedDim),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Opening Landlord Listing Terminal...')),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.secondary,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Row(
                              children: [
                                Text('List Property Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward, size: 14, color: Colors.white),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Average Rental Yield in Islamabad is 7.4%')),
                              );
                            },
                            child: const Text('Calculate Yield', style: TextStyle(color: AppColors.primaryFixedDim, fontSize: 13)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CityDropdownPill extends StatelessWidget {
  final String selectedCity;
  final ValueChanged<String> onCitySelected;

  const _CityDropdownPill({
    required this.selectedCity,
    required this.onCitySelected,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: onCitySelected,
      color: AppColors.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: 'All Cities', child: Text('All Cities')),
        const PopupMenuItem(value: 'Lahore', child: Text('Lahore')),
        const PopupMenuItem(value: 'Islamabad', child: Text('Islamabad')),
        const PopupMenuItem(value: 'Karachi', child: Text('Karachi')),
        const PopupMenuItem(value: 'Rawalpindi', child: Text('Rawalpindi')),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.location_on, color: AppColors.secondary, size: 15),
            const SizedBox(width: 4),
            Text(
              selectedCity,
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const Icon(Icons.expand_more, color: AppColors.onSurfaceVariant, size: 16),
          ],
        ),
      ),
    );
  }
}

class _QuickFilterChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _QuickFilterChip({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), offset: Offset(0, 2), blurRadius: 4),
          ],
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.primary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final Map<String, dynamic> category;
  final VoidCallback onTap;

  const _CategoryCard({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 135,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 3)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.network(
                    category['imageUrl'] as String,
                    height: 90,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 90,
                      color: AppColors.surfaceContainer,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      category['count'] as String,
                      style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              category['name'] as String,
              style: AppTypography.titleMedium.copyWith(fontSize: 13),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              category['subtitle'] as String,
              style: AppTypography.bodySmall.copyWith(fontSize: 10.5),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _MicroListingCard extends StatelessWidget {
  final String title;
  final String location;
  final String price;
  final String specs;
  final String timeAgo;
  final String imageUrl;

  const _MicroListingCard({
    required this.title,
    required this.location,
    required this.price,
    required this.specs,
    required this.timeAgo,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              imageUrl,
              width: 70,
              height: 70,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 70,
                height: 70,
                color: AppColors.surfaceContainer,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      location,
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.secondary,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                    Text(timeAgo, style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: AppTypography.titleMedium.copyWith(fontSize: 13.5),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      price,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12.5,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '• $specs',
                      style: AppTypography.bodySmall.copyWith(fontSize: 11),
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
}
