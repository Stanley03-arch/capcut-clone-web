# CapCut Clone - Web Video Editor

A **basic CapCut-inspired video editor** built with pure HTML, CSS, and JavaScript. This is a starter/prototype project demonstrating core video editing concepts in the browser.

![CapCut Clone](https://img.shields.io/badge/Status-Prototype-orange) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 📁 **Drag & drop / click to upload** video files (MP4, WebM, MOV)
- ▶️ **Playback controls** with seek bar
- ⏱️ **Speed control** (0.25x – 2x)
- 🔊 **Volume control**
- ✂️ **Trim** start/end points
- 🎨 **Basic filters** (Grayscale, Sepia, Contrast, Brightness, Blur)
- 📜 **Simple timeline** with visual clip representation
- 💾 **Export** to WebM (browser MediaRecorder + canvas)
- ⌨️ Spacebar to play/pause

## 🚀 Quick Start

Just open `index.html` in a modern browser (Chrome/Edge/Firefox recommended).

No build step required — pure client-side.

```bash
# Or serve locally
npx serve .
# Then open http://localhost:3000
```

## ⚠️ Limitations (This is a Prototype)

This is **not** a full CapCut replacement. Real video editors require:

- Multi-track timeline with drag-and-drop clips
- Transitions, effects, text overlays, stickers
- Audio mixing & waveform visualization
- Keyframe animations
- High-quality export (H.264/H.265) via FFmpeg
- GPU-accelerated rendering
- Project saving / undo-redo history

### Recommended Next Steps for a Real Clone

1. **Use existing open-source projects**:
   - [OpenCut](https://github.com/OpenCut-app/OpenCut) — the leading open-source CapCut alternative (70k+ stars)
   - [Editkub](https://github.com/9teeedev/editkub) — browser-based fork
   - [WannaCut](https://github.com/ter-9001/WannaCut)

2. **Tech stack ideas for a serious project**:
   - Frontend: React / Vue + PixiJS or WebGL for rendering
   - Core: FFmpeg.wasm or a Rust/WebAssembly video engine
   - Desktop: Tauri or Electron
   - Timeline: Custom canvas-based multi-track UI

3. **Add FFmpeg.wasm** for real trim/export/transcoding

## 📁 Project Structure

```
capcut-clone-web/
├── index.html      # Main UI
├── styles.css      # CapCut-inspired dark theme
├── app.js          # Editor logic
└── README.md
```

## 🛠️ Roadmap (if continuing)

- [ ] Multi-clip support
- [ ] Text overlays
- [ ] Transitions
- [ ] Audio track
- [ ] Undo / Redo
- [ ] FFmpeg.wasm integration
- [ ] Project save/load (IndexedDB)
- [ ] Mobile responsive improvements

## License

MIT — free to use, modify, and distribute.

---

**Note**: CapCut is a trademark of ByteDance. This is an independent educational prototype and is not affiliated with CapCut or ByteDance.
