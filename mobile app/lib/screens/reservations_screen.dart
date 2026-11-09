import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_network_image.dart';
import '../widgets/top_header.dart';
import 'complaints_screen.dart';
import 'property_details_screen.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  String? _departureNotice;
  final Map<String, _DurationMetadata> _metadataMap = {};

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
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthProvider>(context);
    final reservedProps = appState.getReservedPropertiesForUser(auth.currentUser, auth.isOps);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: const TopHeader(title: 'My Reservations'),
      body: RefreshIndicator(
        onRefresh: () async {
          await appState.refreshProperties();
          await appState.fetchUserBookings(
            userId: auth.currentUser.id,
            userEmail: auth.currentUser.email,
          );
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header Banner
              _buildHeaderBanner(context, appState),

              const SizedBox(height: 14),

              // Departure Notice Alert if triggered
              if (_departureNotice != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFA5D6A7)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Property Unreserved & Departed!',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Color(0xFF1B5E20),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _departureNotice!,
                              style: const TextStyle(fontSize: 11.5, color: Color(0xFF2E7D32), height: 1.3),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.close, size: 16, color: Color(0xFF2E7D32)),
                        onPressed: () => setState(() => _departureNotice = null),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // 2. Reserved List or Empty State
              if (reservedProps.isEmpty)
                _buildEmptyState(context, appState)
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: reservedProps.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (ctx, index) {
                    final prop = reservedProps[index];
                    return _buildReservedCard(context, prop, appState, auth);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner(BuildContext context, AppState appState) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [
          BoxShadow(color: Color(0x06001637), offset: Offset(0, 2), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFA1F1E9).withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock, size: 12, color: Color(0xFF076A64)),
                    SizedBox(width: 4),
                    Text(
                      'ACTIVE BOOKINGS & LEASES',
                      style: TextStyle(
                        color: Color(0xFF076A64),
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.amber[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '6-MONTH AUTO UNRESERVE',
                  style: TextStyle(
                    color: Color(0xFF78350F),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Reserved Properties & Departure Portal',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF001637),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Review your reserved listings, adjust tour or lease days, file tenant complaints, or process departure with automatic email notifications to the owner.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF44474E), height: 1.35),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ComplaintsScreen()),
                  );
                },
                icon: const Icon(Icons.report_problem, size: 14, color: Colors.white),
                label: const Text(
                  'File Complaint',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFBA1A1A),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => appState.setTabIndex(1),
                icon: const Icon(Icons.search, size: 14, color: Color(0xFF001637)),
                label: const Text(
                  'Explore More',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFE7E8EA)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppState appState) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7E8EA)),
      ),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.amber[50],
              shape: BoxShape.circle,
              border: Border.all(color: Colors.amber[200]!),
            ),
            child: const Icon(Icons.domain_disabled, size: 30, color: Color(0xFFD97706)),
          ),
          const SizedBox(height: 14),
          const Text(
            'No Active Reservations',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
          ),
          const SizedBox(height: 6),
          const Text(
            'You currently have no properties reserved. When you reserve or book a property, it will appear here with active countdown tracking and departure management.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Color(0xFF44474E), height: 1.4),
          ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            onPressed: () => appState.setTabIndex(1),
            icon: const Icon(Icons.search, size: 15, color: Colors.white),
            label: const Text('Explore Available Properties', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF076A64),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReservedCard(BuildContext context, PropertyModel prop, AppState appState, AuthProvider auth) {
    final meta = _metadataMap.putIfAbsent(prop.id, () => _DurationMetadata.defaultSixMonths());
    final now = DateTime.now();
    final daysRemaining = meta.endDate.difference(now).inDays.clamp(0, 365);
    final percentPassed = (1.0 - (daysRemaining / (meta.totalDays > 0 ? meta.totalDays : 180))).clamp(0.0, 1.0);

    final landlordName = prop.agentName.isNotEmpty ? prop.agentName : 'Ahmed Khan';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [
          BoxShadow(color: Color(0x06001637), offset: Offset(0, 2), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Photo & Badges Header
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: SizedBox(
                  height: 150,
                  width: double.infinity,
                  child: AppNetworkImage(url: prop.imageUrl, fit: BoxFit.cover),
                ),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFA1F1E9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF076A64).withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock, size: 12, color: Color(0xFF076A64)),
                      SizedBox(width: 4),
                      Text(
                        'Reserved For You',
                        style: TextStyle(
                          color: Color(0xFF076A64),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                right: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    prop.priceFormatted,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),

          // 2. Info details
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prop.title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 13, color: Color(0xFF75777F)),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        prop.location,
                        style: const TextStyle(fontSize: 11.5, color: Color(0xFF75777F)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // 3. Stay / Tour Duration Box (Exact match to website)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F9FB),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE7E8EA)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.schedule, size: 15, color: Color(0xFF076A64)),
                              const SizedBox(width: 4),
                              Text(
                                meta.durationText,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: daysRemaining <= 3 ? const Color(0xFFFFF3E0) : const Color(0xFFE8F5E9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              daysRemaining <= 0 ? 'Term Finished' : '⏳ $daysRemaining Day${daysRemaining == 1 ? '' : 's'} Left',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: daysRemaining <= 3 ? const Color(0xFFE65100) : const Color(0xFF2E7D32),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${DateFormat('d MMM yyyy').format(meta.startDate)} → ${DateFormat('d MMM yyyy').format(meta.endDate)}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF44474E)),
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: percentPassed,
                          minHeight: 5,
                          backgroundColor: const Color(0xFFE7E8EA),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF076A64)),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'When this reservation period finishes, the system will automatically return the property to AVAILABLE.',
                        style: TextStyle(fontSize: 10, color: Color(0xFF75777F)),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // 4. Landlord strip
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Landlord: $landlordName',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF44474E)),
                    ),
                    const Text(
                      'Status: Active Lease',
                      style: TextStyle(fontSize: 11, color: Color(0xFF076A64), fontWeight: FontWeight.bold),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFEDEBEB)),
                const SizedBox(height: 10),

                // 5. Actions Grid
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => PropertyDetailsScreen(property: prop)),
                        );
                      },
                      icon: const Icon(Icons.visibility, size: 13, color: Color(0xFF001637)),
                      label: const Text('View Listing', style: TextStyle(fontSize: 11, color: Color(0xFF001637), fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        side: const BorderSide(color: Color(0xFFE7E8EA)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => _openAdjustDurationModal(context, prop),
                      icon: const Icon(Icons.edit_calendar, size: 13, color: Color(0xFF076A64)),
                      label: const Text('Adjust Tour Days', style: TextStyle(fontSize: 11, color: Color(0xFF076A64), fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        backgroundColor: const Color(0xFFE6F7F6),
                        side: const BorderSide(color: Color(0xFFA1F1E9)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ComplaintsScreen(preselectedPropertyId: prop.id),
                          ),
                        );
                      },
                      icon: const Icon(Icons.report_problem, size: 13, color: Color(0xFFBA1A1A)),
                      label: const Text('File Complaint', style: TextStyle(fontSize: 11, color: Color(0xFFBA1A1A), fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        backgroundColor: const Color(0xFFFFF8F7),
                        side: const BorderSide(color: Color(0xFFFFDAD6)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _openDepartureModal(context, prop, appState, auth),
                      icon: const Icon(Icons.logout, size: 13, color: Colors.white),
                      label: const Text('Process Departure', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        backgroundColor: const Color(0xFFBA1A1A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        elevation: 0,
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

  // MODAL 1: ADJUST DURATION (e.g. 1 Day short tour, 3 days, 2 weeks, 6 months)
  void _openAdjustDurationModal(BuildContext context, PropertyModel prop) {
    int durationValue = 1;
    String durationUnit = 'Days';

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE6F7F6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.edit_calendar, color: Color(0xFF076A64), size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('Adjust Tour / Stay Days', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      prop.title,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF076A64)),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Specify the exact duration (e.g. 1 Day for a short tour stay, 3 Days, or multiple months).',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF44474E), height: 1.3),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            initialValue: '$durationValue',
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Duration',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            onChanged: (val) {
                              final parsed = int.tryParse(val) ?? 1;
                              setModalState(() => durationValue = parsed > 0 ? parsed : 1);
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 3,
                          child: DropdownButtonFormField<String>(
                            initialValue: durationUnit,
                            decoration: const InputDecoration(
                              labelText: 'Unit',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'Days', child: Text('Days')),
                              DropdownMenuItem(value: 'Weeks', child: Text('Weeks')),
                              DropdownMenuItem(value: 'Months', child: Text('Months')),
                            ],
                            onChanged: (val) {
                              if (val != null) setModalState(() => durationUnit = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FB),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Effective Duration: $durationValue $durationUnit ${durationUnit == 'Days' && durationValue <= 7 ? '(Tour Stay)' : ''}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final now = DateTime.now();
                    DateTime newEnd = now;
                    if (durationUnit == 'Days') {
                      newEnd = now.add(Duration(days: durationValue));
                    } else if (durationUnit == 'Weeks') {
                      newEnd = now.add(Duration(days: durationValue * 7));
                    } else {
                      newEnd = DateTime(now.year, now.month + durationValue, now.day);
                    }
                    final diffDays = newEnd.difference(now).inDays;
                    setState(() {
                      _metadataMap[prop.id] = _DurationMetadata(
                        durationText: '$durationValue $durationUnit ${durationUnit == 'Days' && durationValue <= 7 ? '(Tour Stay)' : ''}'.trim(),
                        startDate: now,
                        endDate: newEnd,
                        totalDays: diffDays > 0 ? diffDays : 1,
                      );
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Updated stay duration for "${prop.title}" to $durationValue $durationUnit!'),
                        backgroundColor: const Color(0xFF076A64),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF076A64)),
                  child: const Text('Save Duration', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // MODAL 2: PROCESS DEPARTURE / UNRESERVE (Matches website modal)
  void _openDepartureModal(BuildContext context, PropertyModel prop, AppState appState, AuthProvider auth) {
    String reason = 'End of stay / Relocation';
    bool isProcessing = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFDAD6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.logout, color: Color(0xFFBA1A1A), size: 20),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('Confirm Departure', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'By unreserving this property, you are confirming your departure. The listing will immediately revert to AVAILABLE for new applicants.',
                      style: TextStyle(fontSize: 11.5, color: Color(0xFF44474E), height: 1.35),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FB),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE7E8EA)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Property: ${prop.title}', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 3),
                          Text('Landlord: ${prop.agentName.isNotEmpty ? prop.agentName : "Ahmed Khan"}', style: const TextStyle(fontSize: 11, color: Color(0xFF44474E))),
                          const SizedBox(height: 3),
                          Text('Departure Date: ${DateFormat('d MMM yyyy').format(DateTime.now())}', style: const TextStyle(fontSize: 11, color: Color(0xFF076A64), fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text('Reason for Departure:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: reason,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'End of stay / Relocation', child: Text('End of stay / Relocation', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'Early lease departure / Job relocation', child: Text('Early lease departure / Job relocation', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'Mutual cancellation with landlord', child: Text('Mutual cancellation with landlord', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: '6-Month tenancy period finished', child: Text('6-Month tenancy period finished', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'Other reason', child: Text('Other personal reason', style: TextStyle(fontSize: 12))),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => reason = val);
                      },
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.mail, size: 14, color: Color(0xFF076A64)),
                        SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Confirmation emails will be delivered to the landlord (dawworld86@gmail.com) and your email address.',
                            style: TextStyle(fontSize: 10.5, color: Color(0xFF75777F)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isProcessing ? null : () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: isProcessing
                      ? null
                      : () async {
                          setModalState(() => isProcessing = true);
                          final user = auth.currentUser;
                          final success = await appState.unreserveProperty(
                            propertyId: prop.id,
                            propertyTitle: prop.title,
                            ownerName: prop.agentName.isNotEmpty ? prop.agentName : 'Ahmed Khan',
                            ownerEmail: 'dawworld86@gmail.com',
                            userName: user.fullname.isNotEmpty ? user.fullname : 'Resident',
                            userEmail: user.email.isNotEmpty ? user.email : 'tenant@havenkey.pk',
                            userPhone: user.phoneNo,
                            departureDate: DateFormat('d MMM yyyy').format(DateTime.now()),
                            reason: reason,
                            userId: user.id.isNotEmpty ? user.id : null,
                            isAutomatic: false,
                          );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted && success) {
                            setState(() {
                              _departureNotice = 'Departure confirmed for "${prop.title}". The listing is now AVAILABLE and confirmation emails have been sent to the landlord and you.';
                            });
                          }
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFBA1A1A)),
                  child: isProcessing
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Confirm Departure', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _DurationMetadata {
  final String durationText;
  final DateTime startDate;
  final DateTime endDate;
  final int totalDays;

  _DurationMetadata({
    required this.durationText,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
  });

  factory _DurationMetadata.defaultSixMonths() {
    final now = DateTime.now();
    final end = DateTime(now.year, now.month + 6, now.day);
    return _DurationMetadata(
      durationText: '6 Months (Standard Lease)',
      startDate: now,
      endDate: end,
      totalDays: end.difference(now).inDays,
    );
  }
}
