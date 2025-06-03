/**
 * PSP Greatest Hits Visualizer
 * 
 * Handles waveform visualization on canvas elements.
 */

const CANVAS_DRAW_BG_COLOR = 'rgba(16, 16, 16, 0.5)'; // Dark background for drawing waveforms, 50% transparent

/**
 * Draw waveform visualization with playback position indicator
 */
function drawWaveform(canvas, dataArray, playbackPosition, colorTheme) {
    if (!canvas || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    // Clear canvas with dark background color
    ctx.fillStyle = CANVAS_DRAW_BG_COLOR;
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line (subtle on dark background)
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // Lighter center line for dark bg
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw playback position line
    const positionX = Math.max(0, Math.min(1, playbackPosition)) * width;
    ctx.beginPath();
    ctx.moveTo(positionX, 0);
    ctx.lineTo(positionX, height);
    ctx.strokeStyle = colorTheme.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = colorTheme.mid;
    ctx.lineWidth = 2;
    
    const skipFactor = Math.ceil(dataArray.length / width);
    const verticalScale = 1.0;
    
    for (let i = 0; i < dataArray.length; i += skipFactor) {
        const x = (i / dataArray.length) * width;
        const normalizedData = ((dataArray[i] / 128.0) - 1.0) * verticalScale;
        const y = (height / 2) + normalizedData * (height / 2) * 0.9;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(positionX, 0, width - positionX, height);
}

/**
 * Draw a static placeholder waveform when not playing
 */
function drawStaticWaveform(canvas, strokeColor) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    ctx.fillStyle = CANVAS_DRAW_BG_COLOR;
    ctx.fillRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw example placeholder waveform shape (sine wave)
    ctx.beginPath();
    const amplitude = height * 0.3;
    const frequency = 0.01;
    
    for (let x = 0; x < width; x++) {
        const y = (height / 2) + Math.sin(x * frequency) * amplitude;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Generate a fake waveform when actual data isn't available
 * (Used for initial display and when audio isn't playing)
 */
function generateFakeWaveformData(length, complexity = 3) {
    const data = new Uint8Array(length);
    
    // Fill with a sine wave approximation
    for (let i = 0; i < length; i++) {
        let value = 128; // Center value
        
        // Add several sine waves at different frequencies for a more complex waveform
        for (let j = 1; j <= complexity; j++) {
            const amplitude = 40 / j; // Diminishing amplitude for higher harmonics
            const frequency = j * (Math.PI * 2) / length;
            value += Math.sin(i * frequency * j) * amplitude;
        }
        
        // Add some random noise
        value += (Math.random() - 0.5) * 10;
        
        // Clamp to 0-255
        data[i] = Math.max(0, Math.min(255, Math.round(value)));
    }
    
    return data;
}
