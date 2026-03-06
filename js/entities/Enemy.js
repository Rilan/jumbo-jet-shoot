import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { ENEMIES, ENEMY_TYPES, CANVAS } from '../utils/Constants.js';

/**
 * Base enemy class
 */
export class Enemy extends Entity {
    constructor(x, y, type = ENEMY_TYPES.BASIC) {
        const config = ENEMIES[type.toUpperCase()] || ENEMIES.BASIC;

        super(x, y, config.WIDTH, config.HEIGHT);

        this.type = type;
        this.config = config;
        this.health = config.HEALTH;
        this.maxHealth = config.HEALTH;
        this.speed = config.SPEED;
        this.score = config.SCORE;
        this.color = config.COLOR;

        // Movement tracking
        this.startX = x;
        this.startY = y;
        this.time = Math.random() * Math.PI * 2; // Random phase offset

        // Shooter enemy properties
        this.fireCooldown = 0;
        this.fireRate = config.FIRE_RATE || 2;

        // Damage flash
        this.damageFlash = 0;
    }

    /**
     * Update enemy state
     */
    update(deltaTime, playerPosition = null) {
        this.time += deltaTime;

        // Update based on type
        switch (this.type) {
            case ENEMY_TYPES.BASIC:
                this.updateBasic(deltaTime);
                break;
            case ENEMY_TYPES.ZIGZAG:
                this.updateZigZag(deltaTime);
                break;
            case ENEMY_TYPES.CIRCULAR:
                this.updateCircular(deltaTime);
                break;
            case ENEMY_TYPES.SHOOTER:
                this.updateShooter(deltaTime, playerPosition);
                break;
            default:
                this.updateBasic(deltaTime);
        }

        // Damage flash decay
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime * 5;
        }

        // Destroy if too far below screen
        if (this.position.y > CANVAS.HEIGHT + 100) {
            this.destroy();
        }
    }

    /**
     * Basic enemy - moves straight down
     */
    updateBasic(deltaTime) {
        this.velocity.set(0, this.speed);
        this.position.y += this.velocity.y * deltaTime;
    }

    /**
     * ZigZag enemy - oscillates horizontally while moving down
     */
    updateZigZag(deltaTime) {
        const config = ENEMIES.ZIGZAG;
        const horizontalOffset = Math.sin(this.time * config.FREQUENCY) * config.AMPLITUDE;

        this.position.x = this.startX + horizontalOffset;
        this.position.y += this.speed * deltaTime;

        // Bounce off walls
        if (this.position.x < this.width / 2) {
            this.startX = this.width / 2 - horizontalOffset;
        }
        if (this.position.x > CANVAS.WIDTH - this.width / 2) {
            this.startX = CANVAS.WIDTH - this.width / 2 - horizontalOffset;
        }
    }

    /**
     * Circular enemy - spiral/circular movement pattern
     */
    updateCircular(deltaTime) {
        const config = ENEMIES.CIRCULAR;
        const angle = this.time * config.ANGULAR_SPEED;

        this.position.x = this.startX + Math.cos(angle) * config.RADIUS;
        this.position.y += this.speed * deltaTime;

        // Update center point
        this.startX += Math.sin(angle) * 0.5;

        // Keep in bounds horizontally
        if (this.startX < config.RADIUS + this.width) {
            this.startX = config.RADIUS + this.width;
        }
        if (this.startX > CANVAS.WIDTH - config.RADIUS - this.width) {
            this.startX = CANVAS.WIDTH - config.RADIUS - this.width;
        }
    }

    /**
     * Shooter enemy - moves slowly and shoots at player
     */
    updateShooter(deltaTime, playerPosition) {
        // Move down slowly
        this.position.y += this.speed * deltaTime;

        // Try to align with player horizontally
        if (playerPosition) {
            const dx = playerPosition.x - this.position.x;
            this.position.x += Math.sign(dx) * this.speed * 0.3 * deltaTime;
        }

        // Update fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }
    }

    /**
     * Check if shooter can fire
     */
    canShoot() {
        return this.type === ENEMY_TYPES.SHOOTER &&
            this.fireCooldown <= 0 &&
            this.position.y > 50 &&
            this.position.y < CANVAS.HEIGHT - 100;
    }

    /**
     * Reset fire cooldown after shooting
     */
    shoot() {
        this.fireCooldown = this.fireRate;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health -= amount;
        this.damageFlash = 1;

        if (this.health <= 0) {
            this.destroy();
            return true; // Destroyed
        }
        return false;
    }

    /**
     * Render the enemy
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Damage flash effect
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.7;
        }

        // Render based on type
        switch (this.type) {
            case ENEMY_TYPES.BASIC:
                this.renderBasic(ctx);
                break;
            case ENEMY_TYPES.ZIGZAG:
                this.renderZigZag(ctx);
                break;
            case ENEMY_TYPES.CIRCULAR:
                this.renderCircular(ctx);
                break;
            case ENEMY_TYPES.SHOOTER:
                this.renderShooter(ctx);
                break;
            default:
                this.renderBasic(ctx);
        }

        ctx.restore();
    }

    /**
     * Render basic enemy (triangle pointing down)
     */
    renderBasic(ctx) {
        ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Details
        ctx.fillStyle = '#880000';
        ctx.beginPath();
        ctx.arc(0, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render zigzag enemy (diamond shape)
     */
    renderZigZag(ctx) {
        ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Stripes
        ctx.strokeStyle = '#553300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 4);
        ctx.lineTo(this.width / 4, this.height / 4);
        ctx.moveTo(this.width / 4, -this.height / 4);
        ctx.lineTo(-this.width / 4, this.height / 4);
        ctx.stroke();
    }

    /**
     * Render circular enemy (hexagon)
     */
    renderCircular(ctx) {
        ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.time;
            const x = Math.cos(angle) * this.width / 2;
            const y = Math.sin(angle) * this.height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Center orb
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render shooter enemy (larger with cannons)
     */
    renderShooter(ctx) {
        ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.color;

        // Main body
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 4);
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 4);
        ctx.closePath();
        ctx.fill();

        // Cannons
        ctx.fillStyle = '#442288';
        ctx.fillRect(-this.width / 2 - 5, this.height / 4, 10, 15);
        ctx.fillRect(this.width / 2 - 5, this.height / 4, 10, 15);

        // Eye
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Factory function to create enemies
 */
export function createEnemy(x, y, type) {
    return new Enemy(x, y, type);
}
