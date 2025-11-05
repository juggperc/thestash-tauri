# Desktop App Setup Guide

## Quick Start - PWA (Recommended) ✅

The easiest way to get a desktop app:

1. **Build and start the app:**
   ```bash
   npm run build
   npm start
   ```

2. **Open in browser** (Chrome, Edge, or Safari)

3. **Install as app:**
   - Chrome/Edge: Click the install icon in the address bar
   - Safari: File → Add to Dock
   - The app will appear in your Applications folder

**That's it!** You now have a desktop app that:
- ✅ Works offline
- ✅ Opens in its own window
- ✅ Has a custom icon
- ✅ Updates automatically

## Electron Setup (Full Native App)

### Installation

```bash
# Install Electron dependencies
cd electron
npm install
cd ..

# Install dev dependencies
npm install
```

### Development

Run Next.js + Electron together:
```bash
npm run electron:dev
```

### Building for Mac

```bash
npm run electron:build:mac
```

The `.dmg` file will be in `electron/dist/`

### Notes

- First build downloads Electron (~100MB)
- App size: ~120-150MB
- Requires code signing for distribution outside App Store

## Icon Setup

You'll need to create app icons:

1. Create `public/icon-192.png` (192x192px)
2. Create `public/icon-512.png` (512x512px)
3. For Electron, also create `electron/icon.icns` (Mac) or `electron/icon.ico` (Windows)

You can use online tools like:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

## Comparison

| Feature | PWA | Electron | Tauri |
|---------|-----|----------|-------|
| Size | ~5MB | ~120MB | ~10MB |
| Setup | ✅ Done | ⚙️ 5 min | ⚙️ 15 min |
| OS Integration | Basic | Full | Full |
| Updates | Auto | Manual | Manual |
| Best For | Most users | Deep integration | Lightweight native |

## Recommendation

**Start with PWA** - it's already configured and works great! If you need more OS features later, add Electron.

