# Desktop App Setup

This app can be run as a desktop application using Electron or as a Progressive Web App (PWA).

## Option 1: Progressive Web App (PWA) - Simplest ✅

The app is already configured as a PWA. Users can install it directly from their browser:

1. Build the app: `npm run build && npm start`
2. Open in browser (Chrome/Edge/Safari)
3. Click "Install" button in address bar or use browser menu
4. App will appear in Applications folder (Mac) or Start Menu (Windows)

**Advantages:**
- ✅ Zero additional dependencies
- ✅ Lightweight (uses system browser)
- ✅ Already responsive
- ✅ Works offline with service worker
- ✅ Auto-updates with web deployment

## Option 2: Electron App

### Setup

1. Install Electron dependencies:
```bash
cd electron
npm install
cd ..
npm install
```

2. Run in development:
```bash
npm run electron:dev
```

3. Build for Mac:
```bash
npm run electron:build:mac
```

The built app will be in `electron/dist/`

### Building

- **Mac**: `npm run electron:build:mac`
- **Windows**: `npm run electron:build:win` (requires Windows)
- **Linux**: `npm run electron:build:linux`

### Notes

- Electron apps are larger (~100-200MB) but provide native OS integration
- For Mac, you may need to sign the app for distribution outside App Store
- First build will download Electron binaries

## Option 3: Tauri (Lightweight Alternative) ⚡

Tauri is much lighter than Electron (~5-10MB vs 100-200MB). Setup:

1. Install Tauri CLI:
```bash
npm install -g @tauri-apps/cli
```

2. Initialize Tauri in the project:
```bash
tauri init
```

3. Configure `src-tauri/tauri.conf.json` to point to Next.js build
4. Build: `tauri build`

**Advantages:**
- ⚡ Much smaller bundle size
- ⚡ Faster startup
- ⚡ Uses system webview
- ⚡ Better security model

**Considerations:**
- Requires Rust toolchain
- More setup complexity
- System webview requirements vary by OS

## Recommendation

For "the stash", I recommend **PWA** first:
- Already works as installable app
- Lightweight and responsive
- No additional build steps
- Works across all platforms

If you need deeper OS integration (file system access, notifications, etc.), then consider Electron or Tauri.

