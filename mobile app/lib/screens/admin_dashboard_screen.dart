import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../widgets/escrow_chart.dart';
import 'property_details_screen.dart';
import '../widgets/app_network_image.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _selectedTab = 0; // 0: Properties, 1: KYC, 2: Escrow, 3: Documents
  String _searchQuery = '';
  String _categoryFilter = 'all';
  String _typeFilter = 'all';

  // KYC items state
  late List<_KycItem> _kycList;
  bool _leaseApproved = false;

  @override
  void initState() {
    super.initState();
    _kycList = [
      _KycItem(
        id: 'KYC-8801',
        landlordName: 'Tariq Mehmood',
        propertyTitle: '12 Marla Luxury Villa',
        location: 'DHA Phase 6, Sector J, Lahore',
        deedType: 'Registry Deed / Fard',
        declaredValue: 'PKR 85,000,000',
        submittedAt: 'Today, 11:20 AM',
        status: 'Pending Review',
      ),
      _KycItem(
        id: 'KYC-8802',
        landlordName: 'Saira Bano',
        propertyTitle: 'Oceanfront Sky Penthouse',
        location: 'Clifton Block 2, Karachi',
        deedType: 'Sub-Lease & Allotment',
        declaredValue: 'PKR 45,000,000',
        submittedAt: 'Yesterday',
        status: 'Verification In Progress',
      ),
      _KycItem(
        id: 'KYC-8803',
        landlordName: 'Chaudhry Malik Riaz',
        propertyTitle: 'Executive Commercial Floor',
        location: 'Gulberg III, Main Boulevard, Lahore',
        deedType: 'Sale Deed & Mutation',
        declaredValue: 'PKR 140,000,000',
        submittedAt: '2 days ago',
        status: 'Audit Check',
      ),
      _KycItem(
        id: 'KYC-8804',
        landlordName: 'Farhan Malik',
        propertyTitle: 'Diplomatic Enclave Residence',
        location: 'Sector F-7/2, Islamabad',
        deedType: 'CDA Transfer Letter',
        declaredValue: 'PKR 95,000,000',
        submittedAt: '3 days ago',
        status: 'Pending Review',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthProvider>(context);
    final properties = appState.properties;

    // Filter properties
    final filtered = properties.where((p) {
      if (_categoryFilter != 'all') {
        if (!p.propertyType.toLowerCase().contains(_categoryFilter.toLowerCase())) {
          return false;
        }
      }
      if (_typeFilter != 'all') {
        if (!p.listingType.toLowerCase().contains(_typeFilter.toLowerCase())) {
          return false;
        }
      }
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match = p.title.toLowerCase().contains(q) ||
            p.location.toLowerCase().contains(q) ||
            p.city.toLowerCase().contains(q) ||
            p.address.toLowerCase().contains(q);
        if (!match) return false;
      }
      return true;
    }).toList();

    final rentCount = properties.where((p) => p.listingType == 'rent').length;
    final saleCount = properties.where((p) => p.listingType == 'sale').length;
    final pendingKycCount = _kycList.where((k) => k.status.contains('Pending') || k.status.contains('Audit') || k.status.contains('Progress')).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(66),
        child: Container(
          color: const Color(0xFF001637),
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 6,
            left: 16,
            right: 16,
            bottom: 10,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF172B4D)),
                    ),
                    child: const Icon(
                      Icons.admin_panel_settings,
                      color: Color(0xFFA1F1E9),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      RichText(
                        text: const TextSpan(
                          children: [
                            TextSpan(
                              text: 'Haven',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            TextSpan(
                              text: 'Key ',
                              style: TextStyle(
                                color: Color(0xFFA1F1E9),
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            TextSpan(
                              text: 'Admin',
                              style: TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Text(
                        'Operations & Regulatory Escrow',
                        style: TextStyle(
                          color: Color(0xFF8093BB),
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  // SBP Online Indicator
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 5),
                        const Text(
                          'Online',
                          style: TextStyle(
                            color: Color(0xFFD7E2FF),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // User Avatar with sign out dialog
                  GestureDetector(
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (dCtx) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: const Row(
                            children: [
                              Icon(Icons.logout, color: Color(0xFFBA1A1A), size: 22),
                              SizedBox(width: 8),
                              Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          content: const Text('Are you sure you want to sign out from HavenKey Operations Console?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(dCtx),
                              child: const Text('Cancel'),
                            ),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.pop(dCtx);
                                final appState = Provider.of<AppState>(context, listen: false);
                                auth.logout();
                                appState.clearUserData();
                                appState.setTabIndex(0);
                                Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
                                  '/login',
                                  (route) => false,
                                );
                              },
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFBA1A1A)),
                              child: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        color: Color(0xFF076A64),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        auth.currentUser.fullname.isNotEmpty
                            ? auth.currentUser.fullname[0].toUpperCase()
                            : 'A',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: const Icon(Icons.logout, color: Color(0xFFD7E2FF), size: 19),
                    tooltip: 'Sign Out',
                    onPressed: () {
                      final appState = Provider.of<AppState>(context, listen: false);
                      auth.logout();
                      appState.clearUserData();
                      appState.setTabIndex(0);
                      Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
                        '/login',
                        (route) => false,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => appState.refreshProperties(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Operations Telemetry Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'OPERATIONS TELEMETRY',
                      style: TextStyle(
                        color: Color(0xFF076A64),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text(
                          'Admin Operations Console',
                          style: TextStyle(
                            color: Color(0xFF001637),
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            appState.refreshProperties();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Synchronized with Supabase database!'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                          icon: const Icon(Icons.sync, color: Color(0xFF076A64), size: 20),
                          tooltip: 'Sync Database',
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Full CRUD management for verified Pakistani property assets, landlord KYC deeds, and escrow deposits.',
                      style: TextStyle(
                        color: Color(0xFF44474E),
                        fontSize: 11.5,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _openPropertyModal(context, null),
                            icon: const Icon(Icons.add_photo_alternate, size: 16, color: Colors.white),
                            label: const Text(
                              '+ Upload New Property',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF076A64),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              elevation: 0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          onPressed: () => appState.setTabIndex(1),
                          icon: const Icon(Icons.visibility, size: 16, color: Color(0xFF001637)),
                          label: const Text(
                            'Public Site',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF001637),
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE7E8EA)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 2. 6 Core Metric KPI Cards matching website
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.45,
                  children: [
                    _KpiMetricCard(
                      label: 'ACTIVE LISTINGS',
                      value: '${properties.length}',
                      subtitle: 'Live in Market',
                      subIcon: Icons.trending_up,
                      subColor: const Color(0xFF10B981),
                    ),
                    _KpiMetricCard(
                      label: 'VERIFIED LANDLORDS',
                      value: '1,248',
                      subtitle: '100% Biometric',
                      subIcon: Icons.verified,
                      subColor: const Color(0xFF076A64),
                    ),
                    _KpiMetricCard(
                      label: 'PENDING KYC QUEUE',
                      value: '$pendingKycCount',
                      subtitle: 'Avg wait: 28m',
                      subIcon: Icons.schedule,
                      subColor: const Color(0xFFBA1A1A),
                      valueColor: const Color(0xFFBA1A1A),
                    ),
                    _KpiMetricCard(
                      label: 'MONTHLY ESCROW',
                      value: 'PKR 28.4M',
                      subtitle: 'Bank Guaranteed',
                      subIcon: Icons.lock,
                      subColor: const Color(0xFF10B981),
                    ),
                    _KpiMetricCard(
                      label: 'FOR RENT / SALE',
                      value: '$rentCount / $saleCount',
                      subtitle: 'Portfolio Ratio',
                      subIcon: Icons.pie_chart,
                      subColor: const Color(0xFF076A64),
                    ),
                    _KpiMetricCard(
                      label: 'COMPLIANCE SCORE',
                      value: '99.8%',
                      subtitle: 'Audit Passed',
                      subIcon: Icons.shield,
                      subColor: const Color(0xFF10B981),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 3. Tab Switcher
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 14),
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFE7E8EA), width: 1.5),
                  ),
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _TabButton(
                        icon: Icons.real_estate_agent,
                        title: 'Properties Portfolio',
                        badge: '${properties.length}',
                        isSelected: _selectedTab == 0,
                        onTap: () => setState(() => _selectedTab = 0),
                      ),
                      _TabButton(
                        icon: Icons.verified_user,
                        title: 'Landlord KYC',
                        badge: '$pendingKycCount',
                        isSelected: _selectedTab == 1,
                        onTap: () => setState(() => _selectedTab = 1),
                      ),
                      _TabButton(
                        icon: Icons.account_balance,
                        title: 'Escrow & Liquidity',
                        isSelected: _selectedTab == 2,
                        onTap: () => setState(() => _selectedTab = 2),
                      ),
                      _TabButton(
                        icon: Icons.library_books,
                        title: 'Legal RAG Docs',
                        badge: '4',
                        isSelected: _selectedTab == 3,
                        onTap: () => setState(() => _selectedTab = 3),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // 4. Tab Body Content
              if (_selectedTab == 0) ...[
                _buildPropertiesTab(context, appState, filtered),
              ] else if (_selectedTab == 1) ...[
                _buildKycTab(context),
              ] else if (_selectedTab == 2) ...[
                _buildEscrowTab(context),
              ] else if (_selectedTab == 3) ...[
                _buildDocumentsTab(context),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // TAB 1: PROPERTIES PORTFOLIO (CRUD)
  // =========================================================================
  Widget _buildPropertiesTab(
    BuildContext context,
    AppState appState,
    List<PropertyModel> filtered,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search & Filter Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE7E8EA)),
              boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
            ),
            child: Column(
              children: [
                // Search Input
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF75777F)),
                    hintText: 'Search title, location, or city...',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF75777F)),
                    filled: true,
                    fillColor: const Color(0xFFF2F4F6),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFE7E8EA)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFE7E8EA)),
                    ),
                  ),
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 10),
                // Filter Chips Row
                Row(
                  children: [
                    // Category Filter
                    Expanded(
                      child: Container(
                        height: 36,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F4F6),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE7E8EA)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _categoryFilter,
                            isExpanded: true,
                            icon: const Icon(Icons.arrow_drop_down, size: 18),
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF001637),
                              fontWeight: FontWeight.w600,
                            ),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Categories')),
                              DropdownMenuItem(value: 'villas', child: Text('Villas')),
                              DropdownMenuItem(value: 'apartments', child: Text('Apartments')),
                              DropdownMenuItem(value: 'flats', child: Text('Flats')),
                              DropdownMenuItem(value: 'plots', child: Text('Plots')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _categoryFilter = val);
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Type Filter
                    Expanded(
                      child: Container(
                        height: 36,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F4F6),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE7E8EA)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _typeFilter,
                            isExpanded: true,
                            icon: const Icon(Icons.arrow_drop_down, size: 18),
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: Color(0xFF001637),
                              fontWeight: FontWeight.w600,
                            ),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('All Types')),
                              DropdownMenuItem(value: 'rent', child: Text('For Rent')),
                              DropdownMenuItem(value: 'sale', child: Text('For Sale')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _typeFilter = val);
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Count & Add button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${filtered.length} Properties in Portfolio',
                style: const TextStyle(
                  color: Color(0xFF001637),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              InkWell(
                onTap: () => _openPropertyModal(context, null),
                child: const Row(
                  children: [
                    Icon(Icons.add_circle, size: 16, color: Color(0xFF076A64)),
                    SizedBox(width: 4),
                    Text(
                      'Add New',
                      style: TextStyle(
                        color: Color(0xFF076A64),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Property Cards List
          if (filtered.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE7E8EA)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.domain_disabled, size: 44, color: Color(0xFFB0B3BA)),
                  const SizedBox(height: 10),
                  const Text(
                    'No properties match your filter',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF001637)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Try adjusting filters or upload a new property.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF75777F)),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _searchQuery = '';
                        _categoryFilter = 'all';
                        _typeFilter = 'all';
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF076A64),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    child: const Text('Reset Filters', style: TextStyle(color: Colors.white, fontSize: 11)),
                  ),
                ],
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              itemBuilder: (ctx, i) {
                final p = filtered[i];
                return _buildAdminPropertyCard(context, appState, p);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildAdminPropertyCard(
    BuildContext context,
    AppState appState,
    PropertyModel p,
  ) {
    final isRent = p.listingType == 'rent';
    final primaryImg = p.images.isNotEmpty ? p.images.first : p.imageUrl;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Thumbnail + Details
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Stack(
                    children: [
                      AppNetworkImage(
                        url: primaryImg,
                        width: 84,
                        height: 84,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 84,
                          height: 84,
                          color: const Color(0xFFF2F4F6),
                          child: const Icon(Icons.home, color: Color(0xFF75777F)),
                        ),
                      ),
                      if (p.images.length > 1)
                        Positioned(
                          bottom: 4,
                          right: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${p.images.length} 📷',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Title and tags
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isRent ? const Color(0xFFE8F5E9) : const Color(0xFFE3F2FD),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              isRent ? 'FOR RENT' : 'FOR SALE',
                              style: TextStyle(
                                color: isRent ? const Color(0xFF2E7D32) : const Color(0xFF1565C0),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF2F4F6),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              p.propertyType.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF44474E),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const Spacer(),
                          // Status pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF076A64).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              p.status.toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF076A64),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        p.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF001637),
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 12, color: Color(0xFF75777F)),
                          const SizedBox(width: 2),
                          Expanded(
                            child: Text(
                              p.address.isNotEmpty ? '${p.address}, ${p.city}' : p.location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Color(0xFF75777F), fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        p.priceFormatted,
                        style: const TextStyle(
                          color: Color(0xFF076A64),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Specs Bar (Beds, Baths, Area)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFF8F9FA),
              border: Border(
                top: BorderSide(color: Color(0xFFE7E8EA), width: 0.5),
                bottom: BorderSide(color: Color(0xFFE7E8EA), width: 0.5),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SpecPill(icon: Icons.bed_outlined, text: '${p.beds} Beds'),
                _SpecPill(icon: Icons.bathtub_outlined, text: '${p.baths} Baths'),
                _SpecPill(icon: Icons.square_foot, text: '${p.areaValue.toStringAsFixed(0)} ${p.areaUnit}'),
                _SpecPill(icon: Icons.verified_user_outlined, text: p.verified ? 'Verified' : 'Pending'),
              ],
            ),
          ),

          // Action Buttons: Edit, Delete, Preview
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
            child: Row(
              children: [
                // Edit Button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openPropertyModal(context, p),
                    icon: const Icon(Icons.edit, size: 14, color: Color(0xFF076A64)),
                    label: const Text(
                      'Edit',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF076A64)),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Delete Button
                OutlinedButton.icon(
                  onPressed: () => _confirmDeleteProperty(context, appState, p),
                  icon: const Icon(Icons.delete_outline, size: 14, color: Color(0xFFBA1A1A)),
                  label: const Text(
                    'Delete',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFFBA1A1A)),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFBA1A1A)),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                ),
                const SizedBox(width: 8),
                // View Details Button
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PropertyDetailsScreen(property: p),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF001637),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    elevation: 0,
                  ),
                  child: const Text(
                    'View',
                    style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TAB 2: LANDLORD KYC QUEUE
  // =========================================================================
  Widget _buildKycTab(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Landlord KYC Deeds Review',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                  ),
                  Text(
                    'Audit registered Pakistani title deeds & CNIC verification',
                    style: TextStyle(fontSize: 11, color: Color(0xFF75777F)),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Nadra Linked',
                  style: TextStyle(color: Color(0xFF2E7D32), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _kycList.length,
            itemBuilder: (ctx, i) {
              final kyc = _kycList[i];
              final isVerified = kyc.status.contains('Verified');
              final isRejected = kyc.status.contains('Rejected');

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE7E8EA)),
                  boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: const Color(0xFF076A64).withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                kyc.landlordName.isNotEmpty ? kyc.landlordName[0] : 'L',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  kyc.landlordName,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF001637)),
                                ),
                                Text(kyc.submittedAt, style: const TextStyle(fontSize: 10, color: Color(0xFF75777F))),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isVerified
                                ? const Color(0xFFE8F5E9)
                                : isRejected
                                    ? const Color(0xFFFFEBEE)
                                    : const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            kyc.status,
                            style: TextStyle(
                              color: isVerified
                                  ? const Color(0xFF2E7D32)
                                  : isRejected
                                      ? const Color(0xFFC62828)
                                      : const Color(0xFFEF6C00),
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FA),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(kyc.propertyTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF001637))),
                              Text(kyc.declaredValue, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF076A64))),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(kyc.location, style: const TextStyle(fontSize: 10.5, color: Color(0xFF75777F))),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.description_outlined, size: 12, color: Color(0xFF076A64)),
                              const SizedBox(width: 4),
                              Text('Deed: ${kyc.deedType}', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF001637))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (!isVerified && !isRejected)
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  kyc.status = 'Rejected - Incomplete Title';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Deed for ${kyc.landlordName} flagged as rejected.')),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFBA1A1A)),
                                padding: const EdgeInsets.symmetric(vertical: 6),
                              ),
                              child: const Text('Reject', style: TextStyle(color: Color(0xFFBA1A1A), fontSize: 11.5, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  kyc.status = 'Verified & Live';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Approved ${kyc.landlordName}\'s title deed. Listing is now Verified & Live!'),
                                    backgroundColor: const Color(0xFF076A64),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF076A64),
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                elevation: 0,
                              ),
                              child: const Text('Approve Deed', style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      )
                    else
                      Center(
                        child: Text(
                          isVerified ? '✓ Verified & Cleared on SBP Escrow Ledger' : '✕ Document flagged for legal review',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isVerified ? const Color(0xFF2E7D32) : const Color(0xFFBA1A1A),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TAB 3: ESCROW & BANK LIQUIDITY
  // =========================================================================
  Widget _buildEscrowTab(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bank Guaranteed Escrow Ledger',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
          ),
          const Text(
            'SBP-governed trust account telemetry with automated release protocols',
            style: TextStyle(fontSize: 11, color: Color(0xFF75777F)),
          ),
          const SizedBox(height: 12),

          // Escrow Chart
          const EscrowChart(),

          const SizedBox(height: 16),

          // Digital Agreement Queue Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE7E8EA)),
              boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('LEGAL & COMPLIANCE', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF076A64))),
                          Text('Digital Agreement Queue', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF001637))),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF3E0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text('1 Pending Signature', style: TextStyle(color: Color(0xFFEF6C00), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE7E8EA)),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Sky Villa 10-C (Oceanfront Penthouse)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                              Text('Tenant: Tariq Hassan • Landlord: Emaar Properties', style: TextStyle(fontSize: 10.5, color: Color(0xFF75777F))),
                            ],
                          ),
                          const Text('PKR 280k/mo', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF076A64), fontSize: 12.5)),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF2F4F6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('ADVANCE ESCROW', style: TextStyle(fontSize: 8.5, color: Color(0xFF75777F))),
                                  Text('PKR 840,000 (Paid)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF001637))),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF2F4F6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('LEASE TERM', style: TextStyle(fontSize: 8.5, color: Color(0xFF75777F))),
                                  Text('24 Months Commercial', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF001637))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (!_leaseApproved)
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Requested revision from Legal Drafting Team.')),
                                  );
                                },
                                child: const Text('Request Edit', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637))),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  setState(() => _leaseApproved = true);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Digital agreement approved & keys dispatched!'),
                                      backgroundColor: Color(0xFF076A64),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF076A64),
                                  elevation: 0,
                                ),
                                child: const Text('Approve Lease', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white)),
                              ),
                            ),
                          ],
                        )
                      else
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          alignment: Alignment.center,
                          child: const Text('✓ Lease Digitally Sealed & Dispatched', style: TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold, fontSize: 11.5)),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TAB 4: KNOWLEDGE BASE (RAG) / LEGAL DOCUMENTS
  // =========================================================================
  Widget _buildDocumentsTab(BuildContext context) {
    final docs = [
      {'title': 'Sindh Rented Premises Ordinance 1979', 'chunks': 18, 'size': '1.2 MB', 'status': 'Indexed in Vector DB'},
      {'title': 'Punjab Rented Premises Act 2009', 'chunks': 24, 'size': '1.8 MB', 'status': 'Indexed in Vector DB'},
      {'title': 'Islamabad Rent Restriction Act', 'chunks': 16, 'size': '940 KB', 'status': 'Indexed in Vector DB'},
      {'title': 'State Bank of Pakistan Escrow Framework', 'chunks': 32, 'size': '2.4 MB', 'status': 'Indexed in Vector DB'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Knowledge Base (RAG)',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                  ),
                  Text(
                    'Indexed Pakistani real estate legal acts & tenancy regulations',
                    style: TextStyle(fontSize: 11, color: Color(0xFF75777F)),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Document indexer running. 90 chunks active in 384-d vector space.')),
                  );
                },
                icon: const Icon(Icons.upload_file, size: 14, color: Colors.white),
                label: const Text('Index PDF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF076A64),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: docs.length,
            itemBuilder: (ctx, i) {
              final d = docs[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE7E8EA)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF001637).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.picture_as_pdf, color: Color(0xFFBA1A1A), size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF001637))),
                          const SizedBox(height: 2),
                          Text('${d['chunks']} chunks • ${d['size']} • ${d['status']}', style: const TextStyle(fontSize: 10.5, color: Color(0xFF75777F))),
                        ],
                      ),
                    ),
                    const Icon(Icons.verified, color: Color(0xFF10B981), size: 18),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // MODAL: ADD / EDIT PROPERTY DIALOG
  // =========================================================================
  void _openPropertyModal(BuildContext context, PropertyModel? existing) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PropertyFormModal(existing: existing),
    );
  }

  // =========================================================================
  // CONFIRM DELETE
  // =========================================================================
  void _confirmDeleteProperty(BuildContext context, AppState appState, PropertyModel p) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Property?'),
        content: Text('Are you sure you want to remove "${p.title}" permanently from Supabase?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await appState.deleteProperty(p.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Deleted "${p.title}" from Supabase database.'),
                      backgroundColor: const Color(0xFFBA1A1A),
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Delete failed: $e'), backgroundColor: const Color(0xFFBA1A1A)),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFBA1A1A)),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// PROPERTY FORM MODAL (CREATE / EDIT)
// ===========================================================================
class _PropertyFormModal extends StatefulWidget {
  final PropertyModel? existing;

