import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';
import '../widgets/top_header.dart';
import '../widgets/property_card.dart';
import '../widgets/filter_drawer.dart';

class PropertyListingsScreen extends StatefulWidget {
  const PropertyListingsScreen({super.key});

  @override
  State<PropertyListingsScreen> createState() => _PropertyListingsScreenState();
}

class _PropertyListingsScreenState extends State<PropertyListingsScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isGridView = false;
  String _sortOption = 'Recommended';

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final properties = appState.properties;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const TopHeader(title: 'Properties'),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // 1. Sticky Omni-Search Bar & Quick Filter Chips
              SliverToBoxAdapter(
                child: Container(
                  color: AppColors.surface,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Column(
                    children: [
                      // Omni-Search Input Row
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerLowest,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x0C001637),
                                    offset: Offset(0, 2),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.search, color: AppColors.secondary, size: 22),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        TextField(
                                          controller: _searchController,
                                          onChanged: (val) => appState.setSearchQuery(val),
                                          decoration: InputDecoration(
                                            hintText: '${appState.selectedCity}, F-8...',
                                            hintStyle: const TextStyle(
                                              color: AppColors.onSurfaceVariant,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            border: InputBorder.none,
                                            isDense: true,
                                            contentPadding: EdgeInsets.zero,
                                          ),
                                          style: const TextStyle(
                                            color: AppColors.primary,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Text(
                                          '${appState.selectedCity} • ${appState.listingType == 'all' ? 'All Types' : (appState.listingType == 'rent' ? 'For Rent' : 'For Sale')}',
                                          style: AppTypography.labelSmall.copyWith(fontSize: 10.5),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (_searchController.text.isNotEmpty)
                                    IconButton(
                                      icon: const Icon(Icons.close, size: 16, color: AppColors.onSurfaceVariant),
                                      onPressed: () {
                                        _searchController.clear();
                                        appState.setSearchQuery('');
                                      },
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Filter Button with Badge
                          GestureDetector(
                            onTap: () => FilterDrawer.show(context),
                            child: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.primaryContainer,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: const [
                                  BoxShadow(color: Color(0x1F001637), blurRadius: 8, offset: Offset(0, 2)),
                                ],
                              ),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  const Icon(Icons.tune, color: Colors.white, size: 22),
                                  Positioned(
                                    top: 6,
                                    right: 6,
                                    child: Container(
                                      width: 16,
                                      height: 16,
                                      decoration: const BoxDecoration(
                                        color: AppColors.secondaryFixed,
                                        shape: BoxShape.circle,
                                      ),
                                      alignment: Alignment.center,
                                      child: const Text(
                                        '4',
                                        style: TextStyle(
                                          color: AppColors.onSecondaryFixed,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Horizontal Filter Chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _FilterPill(
                              label: appState.listingType == 'rent' ? 'For Rent' : 'For Sale',
                              onClear: () {},
                            ),
                            const SizedBox(width: 6),
                            _FilterPill(
                              label: appState.selectedCategory != null
                                  ? appState.selectedCategory!.toUpperCase()
                                  : 'Apartments & Houses',
                              onClear: () => appState.setCategory(null),
                            ),
                            const SizedBox(width: 6),
                            _FilterPill(
                              label: '< PKR 500k',
                              onClear: () => appState.setPriceFilter(null),
                            ),
                            const SizedBox(width: 6),
                            _FilterPill(
                              label: '5 - 20 Marla',
                              onClear: () {},
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => FilterDrawer.show(context),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLowest,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: const [
                                    BoxShadow(color: Color(0x0A000000), blurRadius: 4),
                                  ],
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.add, size: 14, color: AppColors.onSurfaceVariant),
                                    SizedBox(width: 2),
                                    Text(
                                      'More',
                                      style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Results Count & Sorting Controls
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                '${properties.length * 208 + 48}',
                                style: AppTypography.headlineSmall.copyWith(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.secondaryFixed,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.verified, size: 12, color: AppColors.onSecondaryFixed),
                                    SizedBox(width: 2),
                                    Text(
                                      'Verified',
                                      style: TextStyle(
                                        color: AppColors.onSecondaryFixed,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          Text(
                            'Available in ${appState.selectedCity} & Rawalpindi',
                            style: AppTypography.bodySmall.copyWith(fontSize: 11),
                          ),
                        ],
                      ),

                      // Sorting & Layout Toggle
                      Row(
                        children: [
                          PopupMenuButton<String>(
                            onSelected: (val) => setState(() => _sortOption = val),
                            color: AppColors.surfaceContainerLowest,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            itemBuilder: (ctx) => [
                              const PopupMenuItem(value: 'Recommended', child: Text('Recommended')),
                              const PopupMenuItem(value: 'Price: Low to High', child: Text('Price: Low to High')),
                              const PopupMenuItem(value: 'Price: High to Low', child: Text('Price: High to Low')),
                              const PopupMenuItem(value: 'Newest First', child: Text('Newest First')),
                            ],
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerLowest,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 4)],
                              ),
                              child: Row(
                                children: [
                                  const Text('Sort: ', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11)),
                                  Text(
                                    _sortOption,
                                    style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                  const Icon(Icons.expand_more, size: 14, color: AppColors.onSurfaceVariant),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainer,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () => setState(() => _isGridView = false),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: !_isGridView ? AppColors.surfaceContainerLowest : Colors.transparent,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Icon(
                                      Icons.view_agenda_outlined,
                                      size: 16,
                                      color: !_isGridView ? AppColors.primary : AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => setState(() => _isGridView = true),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: _isGridView ? AppColors.surfaceContainerLowest : Colors.transparent,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Icon(
                                      Icons.grid_view_outlined,
                                      size: 16,
                                      color: _isGridView ? AppColors.primary : AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // 3. Listings Stream
              if (appState.isLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(color: AppColors.secondary),
                    ),
                  ),
                )
              else if (properties.isEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.apartment_outlined, size: 48, color: AppColors.outline),
                        const SizedBox(height: 12),
                        Text(
                          'No properties found in database',
                          style: AppTypography.titleMedium,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Try resetting filters or searching for another location.',
                          style: AppTypography.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => appState.resetFilters(),
                          child: const Text('Reset Filters'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (ctx, i) => PropertyCard(property: properties[i]),
                      childCount: properties.length,
                    ),
                  ),
                ),
            ],
          ),

          // 4. Floating "Interactive Map" Pill
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Displaying 1,248 verified pins in ${appState.selectedCity} Geo-Map View'),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x35001637),
                        blurRadius: 18,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.map_outlined, color: AppColors.secondaryFixed, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Interactive Map',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        '|',
                        style: TextStyle(color: Colors.white24),
                      ),
                      SizedBox(width: 8),
                      Text(
                        '1,248 Pins',
                        style: TextStyle(
                          color: AppColors.secondaryFixed,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final VoidCallback onClear;

  const _FilterPill({required this.label, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.secondaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: const BoxDecoration(
              color: AppColors.secondary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.onSecondaryContainer,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onClear,
            child: const Icon(Icons.close, size: 13, color: AppColors.onSecondaryContainer),
          ),
        ],
      ),
    );
  }
}
