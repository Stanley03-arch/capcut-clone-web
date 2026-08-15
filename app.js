/**
 * NovaCut — Privacy-first CapCut alternative (v0.2)
 * Local-first, no watermarks, free forever.
 */

(() => {
  // ========== STATE ==========
  const state = {
    media: [],
    tracks: [
      { id: 'v1', type: 'video', name: 'Video 1', clips: [] },
      { id: 'a1', type: 'audio', name: 'Audio 1', clips: [] },
      { id: 't1', type: 'text',  name: 'Text',    clips: [] }
    ],
    selectedClipId: null,
    selectedTextId: null,
    currentTime: 0,
    duration: 0,
    playing: false,
    pxPerSec: 60,
    aspect: '16:9',
    filter: 'none',
    history: [],
    historyIndex: -1,
    projectName: 'Untitled Project'
  };

  let clipIdCounter = 1;
  let mediaIdCounter = 1;
  let textIdCounter = 1;

  // ========== DOM ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    uploadZone: $('#uploadZone'),
    fileInput: $('#fileInput'),
    mediaGrid: $('#mediaGrid'),
    previewVideo: $('#previewVideo'),
    previewEmpty: $('#previewEmpty'),
    canvasWrapper: $('#canvasWrapper'),
    textLayer: $('#textLayer'),
    playBtn: $('#playBtn'),
    seekBar: $('#seekBar'),
    currentTime: $('#currentTime'),
    totalTime: $('#totalTime'),
    tracksContainer: $('#tracksContainer'),
    trackLabels: $('#trackLabels'),
    playhead: $('#playhead'),
    ruler: $('#ruler'),
    timelineScroll: $('#timelineScroll'),
    inspector: $('#inspector'),
    exportBtn: $('#exportBtn'),
    exportModal: $('#exportModal'),
    zoomSlider: $('#zoomSlider'),
    aspectSelect: $('#aspectSelect'),
    undoBtn: $('#undoBtn'),
    redoBtn: $('#redoBtn')
  };

  // ========== UTILS ==========
  function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${sec.padStart(4, '0')}`;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ========== HISTORY ==========
  function pushHistory() {
    const snapshot = JSON.stringify({
      tracks: state.tracks,
      filter: state.filter
    });
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    state.historyIndex++;
    if (state.history.length > 50) {
      state.history.shift();
      state.historyIndex--;
    }
    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
    updateHistoryButtons();
  }

  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
    updateHistoryButtons();
  }

  function restoreSnapshot(snap) {
    const data = JSON.parse(snap);
    state.tracks = data.tracks;
    state.filter = data.filter;
    renderTimeline();
    applyFilter();
    renderInspector();
  }

  function updateHistoryButtons() {
    els.undoBtn.disabled = state.historyIndex <= 0;
    els.redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  }

  // ========== MEDIA ==========
  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) return;

      const url = URL.createObjectURL(file);
      const id = `media_${mediaIdCounter++}`;
      const isVideo = file.type.startsWith('video/');

      const mediaItem = {
        id,
        name: file.name,
        type: isVideo ? 'video' : 'audio',
        url,
        duration: 0,
        file
      };

      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          mediaItem.duration = video.duration;
          renderMediaGrid();
        };
      } else {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          mediaItem.duration = audio.duration;
          renderMediaGrid();
        };
      }

      state.media.push(mediaItem);
      renderMediaGrid();
    });
  }

  function renderMediaGrid() {
    els.mediaGrid.innerHTML = state.media.map(m => `
      <div class="media-card" draggable="true" data-id="${m.id}">
        ${m.type === 'video'
          ? `<video src="${m.url}" muted></video>`
          : `<div class="thumb" style="display:grid;place-items:center;height:60px;background:#1a1a2e;font-size:24px;">🎵</div>`}
        <div class="name">${m.name}</div>
        ${m.duration ? `<span class="duration">${formatTime(m.duration)}</span>` : ''}
      </div>
    `).join('');

    $$('.media-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('mediaId', card.dataset.id);
      });
      card.addEventListener('dblclick', () => {
        addClipFromMedia(card.dataset.id);
      });
    });
  }

  function addClipFromMedia(mediaId, trackId = null, startTime = null) {
    const media = state.media.find(m => m.id === mediaId);
    if (!media) return;

    const track = trackId
      ? state.tracks.find(t => t.id === trackId)
      : state.tracks.find(t => t.type === media.type) || state.tracks[0];

    if (!track) return;

    let start = startTime ?? state.currentTime;
    if (track.clips.length && startTime === null) {
      const last = track.clips.reduce((a, c) => (c.start + c.duration > a.start + a.duration ? c : a), track.clips[0]);
      start = Math.max(start, last.start + last.duration);
    }

    const clip = {
      id: `clip_${clipIdCounter++}`,
      mediaId: media.id,
      name: media.name,
      type: media.type,
      start,
      duration: media.duration || 5,
      offset: 0,
      speed: 1,
      volume: 1
    };

    track.clips.push(clip);
    pushHistory();
    updateProjectDuration();
    renderTimeline();
    selectClip(clip.id);
    els.exportBtn.disabled = false;
    els.playBtn.disabled = false;
    els.seekBar.disabled = false;
    els.previewEmpty.style.display = 'none';
  }

  // ========== TIMELINE ==========
  function updateProjectDuration() {
    let max = 0;
    state.tracks.forEach(t => {
      t.clips.forEach(c => {
        max = Math.max(max, c.start + c.duration);
      });
    });
    state.duration = Math.max(max, 1);
    els.totalTime.textContent = formatTime(state.duration);
    els.seekBar.max = state.duration * 1000;
    renderRuler();
  }

  function renderRuler() {
    const width = state.duration * state.pxPerSec + 200;
    els.ruler.style.width = width + 'px';
    els.tracksContainer.style.width = width + 'px';

    let html = '';
    const step = state.pxPerSec >= 80 ? 1 : state.pxPerSec >= 40 ? 2 : 5;
    for (let t = 0; t <= state.duration + 5; t += step) {
      html += `<div class="ruler-mark" style="left:${t * state.pxPerSec}px">${formatTime(t)}</div>`;
    }
    els.ruler.innerHTML = html;
  }

  function renderTimeline() {
    els.trackLabels.innerHTML = state.tracks.map(t =>
      `<div class="track-label">${t.name}</div>`
    ).join('');

    document.documentElement.style.setProperty('--px-per-sec', state.pxPerSec + 'px');

    els.tracksContainer.innerHTML = state.tracks.map(track => {
      const clipsHtml = track.clips.map(clip => {
        const left = clip.start * state.pxPerSec;
        const width = Math.max(clip.duration * state.pxPerSec, 20);
        const selected = clip.id === state.selectedClipId ? 'selected' : '';
        return `
          <div class="clip ${clip.type} ${selected}"
               data-id="${clip.id}"
               data-track="${track.id}"
               style="left:${left}px;width:${width}px"
               title="${clip.name}">
            <span class="clip-name">${clip.name}</span>
          </div>
        `;
      }).join('');

      return `<div class="track-row" data-track="${track.id}">${clipsHtml}</div>`;
    }).join('');

    $$('.clip').forEach(el => {
      el.addEventListener('mousedown', onClipMouseDown);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectClip(el.dataset.id);
      });
    });

    $$('.track-row').forEach(row => {
      row.addEventListener('dragover', e => e.preventDefault());
      row.addEventListener('drop', e => {
        e.preventDefault();
        const mediaId = e.dataTransfer.getData('mediaId');
        if (mediaId) {
          const rect = row.getBoundingClientRect();
          const x = e.clientX - rect.left + els.timelineScroll.scrollLeft;
          const time = x / state.pxPerSec;
          addClipFromMedia(mediaId, row.dataset.track, Math.max(0, time));
        }
      });
    });

    updatePlayhead();
  }

  let dragClip = null;
  let dragStartX = 0;
  let dragOrigStart = 0;

  function onClipMouseDown(e) {
    if (e.button !== 0) return;
    const clipEl = e.currentTarget;
    const clip = findClip(clipEl.dataset.id);
    if (!clip) return;

    selectClip(clip.id);
    dragClip = clip;
    dragStartX = e.clientX;
    dragOrigStart = clip.start;

    const onMove = (ev) => {
      const dx = ev.clientX - dragStartX;
      const dt = dx / state.pxPerSec;
      clip.start = Math.max(0, dragOrigStart + dt);
      renderTimeline();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (dragClip) {
        pushHistory();
        updateProjectDuration();
        renderTimeline();
      }
      dragClip = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function findClip(id) {
    for (const t of state.tracks) {
      const c = t.clips.find(c => c.id === id);
      if (c) return c;
    }
    return null;
  }

  function findTrackOfClip(id) {
    return state.tracks.find(t => t.clips.some(c => c.id === id));
  }

  function selectClip(id) {
    state.selectedClipId = id;
    state.selectedTextId = null;
    renderTimeline();
    renderInspector();
    const clip = findClip(id);
    if (clip && clip.type === 'video') {
      const media = state.media.find(m => m.id === clip.mediaId);
      if (media) {
        els.previewVideo.src = media.url;
        els.previewVideo.currentTime = clip.offset || 0;
      }
    }
  }

  function deleteSelected() {
    if (!state.selectedClipId) return;
    const track = findTrackOfClip(state.selectedClipId);
    if (!track) return;
    track.clips = track.clips.filter(c => c.id !== state.selectedClipId);
    state.selectedClipId = null;
    pushHistory();
    updateProjectDuration();
    renderTimeline();
    renderInspector();
  }

  // ========== TEXT ==========
  function addText(style = 'title') {
    const presets = {
      title:    { text: 'Your Title', size: 48, weight: 700, y: 30 },
      subtitle: { text: 'Subtitle text', size: 28, weight: 500, y: 55 },
      caption:  { text: 'Caption goes here', size: 22, weight: 400, y: 80 }
    };
    const p = presets[style] || presets.title;

    const textTrack = state.tracks.find(t => t.type === 'text') || state.tracks[2];
    const clip = {
      id: `text_${textIdCounter++}`,
      type: 'text',
      name: p.text,
      text: p.text,
      start: state.currentTime,
      duration: 4,
      style: {
        fontSize: p.size,
        fontWeight: p.weight,
        color: '#ffffff',
        x: 50,
        y: p.y,
        align: 'center'
      }
    };

    textTrack.clips.push(clip);
    pushHistory();
    updateProjectDuration();
    renderTimeline();
    selectClip(clip.id);
    renderTextLayer();
  }

  function renderTextLayer() {
    const time = state.currentTime;
    const texts = [];
    state.tracks.filter(t => t.type === 'text').forEach(t => {
      t.clips.forEach(c => {
        if (time >= c.start && time < c.start + c.duration) {
          texts.push(c);
        }
      });
    });

    els.textLayer.innerHTML = texts.map(t => `
      <div class="text-item ${t.id === state.selectedClipId ? 'selected' : ''}"
           data-id="${t.id}"
           style="
             left:${t.style.x}%;
             top:${t.style.y}%;
             transform:translate(-50%, -50%);
             font-size:${t.style.fontSize}px;
             font-weight:${t.style.fontWeight};
             color:${t.style.color};
             text-align:${t.style.align};
           ">${escapeHtml(t.text)}</div>
    `).join('');

    $$('.text-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectClip(el.dataset.id);
        const clip = findClip(el.dataset.id);
        if (!clip) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = clip.style.x;
        const origY = clip.style.y;
        const rect = els.canvasWrapper.getBoundingClientRect();

        const onMove = (ev) => {
          const dx = ((ev.clientX - startX) / rect.width) * 100;
          const dy = ((ev.clientY - startY) / rect.height) * 100;
          clip.style.x = clamp(origX + dx, 5, 95);
          clip.style.y = clamp(origY + dy, 5, 95);
          renderTextLayer();
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          pushHistory();
          renderInspector();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
  }

  // ========== INSPECTOR ==========
  function renderInspector() {
    const clip = state.selectedClipId ? findClip(state.selectedClipId) : null;
    if (!clip) {
      els.inspector.innerHTML = `<div class="empty-inspector">Select a clip or text to edit</div>`;
      return;
    }

    if (clip.type === 'text') {
      els.inspector.innerHTML = `
        <div class="insp-group">
          <label>Text</label>
          <textarea id="inspText" rows="2">${escapeHtml(clip.text)}</textarea>
        </div>
        <div class="insp-group">
          <label>Font Size</label>
          <input type="range" id="inspSize" min="12" max="96" value="${clip.style.fontSize}">
          <div class="value-display">${clip.style.fontSize}px</div>
        </div>
        <div class="insp-group">
          <label>Color</label>
          <input type="color" id="inspColor" value="${clip.style.color}">
        </div>
        <div class="insp-group">
          <label>Duration (s)</label>
          <input type="number" id="inspDur" min="0.5" step="0.1" value="${clip.duration.toFixed(1)}">
        </div>
        <div class="insp-group">
          <label>Start (s)</label>
          <input type="number" id="inspStart" min="0" step="0.1" value="${clip.start.toFixed(1)}">
        </div>
      `;

      $('#inspText').oninput = (e) => {
        clip.text = e.target.value;
        clip.name = e.target.value.slice(0, 20);
        renderTextLayer();
        renderTimeline();
      };
      $('#inspSize').oninput = (e) => {
        clip.style.fontSize = +e.target.value;
        e.target.nextElementSibling.textContent = e.target.value + 'px';
        renderTextLayer();
      };
      $('#inspColor').oninput = (e) => {
        clip.style.color = e.target.value;
        renderTextLayer();
      };
      $('#inspDur').onchange = (e) => {
        clip.duration = Math.max(0.5, +e.target.value);
        pushHistory();
        updateProjectDuration();
        renderTimeline();
      };
      $('#inspStart').onchange = (e) => {
        clip.start = Math.max(0, +e.target.value);
        pushHistory();
        updateProjectDuration();
        renderTimeline();
      };
    } else {
      els.inspector.innerHTML = `
        <div class="insp-group">
          <label>Name</label>
          <input type="text" id="inspName" value="${escapeHtml(clip.name)}">
        </div>
        <div class="insp-group">
          <label>Speed</label>
          <input type="range" id="inspSpeed" min="0.25" max="2" step="0.25" value="${clip.speed}">
          <div class="value-display">${clip.speed}x</div>
        </div>
        <div class="insp-group">
          <label>Volume</label>
          <input type="range" id="inspVol" min="0" max="1" step="0.05" value="${clip.volume}">
          <div class="value-display">${Math.round(clip.volume * 100)}%</div>
        </div>
        <div class="insp-group">
          <label>Start (s)</label>
          <input type="number" id="inspStart" min="0" step="0.1" value="${clip.start.toFixed(1)}">
        </div>
        <div class="insp-group">
          <label>Duration (s)</label>
          <input type="number" id="inspDur" min="0.1" step="0.1" value="${clip.duration.toFixed(1)}">
        </div>
      `;

      $('#inspName').onchange = (e) => {
        clip.name = e.target.value;
        renderTimeline();
      };
      $('#inspSpeed').oninput = (e) => {
        clip.speed = +e.target.value;
        e.target.nextElementSibling.textContent = e.target.value + 'x';
        els.previewVideo.playbackRate = clip.speed;
      };
      $('#inspVol').oninput = (e) => {
        clip.volume = +e.target.value;
        e.target.nextElementSibling.textContent = Math.round(clip.volume * 100) + '%';
        els.previewVideo.volume = clip.volume;
      };
      $('#inspStart').onchange = (e) => {
        clip.start = Math.max(0, +e.target.value);
        pushHistory();
        updateProjectDuration();
        renderTimeline();
      };
      $('#inspDur').onchange = (e) => {
        clip.duration = Math.max(0.1, +e.target.value);
        pushHistory();
        updateProjectDuration();
        renderTimeline();
      };
    }
  }

  // ========== PLAYBACK ==========
  function updatePlayhead() {
    const x = state.currentTime * state.pxPerSec;
    els.playhead.style.left = x + 'px';
  }

  function setCurrentTime(t) {
    state.currentTime = clamp(t, 0, state.duration);
    els.currentTime.textContent = formatTime(state.currentTime);
    els.seekBar.value = state.currentTime * 1000;
    updatePlayhead();
    renderTextLayer();

    const videoTrack = state.tracks.find(t => t.type === 'video');
    if (videoTrack) {
      const active = videoTrack.clips.find(c =>
        state.currentTime >= c.start && state.currentTime < c.start + c.duration
      );
      if (active) {
        const media = state.media.find(m => m.id === active.mediaId);
        if (media && els.previewVideo.src !== media.url) {
          els.previewVideo.src = media.url;
        }
        const localTime = (state.currentTime - active.start) * active.speed + (active.offset || 0);
        if (Math.abs(els.previewVideo.currentTime - localTime) > 0.15) {
          els.previewVideo.currentTime = localTime;
        }
        els.previewVideo.playbackRate = active.speed;
        els.previewVideo.volume = active.volume;
      }
    }
  }

  let rafId = null;
  function tick() {
    if (!state.playing) return;
    setCurrentTime(state.currentTime + 1/30);
    if (state.currentTime >= state.duration) {
      pause();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (state.duration <= 0) return;
    state.playing = true;
    els.playBtn.textContent = '⏸';
    els.previewVideo.play().catch(() => {});
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    els.playBtn.textContent = '▶';
    els.previewVideo.pause();
    if (rafId) cancelAnimationFrame(rafId);
  }

  function togglePlay() {
    state.playing ? pause() : play();
  }

  // ========== FILTERS ==========
  function applyFilter(name) {
    if (name !== undefined) state.filter = name;
    els.previewVideo.className = '';
    if (state.filter !== 'none') {
      els.previewVideo.classList.add('filter-' + state.filter);
    }
    $$('.effect-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === state.filter);
    });
  }

  // ========== ASPECT RATIO ==========
  function setAspect(ratio) {
    state.aspect = ratio;
    const [w, h] = ratio.split(':').map(Number);
    const stage = $('#previewStage');
    const maxW = stage.clientWidth - 40;
    const maxH = stage.clientHeight - 40;
    let width = maxW;
    let height = width * (h / w);
    if (height > maxH) {
      height = maxH;
      width = height * (w / h);
    }
    els.canvasWrapper.style.width = width + 'px';
    els.canvasWrapper.style.height = height + 'px';
  }

  // ========== EXPORT ==========
  function openExportModal() {
    els.exportModal.hidden = false;
  }

  function closeExportModal() {
    els.exportModal.hidden = true;
    $('#exportProgress').hidden = true;
  }

  async function startExport() {
    const progress = $('#exportProgress');
    const fill = $('#progressFill');
    const text = $('#progressText');
    progress.hidden = false;

    const videoTrack = state.tracks.find(t => t.type === 'video');
    if (!videoTrack || !videoTrack.clips.length) {
      alert('No video clips to export');
      return;
    }

    const firstClip = videoTrack.clips[0];
    const media = state.media.find(m => m.id === firstClip.mediaId);
    if (!media) return;

    text.textContent = 'Recording...';
    fill.style.width = '10%';

    const canvas = document.createElement('canvas');
    const res = +$('#exportRes').value;
    const aspect = state.aspect.split(':').map(Number);
    canvas.width = res === 1080 ? (aspect[0] > aspect[1] ? 1920 : 1080) : res === 720 ? (aspect[0] > aspect[1] ? 1280 : 720) : 854;
    canvas.height = Math.round(canvas.width * (aspect[1] / aspect[0]));

    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `novacut-export-${Date.now()}.webm`;
      a.click();
      text.textContent = 'Done!';
      fill.style.width = '100%';
      setTimeout(closeExportModal, 800);
    };

    const vid = els.previewVideo;
    vid.src = media.url;
    vid.currentTime = firstClip.offset || 0;
    await vid.play();

    recorder.start();
    fill.style.width = '30%';

    const start = performance.now();
    const durMs = firstClip.duration * 1000;

    function draw() {
      const elapsed = performance.now() - start;
      if (elapsed >= durMs || vid.paused) {
        recorder.stop();
        vid.pause();
        return;
      }
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

      const t = elapsed / 1000 + firstClip.start;
      state.tracks.filter(tr => tr.type === 'text').forEach(tr => {
        tr.clips.forEach(c => {
          if (t >= c.start && t < c.start + c.duration) {
            ctx.font = `${c.style.fontWeight} ${c.style.fontSize * (canvas.width / 600)}px Inter, sans-serif`;
            ctx.fillStyle = c.style.color;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 8;
            ctx.fillText(c.text, canvas.width * (c.style.x / 100), canvas.height * (c.style.y / 100));
          }
        });
      });

      fill.style.width = (30 + (elapsed / durMs) * 60) + '%';
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ========== PROJECT SAVE ==========
  function saveProject() {
    const data = {
      version: 2,
      name: state.projectName,
      tracks: state.tracks,
      filter: state.filter,
      aspect: state.aspect,
      mediaMeta: state.media.map(m => ({ id: m.id, name: m.name, type: m.type, duration: m.duration }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'novacut-project.json';
    a.click();
  }

  // ========== EVENTS ==========
  function initEvents() {
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        $$('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        $(`#tab-${tab.dataset.tab}`).classList.add('active');
      });
    });

    els.uploadZone.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', e => handleFiles(e.target.files));
    els.uploadZone.addEventListener('dragover', e => { e.preventDefault(); els.uploadZone.classList.add('dragover'); });
    els.uploadZone.addEventListener('dragleave', () => els.uploadZone.classList.remove('dragover'));
    els.uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      els.uploadZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    els.playBtn.addEventListener('click', togglePlay);
    $('#skipBack').addEventListener('click', () => setCurrentTime(state.currentTime - 5));
    $('#skipForward').addEventListener('click', () => setCurrentTime(state.currentTime + 5));
    els.seekBar.addEventListener('input', e => setCurrentTime(+e.target.value / 1000));

    els.zoomSlider.addEventListener('input', e => {
      state.pxPerSec = +e.target.value;
      renderRuler();
      renderTimeline();
    });

    els.aspectSelect.addEventListener('change', e => setAspect(e.target.value));
    window.addEventListener('resize', () => setAspect(state.aspect));

    $('#addTextBtn').addEventListener('click', () => addText('title'));
    $$('.preset').forEach(btn => {
      btn.addEventListener('click', () => addText(btn.dataset.style));
    });

    $$('.effect-item').forEach(btn => {
      btn.addEventListener('click', () => {
        applyFilter(btn.dataset.filter);
        pushHistory();
      });
    });

    $('#deleteClipBtn').addEventListener('click', deleteSelected);
    $('#splitBtn').addEventListener('click', () => {
      const clip = state.selectedClipId ? findClip(state.selectedClipId) : null;
      if (!clip || clip.type === 'text') return;
      if (state.currentTime <= clip.start || state.currentTime >= clip.start + clip.duration) return;

      const splitAt = state.currentTime - clip.start;
      const newClip = { ...clip, id: `clip_${clipIdCounter++}`, start: state.currentTime, duration: clip.duration - splitAt, offset: (clip.offset || 0) + splitAt };
      clip.duration = splitAt;
      const track = findTrackOfClip(clip.id);
      track.clips.push(newClip);
      pushHistory();
      renderTimeline();
    });

    $('#addTrackBtn').addEventListener('click', () => {
      const id = `v${state.tracks.length + 1}`;
      state.tracks.push({ id, type: 'video', name: `Video ${state.tracks.filter(t=>t.type==='video').length + 1}`, clips: [] });
      renderTimeline();
    });

    els.undoBtn.addEventListener('click', undo);
    els.redoBtn.addEventListener('click', redo);

    els.exportBtn.addEventListener('click', openExportModal);
    $('#cancelExport').addEventListener('click', closeExportModal);
    $('#startExport').addEventListener('click', startExport);

    $('#saveProjectBtn').addEventListener('click', saveProject);

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'Delete' || e.code === 'Backspace') deleteSelected();
      if (e.ctrlKey && e.code === 'KeyZ') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.code === 'KeyY') { e.preventDefault(); redo(); }
    });

    els.tracksContainer.addEventListener('click', () => {
      state.selectedClipId = null;
      renderTimeline();
      renderInspector();
    });
  }

  // ========== INIT ==========
  function init() {
    initEvents();
    renderTimeline();
    setAspect('16:9');
    pushHistory();
    console.log('NovaCut v0.2 ready — local-first, no watermarks.');
  }

  init();
})();
