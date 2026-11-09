import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/ai_assistant_screen.dart';
import '../screens/customer_dashboard_screen.dart';

class TopHeader extends StatelessWidget implements PreferredSizeWidget {
  final bool showBack;
  final String? title;
  final VoidCallback? onBack;

  const TopHeader({
    super.key,
    this.showBack = false,
    this.title,
    this.onBack,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.currentUser;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.9),
        border: const Border(
          bottom: BorderSide(color: AppColors.surfaceContainerHigh, width: 1),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left side: Brand or Back Button
              if (showBack)
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                      onPressed: onBack ?? () => Navigator.of(context).pop(),
                    ),
                    if (title != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        title!,
                        style: AppTypography.titleMedium.copyWith(fontSize: 17),
                      ),
                    ],
                  ],
                )
              else
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.vpn_key,
                        color: AppColors.secondaryFixed,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'HavenKey',
                          style: AppTypography.headlineSmall.copyWith(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            height: 1.1,
                          ),
                        ),
                        Text(
                          'PK Real Estate',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.w600,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

              // Right side: AI Copilot, Notifications & Avatar / Role Badge
              Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.smart_toy_outlined,
                      color: Color(0xFF076A64),
                      size: 23,
                    ),
                    tooltip: 'HavenKey AI Copilot',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
                      );
                    },
                  ),
                  Stack(
                    alignment: Alignment.topRight,
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.notifications_outlined,
                          color: AppColors.onSurfaceVariant,
                          size: 24,
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('All systems verified • Zero unread alerts'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                      ),
                      Positioned(
                        right: 12,
                        top: 12,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () {
                      if (!auth.isAuthenticated) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      } else {
                        _showUserQuickMenu(context, auth);
                      }
                    },
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: auth.activeRole == 'admin'
                            ? AppColors.secondary
                            : AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        user.fullname.isNotEmpty ? user.fullname[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUserQuickMenu(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceContainerLowest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.primaryContainer,
                      child: Text(
                        auth.currentUser.fullname[0],
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.currentUser.fullname, style: AppTypography.titleMedium),
                        Text(auth.currentUser.email, style: AppTypography.bodySmall),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                Text('Switch Operating Role', style: AppTypography.labelMedium),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _RoleChoiceChip(
                      label: 'Tenant',
                      selected: auth.activeRole == 'tenant',
                      onTap: () {
                        auth.setActiveRole('tenant');
                        Navigator.pop(ctx);
                      },
                    ),
                    const SizedBox(width: 8),
                    _RoleChoiceChip(
                      label: 'Landlord',
                      selected: auth.activeRole == 'landlord',
                      onTap: () {
                        auth.setActiveRole('landlord');
                        Navigator.pop(ctx);
                      },
                    ),
                    const SizedBox(width: 8),
                    _RoleChoiceChip(
                      label: 'Operations',
                      selected: auth.activeRole == 'admin',
                      onTap: () {
                        auth.setActiveRole('admin');
                        Navigator.pop(ctx);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.manage_accounts_outlined, color: AppColors.primary),
                  title: const Text('My Account & Leases Portal', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                  trailing: const Icon(Icons.chevron_right, size: 18),
                  contentPadding: EdgeInsets.zero,
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CustomerDashboardScreen()),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.smart_toy_outlined, color: Color(0xFF076A64)),
                  title: const Text('HavenKey AI Copilot', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                  trailing: const Icon(Icons.chevron_right, size: 18),
                  contentPadding: EdgeInsets.zero,
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
                    );
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: AppColors.error),
                  title: const Text('Sign Out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
                  contentPadding: EdgeInsets.zero,
                  onTap: () {
                    final appState = Provider.of<AppState>(context, listen: false);
                    auth.logout();
                    appState.clearUserData();
                    appState.setTabIndex(0);
                    Navigator.pop(ctx);
                    Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
                      '/login',
                      (route) => false,
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _RoleChoiceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _RoleChoiceChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.secondary : AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.onSurface,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
