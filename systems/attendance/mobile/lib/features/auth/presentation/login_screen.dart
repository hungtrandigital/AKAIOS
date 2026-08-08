// Login screen — phone + password, or phone + OTP.

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/http_client.dart';
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
  String? _errorMsg;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _errorMsg = null;
    });
    try {
      final repo = ref.read(authRepositoryProvider);
      if (_otpMode) {
        if (_otpCtrl.text.length != 6) {
          throw Exception('OTP phải 6 số');
        }
        await repo.loginWithOtp(phone: _phoneCtrl.text, otp: _otpCtrl.text);
      } else {
        await repo.loginWithPassword(
            phone: _phoneCtrl.text, password: _passwordCtrl.text);
      }
      if (!mounted) return;
      context.go('/today');
    } on ApiException catch (e) {
      setState(() => _errorMsg = e.message);
    } catch (e) {
      setState(() => _errorMsg = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestOtp() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.requestOtp(phone: _phoneCtrl.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('OTP đã gửi (kiểm tra server log trong dev mode)')),
      );
      setState(() => _otpMode = true);
    } on ApiException catch (e) {
      setState(() => _errorMsg = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.loginTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _phoneCtrl,
              decoration: InputDecoration(
                labelText: l.phone,
                prefixText: '+84 ',
                border: const OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
              enabled: !_loading,
            ),
            const SizedBox(height: 16),
            if (!_otpMode) ...[
              TextField(
                controller: _passwordCtrl,
                decoration: InputDecoration(
                  labelText: l.password,
                  border: const OutlineInputBorder(),
                ),
                obscureText: true,
                enabled: !_loading,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: Text(l.loginButton),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _loading ? null : _requestOtp,
                child: Text(l.loginWithOtp),
              ),
            ] else ...[
              TextField(
                controller: _otpCtrl,
                decoration: InputDecoration(
                  labelText: l.otp,
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
                enabled: !_loading,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: Text(l.verify),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed:
                    _loading ? null : () => setState(() => _otpMode = false),
                child: const Text('← Quay lại'),
              ),
            ],
            if (_errorMsg != null) ...[
              const SizedBox(height: 16),
              Text(_errorMsg!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
