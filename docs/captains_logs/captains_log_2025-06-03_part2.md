# Captain's Log - 2025-06-03 (Part 2)

## Feature: Starfield Parallax Scrolling - 2025-06-03

*   **Objective:** Enhance the visual depth of the page by making the starfield background parallax scroll in response to user scrolling.
*   **Implementation Details (`js/starfield.js`):
    *   Added a `verticalParallaxOffset` that updates on window `scroll` events.
    *   The offset is calculated as `-window.scrollY * parallaxFactor`.
    *   The `parallaxFactor` was initially `0.1` and later adjusted to `0.05` for a subtler effect.
    *   Crucially, in the `Star.draw()` method, the `verticalParallaxOffset` is divided by `this.z` (the star's depth) before being applied to the star's `y` position: `y + (verticalParallaxOffset / this.z)`.
    *   This ensures that closer stars (smaller `z`) parallax more significantly than distant stars (larger `z`), creating a realistic depth effect.

## Push to GitHub - 2025-06-03

*   **Version:** `2025_06_03_v1.07`
*   **Commit Message:** `v1.07: Implement depth-aware parallax scrolling for starfield background.`
*   The version and commit message have been updated in the console log in `js/main.js`. 