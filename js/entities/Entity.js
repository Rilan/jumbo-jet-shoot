import { Vector2 } from '../utils/Vector2.js';

/**
 * Base entity class for all game objects
 */
export class Entity {
    constructor(x, y, width, height) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.width = width;
        this.height = height;
        this.active = true;
        this.rotation = 0;
    }

    /**
     * Update entity state
     */
    update(deltaTime) {
        // Apply velocity to position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    /**
     * Render the entity
     */
    render(ctx) {
        // Override in subclasses
    }

    /**
     * Get bounding box for collision detection
     */
    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get center position
     */
    getCenter() {
        return this.position.clone();
    }

    /**
     * Check if entity is within canvas bounds
     */
    isInBounds(canvasWidth, canvasHeight, margin = 50) {
        return (
            this.position.x >= -margin &&
            this.position.x <= canvasWidth + margin &&
            this.position.y >= -margin &&
            this.position.y <= canvasHeight + margin
        );
    }

    /**
     * Deactivate entity (mark for removal)
     */
    destroy() {
        this.active = false;
    }

    /**
     * Check if entity is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Set position
     */
    setPosition(x, y) {
        this.position.set(x, y);
    }

    /**
     * Set velocity
     */
    setVelocity(x, y) {
        this.velocity.set(x, y);
    }
}
