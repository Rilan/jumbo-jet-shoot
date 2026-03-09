import { Vector2 } from '../utils/Vector2.js';

/**
 * Base entity class — owns a Phaser Graphics object for rendering.
 * Subclasses implement draw() using Phaser Graphics API.
 */
export class Entity {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} depth  Phaser scene depth (z-order)
     */
    constructor(scene, x, y, width, height, depth = 0) {
        this.scene = scene;
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.active = true;

        this.graphic = scene.add.graphics();
        this.graphic.setDepth(depth);
    }

    /** Called every frame; subclasses override to draw at local (0,0). */
    draw() {}

    /** Update position from velocity. */
    update(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    /** AABB bounding box centred on position. */
    getBounds() {
        return {
            x:      this.position.x - this.width  / 2,
            y:      this.position.y - this.height / 2,
            width:  this.width,
            height: this.height
        };
    }

    getCenter() { return this.position.clone(); }

    isInBounds(canvasWidth, canvasHeight, margin = 50) {
        return (
            this.position.x >= -margin &&
            this.position.x <= canvasWidth  + margin &&
            this.position.y >= -margin &&
            this.position.y <= canvasHeight + margin
        );
    }

    destroy() {
        this.active = false;
        if (this.graphic) {
            this.graphic.destroy();
            this.graphic = null;
        }
    }

    isActive() { return this.active; }
    setPosition(x, y) { this.position.set(x, y); }
    setVelocity(x, y) { this.velocity.set(x, y); }
}
