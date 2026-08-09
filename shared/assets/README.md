# Shared Brand Assets

This directory contains canonical source assets. Do not resize, recompress, or
overwrite the source files for application packaging.

The Prismate mobile source is
`Prismate Brand Assets/LOGO/Prismate_Black@5x.png`. The approved optimized
derivative is `systems/attendance/mobile/assets/branding/prismate_logo_black.png`
(1200×464); native Android/iOS launch variants are generated from that derivative.

Keep application derivatives beside the consuming system, document their source
here, and use mechanical scaling only unless a new brand treatment is explicitly
approved.

The employee mobile typography bundle lives in
`systems/attendance/mobile/assets/fonts/`. It contains the Manrope variable font
and Be Vietnam Pro Regular/Medium/SemiBold/Bold files downloaded from the
official `google/fonts` repository on 2026-08-08. Each family keeps its original
SIL Open Font License beside the binaries (`Manrope-OFL.txt` and
`BeVietnamPro-OFL.txt`). Do not replace these files with generated website cache
artifacts from `.vinext`, `dist`, or `node_modules`; update from the upstream
family directories and re-run Flutter layout tests when changing font versions.
