/**
 * PSP Greatest Hits Visualizer
 * 
 * Handles waveform visualization on canvas elements.
 */

const CANVAS_DRAW_BG_COLOR = 'rgba(16, 16, 16, 0.5)'; // Dark background for drawing waveforms, 50% transparent

function hexToRgba(hex, alpha) {
    if (typeof hex !== 'string' || !hex.startsWith('#')) {
        // console.warn('Invalid hex color provided to hexToRgba:', hex);
        return `rgba(200, 200, 200, ${alpha})`; // Fallback to a light grey if issues
    }
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { // #RGB format
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) { // #RRGGBB format
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    } else {
        // console.warn('Invalid hex color length provided to hexToRgba:', hex);
        return `rgba(200, 200, 200, ${alpha})`; // Fallback
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        // console.warn('Parsing hex resulted in NaN:', hex);
        return `rgba(200, 200, 200, ${alpha})`; // Fallback if parsing failed
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Draw waveform visualization with playback position indicator
 */
function drawWaveform(canvas, dataArray, playbackPosition, colorTheme) {
    if (!canvas || !dataArray) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const positionX = Math.max(0, Math.min(1, playbackPosition)) * width;

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
    
    // Draw main waveform first
    ctx.beginPath();
    ctx.strokeStyle = colorTheme.mid; // Waveform base color
    ctx.lineWidth = 2;
    
    const skipFactor = Math.ceil(dataArray.length / width) || 1; // Ensure skipFactor is at least 1
    const verticalScale = 1.0;
    
    let firstPoint = true;
    for (let i = 0; i < dataArray.length; i += skipFactor) {
        const x = (i / dataArray.length) * width;
        const normalizedData = ((dataArray[i] / 128.0) - 1.0) * verticalScale;
        const y = (height / 2) + normalizedData * (height / 2) * 0.9;
        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Highlight played portion (left of playhead) using theme's light color
    const highlightAlpha = 0.03; // Further reduced from 0.02 for a barely perceptible highlight
    const highlightColor = hexToRgba(colorTheme.light, highlightAlpha);
    ctx.fillStyle = highlightColor;
    ctx.fillRect(0, 0, positionX, height);

    // Darken unplayed portion (right of playhead) - existing logic, made darker
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Increased from 0.2 to make it darker
    ctx.fillRect(positionX, 0, width - positionX, height);

    // Draw playback position line (playhead) on top of everything
    ctx.beginPath();
    ctx.moveTo(positionX, 0);
    ctx.lineTo(positionX, height);
    ctx.strokeStyle = colorTheme.dark; // Make it distinct
    ctx.lineWidth = 1.5; // Ensure it's visible
    ctx.stroke();
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
