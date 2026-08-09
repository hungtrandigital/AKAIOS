import 'package:flutter/material.dart';

const prismateLogoAsset = 'assets/branding/prismate_logo_black.png';

/// Reusable Prismate loading mark for page-level and inline progress states.
///
/// Motion follows the operating-system accessibility preference and never
/// controls how long an operation takes.
class PrismateLoadingMark extends StatefulWidget {
  const PrismateLoadingMark({
    super.key,
    this.width = 156,
    this.tint,
    this.animate = true,
    this.semanticLabel = 'Đang xử lý',
  });

  final double width;
  final Color? tint;
  final bool animate;
  final String semanticLabel;

  @override
  State<PrismateLoadingMark> createState() => _PrismateLoadingMarkState();
}

class _PrismateLoadingMarkState extends State<PrismateLoadingMark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 820),
      value: 1,
    );
    _opacity = Tween<double>(begin: .58, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );
    _scale = Tween<double>(begin: .975, end: 1.015).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncMotion();
  }

  @override
  void didUpdateWidget(covariant PrismateLoadingMark oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.animate != widget.animate) _syncMotion();
  }

  void _syncMotion() {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final shouldAnimate =
        widget.animate && !reduceMotion && TickerMode.of(context);
    if (shouldAnimate) {
      if (!_controller.isAnimating) _controller.repeat(reverse: true);
    } else {
      _controller.stop();
      _controller.value = 1;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.semanticLabel,
      liveRegion: true,
      child: ExcludeSemantics(
        child: FadeTransition(
          opacity: _opacity,
          child: ScaleTransition(
            scale: _scale,
            child: Image.asset(
              prismateLogoAsset,
              width: widget.width,
              fit: BoxFit.contain,
              color: widget.tint,
              colorBlendMode: widget.tint == null ? null : BlendMode.srcIn,
              errorBuilder: (_, __, ___) => SizedBox(
                width: widget.width,
                child: Text(
                  'Prismate',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: widget.tint ?? const Color(0xFF171717),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PrismateLoadingView extends StatelessWidget {
  const PrismateLoadingView({
    super.key,
    required this.message,
    this.helper,
    this.logoWidth = 176,
  });

  final String message;
  final String? helper;
  final double logoWidth;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            PrismateLoadingMark(width: logoWidth),
            const SizedBox(height: 20),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (helper != null) ...[
              const SizedBox(height: 6),
              Text(
                helper!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
