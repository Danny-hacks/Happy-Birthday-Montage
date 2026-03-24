# 🎂 Birthday Montage

A cinematic, scroll-driven birthday montage website built with **React + Vite**. Drop in your photos, videos, and a background track — get a beautiful, animated birthday experience your loved one can open on any device.

**[Live Demo](https://sweet-mother.netlify.app/)**

---

## ✨ Features

- **Scroll-driven storytelling** — Full-screen sections with smooth scroll-snap, parallax effects, and staggered reveal animations
- **Background music** — Loops your chosen audio track with smooth fade-in/out and auto-ducking when featured videos play
- **Featured videos with sound** — Mark specific videos (e.g. candle blowing, birthday singing) to play their own audio while the background music fades out
- **iOS/mobile compatible** — Handles autoplay restrictions, tap-to-unmute fallback, and responsive layouts
- **Ken Burns effect** — Photos gently zoom and pan for a cinematic feel
- **Floating particles & embers** — Gold dots, embers, and flame particles drift across the screen
- **Swipe prompt** — Animated hint tells the viewer to scroll/swipe to begin
- **Progress bar** — Gold gradient bar at the top shows scroll progress
- **Text interludes** — Inspirational quotes appear between media with word-by-word animation
- **Drag & drop media sync** — Just drop files into `app/public/media/` and run the sync script

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/Danny-hacks/Happy-Birthday-Montage.git
cd Happy-Birthday-Montage

# Install dependencies
cd app
npm install
```

### Add Your Media

Drop your files into `app/public/media/`:

| File Type | Supported Formats |
|-----------|-------------------|
| Photos    | `.jpeg`, `.jpg`, `.png`, `.webp` |
| Videos    | `.mp4`, `.mov`, `.webm` |
| Audio     | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac` |

- The **first audio file** found becomes the background music
- Files are auto-renamed to `photo1.jpeg`, `video1.mp4`, etc. (sorted by modified time)
- No need to pre-name anything — just drag and drop

### Run Locally

```bash
cd app
npm run dev
```

The Vite build auto-syncs media on startup. You can also run the sync manually or in watch mode:

```bash
# One-time sync
node sync-media.js --no-watch

# Watch mode (auto-syncs on file changes, default)
node sync-media.js
```

### Customize Content

Edit `app/src/mediaConfig.js` to:

- **Reorder** photos and videos
- **Add captions** to photos: `"caption": "Your text here"`
- **Unmute videos** that should play with sound: `"unmute": true`
- **Add text interludes** between media: `{ "type": "text", "message": "Your quote here..." }`

The sync script preserves your captions and unmute flags when you add/remove media.

### Example Config Entry

```js
{
  "type": "video",
  "src": "/media/video3.mp4",
  "unmute": true,           // plays video audio, ducks background music
  "caption": "Make a wish!"
}
```

## 🌐 Deploy to Netlify

1. Push to GitHub
2. Connect the repo to [Netlify](https://netlify.com)
3. Netlify auto-detects the config from `netlify.toml`:
   - **Base directory:** `app`
   - **Build command:** `npm run build`
   - **Publish directory:** `app/dist`

Every push triggers a new deploy automatically.

## 📁 Project Structure

```
Happy-Birthday-Montage/
├── app/
│   ├── public/media/       # ← Drop your photos, videos & audio here
│   │   ├── photo1.jpeg
│   │   ├── video1.mp4
│   │   └── bg-music.mp3
│   ├── src/
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css         # All styles
│   │   └── mediaConfig.js  # Auto-generated media config
│   ├── vite.config.js      # Vite config with build-time sync
│   └── package.json
├── sync-media.js           # Media sync script (rename & generate config)
├── netlify.toml            # Netlify deployment config
└── README.md
```

## 🔧 Media Sync Script

The `sync-media.js` script handles all media management:

**What it does:**
1. Scans `app/public/media/` for photos, videos, and audio
2. Renames files sequentially (`photo1.jpeg`, `video1.mp4`, etc.)
3. Regenerates `mediaConfig.js` with interleaved photos, videos, and text breaks
4. Preserves any captions or unmute flags you've set

**During builds** (including Netlify deploys), the Vite plugin runs this automatically.

## 🎨 Customization

### Change the birthday person's name
Edit the heading in `app/src/App.jsx` — search for "Happy Birthday" and update accordingly.

### Change the color scheme
Edit the CSS variables at the top of `app/src/App.css`:
```css
:root {
  --gold: #d4a055;
  --gold-light: #f0d4a8;
  --warm-dark: #1a0e05;
  --warm-mid: #2d1810;
  --cream: #faf3e8;
}
```

### Change text interludes
Edit the messages in `mediaConfig.js` or update the defaults in `sync-media.js`.

## 📄 License

MIT — use it for any birthday, anniversary, or celebration you like.
