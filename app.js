// CapCut Clone - Basic Web Video Editor
// Simple client-side video editor prototype

const videoInput = document.getElementById('videoInput');
const uploadArea = document.getElementById('uploadArea');
const previewVideo = document.getElementById('previewVideo');
const placeholder = document.getElementById('placeholder');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const speedControl = document.getElementById('speedControl');
const speedValue = document.getElementById('speedValue');
const volumeControl = document.getElementById('volumeControl');
const trimStart = document.getElementById('trimStart');
const trimEnd = document.getElementById('trimEnd');
const filterSelect = document.getElementById('filterSelect');
const applyTrimBtn = document.getElementById('applyTrimBtn');
const exportBtn = document.getElementById('exportBtn');
const mediaList = document.getElementById('mediaList');
const mainClip = document.getElementById('mainClip');
const playhead = document.getElementById('playhead');

let currentVideoUrl = null;
let isPlaying = false;
let trimStartTime = 0;
let trimEndTime = 0;

// Upload handling
uploadArea.addEventListener('click', () => videoInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

videoInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.type.startsWith('video/')) {
    alert('Please upload a video file.');
    return;
  }

  // Clean previous
  if (currentVideoUrl) {
    URL.revokeObjectURL(currentVideoUrl);
  }

  currentVideoUrl = URL.createObjectURL(file);
  previewVideo.src = currentVideoUrl;
  previewVideo.classList.add('active');
  placeholder.style.display = 'none';

  // Enable controls
  enableControls(true);

  // Add to media list
  mediaList.innerHTML = `
    <div class="media-item">
      <span>🎥</span>
      <span>${file.name}</span>
    </div>
  `;

  // Show clip on timeline
  mainClip.style.display = 'flex';
  mainClip.querySelector('.clip-name').textContent = file.name.substring(0, 20);

  previewVideo.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(previewVideo.duration);
    seekBar.max = previewVideo.duration;
    trimEnd.value = previewVideo.duration.toFixed(1);
    trimEndTime = previewVideo.duration;
    trimStart.value = 0;
    trimStartTime = 0;

    // Set clip width based on duration (rough scale: 50px per second)
    const clipWidth = Math.min(Math.max(previewVideo.duration * 50, 80), 800);
    mainClip.style.width = clipWidth + 'px';
  });
}

function enableControls(enabled) {
  playPauseBtn.disabled = !enabled;
  seekBar.disabled = !enabled;
  speedControl.disabled = !enabled;
  volumeControl.disabled = !enabled;
  trimStart.disabled = !enabled;
  trimEnd.disabled = !enabled;
  filterSelect.disabled = !enabled;
  applyTrimBtn.disabled = !enabled;
  exportBtn.disabled = !enabled;
}

// Playback
playPauseBtn.addEventListener('click', togglePlay);

function togglePlay() {
  if (previewVideo.paused) {
    previewVideo.play();
    playPauseBtn.textContent = '⏸️';
    isPlaying = true;
  } else {
    previewVideo.pause();
    playPauseBtn.textContent = '▶️';
    isPlaying = false;
  }
}

previewVideo.addEventListener('timeupdate', () => {
  currentTimeEl.textContent = formatTime(previewVideo.currentTime);
  seekBar.value = previewVideo.currentTime;

  // Update playhead position (rough: 50px per second + 60px label offset)
  const pos = 60 + (previewVideo.currentTime * 50);
  playhead.style.left = pos + 'px';

  // Loop within trim if set
  if (trimEndTime > 0 && previewVideo.currentTime >= trimEndTime) {
    previewVideo.currentTime = trimStartTime;
  }
});

seekBar.addEventListener('input', () => {
  previewVideo.currentTime = seekBar.value;
});

// Speed
speedControl.addEventListener('input', () => {
  const speed = parseFloat(speedControl.value);
  previewVideo.playbackRate = speed;
  speedValue.textContent = speed + 'x';
});

// Volume
volumeControl.addEventListener('input', () => {
  previewVideo.volume = volumeControl.value;
});

// Filters
filterSelect.addEventListener('change', () => {
  // Remove previous filters
  previewVideo.className = 'preview-video active';
  const filter = filterSelect.value;
  if (filter !== 'none') {
    previewVideo.classList.add('filter-' + filter);
  }
});

// Trim
applyTrimBtn.addEventListener('click', () => {
  trimStartTime = parseFloat(trimStart.value) || 0;
  trimEndTime = parseFloat(trimEnd.value) || previewVideo.duration;

  if (trimStartTime >= trimEndTime) {
    alert('Start time must be less than end time');
    return;
  }

  previewVideo.currentTime = trimStartTime;
  
  // Update clip visual
  const duration = trimEndTime - trimStartTime;
  const clipWidth = Math.min(Math.max(duration * 50, 80), 800);
  mainClip.style.width = clipWidth + 'px';
  mainClip.style.left = (trimStartTime * 50) + 'px';

  alert(`Trim applied: ${trimStartTime.toFixed(1)}s → ${trimEndTime.toFixed(1)}s`);
});

// Export (basic - records the current playback with filters)
exportBtn.addEventListener('click', async () => {
  if (!currentVideoUrl) return;

  exportBtn.textContent = 'Exporting...';
  exportBtn.disabled = true;

  try {
    // Create a temporary canvas to apply filters and record
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Wait for video to be ready
    await new Promise(resolve => {
      if (previewVideo.readyState >= 2) resolve();
      else previewVideo.addEventListener('loadeddata', resolve, { once: true });
    });

    canvas.width = previewVideo.videoWidth || 1280;
    canvas.height = previewVideo.videoHeight || 720;

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'capcut-clone-export.webm';
      a.click();
      URL.revokeObjectURL(url);

      exportBtn.textContent = 'Export';
      exportBtn.disabled = false;
      previewVideo.pause();
      playPauseBtn.textContent = '▶️';
    };

    // Start from trim
    previewVideo.currentTime = trimStartTime;
    previewVideo.playbackRate = parseFloat(speedControl.value);
    
    mediaRecorder.start();
    previewVideo.play();

    // Draw frames
    function drawFrame() {
      if (previewVideo.currentTime >= trimEndTime || previewVideo.paused) {
        mediaRecorder.stop();
        return;
      }
      ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    }
    drawFrame();

  } catch (err) {
    console.error(err);
    alert('Export failed: ' + err.message + '\n\nNote: This is a basic browser export. For production use FFmpeg.wasm or a backend.');
    exportBtn.textContent = 'Export';
    exportBtn.disabled = false;
  }
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  
  if (e.code === 'Space') {
    e.preventDefault();
    if (!playPauseBtn.disabled) togglePlay();
  }
});
