class AgreementModel {
  final String id;
  final String propertyTitle;
  final String propertyLocation;
  final String landlordName;
  final String tenantName;
  final double monthlyRent;
  final String monthlyRentFormatted;
  final double securityDeposit;
  final String securityDepositFormatted;
  final String startDate;
  final String endDate;
  final String nextDueDate;
  final int daysRemaining;
  final String status;
  final bool isEscrowProtected;
  final bool raastAutoDebit;
  final String raastBank;

  AgreementModel({
    required this.id,
    required this.propertyTitle,
    required this.propertyLocation,
    required this.landlordName,
    required this.tenantName,
    required this.monthlyRent,
    required this.monthlyRentFormatted,
    required this.securityDeposit,
    required this.securityDepositFormatted,
    required this.startDate,
    required this.endDate,
    required this.nextDueDate,
    this.daysRemaining = 12,
    this.status = 'active',
    this.isEscrowProtected = true,
    this.raastAutoDebit = true,
    this.raastBank = 'HBL •••• 4092',
  });

  factory AgreementModel.fromJson(Map<String, dynamic> json) {
    final rent = (json['monthly_rent'] ?? json['monthlyRent'] ?? 320000) as num;
    final deposit = (json['security_deposit'] ?? json['depositEscrow'] ?? rent * 2) as num;

    return AgreementModel(
      id: json['id']?.toString() ?? 'AGR-PK-2025-8841',
      propertyTitle: json['property_title'] ?? json['propertyTitle'] ?? 'Margalla Ridge • Residence 4B',
      propertyLocation: json['property_location'] ?? json['propertyLocation'] ?? 'Sector F-10, Islamabad',
      landlordName: json['landlord_name'] ?? json['landlordName'] ?? 'Imran Mansoor',
      tenantName: json['tenant_name'] ?? json['tenantName'] ?? 'Amina Tariq',
      monthlyRent: rent.toDouble(),
      monthlyRentFormatted: json['monthlyRentFormatted'] ?? 'PKR ${rent.toStringAsFixed(0)}',
      securityDeposit: deposit.toDouble(),
      securityDepositFormatted: json['depositEscrowFormatted'] ?? 'PKR ${deposit.toStringAsFixed(0)}',
      startDate: json['start_date'] ?? json['startDate'] ?? '01 Sep 2024',
      endDate: json['end_date'] ?? json['endDate'] ?? '31 Aug 2026',
      nextDueDate: json['nextDueDate'] ?? '1st Proximum',
      daysRemaining: json['daysRemaining'] ?? 12,
      status: json['status'] ?? 'active',
      isEscrowProtected: json['isEscrowProtected'] ?? true,
      raastAutoDebit: json['raastAutoDebit'] ?? true,
      raastBank: json['raastBank'] ?? 'HBL •••• 4092',
    );
  }
}
