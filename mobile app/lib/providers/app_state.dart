import 'package:flutter/material.dart';
import '../models/property_model.dart';
import '../models/complaint_model.dart';
import '../models/chat_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/ai_service.dart';
import '../services/mock_data.dart';

class AppState extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final AiService _aiService = AiService();

  bool _isAiTyping = false;
  bool get isAiTyping => _isAiTyping;

  int _currentTabIndex = 0;
  int get currentTabIndex => _currentTabIndex;

  String _selectedCity = 'All Cities';
  String get selectedCity => _selectedCity;

  String _listingType = 'all'; // 'all', 'rent' or 'sale'
  String get listingType => _listingType;

  String? _selectedCategory;
  String? get selectedCategory => _selectedCategory;

  double? _maxPrice;
  double? get maxPrice => _maxPrice;

  String _searchQuery = '';
  String get searchQuery => _searchQuery;

  List<PropertyModel> _properties = [];
  List<PropertyModel> get properties => _properties;

  final Set<String> _savedPropertyIds = {};
  Set<String> get savedPropertyIds => _savedPropertyIds;

  final Set<String> _userBookedPropertyIds = {};
  Set<String> get userBookedPropertyIds => _userBookedPropertyIds;

  List<ComplaintModel> _complaints = [];
  List<ComplaintModel> get complaints => _complaints;

  List<ChatModel> _chatMessages = [];
  List<ChatModel> get chatMessages => _chatMessages;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  AppState() {
    _initData();
  }

  void _initData() {
    _complaints = [];
    _chatMessages = List.from(MockData.initialChatMessages);
    refreshProperties();
    refreshComplaints();
  }

  Future<void> refreshComplaints() async {
    try {
      final list = await _apiService.getComplaints();
      _complaints = list;
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing complaints: $e');
    }
  }

  Future<void> fetchUserBookings({required String userId, required String userEmail}) async {
    if (userId.trim().isEmpty && userEmail.trim().isEmpty) {
      _userBookedPropertyIds.clear();
      notifyListeners();
      return;
    }
    try {
      final bookedIds = await _apiService.getUserBookedPropertyIds(
        userId: userId,
        userEmail: userEmail,
      );
      _userBookedPropertyIds.clear();
      _userBookedPropertyIds.addAll(bookedIds);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching user bookings: $e');
    }
  }

  void clearUserData() {
    _userBookedPropertyIds.clear();
    _complaints.clear();
    notifyListeners();
  }

  void setTabIndex(int index) {
    _currentTabIndex = index;
    notifyListeners();
  }

  void setCity(String city) {
    _selectedCity = city;
    notifyListeners();
    refreshProperties();
  }

  void setListingType(String type) {
    _listingType = type;
    notifyListeners();
    refreshProperties();
  }

  void setCategory(String? cat) {
    _selectedCategory = cat;
    notifyListeners();
    refreshProperties();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
    refreshProperties();
  }

  void setPriceFilter(double? max) {
    _maxPrice = max;
    notifyListeners();
    refreshProperties();
  }

  void resetFilters() {
    _selectedCategory = null;
    _maxPrice = null;
    _searchQuery = '';
    notifyListeners();
    refreshProperties();
  }

  Future<void> refreshProperties() async {
    _isLoading = true;
    notifyListeners();

    final result = await _apiService.getProperties(
      city: _selectedCity,
      category: _selectedCategory,
      type: _listingType,
      maxPrice: _maxPrice,
      search: _searchQuery,
    );

    _properties = result;
    _isLoading = false;
    notifyListeners();
  }

  Future<PropertyModel> createProperty(Map<String, dynamic> data) async {
    final created = await _apiService.createProperty(data);
    _properties.insert(0, created);
    notifyListeners();
    return created;
  }

  Future<PropertyModel> updateProperty(String id, Map<String, dynamic> data) async {
    final updated = await _apiService.updateProperty(id, data);
    final idx = _properties.indexWhere((p) => p.id == id);
    if (idx != -1) {
      _properties[idx] = updated;
    } else {
      _properties.insert(0, updated);
    }
    notifyListeners();
    return updated;
  }

  Future<void> deleteProperty(String id) async {
    await _apiService.deleteProperty(id);
    _properties.removeWhere((p) => p.id == id);
    notifyListeners();
  }

  Future<Map<String, dynamic>> bookProperty({
    required String propertyId,
    required String propertyTitle,
    required String propertyLocation,
    required String listingType,
    required double price,
    required String bookingDate,
    required String timeSlot,
    required String bookingTypeName,
    required String bookingTypeSlug,
    required String userName,
    required String userEmail,
    required String userPhone,
    String? duration,
    String? endDate,
    String? bookingMode,
    String? userId,
    String? notes,
  }) async {
    final result = await _apiService.bookProperty(
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      propertyLocation: propertyLocation,
      listingType: listingType,
      price: price,
      bookingDate: bookingDate,
      endDate: endDate,
      duration: duration,
      bookingMode: bookingMode,
      timeSlot: timeSlot,
      bookingTypeName: bookingTypeName,
      bookingTypeSlug: bookingTypeSlug,
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone,
      userId: userId,
      notes: notes,
    );

    // Update local status to 'not available'
    final idx = _properties.indexWhere((p) => p.id == propertyId);
    if (idx != -1) {
      final old = _properties[idx];
      _properties[idx] = PropertyModel(
        id: old.id,
        title: old.title,
        description: old.description,
        propertyType: old.propertyType,
        listingType: old.listingType,
        price: old.price,
        priceFormatted: old.priceFormatted,
        pricePeriod: old.pricePeriod,
        areaValue: old.areaValue,
        areaUnit: old.areaUnit,
        beds: old.beds,
        baths: old.baths,
        location: old.location,
        address: old.address,
        city: old.city,
        status: 'reserved',
        imageUrl: old.imageUrl,
        images: old.images,
        verified: old.verified,
        featured: old.featured,
        amenities: old.amenities,
        walkScore: old.walkScore,
        agentName: old.agentName,
        agentPhone: old.agentPhone,
        agentRole: old.agentRole,
        agentRating: old.agentRating,
        isFavorite: old.isFavorite,
      );
      _userBookedPropertyIds.add(propertyId);
      notifyListeners();
    } else {
      _userBookedPropertyIds.add(propertyId);
      notifyListeners();
    }

    return result;
  }

  void toggleFavorite(String propertyId) {
    if (_savedPropertyIds.contains(propertyId)) {
      _savedPropertyIds.remove(propertyId);
    } else {
      _savedPropertyIds.add(propertyId);
    }
    notifyListeners();
  }

  bool isFavorite(String propertyId) => _savedPropertyIds.contains(propertyId);

  List<PropertyModel> get savedProperties {
    return _properties.where((p) => _savedPropertyIds.contains(p.id)).toList();
  }

  Future<void> sendChatMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    final now = DateTime.now();
    final hour = now.hour > 12 ? now.hour - 12 : (now.hour == 0 ? 12 : now.hour);
    final period = now.hour >= 12 ? 'PM' : 'AM';
    final minute = now.minute.toString().padLeft(2, '0');
    final timeStr = '$hour:$minute $period';

    final userMsg = ChatModel(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      sender: 'user',
      text: trimmed,
      timestamp: timeStr,
    );
    _chatMessages.add(userMsg);
    _isAiTyping = true;
    notifyListeners();

    try {
      final aiReply = await _aiService.processQuery(
        trimmed,
        history: _chatMessages,
        allProperties: _properties,
      );
      _chatMessages.add(aiReply);
    } catch (e) {
      _chatMessages.add(
        ChatModel(
          id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
          sender: 'ai',
          text: 'An error occurred while analyzing real estate parameters: $e',
          timestamp: timeStr,
        ),
      );
    } finally {
      _isAiTyping = false;
      notifyListeners();
    }
  }

  void clearChat() {
    _aiService.resetSession();
    _chatMessages = [
      ChatModel(
        id: 'init-${DateTime.now().millisecondsSinceEpoch}',
        sender: 'ai',
        text: 'Conversation cleared. How can I assist your property search or legal lease verification today?',
        timestamp: 'Just now',
      ),
    ];
    notifyListeners();
  }

  List<PropertyModel> get reservedProperties {
    return _properties.where((p) => p.isReserved).toList();
  }

  // Scoped strictly to the specific user:
  // - Tenants / Regular users ONLY see the properties they have personally booked / leased
  // - Admins / Ops see all reserved properties across the system
  List<PropertyModel> getReservedPropertiesForUser(UserModel user, bool isOps) {
    if (isOps) {
      return _properties.where((p) => p.isReserved).toList();
    }
    return _properties.where((p) => _userBookedPropertyIds.contains(p.id)).toList();
  }

  Future<bool> unreserveProperty({
    required String propertyId,
    required String propertyTitle,
    required String ownerName,
    required String ownerEmail,
    required String userName,
    required String userEmail,
    required String userPhone,
    required String departureDate,
    required String reason,
    String? userId,
    bool isAutomatic = false,
  }) async {
    final success = await _apiService.unreserveProperty(
      propertyId: propertyId,
      propertyTitle: propertyTitle,
      ownerName: ownerName,
      ownerEmail: ownerEmail,
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone,
      departureDate: departureDate,
      reason: reason,
      userId: userId,
      isAutomatic: isAutomatic,
    );

    // Update local status back to 'available'
    const legacyMap = {
      'prop-lumina-karachi': 'a1000000-0000-0000-0000-000000000001',
      'prop-meadowbrook-lahore': 'a1000000-0000-0000-0000-000000000002',
      'prop-margalla-ridge-isb': 'a1000000-0000-0000-0000-000000000003',
      'prop-serena-courtyard-isb': 'a1000000-0000-0000-0000-000000000004',
      'prop-skyline-apartment-lahore': 'a1000000-0000-0000-0000-000000000005',
      'prop-commercial-bahria-rwp': 'a1000000-0000-0000-0000-000000000006',
      'prop-greenview-penthouse-isb': 'a1000000-0000-0000-0000-000000000007',
    };
    final resolvedPropertyId = legacyMap[propertyId] ?? propertyId;
    _userBookedPropertyIds.remove(propertyId);
    _userBookedPropertyIds.remove(resolvedPropertyId);

    final idx = _properties.indexWhere((p) => p.id == propertyId || p.id == resolvedPropertyId);
    if (idx != -1) {
      final old = _properties[idx];
      _properties[idx] = PropertyModel(
        id: old.id,
        title: old.title,
        description: old.description,
        propertyType: old.propertyType,
        listingType: old.listingType,
        price: old.price,
        priceFormatted: old.priceFormatted,
        pricePeriod: old.pricePeriod,
        areaValue: old.areaValue,
        areaUnit: old.areaUnit,
        beds: old.beds,
        baths: old.baths,
        location: old.location,
        address: old.address,
        city: old.city,
        status: 'available',
        imageUrl: old.imageUrl,
        images: old.images,
        verified: old.verified,
        featured: old.featured,
        amenities: old.amenities,
        walkScore: old.walkScore,
        agentName: old.agentName,
        agentPhone: old.agentPhone,
        agentRole: old.agentRole,
        agentRating: old.agentRating,
        isFavorite: old.isFavorite,
      );
      notifyListeners();
    } else {
      notifyListeners();
    }

    return success;
  }

  Future<ComplaintModel> addComplaint({
    required String title,
    required String description,
    required String category,
    required String propertyTitle,
    String? propertyId,
    String? userId,
    String? userName,
    String? userEmail,
    String? userPhone,
    String? ownerName,
    String? ownerEmail,
  }) async {
    final complaint = await _apiService.createComplaint(
      title: title,
      description: description,
      category: category,
      propertyTitle: propertyTitle,
      propertyId: propertyId,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone,
      ownerName: ownerName,
      ownerEmail: ownerEmail,
    );
    _complaints.insert(0, complaint);
    notifyListeners();
    return complaint;
  }

  Future<void> resolveComplaint(String id) async {
    final idx = _complaints.indexWhere((c) => c.id == id);
    if (idx != -1) {
      _complaints[idx].status = 'resolved';
      await _apiService.updateComplaintStatus(id, 'resolved');
      notifyListeners();
    }
  }
}
