import { Entity } from './Entity.js';
import { POWERUPS, POWERUP_TYPES, CANVAS } from '../utils/Constants.js';

/**
 * Power-up collectible entity
 */
export class PowerUp extends Entity {
    constructor(x, y, type = POWERUP_TYPES.HEALTH) {
        super(x, y, POWERUPS.SIZE, POWERUPS.SIZE);

        this.type = type;
        this.color = POWERUPS.COLORS[type] || '#ffffff';
        this.speed = POWERUPS.SPEED;
        this.duration = POWERUPS.DURATION[type.toUpperCase()] || 0;

        // Animation
        this.time = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
    }

    /**
     * Update power-up state
     */
    update(deltaTime) {
        this.time += deltaTime;

        // Move downward
        this.position.y += this.speed * deltaTime;

        // Slight horizontal bobbing
        this.position.x += Math.sin(this.time * 3 + this.bobOffset) * 0.5;

        // Rotation animation
        this.rotation += deltaTime * 2;

        // Destroy if off screen
        if (this.position.y > CANVAS.HEIGHT + this.height) {
            this.destroy();
        }
    }

    /**
     * Render the power-up
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Pulsing glow
        const pulseSize = Math.sin(this.time * 5) * 3;
        const glowRadius = this.width / 2 + 10 + pulseSize;

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.color + '66');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rotate for spinning effect
        ctx.rotate(this.rotation);

        // Draw icon based on type
        this.renderIcon(ctx);

        ctx.restore();
    }

    /**
     * Render power-up icon based on type
     */
    renderIcon(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        const size = this.width / 2;

        switch (this.type) {
            case POWERUP_TYPES.WEAPON_UPGRADE:
                // Arrow/upgrade symbol
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.6, size * 0.3);
                ctx.lineTo(size * 0.2, size * 0.3);
                ctx.lineTo(size * 0.2, size);
                ctx.lineTo(-size * 0.2, size);
                ctx.lineTo(-size * 0.2, size * 0.3);
                ctx.lineTo(-size * 0.6, size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case POWERUP_TYPES.SHIELD:
                // Shield shape
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.quadraticCurveTo(size, -size * 0.5, size, 0);
                ctx.quadraticCurveTo(size, size, 0, size);
                ctx.quadraticCurveTo(-size, size, -size, 0);
                ctx.quadraticCurveTo(-size, -size * 0.5, 0, -size);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case POWERUP_TYPES.SPEED_BOOST:
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(size * 0.2, -size);
                ctx.lineTo(-size * 0.3, 0);
                ctx.lineTo(size * 0.1, 0);
                ctx.lineTo(-size * 0.2, size);
                ctx.lineTo(size * 0.3, 0);
                ctx.lineTo(-size * 0.1, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case POWERUP_TYPES.HEALTH:
                // Plus/cross symbol
                ctx.beginPath();
                ctx.rect(-size * 0.2, -size * 0.7, size * 0.4, size * 1.4);
                ctx.rect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.4);
                ctx.fill();
                ctx.strokeRect(-size * 0.2, -size * 0.7, size * 0.4, size * 1.4);
                ctx.strokeRect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.4);
                break;

            case POWERUP_TYPES.EXTRA_LIFE:
                // Heart shape
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.3);
                ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.3, 0, size * 0.7);
                ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size, 0, -size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case POWERUP_TYPES.RAPID_FIRE:
                // Triple bullet symbol
                ctx.fillStyle = this.color;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.ellipse(i * size * 0.4, 0, size * 0.15, size * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                break;

            default:
                // Default circle
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
        }
    }

    /**
     * Get the duration of this power-up effect
     */
    getDuration() {
        return this.duration;
    }
}

/**
 * Get a random power-up type based on weights
 */
export function getRandomPowerUpType() {
    const weights = {
        [POWERUP_TYPES.WEAPON_UPGRADE]: 20,
        [POWERUP_TYPES.SHIELD]: 15,
        [POWERUP_TYPES.SPEED_BOOST]: 15,
        [POWERUP_TYPES.HEALTH]: 25,
        [POWERUP_TYPES.EXTRA_LIFE]: 5,
        [POWERUP_TYPES.RAPID_FIRE]: 20
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
            return type;
        }
    }

    return POWERUP_TYPES.HEALTH;
}
