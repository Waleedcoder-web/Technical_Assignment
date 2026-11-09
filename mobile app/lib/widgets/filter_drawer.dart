import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';

class FilterDrawer extends StatefulWidget {
  const FilterDrawer({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const FilterDrawer(),
    );
  }

  @override
  State<FilterDrawer> createState() => _FilterDrawerState();
}

class _FilterDrawerState extends State<FilterDrawer> {
  String _purpose = 'rent';
  String? _category;
  double _priceSliderVal = 500000;
  String _areaSize = '10 Marla';

  final List<String> _categories = [
    'House',
    'Apartment',
    'Upper Portion',
    'Plot',
    'Penthouse'
  ];

  final List<String> _areaSizes = [
    '5 Marla',
    '10 Marla',
    '1 Kanal',
    '2 Kanal+'
  ];

  @override
  void initState() {
    super.initState();
    final app = Provider.of<AppState>(context, listen: false);
    _purpose = app.listingType;
    _category = app.selectedCategory;
    if (app.maxPrice != null) _priceSliderVal = app.maxPrice!;
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context, listen: false);

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Title & Close Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.tune, color: AppColors.secondary, size: 22),
                      const SizedBox(width: 8),
                      Text('Filters', style: AppTypography.headlineMedium.copyWith(fontSize: 20)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.onSurfaceVariant),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Purpose Section (Rent / Buy)
              Text('Purpose', style: AppTypography.titleMedium),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _SelectButton(
                      label: 'Rent',
                      selected: _purpose == 'rent',
                      onTap: () => setState(() => _purpose = 'rent'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SelectButton(
                      label: 'Buy',
                      selected: _purpose == 'sale',
                      onTap: () => setState(() => _purpose = 'sale'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Property Category
              Text('Property Category', style: AppTypography.titleMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((cat) {
                  final isSel = _category?.toLowerCase() == cat.toLowerCase();
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _category = isSel ? null : cat.toLowerCase();
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSel ? AppColors.primary : AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        cat,
                        style: TextStyle(
                          color: isSel ? Colors.white : AppColors.onSurface,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),

              // Budget Slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Monthly Budget (PKR)', style: AppTypography.titleMedium),
                  Text(
                    'Up to PKR ${(_priceSliderVal / 1000).toStringAsFixed(0)}k',
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Slider(
                value: _priceSliderVal,
                min: 50000,
                max: 1000000,
                divisions: 19,
                activeColor: AppColors.secondary,
                inactiveColor: AppColors.surfaceContainer,
                onChanged: (val) => setState(() => _priceSliderVal = val),
              ),
              const SizedBox(height: 12),

              // Area Size
              Text('Area Size', style: AppTypography.titleMedium),
              const SizedBox(height: 8),
              Row(
                children: _areaSizes.map((size) {
                  final isSel = _areaSize == size;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: _SelectButton(
                        label: size,
                        selected: isSel,
                        onTap: () => setState(() => _areaSize = size),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Drawer Actions (Reset & Apply)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        appState.resetFilters();
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Reset All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () {
                        appState.setListingType(_purpose);
                        appState.setCategory(_category);
                        appState.setPriceFilter(_priceSliderVal);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Apply Filters',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SelectButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.secondary : AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.onSurface,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
