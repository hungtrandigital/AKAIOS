// Employee login — large, Vietnamese-first controls with a single main action.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth_storage.dart';
import '../../../core/http_client.dart';
import '../../../core/prismate_loading.dart';
import '../../../l10n/app_localizations.dart';
import '../data/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _otpMode = false;
  bool _loading = false;
  bool _hidePassword = true;
  String? _errorMsg;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 9) {
      setState(() => _errorMsg = 'Cô/chú vui lòng nhập đúng số điện thoại.');
      return;
    }
    if (_otpMode && !RegExp(r'^\d{6}$').hasMatch(_otpCtrl.text.trim())) {
      setState(() => _errorMsg = 'Mã OTP gồm đúng 6 số.');
      return;
    }
    if (!_otpMode && _passwordCtrl.text.isEmpty) {
      setState(() => _errorMsg = 'Cô/chú vui lòng nhập mật khẩu.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      final repo = ref.read(authRepositoryProvider);
      if (_otpMode) {
        await repo.loginWithOtp(phone: phone, otp: _otpCtrl.text.trim());
      } else {
        await repo.loginWithPassword(
            phone: phone, password: _passwordCtrl.text);
      }
      if (!mounted) return;
      ref.read(authSessionProvider).markAuthenticated();
      context.go('/today');
    } on ApiException catch (e) {
      if (mounted) setState(() => _errorMsg = _friendlyLoginError(e));
    } catch (_) {
      if (mounted) {
        setState(() => _errorMsg =
            'Chưa thể đăng nhập. Cô/chú kiểm tra mạng rồi thử lại nhé.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 9) {
      setState(() => _errorMsg = 'Nhập số điện thoại trước khi lấy mã OTP.');
      return;
    }
    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      await ref.read(authRepositoryProvider).requestOtp(phone: phone);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nếu tài khoản hợp lệ, OTP đã được gửi.')),
      );
      setState(() => _otpMode = true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _errorMsg = _friendlyLoginError(e));
    } catch (_) {
      if (mounted) {
        setState(() => _errorMsg = 'Không gửi được OTP. Vui lòng thử lại.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _friendlyLoginError(ApiException error) {
    if (error.statusCode == 0) {
      return 'Không kết nối được hệ thống. Cô/chú kiểm tra mạng rồi thử lại.';
    }
    if (error.statusCode == 401 || error.statusCode == 403) {
      return 'Số điện thoại, mật khẩu hoặc mã OTP chưa đúng.';
    }
    return 'Chưa thể đăng nhập. Vui lòng thử lại hoặc nhờ giám sát hỗ trợ.';
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: _LoginBrand(),
                    ),
                    const SizedBox(height: 32),
                    Text('Chào cô/chú!',
                        style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 8),
                    Text(
                      'Đăng nhập để xem ca làm và chấm công hôm nay.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _phoneCtrl,
                      decoration: InputDecoration(
                        labelText: l.phone,
                        hintText: 'Ví dụ: 0912 345 678',
                        prefixIcon: const Icon(Icons.phone_outlined),
                      ),
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      enabled: !_loading,
                    ),
                    const SizedBox(height: 16),
                    if (!_otpMode)
                      TextField(
                        controller: _passwordCtrl,
                        decoration: InputDecoration(
                          labelText: l.password,
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            tooltip:
                                _hidePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                            onPressed: _loading
                                ? null
                                : () => setState(
                                    () => _hidePassword = !_hidePassword),
                            icon: Icon(_hidePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined),
                          ),
                        ),
                        obscureText: _hidePassword,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.password],
                        enabled: !_loading,
                        onSubmitted: (_) => _login(),
                      )
                    else
                      TextField(
                        controller: _otpCtrl,
                        decoration: InputDecoration(
                          labelText: l.otp,
                          hintText: '6 số trong tin nhắn',
                          prefixIcon: const Icon(Icons.sms_outlined),
                          counterText: '',
                        ),
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.oneTimeCode],
                        enabled: !_loading,
                        onSubmitted: (_) => _login(),
                      ),
                    if (_errorMsg != null) ...[
                      const SizedBox(height: 16),
                      _MessagePanel(
                        icon: Icons.error_outline,
                        text: _errorMsg!,
                        isError: true,
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _loading ? null : _login,
                      child: _loading
                          ? Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const PrismateLoadingMark(
                                  width: 46,
                                  tint: Colors.white,
                                ),
                                const SizedBox(width: 10),
                                Text(_otpMode
                                    ? 'Đang kiểm tra mã…'
                                    : 'Đang đăng nhập…'),
                              ],
                            )
                          : Text(_otpMode ? l.verify : l.loginButton),
                    ),
                    const SizedBox(height: 10),
                    if (!_otpMode)
                      TextButton(
                        onPressed: _loading ? null : _requestOtp,
                        child: _WrappingButtonLabel(
                          icon: Icons.sms_outlined,
                          label: l.loginWithOtp,
                        ),
                      )
                    else
                      TextButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _otpMode = false;
                                  _errorMsg = null;
                                }),
                        child: const _WrappingButtonLabel(
                          icon: Icons.arrow_back,
                          label: 'Dùng mật khẩu',
                        ),
                      ),
                    const SizedBox(height: 18),
                    Text(
                      'Nếu quên mật khẩu, cô/chú hãy gọi giám sát trực tiếp.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LoginBrand extends StatelessWidget {
  const _LoginBrand();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 12,
      runSpacing: 8,
      children: [
        Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0289F7), Color(0xFF0070CC)],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Text(
            'AK',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const Text(
          'AKAIUNSAN',
          style: TextStyle(
            color: Color(0xFF17202A),
            fontSize: 21,
            fontWeight: FontWeight.w800,
            letterSpacing: -.4,
          ),
        ),
      ],
    );
  }
}

class _WrappingButtonLabel extends StatelessWidget {
  const _WrappingButtonLabel({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 4,
      children: [Icon(icon), Text(label, textAlign: TextAlign.center)],
    );
  }
}

class _MessagePanel extends StatelessWidget {
  const _MessagePanel({
    required this.icon,
    required this.text,
    required this.isError,
  });

  final IconData icon;
  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? const Color(0xFFB42318) : const Color(0xFF176B3A);
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isError ? const Color(0xFFFFF1F0) : const Color(0xFFECFDF3),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(.28)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: Theme.of(context)
                    .textTheme
                    .bodyLarge
                    ?.copyWith(color: color, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
