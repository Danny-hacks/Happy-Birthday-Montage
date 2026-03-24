/**
 * Media Sync Script
 *
 * Run: node sync-media.js
 *
 * What it does:
 *   1. Scans app/public/media/ for photos, videos, and audio
 *   2. Renames photos → photo1.jpeg, photo2.jpeg, ...
 *   3. Renames videos → video1.mp4, video2.mp4, ...
 *   4. Renames first audio → bg-music.mp3
 *   5. Regenerates app/src/mediaConfig.js
 *
 * Just drag & drop files into app/public/media/ and the site updates!
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MEDIA_DIR = path.join(ROOT, "app", "public", "media");
const CONFIG_PATH = path.join(ROOT, "app", "src", "mediaConfig.js");

const IMAGE_EXTS = [".jpeg", ".jpg", ".png", ".webp"];
const VIDEO_EXTS = [".mp4", ".mov", ".webm"];
const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "photo";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return null;
}

function run() {
  // Ensure directory exists
  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  // Read all files
  const files = fs.readdirSync(MEDIA_DIR).filter((f) => {
    return fs.statSync(path.join(MEDIA_DIR, f)).isFile() && !f.startsWith("_tmp_");
  });

  // Categorize
  const photos = [];
  const videos = [];
  let audioFile = null;

  for (const file of files) {
    const type = getFileType(file);
    if (type === "photo") photos.push(file);
    else if (type === "video") videos.push(file);
    else if (type === "audio" && !audioFile) audioFile = file;
  }

  // Sort by modified time so the order you add them is preserved
  const byTime = (a, b) => {
    const aTime = fs.statSync(path.join(MEDIA_DIR, a)).mtimeMs;
    const bTime = fs.statSync(path.join(MEDIA_DIR, b)).mtimeMs;
    return aTime - bTime;
  };
  photos.sort(byTime);
  videos.sort(byTime);

  console.log(`Found: ${photos.length} photos, ${videos.length} videos, ${audioFile ? 1 : 0} audio`);

  // Read existing config to preserve unmute flags and captions
  let existingConfig = [];
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const match = raw.match(/const mediaConfig = (\[[\s\S]*?\]);/);
    if (match) {
      existingConfig = eval(match[1]);
    }
  } catch {}

  const existingLookup = {};
  for (const item of existingConfig) {
    if (item.src) existingLookup[item.src] = item;
  }

  // Phase 1: rename all to temp names to avoid collisions
  const photoRenames = [];
  photos.forEach((file, i) => {
    const ext = path.extname(file).toLowerCase();
    const newName = `photo${i + 1}${ext}`;
    if (file !== newName) {
      const tmpName = `_tmp_photo_${i + 1}${ext}`;
      fs.renameSync(path.join(MEDIA_DIR, file), path.join(MEDIA_DIR, tmpName));
      photoRenames.push({ tmp: tmpName, final: newName, old: file });
    } else {
      photoRenames.push(null);
    }
  });

  const videoRenames = [];
  videos.forEach((file, i) => {
    const ext = path.extname(file).toLowerCase();
    const newName = `video${i + 1}${ext}`;
    if (file !== newName) {
      const tmpName = `_tmp_video_${i + 1}${ext}`;
      fs.renameSync(path.join(MEDIA_DIR, file), path.join(MEDIA_DIR, tmpName));
      videoRenames.push({ tmp: tmpName, final: newName, old: file });
    } else {
      videoRenames.push(null);
    }
  });

  // Phase 2: rename temps to final names
  for (const r of photoRenames) {
    if (r) {
      fs.renameSync(path.join(MEDIA_DIR, r.tmp), path.join(MEDIA_DIR, r.final));
      console.log(`  ${r.old} → ${r.final}`);
    }
  }

  for (const r of videoRenames) {
    if (r) {
      fs.renameSync(path.join(MEDIA_DIR, r.tmp), path.join(MEDIA_DIR, r.final));
      console.log(`  ${r.old} → ${r.final}`);
    }
  }

  // Rename audio
  if (audioFile && audioFile !== "bg-music.mp3") {
    fs.renameSync(path.join(MEDIA_DIR, audioFile), path.join(MEDIA_DIR, "bg-music.mp3"));
    console.log(`  ${audioFile} → bg-music.mp3`);
  }

  // Build final file lists
  const photoMap = photos.map((_, i) => `photo${i + 1}${path.extname(photos[i]).toLowerCase()}`);
  const videoMap = videos.map((_, i) => `video${i + 1}${path.extname(videos[i]).toLowerCase()}`);

  // Interleave photos and videos with text breaks
  const entries = [];
  const totalPhotos = photoMap.length;
  const totalVideos = videoMap.length;
  let pi = 0;
  let vi = 0;

  const textMessages = [
    "Every moment with you is a blessing we treasure forever...",
    "Your love lights up every room you walk into...",
    "A mother's love is the fuel that enables a normal human being to do the impossible...",
    "No one in this world can love you more than your mother...",
    "You are our strength, our joy, our everything...",
    "The world is a better place because you are in it...",
  ];
  let ti = 0;

  // Pattern: photo, video, photo, video, text, repeat
  while (pi < totalPhotos || vi < totalVideos) {
    if (pi < totalPhotos) {
      const src = `/media/${photoMap[pi]}`;
      const existing = existingLookup[src];
      entries.push({
        type: "photo",
        src,
        caption: existing?.caption || "",
      });
      pi++;
    }

    if (vi < totalVideos) {
      const src = `/media/${videoMap[vi]}`;
      const existing = existingLookup[src];
      entries.push({
        type: "video",
        src,
        ...(existing?.unmute ? { unmute: true } : {}),
        ...(existing?.caption ? { caption: existing.caption } : {}),
      });
      vi++;
    }

    if ((pi + vi) % 4 === 0 && ti < textMessages.length && (pi < totalPhotos || vi < totalVideos)) {
      entries.push({
        type: "text",
        message: textMessages[ti++],
      });
    }
  }

  // Write config
  const configContent = `/**
 * MEDIA CONFIGURATION (auto-generated by sync-media.js)
 *
 * To update: drop files into app/public/media/ and run: node sync-media.js
 *
 * To customize:
 *   - Edit captions below
 *   - Add unmute: true to videos that should play with sound
 *   - Add text entries with { type: "text", message: "..." }
 *   - Re-running sync-media.js preserves your captions and unmute flags
 */

const mediaConfig = ${JSON.stringify(entries, null, 2)};

export default mediaConfig;
`;

  fs.writeFileSync(CONFIG_PATH, configContent);

  console.log(`\nDone! Config written with ${entries.length} entries.`);
  console.log("The site will hot-reload automatically.");
}

// ── Run once ──
run();

// ── Watch mode (default, use --no-watch to disable) ──
if (!process.argv.includes("--no-watch")) {
  let debounce = null;
  console.log("\nWatching app/public/media/ for changes... (Ctrl+C to stop)");

  fs.watch(MEDIA_DIR, { persistent: true }, (_eventType, filename) => {
    if (!filename) return;
    if (filename.startsWith("_tmp_")) return;

    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log(`\n--- Change detected: ${filename} ---`);
      run();
    }, 800);
  });
}
