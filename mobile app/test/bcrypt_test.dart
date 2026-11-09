import 'package:flutter_test/flutter_test.dart';
import 'package:bcrypt/bcrypt.dart';

void main() {
  test('bcrypt hash and verification test', () {
    const rawPassword = 'myPassword123!';
    final salt = BCrypt.gensalt(logRounds: 10);
    final hashedPassword = BCrypt.hashpw(rawPassword, salt);

    expect(hashedPassword.startsWith(r'$2a$') || hashedPassword.startsWith(r'$2b$'), isTrue);
    expect(BCrypt.checkpw(rawPassword, hashedPassword), isTrue);
    expect(BCrypt.checkpw('wrongPassword', hashedPassword), isFalse);

    // Cross-compatibility with Node bcryptjs
    const nodeHash = r'$2a$10$3dxt7B0DOKwQ/YokY7lZjesO6vraviN5UMU8id1WLwHnlEh5bCTdy';
    expect(BCrypt.checkpw(rawPassword, nodeHash), isTrue);
  });
}
