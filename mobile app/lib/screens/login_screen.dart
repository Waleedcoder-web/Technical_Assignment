import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/auth_provider.dart';
import '../providers/app_state.dart';
import 'main_shell.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _idController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberDevice = true;

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
              // Top Bar Nav
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
                  Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.vpn_key, color: AppColors.secondaryFixed, size: 16),
                      ),
                      const SizedBox(width: 6),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(text: 'Haven', style: AppTypography.titleMedium.copyWith(fontSize: 18)),
                            TextSpan(text: 'Key', style: AppTypography.titleMedium.copyWith(fontSize: 18, color: AppColors.secondary)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.help_outline, color: AppColors.onSurfaceVariant),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('HavenKey 24/7 Helpline: 051-8889900')),
                      );
                    },
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Editorial Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'SECURE & SBP COMPLIANT',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text('Welcome back to HavenKey', style: AppTypography.headlineLarge.copyWith(fontSize: 24)),
              const SizedBox(height: 4),
              Text(
                'Access your property portfolio, digital lease agreements, and verified services.',
                style: AppTypography.bodySmall,
              ),

              const SizedBox(height: 20),

              // Identifier Input
              Text('Email, Mobile, or CNIC', style: AppTypography.labelMedium),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
                ),
                child: TextField(
                  controller: _idController,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.badge_outlined, color: AppColors.onSurfaceVariant, size: 20),
                    hintText: '42101-XXXXXXX-X or name@domain.pk',
                    hintStyle: TextStyle(fontSize: 13, color: AppColors.outline),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  style: const TextStyle(fontSize: 14, color: AppColors.primary),
                ),
              ),

              const SizedBox(height: 14),

              // Password Input
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Password', style: AppTypography.labelMedium),
                  TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Password recovery link sent to registered phone/email.')),
                      );
                    },
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero),
                    child: Text(
                      'Forgot password?',
                      style: AppTypography.labelSmall.copyWith(color: AppColors.secondary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
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
                    hintText: 'Enter account security key',
                    hintStyle: const TextStyle(fontSize: 13, color: AppColors.outline),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  style: const TextStyle(fontSize: 14, color: AppColors.primary),
                ),
              ),

              const SizedBox(height: 10),

              // Remember Device Checkbox
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Checkbox(
                        value: _rememberDevice,
                        activeColor: AppColors.secondary,
                        onChanged: (val) => setState(() => _rememberDevice = val ?? true),
                      ),
                      Text('Remember device for 30 days', style: AppTypography.bodySmall),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Primary CTA Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: auth.isLoading ? null : () => _handleLogin(auth),
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
                            Text('Sign In to HavenKey', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 20),

              // Register Link
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text("Don't have an account?", style: AppTypography.bodySmall),
                    TextButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const RegisterScreen()),
                        );
                      },
                      child: const Text(
                        'Create an Account',
                        style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Bank-Grade Trust Badges
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock, color: AppColors.secondary, size: 13),
                    const SizedBox(width: 3),
                    Text('256-Bit SSL', style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                    const SizedBox(width: 8),
                    Container(width: 3, height: 3, decoration: const BoxDecoration(color: AppColors.outlineVariant, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    const Icon(Icons.account_balance, color: AppColors.secondary, size: 13),
                    const SizedBox(width: 3),
                    Text('SBP Escrow Standards', style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                    const SizedBox(width: 8),
                    Container(width: 3, height: 3, decoration: const BoxDecoration(color: AppColors.outlineVariant, shape: BoxShape.circle)),
                    const SizedBox(width: 8),
                    const Icon(Icons.security, color: AppColors.secondary, size: 13),
                    const SizedBox(width: 3),
                    Text('Identity Verified', style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleLogin(AuthProvider auth) async {
    final success = await auth.login(
      identifier: _idController.text.trim(),
      password: _passwordController.text.trim(),
    );
    if (success && mounted) {
      final appState = Provider.of<AppState>(context, listen: false);
      appState.setTabIndex(0);
      // Fetch user's actual bookings and live complaints
      await appState.fetchUserBookings(
        userId: auth.currentUser.id,
        userEmail: auth.currentUser.email,
      );
      await appState.refreshComplaints();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Logged in successfully as ${auth.currentUser.fullname}'),
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
          content: Text(auth.errorMessage ?? 'Invalid credentials or user not found in database.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}
