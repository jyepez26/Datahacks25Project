//Initialize the Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const PIXELS_PER_SECOND = 1000 / 300;

//Global variables
let buffers = [];
let files = [];
//Currently playing audio nodes
let activeSources = [];
//Track count
let trackCount = 0;

//Loads the ruler when the document loads
async function loadData() {
    createRuler();
}

//Adds the timestamps seperated by 10 seconds, to the ruler using PIXELS_PER_SECOND
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

//Takes in the mp3 file inputted by the user, and decodes it, appends it to the dropdown.
document.getElementById('fileUploader').addEventListener('change', async (e) => {
    const dropdown = document.getElementById('audioDropdown');
    const addTrackBtn = document.getElementById('addTrackBtn');
  
    //Decodes the file into a buffer using loadAudio and adds it to the select dropdown
    for (const file of e.target.files) {
      const buffer = await loadAudio(file);
      buffers.push(buffer);
      files.push(file);
      const option = document.createElement('option');
      option.text = file.name;
      option.value = buffers.length - 1;
      dropdown.appendChild(option);
    }
  
    //Shows "Add Track" if at least one file is loaded
    if (dropdown.options.length > 0) {
      addTrackBtn.style.display = 'inline-block';
    }
});

//Converts audio buffer data that Web Audio can use
async function loadAudio(file) {
    const arrayBuffer = await file.arrayBuffer();

    //Decodes the audio file
    return await audioCtx.decodeAudioData(arrayBuffer);
}

//Adds a track with the following audio file selected for the track
function addTrack() {
    //Creates a new track with its own id based on the track count
    const trackId = `track${trackCount}`;
    const track = document.createElement('div');
    track.className = 'track';
    track.id = trackId;

    //Creates the delete lane button for the new track
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Lane';
    deleteBtn.onclick = () => track.remove();
    track.appendChild(deleteBtn);

    document.getElementById('trackContainer').appendChild(track);

    //Takes the selected audio file and makes an audio block through createBlock()
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

//Creates a draggable audio block
function createBlock(trackId, bufferIndex, file, left = 0, width = 200, volume = 1.0, startOffset = 0) {
    //Creates the block and places it into the left side of the track
    const block = document.createElement('div');
    block.className = 'audio-block';
    block.style.left = `${left}px`;
    block.style.width = `${width}px`;
    block.dataset.bufferIndex = bufferIndex;
    block.dataset.volume = volume;
    block.dataset.startOffset = startOffset;
    document.getElementById(trackId).appendChild(block);

    //Creates the waveform on the audio block and allows the waveform to remain correct when sliced and spliced
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'waveform';
    block.appendChild(waveformContainer);

    const buffer = buffers[bufferIndex];
    const blockDuration = width / PIXELS_PER_SECOND;
    drawWaveformPreview(waveformContainer, buffer, startOffset, blockDuration);

    let isDragging = false;
    let startX = 0;

    //Checks when the mouse is dragging the object
    block.addEventListener('mousedown', (e) => {
        if (e.target !== block) return;
        isDragging = true;
        startX = e.clientX;
        hideContextMenu();
    });

    //Updates the position of the audio block
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

    //Stops the drag
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    //Provides the options to alter the audio block
    block.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY, block, file, e.offsetX);
    });
}


function drawWaveformPreview(container, buffer, startOffset, duration) {
    //Creates the canvas which will contain the waveform
    const canvas = document.createElement('canvas');
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    //
    const ctx = canvas.getContext('2d');
    const data = buffer.getChannelData(0); // mono
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(startOffset * sampleRate);
    const endSample = Math.min(startSample + Math.floor(duration * sampleRate), data.length);
    const samplesPerPixel = Math.floor((endSample - startSample) / width);
  
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#fc9fb1'; // Slate blue waveform
    ctx.beginPath();
  
    for (let x = 0; x < width; x++) {
        const start = startSample + x * samplesPerPixel;
        let min = 1.0, max = -1.0;
        for (let i = 0; i < samplesPerPixel; i++) {
            const sample = data[start + i] || 0;
            if (sample < min) min = sample;
            if (sample > max) max = sample;
        }
        const y1 = ((1 + min) / 2) * height;
        const y2 = ((1 + max) / 2) * height;
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
    }
  
    ctx.stroke();
    container.appendChild(canvas);
  }
  

