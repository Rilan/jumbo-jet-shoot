/**
 * Game loop manager with delta time calculation
 */
export class GameLoop {
    constructor(game) {
        this.game = game;
        this.lastTime = 0;
        this.running = false;
        this.animationId = null;
        this.targetFPS = 60;
        this.maxDeltaTime = 1 / 30; // Cap delta time to prevent spiral of death
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Pause the loop (keeps track of time)
     */
    pause() {
        this.running = false;
    }

    /**
     * Resume from pause
     */
    resume() {
        if (this.running) return;

        this.running = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Main loop function
     */
    loop(currentTime) {
        if (!this.running) return;

        // Calculate delta time in seconds
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent physics issues on tab switch
        if (deltaTime > this.maxDeltaTime) {
            deltaTime = this.maxDeltaTime;
        }

        // Update game state
        this.game.update(deltaTime);

        // Render the frame
        this.game.render();

        // Schedule next frame
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Check if loop is running
     */
    isRunning() {
        return this.running;
    }
}
