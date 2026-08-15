# NovaCut — Free CapCut Alternative

**Privacy-first • No watermarks • Local-only • Open source**

NovaCut is a browser-based video editor inspired by CapCut, built to stay free and keep your media on your device.

![Status](https://img.shields.io/badge/Status-v0.3%20Beta-00e5b0) ![License](https://img.shields.io/badge/License-MIT-green)

## Why NovaCut?

| Feature                  | CapCut            | NovaCut                |
|--------------------------|-------------------|------------------------|
| Watermark on export      | Free tier: Yes    | **Never**              |
| Your videos leave device | Yes (cloud)       | **No — 100% local**    |
| Price                    | Freemium          | **Free forever**       |
| Account required         | Yes               | **No**                 |
| Open source              | No                | **Yes (MIT)**          |

## Features (v0.3)

- Multi-track timeline (Video / Audio / Text)
- **Mute / Solo** per track
- **Magnetic snap** when dragging clips
- **Transitions** (None, Fade, Crossfade, Slide)
- Drag & drop media + drag clips on timeline
- Text overlays (live position, size, color)
- Speed, volume, duration controls
- Visual effects (B&W, Sepia, Contrast, Vivid, Soft, Invert…)
- **Basic audio/video waveforms** on clips
- Aspect ratios: 16:9, 9:16, 1:1, 4:5
- Split clips at playhead
- Undo / Redo
- Project save (JSON)
- **Improved multi-clip export** to WebM
- Keyboard shortcuts (Space, Delete, Ctrl+Z / Ctrl+Y)

## Quick Start

No install needed.

1. Open `index.html` in **Chrome** or Edge
2. Drop a video
3. Drag it onto the timeline (or double-click)
4. Add text, effects, transitions
5. Mute/Solo tracks as needed
6. Export

Or serve it:

```bash
npx serve .
```

## Roadmap

- [x] Multi-clip export sequencing
- [x] Transitions
- [x] Mute / Solo
- [x] Snap timeline
- [x] Waveforms (visual)
- [ ] FFmpeg.wasm for high-quality MP4
- [ ] Real audio waveform analysis
- [ ] Auto captions
- [ ] Desktop app (Tauri)

## Tech

Pure HTML + CSS + vanilla JavaScript. Zero dependencies. Runs entirely in the browser.

## License

MIT

---

**Not affiliated with CapCut or ByteDance.**
