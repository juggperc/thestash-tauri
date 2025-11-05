# Tauri Setup for the stash

This project is now configured to build with Tauri instead of (or alongside) Electron.

## Prerequisites

1. **Rust**: Install Rust from https://rustup.rs/
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Tauri CLI**: Install globally (or use npx)
   ```bash
   npm install -g @tauri-apps/cli
   # OR use npx (no global install needed)
   ```

3. **System Dependencies** (macOS):
   - Xcode Command Line Tools: `xcode-select --install`
   - For universal builds (arm64 + x64), you may need additional setup

## Development

Run the app in development mode:
```bash
npm run tauri:dev
```

This will:
1. Start the Next.js dev server on port 3000
2. Launch the Tauri window pointing to localhost:3000

## Building

Build for macOS:
```bash
npm run tauri:build:mac
```

This will create a `.app` bundle in `src-tauri/target/release/bundle/macos/`

## How It Works

- **Storage**: Files are stored in `~/Library/Application Support/com.thestash.app/audio-files/`
- **Metadata**: Stored in `~/Library/Application Support/com.thestash.app/metadata.json`
- **API**: Uses Tauri's invoke system instead of Electron IPC
- **Window**: Native macOS window with title bar

## Differences from Electron

- **Smaller bundle size**: Tauri bundles are much smaller (~5-10MB vs ~100MB+)
- **Better performance**: Uses system webview instead of bundled Chromium
- **Security**: More secure by default with limited API surface
- **Native feel**: Better integration with macOS

## Troubleshooting

If you get errors about missing Rust or system dependencies, ensure:
1. Rust is installed and in PATH: `rustc --version`
2. Xcode Command Line Tools are installed
3. For universal builds, you may need to install cross-compilation targets:
   ```bash
   rustup target add aarch64-apple-darwin
   rustup target add x86_64-apple-darwin
   ```

