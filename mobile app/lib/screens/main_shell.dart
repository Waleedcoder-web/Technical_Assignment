import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../providers/auth_provider.dart';
import '../widgets/bottom_nav_bar.dart';
import 'home_screen.dart';
import 'property_listings_screen.dart';
import 'reservations_screen.dart';
import 'complaints_screen.dart';
import 'ai_assistant_screen.dart';
import 'admin_dashboard_screen.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final auth = Provider.of<AuthProvider>(context);

    final List<Widget> screens = auth.isOps
        ? [
            const AdminDashboardScreen(),
            const PropertyListingsScreen(),
            const ReservationsScreen(),
            const ComplaintsScreen(),
            const AiAssistantScreen(),
          ]
        : [
            const HomeScreen(),
            const PropertyListingsScreen(),
            const ReservationsScreen(),
            const ComplaintsScreen(),
            const AiAssistantScreen(),
          ];

    // Ensure valid index bounds
    final int safeIndex = appState.currentTabIndex.clamp(0, screens.length - 1);

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: const BottomNavBar(),
    );
  }
}
