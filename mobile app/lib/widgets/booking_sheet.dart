import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';

class BookingSheet extends StatefulWidget {
  final PropertyModel property;
  final String initialType; // 'in_person', 'video_tour', or 'inspection'

  const BookingSheet({
    super.key,
    required this.property,
    this.initialType = 'in_person',
  });

  static void show(BuildContext context, PropertyModel property, {String initialType = 'in_person'}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BookingSheet(property: property, initialType: initialType),
    );
  }

  @override
  State<BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends State<BookingSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _notesCtrl;
  late TextEditingController _customDurationCtrl;

  // Booking mode: 'booking' (Online Booking / Lease / Token) or 'viewing' (Private viewing / Tour)
  String _bookingMode = 'booking';

  // Duration settings (for rent booking)
  String _leaseDuration = '1 Year';
  bool _isCustomDuration = false;
  int _customDurationValue = 1;
  String _customDurationUnit = 'days'; // 'days', 'weeks', 'months', 'years'

  // User agreement radio decision & checkbox
  String _userAnswer = 'yes'; // 'yes' or 'no'
  bool _agreedToTerms = true;

  late DateTime _selectedDate;
  String _selectedSlot = '11:00 AM - 12:00 PM';
  late String _bookingTypeSlug;
  bool _isLoading = false;

  final List<String> _leaseOptions = [
    '1 Day',
    '2 Days',
    '3 Days',
    '1 Week',
    '1 Month',
    '6 Months',
    '1 Year',
    'custom',
  ];

  final List<Map<String, String>> _bookingTypes = [
    {
      'slug': 'in_person',
      'name': 'In-Person Private Viewing',
      'desc': 'Walk through on-site with verified concierge host',
      'icon': 'person',
    },
    {
      'slug': 'inspection',
      'name': 'Technical Inspection',
      'desc': 'Audit HVAC, plumbing, structural stability',
      'icon': 'engineering',
    },
  ];

  final List<String> _timeSlots = [
    '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM',
    '04:30 PM - 05:30 PM',
    '06:00 PM - 07:00 PM',
  ];

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 2));
    _bookingTypeSlug = widget.initialType;

    _nameCtrl = TextEditingController();
    _emailCtrl = TextEditingController();
    _phoneCtrl = TextEditingController();
    _notesCtrl = TextEditingController();
    _customDurationCtrl = TextEditingController(text: '1');

    // Auto pre-fill with logged-in user data if authenticated
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        if (_nameCtrl.text.isEmpty) _nameCtrl.text = auth.currentUser.fullname;
        if (_emailCtrl.text.isEmpty) _emailCtrl.text = auth.currentUser.email;
        if (_phoneCtrl.text.isEmpty && auth.currentUser.phoneNo.isNotEmpty) {
          _phoneCtrl.text = auth.currentUser.phoneNo;
        }
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _notesCtrl.dispose();
    _customDurationCtrl.dispose();
    super.dispose();
  }

  DateTime getCalculatedEndDate() {
    DateTime d = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
    if (_isCustomDuration) {
      final val = _customDurationValue;
      if (_customDurationUnit == 'days') {
        d = d.add(Duration(days: val));
      } else if (_customDurationUnit == 'weeks') {
        d = d.add(Duration(days: val * 7));
      } else if (_customDurationUnit == 'months') {
        d = DateTime(d.year, d.month + val, d.day);
      } else if (_customDurationUnit == 'years') {
        d = DateTime(d.year + val, d.month, d.day);
      }
    } else {
      if (_leaseDuration.contains('1 Day')) {
        d = d.add(const Duration(days: 1));
      } else if (_leaseDuration.contains('2 Days')) {
        d = d.add(const Duration(days: 2));
      } else if (_leaseDuration.contains('3 Days')) {
        d = d.add(const Duration(days: 3));
      } else if (_leaseDuration.contains('1 Week')) {
        d = d.add(const Duration(days: 7));
      } else if (_leaseDuration.contains('1 Month')) {
        d = DateTime(d.year, d.month + 1, d.day);
      } else if (_leaseDuration.contains('6 Months')) {
        d = DateTime(d.year, d.month + 6, d.day);
      } else if (_leaseDuration.contains('2 Years')) {
        d = DateTime(d.year + 2, d.month, d.day);
      } else if (_leaseDuration.contains('3 Years')) {
        d = DateTime(d.year + 3, d.month, d.day);
      } else {
        d = DateTime(d.year + 1, d.month, d.day);
      }
    }
    return d;
  }

  String getEffectiveDurationText() {
    if (_isCustomDuration) {
      final val = _customDurationValue;
      final unit = val == 1 ? _customDurationUnit.replaceAll(RegExp(r's$'), '') : _customDurationUnit;
      final capitalized = unit.substring(0, 1).toUpperCase() + unit.substring(1);
      final tourTag = (val <= 7 && _customDurationUnit == 'days') ? ' (Tour Stay)' : '';
      return '$val $capitalized$tourTag'.trim();
    }
    return _leaseDuration;
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isBefore(now) ? now.add(const Duration(days: 1)) : _selectedDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 180)),
      builder: (ctx, child) {
        return Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF076A64),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF001637),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.property;
    final isRent = p.listingType.toLowerCase() == 'rent';

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 6),
            width: 44,
            height: 4.5,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _bookingMode == 'booking'
                            ? (isRent ? 'Book for Rent (Digital Lease)' : 'Book Property (Purchase Token)')
                            : 'Schedule a Private Viewing',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF001637),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      const Row(
                        children: [
                          Icon(Icons.bolt, size: 13, color: Color(0xFF10B981)),
                          SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              'Direct Confirmation • No Email Action Required',
                              style: TextStyle(fontSize: 10.5, color: Color(0xFF076A64), fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
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

          // Scrollable Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(18),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Mode Selector Tabs (Online Booking vs Schedule Viewing)
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F4F6),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE7E8EA)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _bookingMode = 'booking'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: _bookingMode == 'booking' ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: _bookingMode == 'booking'
                                      ? [const BoxShadow(color: Color(0x10000000), blurRadius: 4, offset: Offset(0, 1))]
                                      : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.verified_user,
                                      size: 15,
                                      color: _bookingMode == 'booking' ? const Color(0xFF076A64) : const Color(0xFF75777F),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Online Booking',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: _bookingMode == 'booking' ? FontWeight.bold : FontWeight.w600,
                                        color: _bookingMode == 'booking' ? const Color(0xFF076A64) : const Color(0xFF75777F),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _bookingMode = 'viewing'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: _bookingMode == 'viewing' ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: _bookingMode == 'viewing'
                                      ? [const BoxShadow(color: Color(0x10000000), blurRadius: 4, offset: Offset(0, 1))]
                                      : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.calendar_month,
                                      size: 15,
                                      color: _bookingMode == 'viewing' ? const Color(0xFF076A64) : const Color(0xFF75777F),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Schedule Viewing',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: _bookingMode == 'viewing' ? FontWeight.bold : FontWeight.w600,
                                        color: _bookingMode == 'viewing' ? const Color(0xFF076A64) : const Color(0xFF75777F),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Mode Description & Financial Breakdown
                    if (_bookingMode == 'booking') ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE6F7F6),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFA1F1E9)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  isRent ? 'Monthly Rent:' : 'Agreed Purchase Price:',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF001637)),
                                ),
                                Text(
                                  p.priceFormatted,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  isRent ? 'Security Deposit (2 Months Escrow):' : 'Token Reservation Deposit (10%):',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF44474E)),
                                ),
                                Text(
                                  isRent
                                      ? 'PKR ${(p.price * 2).toStringAsFixed(0)}'
                                      : 'PKR ${(p.price * 0.1).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Property Summary Mini Card
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FB),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE7E8EA)),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              p.imageUrl,
                              width: 52,
                              height: 52,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 52,
                                height: 52,
                                color: const Color(0xFFEDEFEF),
                                child: const Icon(Icons.home, color: Color(0xFF75777F)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: Color(0xFF001637)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  p.location,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF75777F)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // IF VIEWING MODE: Show Viewing Type Selector
                    if (_bookingMode == 'viewing') ...[
                      const Text('Viewing / Tour Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                      const SizedBox(height: 8),
                      ..._bookingTypes.map((type) {
                        final isSelected = _bookingTypeSlug == type['slug'];
                        return GestureDetector(
                          onTap: () => setState(() => _bookingTypeSlug = type['slug']!),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFE6F7F6) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? const Color(0xFF076A64) : const Color(0xFFE7E8EA),
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: isSelected ? const Color(0xFF076A64) : const Color(0xFF75777F),
                                  size: 18,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        type['name']!,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: isSelected ? const Color(0xFF076A64) : const Color(0xFF001637),
                                        ),
                                      ),
                                      Text(
                                        type['desc']!,
                                        style: const TextStyle(fontSize: 10.5, color: Color(0xFF75777F)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                      const SizedBox(height: 10),
                    ],

                    // DATES & DURATION CONFIGURATION
                    if (_bookingMode == 'booking' && isRent) ...[
                      // Rent Booking: Move-in Date & Stay Duration
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Move-in Date
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Move-in Date', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: _pickDate,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: const Color(0xFFE7E8EA)),
                                      borderRadius: BorderRadius.circular(8),
                                      color: const Color(0xFFF8F9FA),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.calendar_today, size: 14, color: Color(0xFF076A64)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            DateFormat('dd MMM yyyy').format(_selectedDate),
                                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 10),

                          // Stay / Tour Duration Dropdown
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Stay / Tour Duration', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: const Color(0xFFE7E8EA)),
                                    borderRadius: BorderRadius.circular(8),
                                    color: const Color(0xFFF8F9FA),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _isCustomDuration ? 'custom' : _leaseDuration,
                                      isExpanded: true,
                                      icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF076A64), size: 20),
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                      items: [
                                        ..._leaseOptions.map((opt) {
                                          final label = opt == 'custom' ? 'Enter Duration Manually' : opt;
                                          return DropdownMenuItem<String>(
                                            value: opt,
                                            child: Text(label, style: const TextStyle(fontSize: 11.5)),
                                          );
                                        }),
                                      ],
                                      onChanged: (val) {
                                        if (val == null) return;
                                        if (val == 'custom') {
                                          setState(() => _isCustomDuration = true);
                                        } else {
                                          setState(() {
                                            _isCustomDuration = false;
                                            _leaseDuration = val;
                                          });
                                        }
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      // Manual / Custom Duration Inputs (1 Day, 3 Days, custom days, etc.)
                      if (_isCustomDuration) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE6F7F6).withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFA1F1E9)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.edit_calendar, size: 16, color: Color(0xFF076A64)),
                                      SizedBox(width: 5),
                                      Text(
                                        'Manual Duration (Tour or Custom Stay)',
                                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                                      ),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _isCustomDuration = false;
                                        _leaseDuration = '1 Day';
                                      });
                                    },
                                    child: const Text(
                                      'Reset',
                                      style: TextStyle(fontSize: 10.5, color: Color(0xFF75777F), decoration: TextDecoration.underline),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  // Number Input
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Enter Number', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF44474E))),
                                        const SizedBox(height: 4),
                                        Container(
                                          height: 38,
                                          padding: const EdgeInsets.symmetric(horizontal: 10),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE7E8EA)),
                                          ),
                                          child: TextField(
                                            controller: _customDurationCtrl,
                                            keyboardType: TextInputType.number,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                            decoration: const InputDecoration(
                                              border: InputBorder.none,
                                              isDense: true,
                                              contentPadding: EdgeInsets.symmetric(vertical: 9),
                                            ),
                                            onChanged: (val) {
                                              final parsed = int.tryParse(val) ?? 1;
                                              setState(() => _customDurationValue = parsed < 1 ? 1 : parsed);
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Unit Dropdown
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Unit', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF44474E))),
                                        const SizedBox(height: 4),
                                        Container(
                                          height: 38,
                                          padding: const EdgeInsets.symmetric(horizontal: 10),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFFE7E8EA)),
                                          ),
                                          child: DropdownButtonHideUnderline(
                                            child: DropdownButton<String>(
                                              value: _customDurationUnit,
                                              isExpanded: true,
                                              icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF076A64), size: 18),
                                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                              items: const [
                                                DropdownMenuItem(value: 'days', child: Text('Days', style: TextStyle(fontSize: 11.5))),
                                                DropdownMenuItem(value: 'weeks', child: Text('Weeks', style: TextStyle(fontSize: 11.5))),
                                                DropdownMenuItem(value: 'months', child: Text('Months', style: TextStyle(fontSize: 11.5))),
                                                DropdownMenuItem(value: 'years', child: Text('Years', style: TextStyle(fontSize: 11.5))),
                                              ],
                                              onChanged: (val) {
                                                if (val != null) setState(() => _customDurationUnit = val);
                                              },
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Divider(height: 1, color: Color(0xFFA1F1E9)),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Stay: ${getEffectiveDurationText()}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                                  ),
                                  Text(
                                    'Departure: ${DateFormat('dd MMM yyyy').format(getCalculatedEndDate())}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        // Preset duration departure badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE6F7F6),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFA1F1E9)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Stay: $_leaseDuration',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                              ),
                              Text(
                                'Departure: ${DateFormat('dd MMM yyyy').format(getCalculatedEndDate())}',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF076A64)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ] else if (_bookingMode == 'booking' && !isRent) ...[
                      // Sale Booking: Closing Date
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Proposed Transfer / Closing Date', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: _pickDate,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                              decoration: BoxDecoration(
                                border: Border.all(color: const Color(0xFFE7E8EA)),
                                borderRadius: BorderRadius.circular(8),
                                color: const Color(0xFFF8F9FA),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today, size: 15, color: Color(0xFF076A64)),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormat('dd MMM yyyy').format(_selectedDate),
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      // Viewing Mode: Viewing Date & Preferred Slot
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Viewing Date
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Viewing Date', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: _pickDate,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: const Color(0xFFE7E8EA)),
                                      borderRadius: BorderRadius.circular(8),
                                      color: const Color(0xFFF8F9FA),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.calendar_today, size: 14, color: Color(0xFF076A64)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            DateFormat('dd MMM yyyy').format(_selectedDate),
                                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 10),

                          // Slot Dropdown
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Preferred Slot', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: const Color(0xFFE7E8EA)),
                                    borderRadius: BorderRadius.circular(8),
                                    color: const Color(0xFFF8F9FA),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _selectedSlot,
                                      isExpanded: true,
                                      icon: const Icon(Icons.schedule, color: Color(0xFF076A64), size: 18),
                                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                                      items: _timeSlots.map((slot) {
                                        return DropdownMenuItem<String>(
                                          value: slot,
                                          child: Text(slot, style: const TextStyle(fontSize: 11)),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        if (val != null) setState(() => _selectedSlot = val);
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 16),

                    // APPLICANT CONTACT INFORMATION
                    const Text('Applicant Contact Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF001637))),
                    const SizedBox(height: 8),

                    // Full Name
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Your Full Name',
                        prefixIcon: Icon(Icons.person_outline, size: 18),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(fontSize: 13),
                      validator: (val) => (val == null || val.trim().length < 3) ? 'Enter your full name' : null,
                    ),

                    const SizedBox(height: 10),

                    // Email Address
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email Address (receives confirmation)',
                        prefixIcon: Icon(Icons.email_outlined, size: 18),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(fontSize: 13),
                      validator: (val) => (val == null || !val.contains('@')) ? 'Enter a valid email address' : null,
                    ),

                    const SizedBox(height: 10),

                    // Phone Number
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone / WhatsApp Number',
                        prefixIcon: Icon(Icons.phone_outlined, size: 18),
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(fontSize: 13),
                      validator: (val) => (val == null || val.trim().length < 7) ? 'Enter your phone number' : null,
                    ),

                    const SizedBox(height: 10),

                    // Notes / Special Requests
                    TextFormField(
                      controller: _notesCtrl,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Special Instructions / Requirements (Optional)',
                        hintText: isRent
                            ? 'Number of family occupants, parking needs, or move-in notes...'
                            : 'Token transfer questions or closing requirements...',
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.all(12),
                      ),
                      style: const TextStyle(fontSize: 12),
                    ),

                    const SizedBox(height: 14),

                    // USER DECISION CONFIRMATION: YES OR NO (Exact website radio)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F7F6),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFA1F1E9)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Do you confirm this booking agreement?',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => setState(() => _userAnswer = 'yes'),
                                child: Row(
                                  children: [
                                    Radio<String>(
                                      value: 'yes',
                                      groupValue: _userAnswer,
                                      activeColor: const Color(0xFF076A64),
                                      onChanged: (val) => setState(() => _userAnswer = val ?? 'yes'),
                                    ),
                                    const Text(
                                      'YES — I agree & confirm',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF076A64),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),
                              GestureDetector(
                                onTap: () => setState(() => _userAnswer = 'no'),
                                child: Row(
                                  children: [
                                    Radio<String>(
                                      value: 'no',
                                      groupValue: _userAnswer,
                                      activeColor: const Color(0xFFBA1A1A),
                                      onChanged: (val) => setState(() => _userAnswer = val ?? 'no'),
                                    ),
                                    const Text(
                                      'NO — Cancel',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFBA1A1A),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (_userAnswer == 'no')
                            const Padding(
                              padding: EdgeInsets.only(top: 6),
                              child: Text(
                                'You selected NO. The property will not be booked and remains available.',
                                style: TextStyle(fontSize: 11, color: Color(0xFFBA1A1A), fontWeight: FontWeight.w600),
                              ),
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // TERMS CHECKBOX
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: Checkbox(
                            value: _agreedToTerms,
                            activeColor: const Color(0xFF076A64),
                            onChanged: (val) => setState(() => _agreedToTerms = val ?? true),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'I understand that reserving this property locks it in the system. Dual confirmation emails will be sent directly to both parties without requiring manual email link verification.',
                            style: TextStyle(fontSize: 11, color: Color(0xFF44474E), height: 1.35),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // SUBMIT BUTTON
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: (_isLoading || _userAnswer == 'no' || !_agreedToTerms)
                            ? null
                            : _handleBookingSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF076A64),
                          disabledBackgroundColor: Colors.grey[300],
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  ),
                                  SizedBox(width: 10),
                                  Text(
                                    'Registering & Dispatching Emails...',
                                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              )
                            : Text(
                                _bookingMode == 'booking'
                                    ? (isRent ? 'Confirm Lease & Dispatch Emails' : 'Confirm Purchase Token & Dispatch')
                                    : 'Confirm Viewing & Dispatch Emails',
                                style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.bold),
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

  void _handleBookingSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_userAnswer == 'no') return;

    setState(() => _isLoading = true);

    final appState = Provider.of<AppState>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final navigator = Navigator.of(context);

    final selectedTypeName = _bookingMode == 'booking'
        ? (widget.property.listingType.toLowerCase() == 'rent'
            ? 'Online Booking & Digital Lease'
            : 'Online Booking & Purchase Token')
        : _bookingTypes.firstWhere(
            (t) => t['slug'] == _bookingTypeSlug,
            orElse: () => _bookingTypes.first,
          )['name']!;

    final bookingTypeSlug = _bookingMode == 'booking'
        ? (widget.property.listingType.toLowerCase() == 'rent' ? 'rent_booking' : 'sale_booking')
        : _bookingTypeSlug;

    final formattedDate = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final formattedEndDate = DateFormat('yyyy-MM-dd').format(getCalculatedEndDate());
    final finalDuration = getEffectiveDurationText();

    try {
      final res = await appState.bookProperty(
        propertyId: widget.property.id,
        propertyTitle: widget.property.title,
        propertyLocation: widget.property.location,
        listingType: widget.property.listingType,
        price: widget.property.price,
        bookingDate: formattedDate,
        endDate: formattedEndDate,
        duration: finalDuration,
        bookingMode: _bookingMode,
        timeSlot: _selectedSlot,
        bookingTypeName: selectedTypeName,
        bookingTypeSlug: bookingTypeSlug,
        userName: _nameCtrl.text.trim(),
        userEmail: _emailCtrl.text.trim(),
        userPhone: _phoneCtrl.text.trim(),
        userId: auth.currentUser.id.isNotEmpty ? auth.currentUser.id : null,
        notes: _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
      );

      if (!mounted) return;

      navigator.pop(); // Close booking bottom sheet

      // Show celebratory confirmation dialog
      _showSuccessDialog(
        context,
        bookingId: res['bookingId'] ?? 'BK-CONFIRMED',
        userEmail: _emailCtrl.text.trim(),
        ownerEmail: res['ownerEmail'] ?? 'Owner',
        userEmailSent: res['userEmailSent'] ?? false,
        ownerEmailSent: res['ownerEmailSent'] ?? false,
        duration: finalDuration,
        endDate: formattedEndDate,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Booking registration error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showSuccessDialog(
    BuildContext context, {
    required String bookingId,
    required String userEmail,
    required String ownerEmail,
    required bool userEmailSent,
    required bool ownerEmailSent,
    required String duration,
    required String endDate,
  }) {
    final shortId = bookingId.length > 8 ? bookingId.substring(0, 8).toUpperCase() : bookingId.toUpperCase();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        contentPadding: const EdgeInsets.all(22),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFE6F7F6),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle, color: Color(0xFF076A64), size: 36),
            ),
            const SizedBox(height: 14),
            const Text(
              'Booking Confirmed!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF001637)),
            ),
            const SizedBox(height: 4),
            Text(
              'Reference ID: #$shortId',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF076A64), fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FB),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE7E8EA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timelapse, size: 16, color: Color(0xFF076A64)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Duration: $duration (until $endDate)',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF001637)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(userEmailSent ? Icons.mark_email_read : Icons.mail_outline, size: 16, color: const Color(0xFF076A64)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          userEmailSent ? 'Email sent to $userEmail' : 'Applicant notification logged',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(ownerEmailSent ? Icons.mark_email_read : Icons.mail_outline, size: 16, color: const Color(0xFF076A64)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          ownerEmailSent ? 'Email sent to owner ($ownerEmail)' : 'Owner notification logged',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Row(
                    children: [
                      Icon(Icons.shield_outlined, size: 16, color: Color(0xFF10B981)),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Property status: Reserved',
                          style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No further email confirmation action is required. Both parties have received full booking telemetry.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Color(0xFF75777F)),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF076A64),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: const Text('Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    ),
  );
  }
}
