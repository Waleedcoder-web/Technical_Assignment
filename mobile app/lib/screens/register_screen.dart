import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/auth_provider.dart';
import '../providers/app_state.dart';
import 'login_screen.dart';
import 'main_shell.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _cnicController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _consentSbp = true;

  // Password Strength Checkers
  bool get _hasMinLength => _passwordController.text.length >= 8;
  bool get _hasNumber => RegExp(r'[0-9]').hasMatch(_passwordController.text);
  bool get _hasUpper => RegExp(r'[A-Z]').hasMatch(_passwordController.text);
  bool get _hasSpecial => RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(_passwordController.text);

  int get _strengthScore {
    int s = 0;
    if (_hasMinLength) s++;
    if (_hasNumber) s++;
    if (_hasUpper) s++;
    if (_hasSpecial) s++;
    return s;
  }

  void _formatCnic(String value) {
    String digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 13) digits = digits.substring(0, 13);

    String formatted = '';
    if (digits.length > 5) {
      formatted += '${digits.substring(0, 5)}-';
      if (digits.length > 12) {
        formatted += '${digits.substring(5, 12)}-${digits.substring(12, 13)}';
      } else {
        formatted += digits.substring(5);
      }
    } else {
      formatted = digits;
    }

    _cnicController.value = TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Navigation & Institutional Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                    onPressed: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      }
                    },
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified_user, color: AppColors.secondary, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Institutional Identity Portal',
                          style: TextStyle(
                            color: AppColors.onSurfaceVariant,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'VERIFIED ONBOARDING',
                  style: TextStyle(color: AppColors.secondary, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 6),
              Text('Create your HavenKey account', style: AppTypography.headlineLarge.copyWith(fontSize: 23)),
              const SizedBox(height: 4),
              Text(
                'Join Pakistan\'s premier verified real estate network for seamless leasing, escrow-backed rent protection, and sovereign digital property management.',
                style: AppTypography.bodySmall,
              ),

              const SizedBox(height: 16),

              // Full Legal Name
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Full Legal Name', style: AppTypography.labelMedium),
                  Text('As per CNIC', style: AppTypography.labelSmall),
                ],
              ),
              const SizedBox(height: 6),
              _CustomInputField(
                controller: _nameController,
                icon: Icons.badge_outlined,
                hint: 'e.g. Tariq Mehmood Siddiqui',
              ),

              const SizedBox(height: 12),

              // Email Address
              Text('Work / Personal Email', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              _CustomInputField(
                controller: _emailController,
                icon: Icons.alternate_email,
                hint: 'name@domain.pk',
                keyboardType: TextInputType.emailAddress,
              ),

              const SizedBox(height: 12),

              // Mobile Number
              Text('Mobile Number (Optional)', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: const Row(
                        children: [
                          Text('🇵🇰', style: TextStyle(fontSize: 16)),
                          SizedBox(width: 4),
                          Text('+92', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          hintText: '300 1234567',
                          hintStyle: TextStyle(fontSize: 13, color: AppColors.outline),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        style: const TextStyle(fontSize: 14, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // CNIC Input
              Text('CNIC / Smart National ID', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
                ),
                child: TextField(
                  controller: _cnicController,
                  keyboardType: TextInputType.number,
                  onChanged: _formatCnic,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.credit_card, color: AppColors.onSurfaceVariant, size: 20),
                    suffixIcon: _cnicController.text.length == 15
                        ? const Icon(Icons.check_circle, color: AppColors.secondary, size: 18)
                        : null,
                    hintText: '42101-1234567-1',
                    hintStyle: const TextStyle(fontSize: 13, color: AppColors.outline),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  style: const TextStyle(fontSize: 14, color: AppColors.primary, letterSpacing: 0.5),
                ),
              ),

              const SizedBox(height: 14),

              // Password & Strength Meter
              Text('Master Password', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
                ),
                child: TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.lock_outline, color: AppColors.onSurfaceVariant, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: AppColors.onSurfaceVariant,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    hintText: 'Enter secure passphrase',
                    hintStyle: const TextStyle(fontSize: 13, color: AppColors.outline),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  style: const TextStyle(fontSize: 14, color: AppColors.primary),
                ),
              ),

              const SizedBox(height: 8),

              // Multi-segment Strength Meter
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Vault Strength', style: AppTypography.labelSmall),
                        Text(
                          _strengthScore == 4
                              ? 'Strong'
                              : (_strengthScore >= 2 ? 'Moderate' : 'Weak'),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _strengthScore >= 3 ? AppColors.secondary : AppColors.outline,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: List.generate(4, (i) {
                        final filled = i < _strengthScore;
                        return Expanded(
                          child: Container(
                            margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                            height: 4,
                            decoration: BoxDecoration(
                              color: filled ? AppColors.secondary : AppColors.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _CriteriaItem(label: '8+ Characters', satisfied: _hasMinLength),
                        _CriteriaItem(label: 'Numeric Digits', satisfied: _hasNumber),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _CriteriaItem(label: 'Uppercase Letter', satisfied: _hasUpper),
                        _CriteriaItem(label: 'Special Symbol', satisfied: _hasSpecial),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Confirm Password
              Text('Confirm Master Password', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              _CustomInputField(
                controller: _confirmPasswordController,
                icon: Icons.lock_reset,
                hint: 'Repeat passphrase',
                obscureText: true,
              ),

              const SizedBox(height: 14),

              // Terms & Escrow Consent
              CheckboxListTile(
                value: _consentSbp,
                contentPadding: EdgeInsets.zero,
                activeColor: AppColors.secondary,
                controlAffinity: ListTileControlAffinity.leading,
                title: Text(
                  'I agree to the Terms of Service, Privacy Policy, and verified tenancy escrow regulations.',
                  style: AppTypography.bodySmall.copyWith(fontSize: 11),
                ),
                onChanged: (val) => setState(() => _consentSbp = val ?? true),
              ),

              const SizedBox(height: 16),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: auth.isLoading ? null : () => _handleRegister(auth),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: auth.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Create Account & Continue', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 14),

              // Already have account
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Already have a HavenKey account?', style: AppTypography.bodySmall),
                    TextButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      child: const Text('Sign In', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleRegister(AuthProvider auth) async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your full legal name.')));
      return;
    }
    if (_emailController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid email address.')));
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match.')));
      return;
    }

    final success = await auth.register(
      fullname: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phoneNo: _phoneController.text.trim().isNotEmpty ? '+92 ${_phoneController.text.trim()}' : '',
      cnic: _cnicController.text.trim().isNotEmpty ? _cnicController.text.trim() : '',
      password: _passwordController.text,
      address: 'Pakistan',
      postalCode: '44000',
      role: 'tenant',
    );

    if (success && mounted) {
      final appState = Provider.of<AppState>(context, listen: false);
      appState.setTabIndex(0);
      await appState.fetchUserBookings(
        userId: auth.currentUser.id,
        userEmail: auth.currentUser.email,
      );
      await appState.refreshComplaints();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Account created successfully in Supabase! Welcome to HavenKey.'),
          backgroundColor: AppColors.secondary,
        ),
      );
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const MainShell()),
        );
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage ?? 'Registration failed. Please check your connection and try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}

class _CriteriaItem extends StatelessWidget {
  final String label;
  final bool satisfied;

  const _CriteriaItem({required this.label, required this.satisfied});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          satisfied ? Icons.check_circle : Icons.circle_outlined,
          color: satisfied ? AppColors.secondary : AppColors.outline,
          size: 13,
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10.5,
            color: satisfied ? AppColors.secondary : AppColors.onSurfaceVariant,
            fontWeight: satisfied ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

class _CustomInputField extends StatelessWidget {
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final bool obscureText;
  final TextInputType? keyboardType;

  const _CustomInputField({
    required this.controller,
    required this.icon,
    required this.hint,
    this.obscureText = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: AppColors.onSurfaceVariant, size: 20),
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 13, color: AppColors.outline),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
        style: const TextStyle(fontSize: 14, color: AppColors.primary),
      ),
    );
  }
}
