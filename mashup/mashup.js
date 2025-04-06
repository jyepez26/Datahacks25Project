const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const PIXELS_PER_SECOND = 1000 / 300;
let buffers = [];
let files = [];
let activeSources = [];
let trackCount = 0;

async function loadData() {
    createRuler();
}

function createRuler() {
  const ruler = document.getElementById('ruler');
  for (let i = 0; i <= 300; i += 10) {
    const x = i * PIXELS_PER_SECOND;
    const mark = document.createElement('div');
    mark.style.left = `${x}px`;
    const minutes = Math.floor(i / 60);
    const secs = (i % 60).toString().padStart(2, '0');
    mark.textContent = `${minutes}:${secs}`;
    ruler.appendChild(mark);
  }
}

document.getElementById('fileUploader').addEventListener('change', async (e) => {
    const dropdown = document.getElementById('audioDropdown');
    const addTrackBtn = document.getElementById('addTrackBtn');
  
    for (const file of e.target.files) {
      const buffer = await loadAudio(file);
      buffers.push(buffer);
      files.push(file);
      const option = document.createElement('option');
      option.text = file.name;
      option.value = buffers.length - 1;
      dropdown.appendChild(option);
    }
  
    // Show "Add Track" button if at least one file is loaded
    if (dropdown.options.length > 0) {
      addTrackBtn.style.display = 'inline-block';
    }
});

function addTrack() {
  const trackId = `track${trackCount}`;
  const track = document.createElement('div');
  track.className = 'track';
  track.id = trackId;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete Lane';
  deleteBtn.onclick = () => track.remove();
  track.appendChild(deleteBtn);

  document.getElementById('trackContainer').appendChild(track);
  const selectedIndex = document.getElementById('audioDropdown').value;
  if (selectedIndex !== '') {
    const bufferIndex = parseInt(selectedIndex);
    const file = files[bufferIndex];
    const duration = buffers[bufferIndex].duration;
    const width = duration * PIXELS_PER_SECOND;
    createBlock(trackId, bufferIndex, file, 0, width);
  }
  trackCount++;
}

async function loadAudio(file) {
  const arrayBuffer = await file.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

function createBlock(trackId, bufferIndex, file, left = 0, width = 200, volume = 1.0, startOffset = 0) {
  const block = document.createElement('div');
  block.className = 'audio-block';
  block.style.left = `${left}px`;
  block.style.width = `${width}px`;
  block.dataset.bufferIndex = bufferIndex;
  block.dataset.volume = volume;
  block.dataset.startOffset = startOffset;
  document.getElementById(trackId).appendChild(block);

  const waveformContainer = document.createElement('div');
  waveformContainer.className = 'waveform';
  block.appendChild(waveformContainer);

//   const volumeSlider = document.createElement('input');
//   volumeSlider.type = 'range';
//   volumeSlider.min = 0;
//   volumeSlider.max = 1;
//   volumeSlider.step = 0.01;
//   volumeSlider.value = volume;
//   volumeSlider.className = 'volume-slider';
//   volumeSlider.oninput = (e) => {
//     block.dataset.volume = e.target.value;
//   };
//   block.appendChild(volumeSlider);

  const wave = WaveSurfer.create({
    container: waveformContainer,
    waveColor: 'violet',
    progressColor: 'purple',
    interact: false,
    height: 100,
    responsive: true
  });
  wave.loadBlob(file);

  let isDragging = false;
  let startX = 0;

  block.addEventListener('mousedown', (e) => {
    if (e.target !== block) return;
    isDragging = true;
    startX = e.clientX;
    hideContextMenu();
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const parent = block.parentElement;
      const parentWidth = parent.clientWidth;
      let newLeft = parseInt(block.style.left || 0) + dx;
      newLeft = Math.max(0, Math.min(parentWidth - block.clientWidth, newLeft));
      block.style.left = `${newLeft}px`;
      startX = e.clientX;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  block.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, block, file, e.offsetX);
  });
}

