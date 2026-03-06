/**
 * Handles touch input for mobile devices - virtual joystick and fire button
 */
export class TouchController {
    constructor() {
        this.isTouchDevice = this.detectTouchDevice();
        this.joystickActive = false;
        this.fireActive = false;

        // Joystick state
        this.joystick = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };

        // DOM elements (will be set during init)
        this.elements = {
            container: null,
            joystickBase: null,
            joystickKnob: null,
            fireButton: null
        };

        // Joystick config
        this.joystickRadius = 50; // Max distance knob can move from center

        // Touch identifiers to track multi-touch
        this.joystickTouchId = null;
        this.fireTouchId = null;
    }

    /**
     * Detect if device supports touch
     */
    detectTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }

    /**
     * Initialize touch controls
     */
    init() {
        // Get DOM elements
        this.elements.container = document.getElementById('touch-controls');
        this.elements.joystickBase = document.getElementById('joystick-base');
        this.elements.joystickKnob = document.getElementById('joystick-knob');
        this.elements.fireButton = document.getElementById('fire-button');

        if (!this.elements.container) {
            console.warn('Touch controls elements not found');
            return;
        }

        // Show/hide based on device type
        if (this.isTouchDevice) {
            this.show();
            this.setupEventListeners();
        } else {
            this.hide();
        }
    }

    /**
     * Setup touch event listeners
     */
    setupEventListeners() {
        // Joystick events
        this.elements.joystickBase.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
        this.elements.joystickBase.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
        this.elements.joystickBase.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
        this.elements.joystickBase.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });

        // Fire button events
        this.elements.fireButton.addEventListener('touchstart', (e) => this.onFireStart(e), { passive: false });
        this.elements.fireButton.addEventListener('touchend', (e) => this.onFireEnd(e), { passive: false });
        this.elements.fireButton.addEventListener('touchcancel', (e) => this.onFireEnd(e), { passive: false });

        // Prevent default touch behavior on controls
        this.elements.container.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    /**
     * Handle joystick touch start
     */
    onJoystickStart(e) {
        e.preventDefault();

        const touch = e.changedTouches[0];
        this.joystickTouchId = touch.identifier;
        this.joystickActive = true;

        const rect = this.elements.joystickBase.getBoundingClientRect();
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;

        this.updateJoystickPosition(touch.clientX, touch.clientY);
    }

    /**
     * Handle joystick touch move
     */
    onJoystickMove(e) {
        e.preventDefault();

        // Find our tracked touch
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystickTouchId) {
                this.updateJoystickPosition(touch.clientX, touch.clientY);
                break;
            }
        }
    }

    /**
     * Handle joystick touch end
     */
    onJoystickEnd(e) {
        e.preventDefault();

        // Check if our tracked touch ended
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystickTouchId) {
                this.joystickActive = false;
                this.joystickTouchId = null;
                this.joystick.direction = { x: 0, y: 0 };

                // Reset knob position
                this.elements.joystickKnob.style.transform = 'translate(-50%, -50%)';
                break;
            }
        }
    }

    /**
     * Update joystick position and direction
     */
    updateJoystickPosition(touchX, touchY) {
        // Calculate offset from center
        let deltaX = touchX - this.joystick.startX;
        let deltaY = touchY - this.joystick.startY;

        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Clamp to radius
        if (distance > this.joystickRadius) {
            const scale = this.joystickRadius / distance;
            deltaX *= scale;
            deltaY *= scale;
        }

        // Update knob visual position
        this.elements.joystickKnob.style.transform =
            `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // Calculate normalized direction (-1 to 1)
        this.joystick.direction = {
            x: deltaX / this.joystickRadius,
            y: deltaY / this.joystickRadius
        };
    }

    /**
     * Handle fire button touch start
     */
    onFireStart(e) {
        e.preventDefault();

        const touch = e.changedTouches[0];
        this.fireTouchId = touch.identifier;
        this.fireActive = true;

        // Visual feedback
        this.elements.fireButton.classList.add('active');
    }

    /**
     * Handle fire button touch end
     */
    onFireEnd(e) {
        e.preventDefault();

        // Check if our tracked touch ended
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.fireTouchId) {
                this.fireActive = false;
                this.fireTouchId = null;

                // Remove visual feedback
                this.elements.fireButton.classList.remove('active');
                break;
            }
        }
    }

    /**
     * Get current movement direction from joystick
     * @returns {{x: number, y: number}} Normalized direction (-1 to 1)
     */
    getDirection() {
        return this.joystick.direction;
    }

    /**
     * Check if fire button is pressed
     * @returns {boolean}
     */
    isFiring() {
        return this.fireActive;
    }

    /**
     * Check if touch controls are active
     * @returns {boolean}
     */
    isActive() {
        return this.isTouchDevice;
    }

    /**
     * Show touch controls
     */
    show() {
        if (this.elements.container) {
            this.elements.container.classList.remove('hidden');
        }
    }

    /**
     * Hide touch controls
     */
    hide() {
        if (this.elements.container) {
            this.elements.container.classList.add('hidden');
        }
    }
}
