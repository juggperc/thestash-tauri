# the stash
MP3/WAV storage website built with Next.js and shadcn/ui
built for leakers, collectors, and producers

## lore
i just built this for myself using Composer 1. i needed a mac app that would tag and sort my music, and i wanted it to work the way
i would like it to. initially, i had beatdetektor auto-analysing bpm of songs but vibecoding is braindead so i had to just provide a link to tunebat lol.

## features

- 🎵 upload and store MP3/WAV files
- 🏷️ tag tracks with key, BPM, and custom tags
- 🔍 filter by key and BPM (exact or range)
- 📱 fully responsive design (depends on your definition of responsive)
- 📊 tags and statistics page

## getting started (if u new to dis)

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

optionally you can build the tauri/electron app. its so bloated. its so slow. but its the tool i needed god dammit!

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand
- Lucide Icons

## Storage

All audio files and metadata are stored locally in your browser using localStorage. Files are kept in memory for playback while metadata persists across sessions. This is really dumb, so the .app saves data to your disk.