function showContextMenu(x, y, block, file, offsetX) {
    const menu = document.getElementById('contextMenu');
    menu.innerHTML = '';
  
    // Volume Control
    const volumeLabel = document.createElement('div');
    volumeLabel.textContent = 'Volume';
    volumeLabel.style.fontSize = '12px';
    volumeLabel.style.margin = '5px 0 2px';
  
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = block.dataset.volume;
    volumeSlider.style.width = '100px';
    volumeSlider.oninput = (e) => {
      block.dataset.volume = e.target.value;
    };
  
    menu.appendChild(volumeLabel);
    menu.appendChild(volumeSlider);
  
    // Splice Here
    const splitHereBtn = document.createElement('button');
    splitHereBtn.textContent = 'Splice Here';
    splitHereBtn.onclick = () => {
        const left = parseInt(block.style.left);
        const width = parseInt(block.style.width);
        const splitPoint = Math.max(10, Math.min(width - 10, offsetX)); // pixels
        const bufferIndex = block.dataset.bufferIndex;
        const volume = block.dataset.volume;
        const startOffset = parseFloat(block.dataset.startOffset);
        const parent = block.parentElement;
      
        const duration = width / PIXELS_PER_SECOND;
        const splitTime = splitPoint / PIXELS_PER_SECOND; // seconds
        const firstStart = startOffset;
        const secondStart = startOffset + splitTime;
      
        const firstWidth = splitPoint;
        const secondWidth = width - splitPoint;
      
        parent.removeChild(block);
      
        // First half
        createBlock(parent.id, bufferIndex, file, left, firstWidth, volume, firstStart);
      
        // Second half
        createBlock(parent.id, bufferIndex, file, left + splitPoint, secondWidth, volume, secondStart);
      
        hideContextMenu();
      };
      
  
    // Split in Half
    const splitHalfBtn = document.createElement('button');
    splitHalfBtn.textContent = 'Split in Half';
    splitHalfBtn.onclick = () => {
        const left = parseInt(block.style.left);
        const width = parseInt(block.style.width);
        const halfWidth = width / 2;
        const bufferIndex = block.dataset.bufferIndex;
        const volume = block.dataset.volume;
        const startOffset = parseFloat(block.dataset.startOffset);
        const parent = block.parentElement;
      
        const duration = width / PIXELS_PER_SECOND;
        const halfDuration = duration / 2;
      
        parent.removeChild(block);
      
        createBlock(parent.id, bufferIndex, file, left, halfWidth, volume, startOffset);
        createBlock(parent.id, bufferIndex, file, left + halfWidth, halfWidth, volume, startOffset + halfDuration);
      
        hideContextMenu();
      };
      
  
    // Delete Block
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Block';
    deleteBtn.onclick = () => {
      block.parentElement.removeChild(block);
      hideContextMenu();
    };
  
    menu.appendChild(splitHereBtn);
    menu.appendChild(splitHalfBtn);
    menu.appendChild(deleteBtn);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
  }  

function hideContextMenu() {
  document.getElementById('contextMenu').style.display = 'none';
}

window.addEventListener('click', hideContextMenu);

function playMix() {
    stopMix(); // Stop any currently playing audio first

    document.querySelectorAll('.audio-block').forEach(block => {
        const bufferIndex = parseInt(block.dataset.bufferIndex);
        const buffer = buffers[bufferIndex];
        const left = parseInt(block.style.left || 0);
        const width = parseInt(block.style.width || 200);
        const volume = parseFloat(block.dataset.volume || 1);
        const startTime = left / PIXELS_PER_SECOND;
        const offset = parseFloat(block.dataset.startOffset || 0);
        const duration = width / PIXELS_PER_SECOND;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode).connect(audioCtx.destination);
        source.start(audioCtx.currentTime + startTime, offset, duration);

        activeSources.push(source);
    });
}

function stopMix() {
activeSources.forEach(source => {
    try {
    source.stop();
    } catch (e) {
    console.warn('Error stopping source:', e);
    }
});
activeSources = [];
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});