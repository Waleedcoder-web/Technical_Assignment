import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_typography.dart';
import '../models/chat_model.dart';
import '../models/property_model.dart';
import '../providers/app_state.dart';
import '../screens/property_details_screen.dart';
import '../widgets/app_network_image.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  final List<String> _promptSuggestions = [
    'What is the refund timeline for tenant escrow deposits?',
    "What are HavenKey's landlord dispute resolution rules?",
    'Find 4-Bed villa in DHA Phase 6 under 400k/mo',
    'Show available rental apartments in Lahore',
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _submitMessage(String text) {
    final query = text.trim();
    if (query.isEmpty) return;

    _inputController.clear();
    final appState = Provider.of<AppState>(context, listen: false);
    appState.sendChatMessage(query);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final messages = appState.chatMessages;
    final isTyping = appState.isAiTyping;

    // Trigger auto-scroll on message changes or typing update
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(74),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(color: Color(0xFFE7E8EA), width: 1),
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  if (Navigator.canPop(context)) ...[
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Color(0xFF001637)),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 8),
                  ],
                  // Robot Icon Box
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFF001637),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.smart_toy_outlined,
                        color: Color(0xFFA1F1E9),
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Header Titles + Online Indicator
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                'HavenKey AI Copilot',
                                style: AppTypography.titleMedium.copyWith(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF001637),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 6),
                            // Online Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFA1F1E9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  FadeTransition(
                                    opacity: _pulseAnimation,
                                    child: Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF076A64),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Text(
                                    'ONLINE',
                                    style: TextStyle(
                                      color: Color(0xFF076A64),
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 1),
                        Text(
                          'Qwen 2.5 • RAG Retrieval & Verified Registries',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 10,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Clear Chat Action Button
                  InkWell(
                    onTap: () {
                      appState.clearChat();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Chat session reset to initial state.'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE7E8EA)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.refresh, size: 14, color: Color(0xFF44474E)),
                          SizedBox(width: 4),
                          Text(
                            'Clear',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF44474E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Quick Prompt Suggestions Strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: Color(0xFFE7E8EA), width: 1),
              ),
            ),
            child: SizedBox(
              height: 32,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _promptSuggestions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final prompt = _promptSuggestions[index];
                  return InkWell(
                    onTap: () => _submitMessage(prompt),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE7E8EA)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.auto_awesome,
                            size: 13,
                            color: Color(0xFF076A64),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            prompt,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF001637),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Messages View
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              itemCount: messages.length + (isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == messages.length && isTyping) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(messages[index]);
              },
            ),
          ),

          // Bottom Chat Input Bar
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16, left: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Color(0xFF001637),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.smart_toy_outlined, color: Color(0xFFA1F1E9), size: 16),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF2F4F6),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE7E8EA)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF076A64)),
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  'HavenKey AI is analyzing real estate parameters...',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF44474E),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatModel message) {
    if (message.isUser) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16, left: 40),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: const BoxDecoration(
                      color: Color(0xFF172B4D),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(4),
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                    ),
                    child: Text(
                      message.text,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13.5,
                        height: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.timestamp,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // User Avatar
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: Color(0xFF172B4D),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text(
                  'WH',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // AI Message Bubble
    return Container(
      margin: const EdgeInsets.only(bottom: 20, right: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI Robot Avatar
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              color: Color(0xFF001637),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.smart_toy_outlined, color: Color(0xFFA1F1E9), size: 18),
            ),
          ),
          const SizedBox(width: 10),

          // Message Body & Cards
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F4F6),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(4),
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                    border: Border.all(color: const Color(0xFFE7E8EA)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Formatted text renderer
                      _FormattedMessageContent(text: message.text),

                      // Grounded Knowledge Sources Strip
                      if (message.sources != null && message.sources!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Divider(color: Color(0xFFE7E8EA), height: 1),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.verified, size: 14, color: Color(0xFF076A64)),
                            const SizedBox(width: 4),
                            Text(
                              'VERIFIED KNOWLEDGE SOURCES:',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey.shade600,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: message.sources!.map((s) {
                            final matchPercent = (s.similarity * 100).toInt();
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFE7E8EA)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.description, size: 13, color: Colors.redAccent),
                                  const SizedBox(width: 4),
                                  Text(
                                    s.filename,
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF001637),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFA1F1E9),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Text(
                                      '$matchPercent% match',
                                      style: const TextStyle(
                                        fontSize: 8.5,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF076A64),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                      // Embedded Properties Cards
                      if (message.propertyRecommendations != null &&
                          message.propertyRecommendations!.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Text(
                          'Recommended Listings (${message.propertyRecommendations!.length}):',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF001637),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Column(
                          children: message.propertyRecommendations!.map((prop) {
                            return _AiEmbeddedPropertyCard(property: prop);
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message.timestamp,
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Color(0xFFE7E8EA), width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE7E8EA)),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF191C1E)),
                        textInputAction: TextInputAction.send,
                        onSubmitted: _submitMessage,
                        decoration: const InputDecoration(
                          hintText: 'Ask about properties, escrow, leases, or deeds...',
                          hintStyle: TextStyle(fontSize: 12, color: Color(0xFF75777F)),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.mic, size: 20, color: Color(0xFF75777F)),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Voice input listening... Speak your property query.'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                      splashRadius: 18,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Send Button
            Material(
              color: const Color(0xFF076A64),
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () => _submitMessage(_inputController.text),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  height: 46,
                  width: 46,
                  alignment: Alignment.center,
                  child: const Icon(Icons.send, color: Colors.white, size: 18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Formatted Message Content (matching website markdown parser)
class _FormattedMessageContent extends StatelessWidget {
  final String text;

  const _FormattedMessageContent({required this.text});

  @override
  Widget build(BuildContext context) {
    final lines = text.split('\n');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        final trimmed = line.trim();
        if (trimmed.isEmpty) {
          return const SizedBox(height: 6);
        }

        // Section Heading: ###
        if (trimmed.startsWith('### ')) {
          return Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 4),
            child: Text(
              trimmed.replaceFirst('### ', ''),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Color(0xFF001637),
              ),
            ),
          );
        }

        // Horizontal Rule: ---
        if (trimmed == '---') {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 6),
            child: Divider(color: Color(0xFFE7E8EA), height: 1),
          );
        }

        // Blockquote: >
        if (trimmed.startsWith('> ')) {
          return Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topRight: Radius.circular(8),
                bottomRight: Radius.circular(8),
              ),
              border: Border(
                left: BorderSide(color: Color(0xFF076A64), width: 3),
              ),
            ),
            child: Text(
              trimmed.replaceFirst('> ', ''),
              style: const TextStyle(
                fontSize: 11.5,
                fontStyle: FontStyle.italic,
                color: Color(0xFF001637),
                height: 1.35,
              ),
            ),
          );
        }

        // Numbered list item: 1. , 2.
        final numMatch = RegExp(r'^(\d+)\.\s+(.*)').firstMatch(trimmed);
        if (numMatch != null) {
          final numStr = numMatch.group(1)!;
          final contentStr = numMatch.group(2)!;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 18,
                  height: 18,
                  margin: const EdgeInsets.only(top: 2, right: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F7F6),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFA1F1E9)),
                  ),
                  child: Center(
                    child: Text(
                      numStr,
                      style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF076A64),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    contentStr,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF191C1E),
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        // Bullet list item: • or -
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          final bulletText = trimmed.replaceFirst(RegExp(r'^[•\-\*]\s+'), '');
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 2.5),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 5,
                  height: 5,
                  margin: const EdgeInsets.only(top: 6, right: 8, left: 4),
                  decoration: const BoxDecoration(
                    color: Color(0xFF076A64),
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    bulletText,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF191C1E),
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        // Standard Paragraph
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Text(
            trimmed,
            style: const TextStyle(
              fontSize: 12.5,
              color: Color(0xFF191C1E),
              height: 1.4,
            ),
          ),
        );
      }).toList(),
    );
  }
}