  const _PropertyFormModal({this.existing});

  @override
  State<_PropertyFormModal> createState() => _PropertyFormModalState();
}

class _PropertyFormModalState extends State<_PropertyFormModal> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleCtrl;
  late TextEditingController _priceCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _areaValueCtrl;
  late TextEditingController _descriptionCtrl;

  final ImagePicker _picker = ImagePicker();
  final List<XFile> _pickedImages = [];
  final List<String> _existingImages = [];

  String _propertyType = 'villas';
  String _listingType = 'rent';
  String _areaUnit = 'Marla';
  int _beds = 4;
  int _baths = 4;
  String _status = 'available';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final p = widget.existing;
    _titleCtrl = TextEditingController(text: p?.title ?? '');
    _priceCtrl = TextEditingController(text: p != null ? p.price.toStringAsFixed(0) : '250000');
    _locationCtrl = TextEditingController(text: p?.location ?? 'Lahore');
    _addressCtrl = TextEditingController(text: p?.address ?? 'DHA Phase 6, Sector J, Street 4');
    _areaValueCtrl = TextEditingController(text: p != null ? p.areaValue.toStringAsFixed(0) : '10');
    _descriptionCtrl = TextEditingController(text: p?.description ?? '');

    if (p != null) {
      if (p.images.isNotEmpty) {
        _existingImages.addAll(p.images);
      } else if (p.imageUrl.isNotEmpty) {
        _existingImages.add(p.imageUrl);
      }
      _propertyType = p.propertyType;
      _listingType = p.listingType;
      _areaUnit = p.areaUnit;
      _beds = p.beds;
      _baths = p.baths;
      _status = p.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _priceCtrl.dispose();
    _locationCtrl.dispose();
    _addressCtrl.dispose();
    _areaValueCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImagesFromGallery() async {
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 85);
      if (picked.isNotEmpty) {
        setState(() {
          _pickedImages.addAll(picked);
        });
      }
    } catch (e) {
      debugPrint('Gallery pick error: $e');
    }
  }

  Future<void> _pickImageFromCamera() async {
    try {
      final photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      if (photo != null) {
        setState(() {
          _pickedImages.add(photo);
        });
      }
    } catch (e) {
      debugPrint('Camera pick error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existing != null;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 6),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isEditing ? 'Edit Property Listing' : '+ Upload New Property',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF001637),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE7E8EA)),
          // Form body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Property Title
                    const Text('Property Title', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _titleCtrl,
                      decoration: const InputDecoration(
                        hintText: 'e.g. 10 Marla Luxury Executive Villa',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      validator: (val) => (val == null || val.trim().length < 5) ? 'Title must be at least 5 characters' : null,
                    ),

                    const SizedBox(height: 12),

                    // Property Type & Listing Type
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<String>(
                                initialValue: _propertyType,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'villas', child: Text('Villas')),
                                  DropdownMenuItem(value: 'apartments', child: Text('Apartments')),
                                  DropdownMenuItem(value: 'flats', child: Text('Flats')),
                                  DropdownMenuItem(value: 'plots', child: Text('Plots')),
                                ],
                                onChanged: (v) => setState(() => _propertyType = v!),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Listing Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<String>(
                                initialValue: _listingType,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'rent', child: Text('For Rent')),
                                  DropdownMenuItem(value: 'sale', child: Text('For Sale')),
                                ],
                                onChanged: (v) => setState(() => _listingType = v!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Price & Status
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Price (PKR)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _priceCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  hintText: 'e.g. 250000',
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                validator: (val) => (val == null || double.tryParse(val) == null) ? 'Enter valid price' : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<String>(
                                initialValue: _status,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'available', child: Text('Available')),
                                  DropdownMenuItem(value: 'rented', child: Text('Rented')),
                                  DropdownMenuItem(value: 'sold', child: Text('Sold')),
                                  DropdownMenuItem(value: 'pending', child: Text('Pending')),
                                ],
                                onChanged: (v) => setState(() => _status = v!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Area Value & Unit
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Area Value', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _areaValueCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  hintText: 'e.g. 10',
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                validator: (val) => (val == null || double.tryParse(val) == null) ? 'Required' : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Unit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 4),
                              DropdownButtonFormField<String>(
                                initialValue: _areaUnit,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'Marla', child: Text('Marla')),
                                  DropdownMenuItem(value: 'Kanal', child: Text('Kanal')),
                                  DropdownMenuItem(value: 'Sq Ft', child: Text('Sq Ft')),
                                  DropdownMenuItem(value: 'Sq Yd', child: Text('Sq Yd')),
                                ],
                                onChanged: (v) => setState(() => _areaUnit = v!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Beds & Baths Stepper
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Bedrooms: $_beds', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    onPressed: _beds > 0 ? () => setState(() => _beds--) : null,
                                  ),
                                  Text('$_beds', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () => setState(() => _beds++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Bathrooms: $_baths', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    onPressed: _baths > 0 ? () => setState(() => _baths--) : null,
                                  ),
                                  Text('$_baths', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () => setState(() => _baths++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // City / Location
                    const Text('City / Major Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _locationCtrl,
                      decoration: const InputDecoration(
                        hintText: 'e.g. Lahore, DHA Phase 6',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      validator: (val) => (val == null || val.trim().isEmpty) ? 'Location is required' : null,
                    ),

                    const SizedBox(height: 12),

                    // Address
                    const Text('Street / Sector Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _addressCtrl,
                      decoration: const InputDecoration(
                        hintText: 'e.g. Plot 88, Sector J, Street 4',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),

                    const SizedBox(height: 12),

                    const SizedBox(height: 12),

                    // Property Photos Upload Section (No URL system)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Property Photos',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        Text(
                          '${_existingImages.length + _pickedImages.length} uploaded',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF076A64), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Upload action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _pickImagesFromGallery,
                            icon: const Icon(Icons.photo_library, size: 16, color: Color(0xFF076A64)),
                            label: const Text('Choose Photos', style: TextStyle(color: Color(0xFF076A64), fontSize: 12, fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              side: const BorderSide(color: Color(0xFF076A64)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _pickImageFromCamera,
                            icon: const Icon(Icons.photo_camera, size: 16, color: Color(0xFF001637)),
                            label: const Text('Take Photo', style: TextStyle(color: Color(0xFF001637), fontSize: 12, fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              side: const BorderSide(color: Color(0xFFE7E8EA)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Image Previews Strip
                    if (_existingImages.isEmpty && _pickedImages.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 22),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8F9FB),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE7E8EA)),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.cloud_upload_outlined, size: 34, color: Color(0xFF75777F)),
                            SizedBox(height: 6),
                            Text(
                              'No photos selected yet',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Tap Choose Photos to upload from your phone gallery',
                              style: TextStyle(fontSize: 10.5, color: Color(0xFF75777F)),
                            ),
                          ],
                        ),
                      )
                    else
                      SizedBox(
                        height: 86,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            // Existing Images
                            ..._existingImages.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final url = entry.value;
                              final isCover = idx == 0 && _pickedImages.isEmpty;
                              return Stack(
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(right: 10),
                                    width: 84,
                                    height: 84,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: isCover ? const Color(0xFF076A64) : const Color(0xFFE7E8EA),
                                        width: isCover ? 2 : 1,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(7),
                                      child: AppNetworkImage(
                                        url: url,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.apartment)),
                                      ),
                                    ),
                                  ),
                                  if (isCover)
                                    Positioned(
                                      bottom: 4,
                                      left: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF076A64),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text('Cover', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  Positioned(
                                    top: 4,
                                    right: 14,
                                    child: GestureDetector(
                                      onTap: () => setState(() => _existingImages.removeAt(idx)),
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFBA1A1A),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.close, color: Colors.white, size: 14),
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            }),

                            // Newly Picked Local Files
                            ..._pickedImages.asMap().entries.map((entry) {
                              final idx = entry.key;
                              final file = entry.value;
                              final isCover = _existingImages.isEmpty && idx == 0;
                              return Stack(
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(right: 10),
                                    width: 84,
                                    height: 84,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: isCover ? const Color(0xFF076A64) : const Color(0xFFE7E8EA),
                                        width: isCover ? 2 : 1,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(7),
                                      child: Image.file(
                                        File(file.path),
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                  if (isCover)
                                    Positioned(
                                      bottom: 4,
                                      left: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF076A64),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text('Cover', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  Positioned(
                                    top: 4,
                                    right: 14,
                                    child: GestureDetector(
                                      onTap: () => setState(() => _pickedImages.removeAt(idx)),
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFBA1A1A),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.close, color: Colors.white, size: 14),
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            }),
                          ],
                        ),
                      ),

                    const SizedBox(height: 14),

                    // Description
                    const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _descriptionCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Describe property features, security, power backup, etc.',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF076A64),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                isEditing ? 'Update Property' : 'Publish Property to Supabase',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_existingImages.isEmpty && _pickedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select or upload at least one image.'),
          backgroundColor: Color(0xFFBA1A1A),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final appState = Provider.of<AppState>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    final title = _titleCtrl.text.trim();
    final price = double.tryParse(_priceCtrl.text) ?? 250000;
    final areaVal = double.tryParse(_areaValueCtrl.text) ?? 10;
    final loc = _locationCtrl.text.trim();
    final addr = _addressCtrl.text.trim();
    final desc = _descriptionCtrl.text.trim().isNotEmpty
        ? _descriptionCtrl.text.trim()
        : '$title situated in prime $loc.';

    // Process & upload newly selected images
    final List<String> uploadedUrls = [];
    final supabase = Supabase.instance.client;

    for (int i = 0; i < _pickedImages.length; i++) {
      final img = _pickedImages[i];
      try {
        final bytes = await img.readAsBytes();
        final ext = img.name.split('.').last.toLowerCase();
        final sanitizedExt = (ext == 'png' || ext == 'webp') ? ext : 'jpg';
        final uniqueName = '${DateTime.now().millisecondsSinceEpoch}_$i.$sanitizedExt';
        final filePath = 'properties/$uniqueName';

        // Attempt Supabase Storage upload
        await supabase.storage.from('properties').uploadBinary(
          filePath,
          bytes,
          fileOptions: FileOptions(
            contentType: 'image/$sanitizedExt',
            upsert: true,
          ),
        );
        final publicUrl = supabase.storage.from('properties').getPublicUrl(filePath);
        uploadedUrls.add(publicUrl);
      } catch (uploadErr) {
        debugPrint('Supabase storage upload error: $uploadErr. Fallback to base64 data URI.');
        try {
          final bytes = await img.readAsBytes();
          final b64 = base64Encode(bytes);
          final mime = img.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          uploadedUrls.add('data:$mime;base64,$b64');
        } catch (e) {
          debugPrint('Failed to read bytes for fallback: $e');
        }
      }
    }

    final allImages = [..._existingImages, ...uploadedUrls];
    final primaryImg = allImages.isNotEmpty
        ? allImages.first
        : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

    // Owner ID: Fallback to active admin account in Supabase
    final ownerId = auth.currentUser.id.isNotEmpty
        ? auth.currentUser.id
        : '829454bf-b3a2-40ab-be81-51ab3999a091';

    final payload = <String, dynamic>{
      'owner_id': ownerId,
      'title': title,
      'description': desc,
      'property_type': _propertyType,
      'listing_type': _listingType,
      'price': price,
      'area_value': areaVal,
      'area_unit': _areaUnit,
      'bedroom': _beds,
      'bathroom': _baths,
      'location': loc,
      'address': addr,
      'status': _status,
      'image_url': primaryImg,
      'images': allImages.isNotEmpty ? allImages : [primaryImg],
      'updated_at': DateTime.now().toIso8601String(),
    };

    try {
      if (widget.existing != null) {
        await appState.updateProperty(widget.existing!.id, payload);
        if (mounted) {
          navigator.pop();
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Text('Property "$title" updated in Supabase!'),
              backgroundColor: const Color(0xFF076A64),
            ),
          );
        }
      } else {
        payload['created_at'] = DateTime.now().toIso8601String();
        await appState.createProperty(payload);
        if (mounted) {
          navigator.pop();
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Text('Property "$title" created & live in market!'),
              backgroundColor: const Color(0xFF076A64),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text('Failed to save to database: $e'),
            backgroundColor: const Color(0xFFBA1A1A),
          ),
        );
      }
    }
  }
}

