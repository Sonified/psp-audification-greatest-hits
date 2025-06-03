document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) {
        console.error("Starfield canvas not found!");
        return;
    }
    const ctx = canvas.getContext('2d');

    let stars = [];
    const numStars = 400; // Increased for more depth
    const baseScrollSpeed = 0.2; // Base speed for closest stars (z=1) - SLOWED DOWN
    const minZ = 1; // Closest stars
    const maxZ = 10; // Increased from 5 for more parallax
    const baseStarSize = 2.0; // Base size for closest stars (z=1)

    function resizeCanvas() {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (stars.length === 0) { // Only initialize if stars array is empty (first run)
            initStars();
        } else {
            // Scale existing star positions
            const scaleX = canvas.width / oldWidth;
            const scaleY = canvas.height / oldHeight;
            stars.forEach(star => {
                star.x *= scaleX;
                star.y *= scaleY;

                // Optional: Add a check to ensure stars that are scaled off-screen are handled
                // For instance, if a star is scaled way off to the right, 
                // you might want to wrap it or re-initialize its x position.
                // For now, simple scaling should improve the chaotic behavior significantly.
                // If a star moves off left (x < 0) due to scaling AND its normal movement,
                // the existing update() logic should handle wrapping it to the right.
            });
        }
    }

    class Star {
        constructor(initialX = null) {
            this.z = Math.random() * (maxZ - minZ) + minZ;
            // Ensure initialX is within current canvas bounds if provided during initStars
            this.x = initialX !== null && canvas.width > 0 ? initialX % canvas.width : Math.random() * (canvas.width || window.innerWidth) ;
            this.y = Math.random() * (canvas.height || window.innerHeight);
            this.size = baseStarSize / this.z;
            // Make further stars slightly fainter, but ensure a minimum alpha
            this.alpha = Math.max(0.2, (1 - (this.z - minZ) / (maxZ - minZ)) * 0.8 + 0.2);
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.fill();
        }

        update() {
            this.x -= baseScrollSpeed / this.z; // Move left

            // If star moves off the left edge, reset it to the right edge
            // with a new y and z position for variety.
            if (this.x + this.size < 0) {
                this.x = canvas.width + this.size;
                this.y = Math.random() * canvas.height;
                // Keep z, size, and alpha to maintain its appearance when wrapping
            }
        }
    }

    function initStars() {
        stars = []; // Clear before initializing
        for (let i = 0; i < numStars; i++) {
            // Initialize stars across the screen, not just from one edge
            stars.push(new Star(Math.random() * canvas.width)); 
        }
    }

    function animate() {
        if (!canvas || !ctx) return; // Ensure canvas and context are available
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame
        
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial setup
    animate(); // Start animation
}); 