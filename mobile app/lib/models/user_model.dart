class UserModel {
  final String id;
  final String fullname;
  final String email;
  final String phoneNo;
  final String cnic;
  final String address;
  final String postalCode;
  final String role; // 'tenant', 'landlord', 'admin' / 'operations'
  final bool isVerified;
  final String? token;

  UserModel({
    required this.id,
    required this.fullname,
    required this.email,
    required this.phoneNo,
    required this.cnic,
    required this.address,
    required this.postalCode,
    required this.role,
    this.isVerified = true,
    this.token,
  });

  factory UserModel.empty() {
    return UserModel(
      id: '',
      fullname: '',
      email: '',
      phoneNo: '',
      cnic: '',
      address: '',
      postalCode: '',
      role: 'tenant',
      isVerified: false,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      fullname: json['fullname'] ?? json['name'] ?? 'HavenKey User',
      email: json['email'] ?? '',
      phoneNo: json['phone_no'] ?? json['phone'] ?? '',
      cnic: json['CNIC'] ?? json['cnic'] ?? '',
      address: json['adress'] ?? json['address'] ?? '',
      postalCode: json['postal_code'] ?? '44000',
      role: json['role'] ?? 'tenant',
      isVerified: json['isVerified'] ?? true,
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullname': fullname,
      'name': fullname,
      'email': email,
      'phone_no': phoneNo,
      'phone': phoneNo,
      'CNIC': cnic,
      'cnic': cnic,
      'adress': address,
      'postal_code': postalCode,
      'role': role,
      'isVerified': isVerified,
    };
  }

  bool get isAdmin => role == 'admin' || role == 'operations';
  bool get isLandlord => role == 'landlord';
  bool get isTenant => role == 'tenant';
}
