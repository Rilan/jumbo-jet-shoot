import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { BULLET, CANVAS } from '../utils/Constants.js';

/**
 * Bullet/projectile entity
 */
export class Bullet extends Entity {
    constructor(x, y, angle, speed, damage, isPlayerBullet = true) {
        super(x, y, BULLET.WIDTH, BULLET.HEIGHT);

        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.isPlayerBullet = isPlayerBullet;

        // Set velocity based on angle
        this.velocity = Vector2.fromAngle(angle, speed);

        // Visual properties
        this.color = isPlayerBullet ? BULLET.PLAYER_COLOR : BULLET.ENEMY_COLOR;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    /**
     * Update bullet state
     */
    update(deltaTime) {
        // Store trail position
        this.trail.unshift({
            x: this.position.x,
            y: this.position.y,
            alpha: 1
        });

        // Limit trail
        while (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Fade trail
        this.trail.forEach((point, index) => {
            point.alpha = 1 - (index / this.maxTrailLength);
        });

        // Update position
        super.update(deltaTime);

        // Destroy if out of bounds
        if (!this.isInBounds(CANVAS.WIDTH, CANVAS.HEIGHT)) {
            this.destroy();
        }
    }

    /**
     * Render the bullet
     */
    render(ctx) {
        ctx.save();

        // Draw trail
        this.trail.forEach((point, index) => {
            const size = (1 - index / this.maxTrailLength) * 3;
            ctx.globalAlpha = point.alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw bullet
        ctx.globalAlpha = 1;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Bullet shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Get a narrower hitbox for bullets
     */
    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

/**
 * Boss bullet with special properties
 */
export class BossBullet extends Bullet {
    constructor(x, y, angle, speed, damage) {
        super(x, y, angle, speed, damage, false);
        this.width = 10;
        this.height = 10;
        this.color = '#ff3333';
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Draw larger boss bullet
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