// Embedded Interactive Property Card for AI Assistant
class _AiEmbeddedPropertyCard extends StatelessWidget {
  final PropertyModel property;

  const _AiEmbeddedPropertyCard({required this.property});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE7E8EA)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08001637),
            offset: Offset(0, 2),
            blurRadius: 6,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PropertyDetailsScreen(property: property),
              ),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo with Price Badge
              Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: AppNetworkImage(
                      url: property.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppColors.surfaceContainer,
                        child: const Center(
                          child: Icon(Icons.apartment, size: 36, color: AppColors.outline),
                        ),
                      ),
                    ),
                  ),
                    Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF001637).withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        property.priceFormatted,
                        style: const TextStyle(
                          color: Color(0xFFA1F1E9),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  if (property.isReserved)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.red.shade700,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'RESERVED',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),

              // Title, Location, Specs & Button
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.title,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF001637),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 12, color: Color(0xFF75777F)),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            property.location,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF75777F),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            _specPill(Icons.bed, '${property.beds} Beds'),
                            const SizedBox(width: 6),
                            _specPill(Icons.bathtub, '${property.baths} Baths'),
                            const SizedBox(width: 6),
                            _specPill(Icons.square_foot, '${property.areaValue.toInt()} ${property.areaUnit}'),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF076A64),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'View Details',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
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

  Widget _specPill(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFF2F4F6),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: const Color(0xFF076A64)),
          const SizedBox(width: 3),
          Text(
            text,
            style: const TextStyle(fontSize: 10, color: Color(0xFF44474E), fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
