# the stash

A black and white, boxy-designed MP3/WAV storage website built with Next.js and shadcn/ui.

## Features

- 🎵 Upload and store MP3/WAV files
- 🏷️ Tag tracks with key, BPM, and custom tags
- 🔍 Filter by key and BPM (exact or range)
- 📱 Fully responsive design
- 🎨 Black and white aesthetic with 90-degree angles
- ✨ Subtle animations throughout
- 🔄 Collapsible animated sidebar
- 📊 Tags and statistics page

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand
- Lucide Icons

## Design Philosophy

- **Black & White**: Strict monochrome color scheme
- **Boxy**: Sharp 90-degree angles, no rounded corners
- **Monospace**: All text uses monospace font
- **Minimal**: Clean, focused interface
- **Animated**: Subtle motion for better UX

## Storage

All audio files and metadata are stored locally in your browser using localStorage. Files are kept in memory for playback while metadata persists across sessions.

