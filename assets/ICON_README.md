# assets/

Place your icon files here to customize the app:

## Required files for icon customization:

| File          | Format | Size            | Usage                         |
|---------------|--------|-----------------|-------------------------------|
| icon.svg      | SVG    | 512x512 source  | Source design                 |
| icon.png      | PNG    | 512x512         | Preview / source raster       |
| icon.ico      | ICO    | Multi-size      | Windows app + installer icon  |
| tray-icon.png | PNG    | 32x32           | Tray fallback                 |

## How to generate:

1. Design a square logo (PNG, 512x512 or larger)
2. Convert to .ico using any online converter (e.g. icoconverter.com)
3. Save as `assets/icon.ico`
4. Set the Windows and NSIS icon fields in `electron-builder.yml`

The tray icon prefers `assets/icon.ico`, then falls back to `assets/tray-icon.png`, then to the programmatic fallback.
