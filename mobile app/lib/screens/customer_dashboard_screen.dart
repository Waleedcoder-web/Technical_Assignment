import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../models/property_model.dart';
import '../models/user_model.dart';
import '../models/agreement_model.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/top_header.dart';
import 'reservations_screen.dart';
import 'complaints_screen.dart';
import 'ai_assistant_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final appState = Provider.of<AppState>(context, listen: false);
      appState.fetchUserBookings(
        userId: auth.currentUser.id,
        userEmail: auth.currentUser.email,
      );
      appState.refreshComplaints();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final appState = Provider.of<AppState>(context);
    final user = auth.currentUser;
    final userReservations = appState.getReservedPropertiesForUser(user, auth.isOps);
    final primaryResidence = userReservations.isNotEmpty ? userReservations.first : null;
    final complaints = auth.isOps
        ? appState.complaints
        : appState.complaints.where((c) {
            final email = user.email.toLowerCase().trim();
            final uid = user.id.trim();
            final name = user.fullname.toLowerCase().trim();

            if (uid.isNotEmpty && c.userId != null && c.userId!.trim() == uid) return true;
            if (email.isNotEmpty && c.userEmail != null && c.userEmail!.toLowerCase().trim() == email) return true;
            if (name.isNotEmpty && c.userName != null && c.userName!.toLowerCase().trim() == name) return true;

            return false;
          }).toList();
    final activeTicket = complaints.isNotEmpty ? complaints.first : null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const TopHeader(title: 'Resident Portal'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Tenant Salutation & Status Pill
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
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
                            'TENANT PORTAL',
                            style: AppTypography.labelSmall.copyWith(
                              color: AppColors.secondary,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          Text(
                            'Welcome back, ${user.fullname.split(' ').first}',
                            style: AppTypography.headlineMedium.copyWith(fontSize: 22),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.secondaryFixed,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.circle, size: 8, color: AppColors.secondary),
                            SizedBox(width: 5),
                            Text(
                              'Verified Resident',
                              style: TextStyle(
                                color: AppColors.onSecondaryFixed,
                                fontSize: 11,
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
                    children: [
                      const Icon(Icons.apartment, size: 16, color: AppColors.secondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          primaryResidence != null
                              ? '${primaryResidence.title} • ${primaryResidence.location}'
                              : 'No active tenancy lease • Verified Member',
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

            // 2. Primary Urgent Action Card: Upcoming Rent (if active lease) or Onboarding Card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: primaryResidence != null
                  ? Container(
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Color(0x20001637), blurRadius: 16, offset: Offset(0, 6)),
                        ],
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today, color: AppColors.secondaryFixed, size: 20),
                                  const SizedBox(width: 6),
                                  Text(
                                    'NEXT RENT DUE',
                                    style: AppTypography.labelSmall.copyWith(
                                      color: AppColors.onPrimaryContainer,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.secondaryFixedDim.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text(
                                  'Due in 12 Days',
                                  style: TextStyle(
                                    color: AppColors.secondaryFixed,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                primaryResidence.priceFormatted,
                                style: AppTypography.displayLarge.copyWith(color: Colors.white, fontSize: 26),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Lease: ${primaryResidence.title} • Includes escrow protection',
                            style: const TextStyle(color: AppColors.onPrimaryContainer, fontSize: 11),
                          ),
                          const SizedBox(height: 14),

                          // Raast Auto-Debit status
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.sync, color: AppColors.secondaryFixed, size: 18),
                                    SizedBox(width: 8),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Raast Auto-Debit Enabled',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11.5),
                                        ),
                                        Text(
                                          'HBL •••• 4092',
                                          style: TextStyle(color: AppColors.onPrimaryContainer, fontSize: 10),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Text(
                                  'Active',
                                  style: TextStyle(color: AppColors.secondaryFixed, fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 14),

                          // Actions
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    final res = await _apiService.payRent('AGR-PK-2024-8841');
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('${res['message']} (Txn: ${res['receipt']?['transactionId'] ?? '1Link'})'),
                                          duration: const Duration(seconds: 3),
                                        ),
                                      );
                                    }
                                  },
                                  icon: const Icon(Icons.account_balance, color: Colors.white, size: 16),
                                  label: const Text(
                                    'Pay via Raast / Bank',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.secondary,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    elevation: 0,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerHigh.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: IconButton(
                                  icon: const Icon(Icons.receipt_long, color: Colors.white, size: 20),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Downloading official Rent Receipt PDF...')),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )
                  : Container(
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Color(0x20001637), blurRadius: 16, offset: Offset(0, 6)),
                        ],
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.verified_user, color: AppColors.secondaryFixed, size: 20),
                              const SizedBox(width: 6),
                              Text(
                                'WELCOME TO HAVENKEY',
                                style: AppTypography.labelSmall.copyWith(
                                  color: AppColors.onPrimaryContainer,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Ready to reserve your ideal home?',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'You do not have any active bookings yet. Browse our verified luxury listings across Pakistan and book with SBP bank escrow protection.',
                            style: TextStyle(color: AppColors.onPrimaryContainer, fontSize: 11.5, height: 1.35),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            height: 38,
                            child: ElevatedButton.icon(
                              onPressed: () => appState.setTabIndex(1),
                              icon: const Icon(Icons.search, size: 15, color: Color(0xFF001637)),
                              label: const Text('Explore Live Properties', style: TextStyle(color: Color(0xFF001637), fontWeight: FontWeight.bold, fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.secondaryFixed,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                elevation: 0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),

            const SizedBox(height: 18),

            // 3. Tenancy Metrics KPI Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ReservationsScreen()),
                        );
                      },
                      child: _KpiBox(
                        icon: Icons.calendar_month,
                        iconBg: AppColors.secondaryContainer,
                        iconColor: AppColors.secondary,
                        label: 'Bookings',
                        value: '${userReservations.length} Active',
                        subtitle: 'Tap to view',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ComplaintsScreen()),
                        );
                      },
                      child: _KpiBox(
                        icon: Icons.build,
                        iconBg: AppColors.errorContainer,
                        iconColor: AppColors.error,
                        label: 'Tickets',
                        value: '${complaints.where((c) => c.status != 'resolved').length} Active',
                        subtitle: 'Tap to view',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => appState.setTabIndex(1),
                      child: _KpiBox(
                        icon: Icons.explore,
                        iconBg: AppColors.primaryFixed,
                        iconColor: AppColors.primary,
                        label: 'Catalog',
                        value: '${appState.properties.length} Props',
                        subtitle: 'Explore live',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ReservationsScreen()),
                        );
                      },
                      icon: const Icon(Icons.bookmark_added, size: 14, color: Colors.white),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Reservations', style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold)),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF076A64),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ComplaintsScreen()),
                        );
                      },
                      icon: const Icon(Icons.report_problem, size: 14, color: Colors.white),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('Complaints', style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold)),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFBA1A1A),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
                        );
                      },
                      icon: const Icon(Icons.smart_toy, size: 14, color: Colors.white),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text('AI Copilot', style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold)),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF076A64),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // 4. Primary Residence Overview
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: primaryResidence != null
                  ? Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8)],
                      ),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.home, color: AppColors.secondary, size: 18),
                                  const SizedBox(width: 6),
                                  Text('Primary Residence', style: AppTypography.titleMedium),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerHigh,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '${primaryResidence.beds}-Bed ${primaryResidence.propertyType.toUpperCase()}',
                                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppColors.onSurfaceVariant),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Stack(
                              children: [
                                Image.network(
                                  primaryResidence.imageUrl,
                                  height: 120,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(height: 120, color: AppColors.surfaceContainer),
                                ),
                                Positioned.fill(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [Colors.transparent, AppColors.primary.withValues(alpha: 0.85)],
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  bottom: 10,
                                  left: 10,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(primaryResidence.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                      Text('Location: ${primaryResidence.location} • Agent: ${primaryResidence.agentName}', style: const TextStyle(color: Colors.white70, fontSize: 10.5)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _showAgreementDialog(context, primaryResidence, user),
                                  icon: const Icon(Icons.description_outlined, size: 15, color: AppColors.primary),
                                  label: const Text('View Agreement PDF', style: TextStyle(color: AppColors.primary, fontSize: 11.5, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Lease renewal option active.')),
                                    );
                                  },
                                  icon: const Icon(Icons.autorenew, size: 15, color: AppColors.secondary),
                                  label: const Text('Renew Lease', style: TextStyle(color: AppColors.secondary, fontSize: 11.5, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )
                  : Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8)],
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: const BoxDecoration(
                              color: AppColors.surfaceContainerHigh,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.home_outlined, size: 28, color: AppColors.secondary),
                          ),
                          const SizedBox(height: 10),
                          const Text('No Active Tenancy Lease', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary)),
                          const SizedBox(height: 4),
                          const Text(
                            'You do not currently occupy or lease any properties. When you book or reserve a property, your digital agreement and residence details will appear here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11.5, color: AppColors.onSurfaceVariant, height: 1.35),
                          ),
                          const SizedBox(height: 14),
                          OutlinedButton.icon(
                            onPressed: () => appState.setTabIndex(1),
                            icon: const Icon(Icons.explore, size: 14, color: Color(0xFF076A64)),
                            label: const Text('Browse Live Listings', style: TextStyle(color: Color(0xFF076A64), fontSize: 11.5, fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFA1F1E9)),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),

            const SizedBox(height: 18),

            // 5. Live Service Tracker Card
            if (activeTicket != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 8)],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.engineering, color: AppColors.secondary, size: 20),
                              const SizedBox(width: 6),
                              Text('Live Service Tracker', style: AppTypography.titleMedium),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.secondaryContainer,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              activeTicket.status.toUpperCase(),
                              style: const TextStyle(color: AppColors.onSecondaryContainer, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(activeTicket.title, style: AppTypography.headlineSmall.copyWith(fontSize: 15)),
                      Text('Ticket #${activeTicket.id} • ${activeTicket.priority.toUpperCase()} PRIORITY', style: AppTypography.labelSmall),
                      const SizedBox(height: 10),

                      // Stepper progress
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(activeTicket.assignedVendor ?? 'CoolTech Engineering', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                                const Text('Arriving 3:00 PM today', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 10.5)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: activeTicket.progressPercent,
                                backgroundColor: AppColors.surfaceContainerHigh,
                                color: AppColors.secondary,
                                minHeight: 6,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('• Assigned', style: TextStyle(color: AppColors.secondary, fontSize: 9.5, fontWeight: FontWeight.bold)),
                                Text('• En Route', style: TextStyle(color: AppColors.secondary, fontSize: 9.5, fontWeight: FontWeight.bold)),
                                Text('• Service Complete', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 9.5)),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Technician Info
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: AppColors.surfaceContainerHigh,
                                child: const Text('TS', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 12)),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(activeTicket.technicianName ?? 'Tariq Shah (Lead Tech)', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  const Text('ID: CT-992 • 4.9 ★', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 10)),
                                ],
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.call, color: AppColors.primary, size: 20),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Calling technician ${activeTicket.technicianPhone ?? '0300-5550192'}...')),
                                  );
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.event_repeat, color: AppColors.primary, size: 20),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Rescheduling maintenance appointment...')),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => _showNewComplaintModal(context, appState),
                          icon: const Icon(Icons.add_circle_outline, size: 16, color: Colors.white),
                          label: const Text('Submit New Complaint', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 18),

            // 6. Recent Rent Payment Receipts
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.receipt, color: AppColors.secondary, size: 18),
                          const SizedBox(width: 6),
                          Text('Payment History', style: AppTypography.titleMedium),
                        ],
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('View All (18)', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 6)],
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      children: [
                        _ReceiptTile(
                          title: 'August 2024 Rent',
                          subtitle: 'Cleared • Raast #RR-90412 • 01 Aug',
                          amount: 'PKR 320,000',
                          status: 'Cleared',
                          icon: Icons.check_circle,
                        ),
                        const Divider(height: 12),
                        _ReceiptTile(
                          title: 'July 2024 Rent',
                          subtitle: 'Cleared • Raast #RR-81204 • 01 Jul',
                          amount: 'PKR 320,000',
                          status: 'Cleared',
                          icon: Icons.check_circle,
                        ),
                        const Divider(height: 12),
                        _ReceiptTile(
                          title: 'Security Deposit',
                          subtitle: 'Escrow Held • #SEC-4091',
                          amount: 'PKR 640,000',
                          status: 'Secured',
                          icon: Icons.security,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // 7. 24/7 Concierge Emergency Desk
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: const BoxDecoration(
                            color: AppColors.errorContainer,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.emergency, color: AppColors.error, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Resident Concierge & Emergency', style: AppTypography.titleMedium.copyWith(fontSize: 13.5)),
                              Text('Building security, electrical emergencies, water leaks', style: AppTypography.bodySmall.copyWith(fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Connecting to 24/7 Emergency Dispatch (+92 51 888 9900)...')),
                          );
                        },
                        icon: const Icon(Icons.ring_volume, color: Colors.white, size: 18),
                        label: const Text('Call 24/7 Emergency Desk (+92 51 888 9900)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12.5)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          final auth = Provider.of<AuthProvider>(context, listen: false);
                          final appState = Provider.of<AppState>(context, listen: false);
                          auth.logout();
                          appState.clearUserData();
                          appState.setTabIndex(0);
                          Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
                            '/login',
                            (route) => false,
                          );
                        },
                        icon: const Icon(Icons.logout, color: AppColors.error, size: 16),
                        label: const Text('Sign Out of Account', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFFCDD2)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
    );
  }

  void _showNewComplaintModal(BuildContext context, AppState appState) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String category = 'hvac';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Submit Maintenance Request', style: AppTypography.headlineSmall.copyWith(fontSize: 18)),
                  const SizedBox(height: 14),
                  TextField(
                    controller: titleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Issue Title (e.g. Water leak, AC fault)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Description & Location Details',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Category:', style: TextStyle(fontWeight: FontWeight.bold)),
                      DropdownButton<String>(
                        value: category,
                        items: const [
                          DropdownMenuItem(value: 'hvac', child: Text('HVAC & Cooling')),
                          DropdownMenuItem(value: 'plumbing', child: Text('Plumbing & Water')),
                          DropdownMenuItem(value: 'electrical', child: Text('Electrical & Power')),
                          DropdownMenuItem(value: 'general', child: Text('General Fixture')),
                        ],
                        onChanged: (val) {
                          if (val != null) setModalState(() => category = val);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () {
                        if (titleCtrl.text.trim().isNotEmpty) {
                          appState.addComplaint(
                            title: titleCtrl.text.trim(),
                            description: descCtrl.text.trim(),
                            category: category,
                            propertyTitle: 'Margalla Ridge • Residence 4B',
                          );
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Ticket submitted and dispatched to facility team!')),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Submit Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showAgreementDialog(BuildContext context, PropertyModel property, UserModel user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return FutureBuilder<AgreementModel>(
          future: _apiService.getAgreement(propertyId: property.id, userId: user.id),
          builder: (context, snapshot) {
            final agr = snapshot.data;
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.secondary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.verified, color: AppColors.secondary, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Digital Tenancy Agreement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF001637))),
                              Text('Doc ID: ${agr?.id ?? "HAVENKEY-AGR-VERIFIED"}', style: const TextStyle(fontSize: 11, color: Color(0xFF75777F))),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: ((agr?.status.toLowerCase() ?? 'active') == 'active') ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          (agr?.status ?? 'active').toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: ((agr?.status.toLowerCase() ?? 'active') == 'active') ? const Color(0xFF2E7D32) : const Color(0xFFC62828),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F9FA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE0E0E0)),
                    ),
                    child: Column(
                      children: [
                        _buildAgreementRow('Property', property.title),
                        const Divider(height: 14),
                        _buildAgreementRow('Location', property.location),
                        const Divider(height: 14),
                        _buildAgreementRow('Landlord', agr?.landlordName ?? (property.agentName.isNotEmpty ? property.agentName : 'Ahmed Khan')),
                        const Divider(height: 14),
                        _buildAgreementRow('Tenant', agr?.tenantName ?? (user.fullname.isNotEmpty ? user.fullname : 'Resident')),
                        const Divider(height: 14),
                        _buildAgreementRow('Monthly Rent', agr?.monthlyRentFormatted ?? property.priceFormatted),
                        const Divider(height: 14),
                        _buildAgreementRow('Security Deposit', agr?.securityDepositFormatted ?? 'PKR ${(property.price * 2).toStringAsFixed(0)}'),
                        const Divider(height: 14),
                        _buildAgreementRow('Start Date', agr?.startDate ?? 'Active'),
                        const Divider(height: 14),
                        _buildAgreementRow('End / Expiry Date', agr?.endDate ?? 'Open Tenancy'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.check, size: 16, color: Colors.white),
                      label: const Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAgreementRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11.5, color: Color(0xFF75777F), fontWeight: FontWeight.w500)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _KpiBox extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String value;
  final String subtitle;

  const _KpiBox({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(6)),
                child: Icon(icon, color: iconColor, size: 16),
              ),
              Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 10.5, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primary)),
          Text(subtitle, style: AppTypography.labelSmall.copyWith(fontSize: 10), maxLines: 1),
        ],
      ),
    );
  }
}

class _ReceiptTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String amount;
  final String status;
  final IconData icon;

  const _ReceiptTile({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.status,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: AppColors.secondaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.secondary, size: 18),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
                  Text(subtitle, style: AppTypography.bodySmall.copyWith(fontSize: 10.5)),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
              Text(status, style: const TextStyle(color: AppColors.secondary, fontSize: 10.5, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}

