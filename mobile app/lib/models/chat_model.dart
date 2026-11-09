import 'property_model.dart';

class ChatSource {
  final String filename;
  final double similarity;

  ChatSource({
    required this.filename,
    required this.similarity,
  });

  factory ChatSource.fromJson(Map<String, dynamic> json) {
    return ChatSource(
      filename: json['filename']?.toString() ?? 'HavenKey_Document.pdf',
      similarity: (json['similarity'] is num)
          ? (json['similarity'] as num).toDouble()
          : 0.85,
    );
  }

  Map<String, dynamic> toJson() => {
        'filename': filename,
        'similarity': similarity,
      };
}

class ChatModel {
  final String id;
  final String sender; // 'user' or 'ai'
  final String text;
  final String timestamp;
  final List<PropertyModel>? propertyRecommendations;
  final List<ChatSource>? sources;
  final bool isRAG;
  final String? legalClauseTitle;
  final String? legalClauseExcerpt;
  final String? slaWindow;
  final String? actionButtonText;

  ChatModel({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.propertyRecommendations,
    this.sources,
    this.isRAG = false,
    this.legalClauseTitle,
    this.legalClauseExcerpt,
    this.slaWindow,
    this.actionButtonText,
  });

  bool get isUser => sender == 'user';
  bool get isAi => sender == 'ai';

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    List<PropertyModel>? recs;
    final propList = json['properties'] ?? json['propertyRecommendations'];
    if (propList is List) {
      recs = propList
          .where((p) => p != null && p is Map)
          .map((p) => PropertyModel.fromJson(Map<String, dynamic>.from(p)))
          .toList();
    }

    List<ChatSource>? srcList;
    if (json['sources'] is List) {
      srcList = (json['sources'] as List)
          .where((s) => s != null && s is Map)
          .map((s) => ChatSource.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    }

    return ChatModel(
      id: json['id']?.toString() ?? 'msg-${DateTime.now().millisecondsSinceEpoch}',
      sender: json['sender'] ?? 'ai',
      text: json['answer'] ?? json['text'] ?? '',
      timestamp: json['timestamp'] ?? 'Just now',
      propertyRecommendations: recs,
      sources: srcList,
      isRAG: (srcList != null && srcList.isNotEmpty) || (json['isRAG'] == true),
      legalClauseTitle: json['legalClauseTitle'],
      legalClauseExcerpt: json['legalClauseExcerpt'],
      slaWindow: json['slaWindow'],
      actionButtonText: json['actionButtonText'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender': sender,
      'text': text,
      'timestamp': timestamp,
    };
  }
}
