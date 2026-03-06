import { KEYS } from '../utils/Constants.js';

/**
 * Handles keyboard and mouse input
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {};  // For single-press detection
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            clicked: false
        };
        this.canvas = null;

        this.setupListeners();
    }

    /**
     * Set canvas for mouse coordinate calculation
     */
    setCanvas(canvas) {
        this.canvas = canvas;
    }

    /**
     * Set up event listeners
     */
    setupListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse events
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // Handle window blur (release all keys)
        window.addEventListener('blur', () => this.releaseAll());
    }

    /**
     * Handle key down
     */
    onKeyDown(e) {
        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }

        if (!this.keys[e.code]) {
            this.keysPressed[e.code] = true;
        }
        this.keys[e.code] = true;
    }

    /**
     * Handle key up
     */
    onKeyUp(e) {
        this.keys[e.code] = false;
        this.keysPressed[e.code] = false;
    }

    /**
     * Handle mouse move
     */
    onMouseMove(e) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        }
    }

    /**
     * Handle mouse down
     */
    onMouseDown(e) {
        if (e.button === 0) { // Left click
            this.mouse.down = true;
            this.mouse.clicked = true;
        }
    }

    /**
     * Handle mouse up
     */
    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.down = false;
        }
    }

    /**
     * Check if a key code is used by the game
     */
    isGameKey(code) {
        const allKeys = [
            ...KEYS.UP, ...KEYS.DOWN, ...KEYS.LEFT, ...KEYS.RIGHT,
            ...KEYS.SHOOT, ...KEYS.PAUSE
        ];
        return allKeys.includes(code);
    }

    /**
     * Check if any key in a group is held
     */
    isKeyHeld(keyGroup) {
        return keyGroup.some(key => this.keys[key]);
    }

    /**
     * Check if any key in a group was just pressed
     */
    isKeyPressed(keyGroup) {
        return keyGroup.some(key => this.keysPressed[key]);
    }

    /**
     * Clear single-press states (call at end of update)
     */
    clearPressed() {
        this.keysPressed = {};
        this.mouse.clicked = false;
    }

    /**
     * Release all inputs
     */
    releaseAll() {
        this.keys = {};
        this.keysPressed = {};
        this.mouse.down = false;
        this.mouse.clicked = false;
    }

    /**
     * Get movement direction vector
     */
    getMovementDirection() {
        let x = 0;
        let y = 0;

        if (this.isKeyHeld(KEYS.LEFT)) x -= 1;
        if (this.isKeyHeld(KEYS.RIGHT)) x += 1;
        if (this.isKeyHeld(KEYS.UP)) y -= 1;
        if (this.isKeyHeld(KEYS.DOWN)) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    /**
     * Check if shooting input is active
     */
    isShooting() {
        return this.isKeyHeld(KEYS.SHOOT) || this.mouse.down;
    }

    /**
     * Check if pause was pressed
     */
    isPausePressed() {
        return this.isKeyPressed(KEYS.PAUSE);
    }
}
