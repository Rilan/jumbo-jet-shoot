import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { PLAYER, CANVAS, COLORS } from '../utils/Constants.js';

/**
 * Player jet entity
 */
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER.WIDTH, PLAYER.HEIGHT);

        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.lives = PLAYER.STARTING_LIVES;
        this.speed = PLAYER.SPEED;
        this.fireRate = PLAYER.FIRE_RATE;
        this.fireCooldown = 0;
        this.bulletDamage = PLAYER.BULLET_DAMAGE;
        this.bulletSpeed = PLAYER.BULLET_SPEED;

        // Power-up states
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        this.rapidFireActive = false;
        this.rapidFireTimer = 0;
        this.weaponLevel = 1;

        // Visual effects
        this.thrustFlicker = 0;
        this.damageFlash = 0;

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 8;
    }

    /**
     * Update player state
     */
    update(deltaTime, inputManager) {
        // Get movement input
        const direction = inputManager.getMovementDirection();

        // Calculate speed (with boost if active)
        const currentSpeed = this.speedBoostActive ? this.speed * 1.5 : this.speed;

        // Apply movement
        this.velocity.x = direction.x * currentSpeed;
        this.velocity.y = direction.y * currentSpeed;

        // Update position
        super.update(deltaTime);

        // Keep player in bounds
        this.constrainToBounds();

        // Update fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.invincible = false;
            }
        }

        // Update shield
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }

        // Update speed boost
        if (this.speedBoostActive) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedBoostActive = false;
            }
        }

        // Update rapid fire
        if (this.rapidFireActive) {
            this.rapidFireTimer -= deltaTime;
            if (this.rapidFireTimer <= 0) {
                this.rapidFireActive = false;
            }
        }

        // Update visual effects
        this.thrustFlicker += deltaTime * 20;
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime * 5;
        }

        // Update trail
        this.updateTrail();
    }

    /**
     * Update engine trail effect
     */
    updateTrail() {
        this.trail.unshift({
            x: this.position.x,
            y: this.position.y + this.height / 2,
            alpha: 1
        });

        // Limit trail length
        while (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Fade trail
        this.trail.forEach((point, index) => {
            point.alpha = 1 - (index / this.maxTrailLength);
        });
    }

    /**
     * Keep player within canvas bounds
     */
    constrainToBounds() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        if (this.position.x < halfWidth) {
            this.position.x = halfWidth;
        }
        if (this.position.x > CANVAS.WIDTH - halfWidth) {
            this.position.x = CANVAS.WIDTH - halfWidth;
        }
        if (this.position.y < halfHeight) {
            this.position.y = halfHeight;
        }
        if (this.position.y > CANVAS.HEIGHT - halfHeight) {
            this.position.y = CANVAS.HEIGHT - halfHeight;
        }
    }

    /**
     * Check if player can shoot
     */
    canShoot() {
        const currentFireRate = this.rapidFireActive ? this.fireRate * 0.4 : this.fireRate;
        return this.fireCooldown <= 0;
    }

    /**
     * Get current fire rate
     */
    getCurrentFireRate() {
        return this.rapidFireActive ? this.fireRate * 0.4 : this.fireRate;
    }

    /**
     * Reset fire cooldown after shooting
     */
    shoot() {
        this.fireCooldown = this.getCurrentFireRate();
    }

    /**
     * Get bullet spawn positions based on weapon level
     */
    getBulletSpawnPositions() {
        const positions = [];
        const baseX = this.position.x;
        const baseY = this.position.y - this.height / 2;

        switch (this.weaponLevel) {
            case 1:
                positions.push({ x: baseX, y: baseY, angle: -Math.PI / 2 });
                break;
            case 2:
                positions.push({ x: baseX - 10, y: baseY, angle: -Math.PI / 2 });
                positions.push({ x: baseX + 10, y: baseY, angle: -Math.PI / 2 });
                break;
            case 3:
                positions.push({ x: baseX, y: baseY, angle: -Math.PI / 2 });
                positions.push({ x: baseX - 15, y: baseY + 5, angle: -Math.PI / 2 - 0.15 });
                positions.push({ x: baseX + 15, y: baseY + 5, angle: -Math.PI / 2 + 0.15 });
                break;
            case 4:
            default:
                positions.push({ x: baseX - 8, y: baseY, angle: -Math.PI / 2 });
                positions.push({ x: baseX + 8, y: baseY, angle: -Math.PI / 2 });
                positions.push({ x: baseX - 20, y: baseY + 8, angle: -Math.PI / 2 - 0.2 });
                positions.push({ x: baseX + 20, y: baseY + 8, angle: -Math.PI / 2 + 0.2 });
                break;
        }

        return positions;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.invincible || this.shieldActive) {
            return false;
        }

        this.health -= amount;
        this.damageFlash = 1;

        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.respawn();
            }
            return true; // Died
        }

        // Brief invincibility after hit
        this.invincible = true;
        this.invincibilityTimer = 0.5;

        return false;
    }

    /**
     * Respawn after losing a life
     */
    respawn() {
        this.health = this.maxHealth;
        this.position.set(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);
        this.invincible = true;
        this.invincibilityTimer = PLAYER.INVINCIBILITY_TIME;
        // Keep weapon level on respawn
    }

    /**
     * Apply power-up effect
     */
    applyPowerUp(type, duration) {
        switch (type) {
            case 'weapon':
                if (this.weaponLevel < 4) {
                    this.weaponLevel++;
                }
                break;
            case 'shield':
                this.shieldActive = true;
                this.shieldTimer = duration;
                break;
            case 'speed':
                this.speedBoostActive = true;
                this.speedBoostTimer = duration;
                break;
            case 'health':
                this.health = Math.min(this.health + 30, this.maxHealth);
                break;
            case 'life':
                this.lives++;
                break;
            case 'rapid':
                this.rapidFireActive = true;
                this.rapidFireTimer = duration;
                break;
        }
    }

    /**
     * Get active power-up timers for HUD
     */
    getActivePowerUps() {
        const powerups = [];
        if (this.shieldActive) {
            powerups.push({ type: 'shield', timer: this.shieldTimer });
        }
        if (this.speedBoostActive) {
            powerups.push({ type: 'speed', timer: this.speedBoostTimer });
        }
        if (this.rapidFireActive) {
            powerups.push({ type: 'rapid', timer: this.rapidFireTimer });
        }
        return powerups;
    }

    /**
     * Check if player is game over
     */
    isGameOver() {
        return this.lives <= 0 && this.health <= 0;
    }

    /**
     * Reset player to initial state
     */
    reset() {
        this.health = PLAYER.MAX_HEALTH;
        this.lives = PLAYER.STARTING_LIVES;
        this.position.set(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);
        this.velocity.set(0, 0);
        this.weaponLevel = 1;
        this.invincible = false;
        this.shieldActive = false;
        this.speedBoostActive = false;
        this.rapidFireActive = false;
        this.fireCooldown = 0;
        this.trail = [];
    }

    /**
     * Render the player
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        // Draw trail
        this.renderTrail(ctx);

        // Flashing when invincible
        if (this.invincible && Math.floor(this.invincibilityTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Damage flash
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.7;
        }

        // Draw jet body
        this.renderJet(ctx);

        // Draw shield if active
        if (this.shieldActive) {
            this.renderShield(ctx);
        }

        ctx.restore();
    }

    /**
     * Render engine trail
     */
    renderTrail(ctx) {
        ctx.save();
        this.trail.forEach((point, index) => {
            const relX = point.x - this.position.x;
            const relY = point.y - this.position.y;
            const size = (1 - index / this.maxTrailLength) * 8;

            ctx.globalAlpha = point.alpha * 0.5;
            ctx.fillStyle = COLORS.TRAIL;
            ctx.beginPath();
            ctx.arc(relX, relY, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    /**
     * Render the jet sprite
     */
    renderJet(ctx) {
        // Main body
        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);           // Nose
        ctx.lineTo(-this.width / 2, this.height / 2);  // Left wing
        ctx.lineTo(-this.width / 4, this.height / 3);  // Left indent
        ctx.lineTo(0, this.height / 2.5);          // Center bottom
        ctx.lineTo(this.width / 4, this.height / 3);   // Right indent
        ctx.lineTo(this.width / 2, this.height / 2);   // Right wing
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = COLORS.PLAYER_ACCENT;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 3);
        ctx.lineTo(-this.width / 6, this.height / 8);
        ctx.lineTo(this.width / 6, this.height / 8);
        ctx.closePath();
        ctx.fill();

        // Engine thrust
        const thrustSize = 8 + Math.sin(this.thrustFlicker) * 3;
        const gradient = ctx.createLinearGradient(0, this.height / 2, 0, this.height / 2 + thrustSize);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#0088ff');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-8, this.height / 2.5);
        ctx.lineTo(0, this.height / 2 + thrustSize);
        ctx.lineTo(8, this.height / 2.5);
        ctx.closePath();
        ctx.fill();

        // Speed boost effect
        if (this.speedBoostActive) {
            const boostSize = thrustSize * 1.5;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(-12, this.height / 2.5);
            ctx.lineTo(0, this.height / 2 + boostSize);
            ctx.lineTo(12, this.height / 2.5);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * Render shield effect
     */
    renderShield(ctx) {
        const pulseSize = Math.sin(Date.now() / 100) * 3;
        const radius = Math.max(this.width, this.height) / 2 + 15 + pulseSize;

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#00ffff';
        ctx.fill();
    }
}
