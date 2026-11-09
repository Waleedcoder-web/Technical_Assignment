import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';
import 'filter_drawer.dart';

class SearchHero extends StatefulWidget {
  final VoidCallback? onSearchSubmitted;

  const SearchHero({super.key, this.onSearchSubmitted});

  @override
  State<SearchHero> createState() => _SearchHeroState();
}

class _SearchHeroState extends State<SearchHero> {
  final TextEditingController _controller = TextEditingController();
  int _selectedBudgetIndex = -1;

  final List<Map<String, dynamic>> _budgetBrackets = [
    {'label': 'Under PKR 2.5 Lakh', 'max': 250000.0},
    {'label': 'PKR 3L - 5L', 'max': 500000.0},
    {'label': 'PKR 5L+', 'max': 1000000.0},
    {'label': 'Luxury Mansions', 'max': 80000000.0},
  ];

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isRent = appState.listingType == 'rent';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0E001637),
            offset: Offset(0, 6),
            blurRadius: 20,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Title and Rent/Buy Segmented Control
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Find a Place You\'ll Love to Call Home.',
                  style: AppTypography.headlineSmall.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    height: 1.25,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => appState.setListingType('rent'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isRent ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Rent',
                          style: TextStyle(
                            color: isRent ? Colors.white : AppColors.onSurfaceVariant,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => appState.setListingType('sale'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: !isRent ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          'Buy',
                          style: TextStyle(
                            color: !isRent ? Colors.white : AppColors.onSurfaceVariant,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Row 2: Search Input Field with Filter Trigger
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            child: Row(
              children: [
                const Icon(Icons.search, color: AppColors.secondary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onChanged: (val) => appState.setSearchQuery(val),
                    onSubmitted: (val) {
                      appState.setSearchQuery(val);
                      if (widget.onSearchSubmitted != null) {
                        widget.onSearchSubmitted!();
                      }
                    },
                    decoration: const InputDecoration(
                      hintText: 'Sector F-7, DHA Phase 6, Clifton...',
                      hintStyle: TextStyle(
                        color: AppColors.outline,
                        fontSize: 13,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                    ),
                    style: const TextStyle(fontSize: 14, color: AppColors.primary),
                  ),
                ),
                GestureDetector(
                  onTap: () => FilterDrawer.show(context),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.tune, color: AppColors.primary, size: 16),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Row 3: Popular Price Brackets Pills
          Text(
            'Popular Price Brackets:',
            style: AppTypography.labelSmall.copyWith(fontSize: 11),
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_budgetBrackets.length, (index) {
                final item = _budgetBrackets[index];
                final isSelected = _selectedBudgetIndex == index;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedBudgetIndex = -1;
                          appState.setPriceFilter(null);
                        } else {
                          _selectedBudgetIndex = index;
                          appState.setPriceFilter(item['max'] as double);
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.secondary : AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        item['label'] as String,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.primary,
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          const SizedBox(height: 14),

          // Row 4: Search Properties Button
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              onPressed: () {
                if (widget.onSearchSubmitted != null) {
                  widget.onSearchSubmitted!();
                } else {
                  appState.setTabIndex(1); // Switch to Explore Tab
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Search Properties',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
