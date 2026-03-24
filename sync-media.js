/**
 * Media Sync Script
 *
 * Run: node sync-media.js
 *
 * What it does:
 *   1. Scans the /media folder
 *   2. Renames photos → photo1.jpeg, photo2.jpeg, ...
 *   3. Renames videos → video1.mp4, video2.mp4, ...
 *   4. Keeps audio files as bg-music (first .mp3 found)
 *   5. Copies everything to app/public/media/
 *   6. Regenerates app/src/mediaConfig.js
 *
 * Just drag & drop files into /media and run this script!
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MEDIA_DIR = path.join(ROOT, "media");
const PUBLIC_MEDIA = path.join(ROOT, "app", "public", "media");
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
  // Ensure directories exist
  if (!fs.existsSync(MEDIA_DIR)) {
    console.log("No media/ folder found. Create one and add your files.");
    return;
  }
  fs.mkdirSync(PUBLIC_MEDIA, { recursive: true });

  // Read all files
  const files = fs.readdirSync(MEDIA_DIR).filter((f) => {
    return fs.statSync(path.join(MEDIA_DIR, f)).isFile();
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

  // Clear public media folder
  const existing = fs.readdirSync(PUBLIC_MEDIA);
  for (const f of existing) {
    fs.unlinkSync(path.join(PUBLIC_MEDIA, f));
  }

  // Rename & copy photos
  const photoMap = [];
  photos.forEach((file, i) => {
    const ext = path.extname(file).toLowerCase();
    const newName = `photo${i + 1}${ext}`;
    const oldPath = path.join(MEDIA_DIR, file);
    const renamedPath = path.join(MEDIA_DIR, newName);
    const publicPath = path.join(PUBLIC_MEDIA, newName);

    // Rename in media folder (skip if already named correctly)
    if (file !== newName) {
      // Avoid collision: rename to temp first if target exists
      if (fs.existsSync(renamedPath)) {
        const tmpName = `_tmp_${newName}`;
        fs.renameSync(oldPath, path.join(MEDIA_DIR, tmpName));
        fs.renameSync(path.join(MEDIA_DIR, tmpName), renamedPath);
      } else {
        fs.renameSync(oldPath, renamedPath);
      }
      console.log(`  ${file} → ${newName}`);
    }

    fs.copyFileSync(renamedPath, publicPath);
    photoMap.push(newName);
  });

  // Rename & copy videos
  const videoMap = [];
  videos.forEach((file, i) => {
    const ext = path.extname(file).toLowerCase();
    const newName = `video${i + 1}${ext}`;
    const oldPath = path.join(MEDIA_DIR, file);
    const renamedPath = path.join(MEDIA_DIR, newName);
    const publicPath = path.join(PUBLIC_MEDIA, newName);

    if (file !== newName) {
      if (fs.existsSync(renamedPath)) {
        const tmpName = `_tmp_${newName}`;
        fs.renameSync(oldPath, path.join(MEDIA_DIR, tmpName));
        fs.renameSync(path.join(MEDIA_DIR, tmpName), renamedPath);
      } else {
        fs.renameSync(oldPath, renamedPath);
      }
      console.log(`  ${file} → ${newName}`);
    }

    fs.copyFileSync(renamedPath, publicPath);
    videoMap.push(newName);
  });

  // Copy audio
  if (audioFile) {
    const audioSrc = path.join(MEDIA_DIR, audioFile);
    const audioDst = path.join(PUBLIC_MEDIA, "bg-music.mp3");
    if (audioFile !== "bg-music.mp3") {
      const renamedAudio = path.join(MEDIA_DIR, "bg-music.mp3");
      fs.renameSync(audioSrc, renamedAudio);
      console.log(`  ${audioFile} → bg-music.mp3`);
      fs.copyFileSync(renamedAudio, audioDst);
    } else {
      fs.copyFileSync(audioSrc, audioDst);
    }
  }

  // Generate mediaConfig.js
  // Read existing config to preserve unmute flags and captions
  let existingConfig = [];
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const match = raw.match(/const mediaConfig = (\[[\s\S]*?\]);/);
    if (match) {
      existingConfig = eval(match[1]);
    }
  } catch {}

  // Build lookup for existing captions/unmute by src
  const existingLookup = {};
  for (const item of existingConfig) {
    if (item.src) existingLookup[item.src] = item;
  }

  // Interleave photos and videos nicely, with text breaks
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

  // Pattern: photo, video, photo, text, photo, video, photo, text...
  while (pi < totalPhotos || vi < totalVideos) {
    // Add a photo
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

    // Add a video
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

    // Add a text interlude every 2-3 items
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
 * To update: add/remove files from /media and run: node sync-media.js
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
  console.log("\nWatching media/ folder for changes... (Ctrl+C to stop)");

  fs.watch(MEDIA_DIR, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    // Ignore temp files
    if (filename.startsWith("_tmp_")) return;

    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log(`\n--- Change detected: ${filename} ---`);
      run();
    }, 800); // wait 800ms for drag-and-drop batches to finish
  });
}
