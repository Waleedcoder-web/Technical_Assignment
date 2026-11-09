import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  UserModel _currentUser = UserModel.empty();
  UserModel get currentUser => _currentUser;

  bool _isAuthenticated = false;
  bool get isAuthenticated => _isAuthenticated;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String _activeRole = 'tenant';
  String get activeRole => _activeRole;
  bool get isOps => _activeRole == 'admin' || _activeRole == 'operations';

  void setActiveRole(String role) {
    _activeRole = role;
    notifyListeners();
  }

  Future<bool> login({
    required String identifier,
    required String password,
    String? role,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _apiService.login(
        identifier: identifier,
        password: password,
        role: role ?? _activeRole,
      );
      _currentUser = user;
      _isAuthenticated = true;
      _activeRole = user.role;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullname,
    required String email,
    required String phoneNo,
    required String cnic,
    required String password,
    required String address,
    required String postalCode,
    String role = 'tenant',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _apiService.register(
        fullname: fullname,
        email: email,
        phoneNo: phoneNo,
        cnic: cnic,
        password: password,
        address: address,
        postalCode: postalCode,
        role: role,
      );
      _currentUser = user;
      _isAuthenticated = true;
      _activeRole = user.role;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }


  void logout() {
    _isAuthenticated = false;
    _currentUser = UserModel.empty();
    _activeRole = 'tenant';
    notifyListeners();
  }
}
