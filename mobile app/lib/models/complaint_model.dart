class ComplaintModel {
  final String id;
  final String title;
  final String description;
  final String category;
  final String priority;
  String status; // 'pending', 'in_progress', 'resolved'
  final String propertyTitle;
  final String? assignedVendor;
  final String? technicianName;
  final String? technicianPhone;
  final double progressPercent;
  final String createdAt;
  final String? userId;
  final String? userEmail;
  final String? userName;

  ComplaintModel({
    required this.id,
    required this.title,
    required this.description,
    this.category = 'general',
    this.priority = 'high',
    this.status = 'pending',
    required this.propertyTitle,
    this.assignedVendor,
    this.technicianName,
    this.technicianPhone,
    this.progressPercent = 0.3,
    required this.createdAt,
    this.userId,
    this.userEmail,
    this.userName,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    String category = json['category'] ?? 'General / Maintenance';
    String desc = json['description'] ?? '';
    final catMatch = RegExp(r'^\[Category:\s*([^\]]+)\]\s*(.*)').firstMatch(desc);
    if (catMatch != null) {
      category = catMatch.group(1) ?? category;
      desc = catMatch.group(2) ?? desc;
    }

    String propTitle = 'Margalla Ridge Residence';
    if (json['properties'] is Map) {
      propTitle = json['properties']['title'] ?? propTitle;
    } else if (json['property_title'] != null) {
      propTitle = json['property_title'];
    } else if (json['propertyTitle'] != null) {
      propTitle = json['propertyTitle'];
    }

    String? uEmail;
    String? uId = json['user_id']?.toString() ?? json['userId']?.toString();
    String? uName;
    if (json['users'] is Map) {
      uEmail = json['users']['email'];
      uName = json['users']['fullname'];
    }
    if (json['user_email'] != null) uEmail = json['user_email'];
    if (json['userEmail'] != null) uEmail = json['userEmail'];
    if (json['user_name'] != null) uName = json['user_name'];
    if (json['userName'] != null) uName = json['userName'];

    return ComplaintModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Maintenance Request',
      description: desc,
      category: category,
      priority: json['priority'] ?? 'high',
      status: json['status'] ?? 'pending',
      propertyTitle: propTitle,
      assignedVendor: json['assigned_vendor'] ?? json['assignedVendor'] ?? 'Facility Ops Team',
      technicianName: json['technician_name'] ?? json['technicianName'],
      technicianPhone: json['technician_phone'] ?? json['technicianPhone'],
      progressPercent: (json['progress_percent'] is num)
          ? (json['progress_percent'] as num).toDouble()
          : 0.5,
      createdAt: json['created_at'] ?? json['createdAt'] ?? 'Just now',
      userId: uId,
      userEmail: uEmail,
      userName: uName,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'status': status,
      'priority': priority,
      'userId': userId,
      'userEmail': userEmail,
      'userName': userName,
    };
  }
}
