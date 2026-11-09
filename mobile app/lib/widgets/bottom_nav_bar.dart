import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';

class BottomNavBar extends StatelessWidget {
  const BottomNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthProvider>(context);
    final isOps = auth.activeRole == 'admin' || auth.activeRole == 'operations';

    final currentUser = auth.currentUser;
    final int userBookingsBadge = currentUser.id.isEmpty
        ? 0
        : appState.getReservedPropertiesForUser(currentUser, isOps).length;

    final int userComplaintsBadge = currentUser.id.isEmpty
        ? 0
        : isOps
            ? appState.complaints.where((c) => c.status.toLowerCase() != 'resolved').length
            : appState.complaints.where((c) {
                final email = currentUser.email.toLowerCase().trim();
                final uid = currentUser.id.trim();
                final name = currentUser.fullname.toLowerCase().trim();

                final isUser = (uid.isNotEmpty && c.userId != null && c.userId!.trim() == uid) ||
                    (email.isNotEmpty && c.userEmail != null && c.userEmail!.toLowerCase().trim() == email) ||
                    (name.isNotEmpty && c.userName != null && c.userName!.toLowerCase().trim() == name);
                return isUser && c.status.toLowerCase() != 'resolved';
              }).length;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest.withValues(alpha: 0.95),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10172B4D),
            offset: Offset(0, -3),
            blurRadius: 16,
          ),
        ],
        border: const Border(
          top: BorderSide(color: AppColors.surfaceContainerHigh, width: 0.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: isOps ? Icons.admin_panel_settings_outlined : Icons.home_rounded,
                activeIcon: isOps ? Icons.admin_panel_settings : Icons.home_rounded,
                label: isOps ? 'Admin Hub' : 'Home',
                isActive: appState.currentTabIndex == 0,
                onTap: () => appState.setTabIndex(0),
              ),
              _NavItem(
                icon: Icons.explore_outlined,
                activeIcon: Icons.explore,
                label: isOps ? 'Public Site' : 'Explore',
                isActive: appState.currentTabIndex == 1,
                onTap: () => appState.setTabIndex(1),
              ),
              _NavItem(
                icon: Icons.calendar_month_outlined,
                activeIcon: Icons.calendar_month,
                label: 'Bookings',
                badgeCount: userBookingsBadge,
                isActive: appState.currentTabIndex == 2,
                onTap: () => appState.setTabIndex(2),
              ),
              _NavItem(
                icon: Icons.report_problem_outlined,
                activeIcon: Icons.report_problem,
                label: 'Complaints',
                badgeCount: userComplaintsBadge,
                isActive: appState.currentTabIndex == 3,
                onTap: () => appState.setTabIndex(3),
              ),
              _NavItem(
                icon: Icons.smart_toy_outlined,
                activeIcon: Icons.smart_toy,
                label: 'AI Copilot',
                isActive: appState.currentTabIndex == 4,
                onTap: () => appState.setTabIndex(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData? activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final int badgeCount;

  const _NavItem({
    required this.icon,
    this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.badgeCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    const activeColor = AppColors.secondary;
    const inactiveColor = AppColors.onSurfaceVariant;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isActive ? (activeIcon ?? icon) : icon,
                  color: isActive ? activeColor : inactiveColor,
                  size: 22,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: -8,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppColors.secondary,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      alignment: Alignment.center,
                      child: Text(
                        badgeCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: AppTypography.labelSmall.copyWith(
                color: isActive ? activeColor : inactiveColor,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
