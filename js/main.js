/**
 * Wave Doctor Demo - Main Application
 * 
 * This script initializes the demo and coordinates the audio and visualization components.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Current version: 2025_06_03_v1.04");
    console.log("Commit message: v1.04: Add audio test page and silent MP3 for mobile audio unlock.");

    let isAudioUnlocked = false;
    const silentUnlockAudio = document.getElementById('silent-unlock-audio');

    const exampleSections = document.querySelectorAll('.audio-example-section');
    let currentlyPlayingSection = null;
    const allPlayers = []; // Array to store all player instances

    exampleSections.forEach((section) => {
        const sectionAudioManager = new PSPAudioManager(); // Create a new audio manager for THIS section

        const playButton = section.querySelector('.play-button');
        const waveformCanvas = section.querySelector('.waveform-canvas');
        const timeDisplay = section.querySelector('.time-display');
        const loadingOverlay = section.querySelector('.waveform-overlay');
        const audioBasename = section.dataset.audioBasename;
        const sectionColor = section.dataset.color || 'blue';

        resizeCanvas(waveformCanvas);

        const player = {
            section,
            playButton,
            timeDisplay,
            waveformCanvas,
            loadingOverlay,
            audioManager: sectionAudioManager, // Store this section's own audio manager
            isPlaying: false,
            isLoaded: false,
            animationId: null,
            colorTheme: getColorTheme(sectionColor),
        };
        allPlayers.push(player); // Add to list of all players

        function loadAndSetupAudio(currentAudioBasename, startPlaying = false) {
            player.isLoaded = false;
            playButton.disabled = true;
            loadingOverlay.classList.remove('hidden');
            if (loadingOverlay.querySelector('.loading-indicator div[style*="color: red"]')) {
                loadingOverlay.querySelector('.loading-indicator').innerHTML = '<div class="loading-spinner"></div><span>Loading audio...</span>';
            }

            // If a different section is playing, stop it.
            if (currentlyPlayingSection && currentlyPlayingSection !== player && currentlyPlayingSection.isPlaying) {
                currentlyPlayingSection.audioManager.stopPlayback(true);
                currentlyPlayingSection.isPlaying = false;
                currentlyPlayingSection.playButton.innerHTML = '<span class="play-symbol">▶</span>';
                if (currentlyPlayingSection.animationId) {
                    cancelAnimationFrame(currentlyPlayingSection.animationId);
                    currentlyPlayingSection.animationId = null;
                }
                drawStaticWaveform(currentlyPlayingSection.waveformCanvas, currentlyPlayingSection.colorTheme.mid);
            } else if (currentlyPlayingSection === player && player.isPlaying) {
                // If this section is already playing (e.g. re-triggering load while playing), stop its current playback
                player.audioManager.stopPlayback(true);
                player.isPlaying = false; // It will be set to true again if startPlaying is true
            }
            // Only reset currentlyPlayingSection if it was a *different* section that was stopped, or if nothing was playing.
            // If we stopped the current section to reload it, it remains the currentlyPlayingSection logically.
            if (currentlyPlayingSection && currentlyPlayingSection !== player) {
                currentlyPlayingSection = null; 
            }

            const audioPath = `audio/${currentAudioBasename}.mp3`;
            player.audioManager.loadSingleAudio(audioPath)
                .then(() => {
                    player.isLoaded = true;
                    playButton.disabled = false;
                    loadingOverlay.classList.add('hidden');
                    const duration = player.audioManager.getDuration();
                    timeDisplay.textContent = `0:00 / ${formatTime(duration)}`;
                    drawStaticWaveform(waveformCanvas, player.colorTheme.mid);

                    if (startPlaying) {
                        if (player.audioManager.audioContext && player.audioManager.audioContext.state === 'suspended') {
                            player.audioManager.audioContext.resume();
                        }
                        player.audioManager.startPlayback();
                        player.isPlaying = true;
                        playButton.innerHTML = '<span class="pause-symbol">⏸︎</span>';
                        startWaveformAnimation(player);
                        currentlyPlayingSection = player;
                    }
                })
                .catch(error => {
                    console.error(`Error loading audio for ${currentAudioBasename}:`, error);
                    loadingOverlay.querySelector('.loading-indicator').innerHTML =
                        '<div style="color: red;">Error loading audio</div>';
                    timeDisplay.textContent = '0:00 / 0:00';
                    drawStaticWaveform(waveformCanvas, player.colorTheme.mid);
                });
        }

        loadAndSetupAudio(audioBasename);

        playButton.addEventListener('click', () => {
            if (!isAudioUnlocked && silentUnlockAudio) {
                silentUnlockAudio.play().catch(e => console.warn("Silent unlock play failed (this is often ok on desktop):", e));
                isAudioUnlocked = true;
            }

            if (player.isPlaying) {
                player.audioManager.stopPlayback(false); 
                player.isPlaying = false;
                playButton.innerHTML = '<span class="play-symbol">▶</span>';
                if (player.animationId) {
                    cancelAnimationFrame(player.animationId);
                    player.animationId = null;
                }
            } else {
                if (currentlyPlayingSection && currentlyPlayingSection !== player) {
                    currentlyPlayingSection.audioManager.stopPlayback(true);
                    currentlyPlayingSection.isPlaying = false;
                    currentlyPlayingSection.playButton.innerHTML = '<span class="play-symbol">▶</span>';
                    if (currentlyPlayingSection.animationId) {
                        cancelAnimationFrame(currentlyPlayingSection.animationId);
                        currentlyPlayingSection.animationId = null;
                    }
                    drawStaticWaveform(currentlyPlayingSection.waveformCanvas, currentlyPlayingSection.colorTheme.mid);
                }
                
                if (player.audioManager.audioContext && player.audioManager.audioContext.state === 'suspended') {
                     player.audioManager.audioContext.resume(); 
                }
                player.audioManager.startPlayback();
                player.isPlaying = true;
                playButton.innerHTML = '<span class="pause-symbol">⏸︎</span>';
                startWaveformAnimation(player); 
                currentlyPlayingSection = player; 
            }
        });
        
        waveformCanvas.addEventListener('click', (event) => {
            if (!isAudioUnlocked && silentUnlockAudio) {
                silentUnlockAudio.play().catch(e => console.warn("Silent unlock play failed (this is often ok on desktop):", e));
                isAudioUnlocked = true;
            }

            if (!player.isLoaded) return;
            const rect = waveformCanvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const seekPosition = clickX / rect.width;

            if (player.isPlaying) {
                // If currently playing, seek to the clicked position and continue.
                player.audioManager.seekTo(seekPosition);
                // Update time display immediately to reflect the seek.
                const duration = player.audioManager.getDuration();
                const currentTime = duration * seekPosition;
                player.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            } else {
                // If NOT playing, this click should start playback from the very beginning.
                player.audioManager.pauseTime = 0; // Ensure playback starts from the beginning
                playButton.click(); // This will trigger startPlayback(), which will use the (now zero) pauseTime.
                // Do NOT update timeDisplay here based on click; animation loop will handle it from t=0.
            }
        });
    });

    window.addEventListener('resize', () => {
        allPlayers.forEach(p => {
            resizeCanvas(p.waveformCanvas);
            if (p.isLoaded && !p.isPlaying) {
                 drawStaticWaveform(p.waveformCanvas, p.colorTheme.mid);
            }
        });
    });
});

function resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Modified to take only player, and use player.audioManager internally
function startWaveformAnimation(player) { 
    if (player.animationId) {
        cancelAnimationFrame(player.animationId);
    }
    function animate() {
        if (!player.isPlaying) return;
        const currentTime = player.audioManager.getCurrentTime();
        const duration = player.audioManager.getDuration();
        player.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        drawWaveform(
            player.waveformCanvas, 
            player.audioManager.getWaveformData(),
            currentTime / duration, 
            player.colorTheme
        );
        player.animationId = requestAnimationFrame(animate);
    }
    animate();
}

/* This local definition is a duplicate of the one in js/visualizer.js and should be removed. */
/*
function drawStaticWaveform(canvas, strokeColor) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    // Clear canvas with dark background color - assuming CANVAS_DRAW_BG_COLOR is globally available or visualizer.js is loaded first
    // For safety, or if visualizer.js might not be loaded, you might need to pass this color or define it here.
    // ctx.fillStyle = CANVAS_DRAW_BG_COLOR; // This was the intended change but CANVAS_DRAW_BG_COLOR is in visualizer.js
    // For now, let's assume the visualizer.js's drawStaticWaveform is the one being used and this will be removed.
    // Reverting to a simpler clear or expecting visualizer.js's version to handle BG.
    ctx.clearRect(0, 0, width, height); // Simple clear, or ensure visualizer.js is primary.

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    // ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; // Original light theme center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // Lighter center line for dark bg, aligning with visualizer.js
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
*/

function getColorTheme(color) {
    const themes = {
        blue: { light: '#dbeafe', mid: '#3b82f6', dark: '#1d4ed8' },
        purple: { light: '#e9d5ff', mid: '#a855f7', dark: '#7e22ce' },
        teal: { light: '#ccfbf1', mid: '#14b8a6', dark: '#0f766e' },
        amber: { light: '#fef3c7', mid: '#f59e0b', dark: '#b45309' }
    };
    return themes[color] || themes.blue;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
