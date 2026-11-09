import 'package:flutter/foundation.dart';

class ApiConstants {
  // Primary default base URL for Express backend
  // For Android emulator: 10.0.2.2, for web/iOS: localhost
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:5000';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';
  }

  // Supabase Cloud Configuration
  static const String supabaseUrl = 'https://zhaxrezorucqfdxwxvme.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_EieSlOPQetQvRD6igkpppA_DasiapBf';

  // API endpoints
  static const String health = '/api/health';
  static const String roles = '/api/roles';
  static const String users = '/api/users';
  static const String login = '/api/users/login';
  static const String register = '/api/users/register';
  static const String properties = '/api/properties';
  static const String upload = '/api/upload';
  static const String complaints = '/api/complaints';
  static const String chat = '/api/chatsmessage';
  static const String agreement = '/api/agreement';
}