function showContextMenu(x, y, block, file, offsetX) {
    //Initializes the menu
    const menu = document.getElementById('contextMenu');
    menu.innerHTML = '';
  
    //Controls the volume of the audio block and updates with the slider
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
  
    //Splice the audio based on where the user inputted the value
    const splitHereBtn = document.createElement('button');
    splitHereBtn.textContent = 'Splice Here';
    splitHereBtn.onclick = () => {
        const left = parseInt(block.style.left);
        const width = parseInt(block.style.width);
        const splitPoint = Math.max(10, Math.min(width - 10, offsetX));
        const bufferIndex = block.dataset.bufferIndex;
        const volume = block.dataset.volume;
        const startOffset = parseFloat(block.dataset.startOffset);
        const parent = block.parentElement;
      
        //Finds the duration of both values to create both blocks
        const duration = width / PIXELS_PER_SECOND;
        const splitTime = splitPoint / PIXELS_PER_SECOND;
        const firstStart = startOffset;
        const secondStart = startOffset + splitTime;
      
        const firstWidth = splitPoint;
        const secondWidth = width - splitPoint;
      
        parent.removeChild(block);
      
        //First half
        createBlock(parent.id, bufferIndex, file, left, firstWidth, volume, firstStart);
      
        //Second half
        createBlock(parent.id, bufferIndex, file, left + splitPoint, secondWidth, volume, secondStart);
      
        //Hides context menu after the button is clicked
        hideContextMenu();
      };
      
  
    //Split the audio block into two halves
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
      
        //Finds the duration of half of the audio to split the two
        const duration = width / PIXELS_PER_SECOND;
        const halfDuration = duration / 2;
      
        parent.removeChild(block);
      
        //First half
        createBlock(parent.id, bufferIndex, file, left, halfWidth, volume, startOffset);
        
        //Second half
        createBlock(parent.id, bufferIndex, file, left + halfWidth, halfWidth, volume, startOffset + halfDuration);
      
        //Hides context menu after the button is clicked
        hideContextMenu();
      };
      
  
    //Deletes the block
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

//Hides the context menu after use
function hideContextMenu() {
     document.getElementById('contextMenu').style.display = 'none';
}

window.addEventListener('click', hideContextMenu);

//Plays all of the audio blocks
function playMix() {

    //Stops any currently playing audio first
    stopMix(); 

    //Loop through each audio-block element
    document.querySelectorAll('.audio-block').forEach(block => {
        //Takes in these values to create a new Audio Buffer Source Node
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

function downloadMix() {
    const duration = getTotalMixDuration(); // Total mix length in seconds
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, duration * sampleRate, sampleRate);

    // Recreate the mix in the offline context
    document.querySelectorAll('.audio-block').forEach(block => {
        const bufferIndex = parseInt(block.dataset.bufferIndex);
        const buffer = buffers[bufferIndex];
        const left = parseInt(block.style.left || 0);
        const width = parseInt(block.style.width || 200);
        const volume = parseFloat(block.dataset.volume || 1);
        const startTime = left / PIXELS_PER_SECOND;
        const offset = parseFloat(block.dataset.startOffset || 0);
        const duration = width / PIXELS_PER_SECOND;

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode).connect(offlineCtx.destination);
        source.start(startTime, offset, duration);
    });

    // Render the audio
    offlineCtx.startRendering().then(renderedBuffer => {
        const wavBlob = bufferToWavBlob(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mix.wav';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function getTotalMixDuration() {
    let maxEnd = 0;
    document.querySelectorAll('.audio-block').forEach(block => {
        const left = parseInt(block.style.left || 0);
        const width = parseInt(block.style.width || 200);
        const end = (left + width) / PIXELS_PER_SECOND;
        if (end > maxEnd) maxEnd = end;
    });
    return maxEnd;
}

function bufferToWavBlob(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let offset = 0;

    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    function writeUint32(value) {
        view.setUint32(offset, value, true);
        offset += 4;
    }

    function writeUint16(value) {
        view.setUint16(offset, value, true);
        offset += 2;
    }

    // Write WAV header
    writeString('RIFF');
    writeUint32(length - 8);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(numOfChan);
    writeUint32(buffer.sampleRate);
    writeUint32(buffer.sampleRate * numOfChan * 2);
    writeUint16(numOfChan * 2);
    writeUint16(16);
    writeString('data');
    writeUint32(length - offset - 4);

    // Write interleaved PCM samples
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            const sample = buffer.getChannelData(channel)[i];
            const clamped = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, clamped * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([bufferArray], { type: 'audio/wav' });
}


document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});