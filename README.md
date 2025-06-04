# Parker Solar Probe's Greatest Hits - Space Sound Showcase

This project presents an interactive web page showcasing audifications of data captured by NASA's Parker Solar Probe. Experience the sounds of space with accompanying waveform visualizations.

## Features

*   **Three Unique Audio Examples:**
    *   Encounter 13: Coronal Mass Ejection
    *   Encounter 16: Rising Tones
    *   PSP Encounters Venus (Venus Flyby 4)
*   **Interactive Audio Players:** Each example has its own player with:
    *   Play/Pause controls.
    *   Clickable waveform for seeking (when playing) or starting from the beginning (when paused).
    *   Dynamic time display.
    *   Visual loading indicator.
*   **Waveform Visualization:** Real-time waveform rendering for each audio track.
*   **End-of-Track Handling:** Audio playback stops and resets automatically when a track finishes.
*   **Volume Adjustment:** The "Encounter 16: Rising Tones" track has its volume adjusted to 70% for a better listening experience relative to other tracks.
*   **Audio Fade Transitions:** Smooth fade-in and fade-out effects for audio start/stop.
*   **Animated Starfield Background:** A dynamic, parallax scrolling starfield creates an immersive space-themed backdrop.
*   **Kid-Friendly Descriptions:** Informative and engaging descriptions for each audio example.
*   **Responsive Design:** Elements adjust to different screen sizes (basic responsiveness).
*   **External Link:** Includes a link to NASA's "Listen To SPACE!" YouTube video for further exploration.

## How to View

1.  Clone or download this repository.
2.  Navigate to the project directory.
3.  Open the `index.html` file in a modern web browser.

## Project Structure

*   `index.html`: The main HTML file for the webpage.
*   `styles.css`: CSS for styling the page.
*   `js/`: Contains JavaScript files:
    *   `main.js`: Handles main page logic, player setup, and event handling.
    *   `audio.js`: `PSPAudioManager` class for audio loading, playback, and Web Audio API interactions.
    *   `visualizer.js`: Functions for drawing waveforms on canvas elements.
    *   `starfield.js`: Logic for the animated starfield background.
*   `audio/`: Stores the MP3 audio files.
*   `docs/captains_logs/`: Contains markdown files documenting project progress. 