// ===========================================================================
// HELPER WIDGETS
// ===========================================================================
class _KpiMetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String subtitle;
  final IconData subIcon;
  final Color subColor;
  final Color? valueColor;

  const _KpiMetricCard({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.subIcon,
    required this.subColor,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [BoxShadow(color: Color(0x06000000), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Color(0xFF75777F),
              letterSpacing: 0.5,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: valueColor ?? const Color(0xFF001637),
            ),
          ),
          Row(
            children: [
              Icon(subIcon, size: 12, color: subColor),
              const SizedBox(width: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: subColor),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? badge;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.icon,
    required this.title,
    this.badge,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.only(bottom: 10, right: 14, left: 4),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? const Color(0xFF001637) : Colors.transparent,
              width: 2.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? const Color(0xFF001637) : const Color(0xFF75777F),
            ),
            const SizedBox(width: 6),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? const Color(0xFF001637) : const Color(0xFF75777F),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                fontSize: 12,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: const Color(0xFFEDEEF0),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF001637),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SpecPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _SpecPill({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 12, color: const Color(0xFF75777F)),
        const SizedBox(width: 3),
        Text(text, style: const TextStyle(fontSize: 10.5, color: Color(0xFF44474E), fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _KycItem {
  final String id;
  final String landlordName;
  final String propertyTitle;
  final String location;
  final String deedType;
  final String declaredValue;
  final String submittedAt;
  String status;

  _KycItem({
    required this.id,
    required this.landlordName,
    required this.propertyTitle,
    required this.location,
    required this.deedType,
    required this.declaredValue,
    required this.submittedAt,
    required this.status,
  });
}
