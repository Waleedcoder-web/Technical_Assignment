class PropertyModel {
  final String id;
  final String title;
  final String description;
  final String propertyType; // 'apartments', 'villas', 'flats', 'plots', 'commercial'
  final String listingType;  // 'rent', 'sale'
  final double price;
  final String priceFormatted;
  final String? pricePeriod;
  final double areaValue;
  final String areaUnit;
  final int beds;
  final int baths;
  final String location;
  final String address;
  final String city;
  final String status;
  final String imageUrl;
  final List<String> images;
  final bool verified;
  final bool featured;
  final List<String> amenities;
  final int walkScore;
  final String agentName;
  final String agentPhone;
  final String agentRole;
  final double agentRating;
  bool isFavorite;

  PropertyModel({
    required this.id,
    required this.title,
    required this.description,
    required this.propertyType,
    required this.listingType,
    required this.price,
    required this.priceFormatted,
    this.pricePeriod,
    required this.areaValue,
    required this.areaUnit,
    required this.beds,
    required this.baths,
    required this.location,
    this.address = '',
    required this.city,
    this.status = 'available',
    required this.imageUrl,
    this.images = const [],
    this.verified = true,
    this.featured = false,
    this.amenities = const [],
    this.walkScore = 94,
    this.agentName = 'Farhan Malik',
    this.agentPhone = '+92 300 0000000',
    this.agentRole = 'HavenKey Principal Asset Manager',
    this.agentRating = 4.92,
    this.isFavorite = false,
  });

  bool get isReserved => status.toLowerCase() == 'reserved' || status.toLowerCase() == 'not available';

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    final rawPrice = json['price'];
    final double numPrice = rawPrice is num
        ? rawPrice.toDouble()
        : double.tryParse(rawPrice?.toString().replaceAll(RegExp(r'[^0-9.]'), '') ?? '0') ?? 0;

    final rawArea = json['area_value'] ?? json['area'];
    final double numArea = rawArea is num
        ? rawArea.toDouble()
        : double.tryParse(rawArea?.toString().replaceAll(RegExp(r'[^0-9.]'), '') ?? '10') ?? 10;

    final pType = (json['property_type'] ?? json['category'] ?? 'apartments').toString().toLowerCase();
    final lType = (json['listing_type'] ?? json['transactionType'] ?? 'rent').toString().toLowerCase();

    final List<String> imgList = [];
    if (json['images'] is List) {
      for (final item in json['images']) {
        if (item != null && item.toString().isNotEmpty && !item.toString().contains('localhost')) {
          imgList.add(item.toString());
        }
      }
    }
    String safeImg = (json['image_url'] ?? json['imageUrl'] ?? '').toString();
    if (safeImg.isEmpty || safeImg.contains('localhost')) {
      if (imgList.isNotEmpty) {
        safeImg = imgList.first;
      } else if (pType.contains('villa') || pType.contains('house')) {
        safeImg = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80';
      } else if (pType.contains('plot')) {
        safeImg = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';
      } else if (pType.contains('commercial')) {
        safeImg = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
      } else {
        safeImg = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
      }
    }
    if (imgList.isEmpty) {
      imgList.add(safeImg);
    }

    final addrStr = (json['address'] ?? '').toString();
    final locStr = (json['location'] ?? (addrStr.isNotEmpty ? addrStr : 'Lahore, Pakistan')).toString();
    final cityStr = json['city'] ?? (locStr.toLowerCase().contains('lahore') || addrStr.toLowerCase().contains('lahore') ? 'Lahore' : (locStr.toLowerCase().contains('karachi') || addrStr.toLowerCase().contains('karachi') ? 'Karachi' : 'Islamabad'));

    return PropertyModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Luxury Haven Property',
      description: json['description'] ?? 'Verified premium real estate in prime location.',
      propertyType: pType,
      listingType: lType,
      price: numPrice,
      priceFormatted: json['priceFormatted'] ?? 'PKR ${numPrice.toStringAsFixed(0)}',
      pricePeriod: json['pricePeriod'] ?? (lType == 'sale' ? null : '/ mo'),
      areaValue: numArea,
      areaUnit: json['area_unit'] ?? 'Marla',
      beds: json['bedroom'] ?? json['beds'] ?? 3,
      baths: json['bathroom'] ?? json['baths'] ?? 3,
      location: locStr,
      address: addrStr,
      city: cityStr.toString(),
      status: json['status'] ?? 'available',
      imageUrl: safeImg,
      images: imgList,
      verified: json['verified'] ?? true,
      featured: json['featured'] ?? false,
      amenities: json['amenities'] is List
          ? List<String>.from(json['amenities'])
          : ['24/7 Power Backup', 'Smart RFID Lock', 'Heated Pool', 'Technogym Studio'],
      walkScore: json['walkScore'] ?? 94,
      agentName: json['agentName'] ?? 'Farhan Malik',
      agentPhone: json['agentPhone'] ?? '+92 300 0000000',
      agentRole: json['agentRole'] ?? 'HavenKey Principal Asset Manager',
      agentRating: (json['agentRating'] is num) ? (json['agentRating'] as num).toDouble() : 4.92,
      isFavorite: false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'property_type': propertyType,
      'listing_type': listingType,
      'price': price,
      'priceFormatted': priceFormatted,
      'area_value': areaValue,
      'area_unit': areaUnit,
      'bedroom': beds,
      'bathroom': baths,
      'location': location,
      'city': city,
      'status': status,
      'image_url': imageUrl,
      'images': images,
      'verified': verified,
      'featured': featured,
    };
  }
}
