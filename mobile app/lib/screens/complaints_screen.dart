import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/complaint_model.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../widgets/top_header.dart';
import 'reservations_screen.dart';

class ComplaintsScreen extends StatefulWidget {
  final String? preselectedPropertyId;

  const ComplaintsScreen({super.key, this.preselectedPropertyId});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedPropertyId = '';
  String _selectedCategory = 'Maintenance & Repairs';

  late TextEditingController _titleCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;

  bool _isSubmitting = false;
  String? _successNotice;
  String? _errorMessage;

  final List<String> _categories = [
    'Maintenance & Repairs',
    'Plumbing & Water Leakage',
    'Electrical & Power',
    'HVAC & Cooling',
    'Structural Damage',
    'Security & Locks',
    'Noise & Neighbors',
    'Tenancy / Deposit Terms',
  ];

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController();
    _descCtrl = TextEditingController();
    _nameCtrl = TextEditingController();
    _emailCtrl = TextEditingController();
    _phoneCtrl = TextEditingController();

    if (widget.preselectedPropertyId != null) {
      _selectedPropertyId = widget.preselectedPropertyId!;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final appState = Provider.of<AppState>(context, listen: false);
      appState.fetchUserBookings(userId: auth.currentUser.id, userEmail: auth.currentUser.email);
      appState.refreshComplaints();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.currentUser;
    if (_nameCtrl.text.isEmpty && user.fullname.isNotEmpty) {
      _nameCtrl.text = user.fullname;
    }
    if (_emailCtrl.text.isEmpty && user.email.isNotEmpty) {
      _emailCtrl.text = user.email;
    }
    if (_phoneCtrl.text.isEmpty && user.phoneNo.isNotEmpty) {
      _phoneCtrl.text = user.phoneNo;
    }

    final appState = Provider.of<AppState>(context, listen: false);
    if (_selectedPropertyId.isEmpty) {
      final userReserved = appState.getReservedPropertiesForUser(user, auth.isOps);
      if (userReserved.isNotEmpty) {
        _selectedPropertyId = userReserved.first.id;
      } else if (auth.isOps && appState.properties.isNotEmpty) {
        _selectedPropertyId = appState.properties.first.id;
      }
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthProvider>(context);

    // Strictly enforce: Regular tenants can ONLY file complaints against properties they have personally reserved.
    final userReserved = appState.getReservedPropertiesForUser(auth.currentUser, auth.isOps);
    final availableProps = auth.isOps
        ? (userReserved.isNotEmpty ? userReserved : appState.properties)
        : userReserved;

    PropertyModel? selectedProp;
    try {
      selectedProp = availableProps.firstWhere((p) => p.id == _selectedPropertyId);
    } catch (_) {
      selectedProp = availableProps.isNotEmpty ? availableProps.first : null;
      if (selectedProp != null && _selectedPropertyId != selectedProp.id) {
        _selectedPropertyId = selectedProp.id;
      }
    }

    final currentUser = auth.currentUser;
    // On user side, user only sees their own complaints; ops/admin sees all
    final complaintsList = auth.isOps
        ? appState.complaints
        : appState.complaints.where((c) {
            final email = currentUser.email.toLowerCase().trim();
            final uid = currentUser.id.trim();
            final name = currentUser.fullname.toLowerCase().trim();

            if (uid.isNotEmpty && c.userId != null && c.userId!.trim() == uid) return true;
            if (email.isNotEmpty && c.userEmail != null && c.userEmail!.toLowerCase().trim() == email) return true;
            if (name.isNotEmpty && c.userName != null && c.userName!.toLowerCase().trim() == name) return true;

            return false;
          }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: const TopHeader(title: 'Complaints & Support'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Header Banner
            _buildHeaderBanner(context, appState),

            const SizedBox(height: 14),

            // Success Notice
            if (_successNotice != null) ...[
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
                            'Complaint Registered & Dispatched!',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1B5E20)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _successNotice!,
                            style: const TextStyle(fontSize: 11.5, color: Color(0xFF2E7D32), height: 1.3),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.close, size: 16, color: Color(0xFF2E7D32)),
                      onPressed: () => setState(() => _successNotice = null),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Error Notice
            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEE),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFFCDD2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error, color: Color(0xFFBA1A1A), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(fontSize: 12, color: Color(0xFFBA1A1A)),
                      ),
                    ),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.close, size: 16, color: Color(0xFFBA1A1A)),
                      onPressed: () => setState(() => _errorMessage = null),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // 2. Form Card or Restricted Notice
            if (!auth.isOps && availableProps.isEmpty)
              _buildRestrictedCard(context, appState, auth)
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE7E8EA)),
                  boxShadow: const [
                    BoxShadow(color: Color(0x06001637), offset: Offset(0, 2), blurRadius: 10),
                  ],
                ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Step 1: Property Selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.real_estate_agent, size: 16, color: Color(0xFF076A64)),
                            SizedBox(width: 6),
                            Text(
                              'STEP 1: CHOOSE PROPERTY',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF001637),
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFA1F1E9).withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${availableProps.length} Listing${availableProps.length == 1 ? '' : 's'}',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Property Selection Reel / Radio Cards
                    SizedBox(
                      height: 84,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: availableProps.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (ctx, idx) {
                          final p = availableProps[idx];
                          final isSelected = p.id == _selectedPropertyId;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedPropertyId = p.id),
                            child: Container(
                              width: 220,
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFFFF8F7) : const Color(0xFFF8F9FB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFFBA1A1A) : const Color(0xFFE7E8EA),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          p.title,
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.bold,
                                            color: isSelected ? const Color(0xFFBA1A1A) : const Color(0xFF001637),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          p.location,
                                          style: const TextStyle(fontSize: 10, color: Color(0xFF75777F)),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          'Owner: ${p.agentName.isNotEmpty ? p.agentName : "Ahmed Khan"}',
                                          style: const TextStyle(fontSize: 9.5, color: Color(0xFF44474E)),
                                          maxLines: 1,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    width: 16,
                                    height: 16,
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFFBA1A1A) : Colors.transparent,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isSelected ? const Color(0xFFBA1A1A) : const Color(0xFFC4C7C5),
                                      ),
                                    ),
                                    child: isSelected
                                        ? const Icon(Icons.check, size: 11, color: Colors.white)
                                        : null,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 16),
                    const Divider(height: 1, color: Color(0xFFE7E8EA)),
                    const SizedBox(height: 14),

                    // Step 2: Complaint Form
                    const Row(
                      children: [
                        Icon(Icons.edit_note, size: 16, color: Color(0xFFBA1A1A)),
                        SizedBox(width: 6),
                        Text(
                          'STEP 2: ENTER COMPLAINT DETAILS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFBA1A1A),
                            letterSpacing: 0.6,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Category Chips
                    const Text('Category:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF44474E))),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _categories.map((cat) {
                        final isSel = cat == _selectedCategory;
                        return ChoiceChip(
                          label: Text(cat, style: TextStyle(fontSize: 10.5, color: isSel ? Colors.white : const Color(0xFF44474E), fontWeight: isSel ? FontWeight.bold : FontWeight.normal)),
                          selected: isSel,
                          selectedColor: const Color(0xFFBA1A1A),
                          backgroundColor: const Color(0xFFF8F9FB),
                          side: BorderSide(color: isSel ? const Color(0xFFBA1A1A) : const Color(0xFFE7E8EA)),
                          onSelected: (_) => setState(() => _selectedCategory = cat),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 14),

                    // Subject / Title
                    const Text('Complaint Subject / Headline *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _titleCtrl,
                      decoration: const InputDecoration(
                        hintText: 'e.g. Master bathroom water leakage / Main circuit trip',
                        hintStyle: TextStyle(fontSize: 11.5, color: Color(0xFF9E9E9E)),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      validator: (val) => (val == null || val.trim().length < 3) ? 'Please enter a valid subject' : null,
                    ),

                    const SizedBox(height: 12),

                    // Contact Fields
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Your Name *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _nameCtrl,
                                decoration: const InputDecoration(
                                  hintText: 'Full Name',
                                  hintStyle: TextStyle(fontSize: 11.5),
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                                validator: (val) => (val == null || val.trim().isEmpty) ? 'Required' : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Phone Number', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              TextFormField(
                                controller: _phoneCtrl,
                                decoration: const InputDecoration(
                                  hintText: '+92 300 0000000',
                                  hintStyle: TextStyle(fontSize: 11.5),
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    const Text('Email Address *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _emailCtrl,
                      decoration: const InputDecoration(
                        hintText: 'your.email@example.com',
                        hintStyle: TextStyle(fontSize: 11.5),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      validator: (val) => (val == null || !val.contains('@')) ? 'Valid email required' : null,
                    ),

                    const SizedBox(height: 12),

                    // Description
                    const Text('Detailed Description of Complaint / Issue *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextFormField(
                      controller: _descCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Explain the issue clearly so the landlord and maintenance staff can inspect and resolve it immediately...',
                        hintStyle: TextStyle(fontSize: 11.5, color: Color(0xFF9E9E9E)),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.all(12),
                      ),
                      validator: (val) => (val == null || val.trim().length < 5) ? 'Please describe the problem in more detail' : null,
                    ),

                    const SizedBox(height: 14),

                    // Submit & Landlord Notification Strip
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FB),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, size: 16, color: Color(0xFF076A64)),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'The landlord will immediately receive an alert at dawworld86@gmail.com.',
                              style: TextStyle(fontSize: 10.5, color: Color(0xFF44474E)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : () => _submitComplaint(appState, auth, selectedProp),
                        icon: _isSubmitting
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.send, size: 16, color: Colors.white),
                        label: Text(
                          _isSubmitting ? 'Dispatching...' : 'Submit Complaint to Owner',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFBA1A1A),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // 3. Recent Tickets History Card
            _buildHistoryCard(context, complaintsList, isOps: auth.isOps),
          ],
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
                  color: const Color(0xFFFFDAD6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.report_problem, size: 12, color: Color(0xFFBA1A1A)),
                    SizedBox(width: 4),
                    Text(
                      'TENANT SUPPORT PORTAL',
                      style: TextStyle(
                        color: Color(0xFFBA1A1A),
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
                  color: const Color(0xFFA1F1E9).withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'RESERVED PROPERTIES ONLY',
                  style: TextStyle(
                    color: Color(0xFF076A64),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Maintenance Tickets & Tenant Complaints',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF001637),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'File formal maintenance requests or service complaints for your booked and reserved properties. Every complaint is logged in Supabase and dispatched immediately to the property owner\'s inbox.',
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
                    MaterialPageRoute(builder: (_) => const ReservationsScreen()),
                  );
                },
                icon: const Icon(Icons.bookmark, size: 14, color: Colors.white),
                label: const Text(
                  'My Reservations',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF076A64),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
              OutlinedButton.icon(
                onPressed: () => appState.setTabIndex(1),
                icon: const Icon(Icons.search, size: 14, color: Color(0xFF001637)),
                label: const Text(
                  'Browse Properties',
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

  Widget _buildHistoryCard(BuildContext context, List<ComplaintModel> complaints, {required bool isOps}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.history, size: 16, color: Color(0xFFBA1A1A)),
                  const SizedBox(width: 6),
                  Text(
                    isOps ? 'RECENT TICKETS (${complaints.length})' : 'MY FILED TICKETS (${complaints.length})',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF001637), letterSpacing: 0.6),
                  ),
                ],
              ),
              const Text('24h SLA', style: TextStyle(fontSize: 10, color: Color(0xFF076A64), fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          if (complaints.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  isOps
                      ? 'No complaints submitted yet.'
                      : 'You have not submitted any complaints yet. Your active maintenance tickets will appear here once filed.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF75777F)),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: complaints.length,
              separatorBuilder: (_, __) => const Divider(height: 16, color: Color(0xFFEDEBEB)),
              itemBuilder: (ctx, idx) {
                final c = complaints[idx];
                final isResolved = c.status.toLowerCase() == 'resolved';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            c.title,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: isResolved ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            isResolved ? 'Resolved' : 'Pending Review',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                              color: isResolved ? const Color(0xFF2E7D32) : const Color(0xFFE65100),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${c.propertyTitle} • ${c.category}',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF75777F)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      c.description,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF44474E), height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildRestrictedCard(BuildContext context, AppState appState, AuthProvider auth) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [
          BoxShadow(color: Color(0x06001637), offset: Offset(0, 2), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8F7),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFFFDAD6), width: 1.5),
            ),
            child: const Icon(
              Icons.gavel_rounded,
              color: Color(0xFFBA1A1A),
              size: 34,
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'Active Reservation Required',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF001637),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'A tenant can only register complaints and maintenance tickets for properties they have personally reserved or currently lease.\n\nYou do not have any active property reservations under your account.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12.5,
              color: Color(0xFF44474E),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    appState.setTabIndex(1);
                    if (Navigator.canPop(context)) {
                      Navigator.pop(context);
                    }
                  },
                  icon: const Icon(Icons.explore, size: 16, color: Colors.white),
                  label: const Text(
                    'Explore Properties',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF076A64),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFD0D3D9)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: IconButton(
                  tooltip: 'Refresh My Bookings',
                  icon: const Icon(Icons.refresh, color: Color(0xFF001637), size: 20),
                  onPressed: () async {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Checking database for your reservations...'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                    await appState.fetchUserBookings(
                      userId: auth.currentUser.id,
                      userEmail: auth.currentUser.email,
                    );
                    if (mounted) setState(() {});
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _submitComplaint(AppState appState, AuthProvider auth, PropertyModel? prop) async {
    if (!auth.isOps) {
      final userReserved = appState.getReservedPropertiesForUser(auth.currentUser, false);
      if (userReserved.isEmpty || prop == null || !userReserved.any((p) => p.id == prop.id)) {
        setState(() => _errorMessage = 'You can only file complaints for properties that you have personally reserved.');
        return;
      }
    }

    if (!_formKey.currentState!.validate()) return;

    if (prop == null) {
      setState(() => _errorMessage = 'Please select a property to file a complaint for.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
      _successNotice = null;
    });

    try {
      final user = auth.currentUser;
      final ownerName = prop.agentName.isNotEmpty ? prop.agentName : 'Ahmed Khan';
      const ownerEmail = 'dawworld86@gmail.com';

      await appState.addComplaint(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        category: _selectedCategory,
        propertyTitle: prop.title,
        propertyId: prop.id,
        userId: user.id.isNotEmpty ? user.id : null,
        userName: _nameCtrl.text.trim(),
        userEmail: _emailCtrl.text.trim(),
        userPhone: _phoneCtrl.text.trim(),
        ownerName: ownerName,
        ownerEmail: ownerEmail,
      );

      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _successNotice = 'Complaint registered successfully! An alert email has been dispatched to $ownerName ($ownerEmail) and an acknowledgment sent to ${_emailCtrl.text.trim()}.';
          _titleCtrl.clear();
          _descCtrl.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = 'Failed to submit complaint: $e';
        });
      }
    }
  }
}
