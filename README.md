# NovaCut — Free CapCut Alternative

**Privacy-first • No watermarks • Local-only • Open source**

NovaCut is a browser-based video editor inspired by CapCut, built to stay free and keep your media on your device.

![Status](https://img.shields.io/badge/Status-v0.2%20Beta-00e5b0) ![License](https://img.shields.io/badge/License-MIT-green)

## Why NovaCut?

| Feature                  | CapCut            | NovaCut                |
|--------------------------|-------------------|------------------------|
| Watermark on export      | Free tier: Yes    | **Never**              |
| Your videos leave device | Yes (cloud)       | **No — 100% local**    |
| Price                    | Freemium          | **Free forever**       |
| Account required         | Yes               | **No**                 |
| Open source              | No                | **Yes (MIT)**          |

## Features (v0.2)

- Multi-track timeline (Video / Audio / Text)
- Drag & drop media + drag clips on timeline
- Text overlays with live position & style editing
- Speed, volume, trim duration controls
- Visual effects (B&W, Sepia, Contrast, Vivid, Soft, Invert…)
- Aspect ratios: 16:9, 9:16, 1:1, 4:5
- Split clips at playhead
- Undo / Redo
- Project save (JSON)
- Export to WebM (browser MediaRecorder)
- Keyboard shortcuts (Space, Delete, Ctrl+Z / Ctrl+Y)

## Quick Start

No install needed.

1. Open `index.html` in **Chrome** or Edge (best MediaRecorder support)
2. Drop a video
3. Drag it onto the timeline (or double-click)
4. Add text, effects, adjust speed
5. Export

Or serve it:

```bash
npx serve .
```

## Roadmap

- [ ] Full multi-clip composition export
- [ ] FFmpeg.wasm for high-quality MP4 + advanced processing
- [ ] Transitions
- [ ] Audio waveform
- [ ] Stickers / overlays
- [ ] Auto captions (Whisper.wasm)
- [ ] Desktop app (Tauri)
- [ ] Mobile PWA

## Tech

Pure HTML + CSS + vanilla JavaScript. Zero dependencies. Runs entirely in the browser.

## License

MIT

---

**Not affiliated with CapCut or ByteDance.**  
NovaCut is an independent educational / open-source project.
