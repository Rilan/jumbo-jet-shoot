import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { BOSS, CANVAS } from '../utils/Constants.js';

/**
 * Boss enemy with multiple attack patterns and phases
 */
export class Boss extends Entity {
    constructor(x, y, level = 1) {
        super(x, y, BOSS.WIDTH, BOSS.HEIGHT);

        this.level = level;
        this.health = this.calculateHealth();
        this.maxHealth = this.health;
        this.speed = BOSS.SPEED;
        this.score = this.calculateScore();
        this.color = BOSS.COLOR;

        // State machine
        this.state = 'entering';  // entering, fighting, defeated
        this.phase = 0;           // Current attack phase
        this.phaseThresholds = BOSS.PHASES.map(p => p.healthPercent);

        // Movement
        this.targetX = CANVAS.WIDTH / 2;
        this.targetY = 100;
        this.moveTimer = 0;
        this.moveDuration = 2;

        // Attack properties
        this.attackTimer = 0;
        this.attackCooldown = 1.5;
        this.currentPattern = 'spread';

        // Visual effects
        this.time = 0;
        this.damageFlash = 0;
        this.shakeOffset = { x: 0, y: 0 };
    }

    /**
     * Calculate boss health based on level
     */
    calculateHealth() {
        const threshold = BOSS.SPAWN_THRESHOLDS[this.level - 1] || 1000;
        return Math.floor(threshold / BOSS.HEALTH_MULTIPLIER) * 10 + 200;
    }

    /**
     * Calculate boss score based on level
     */
    calculateScore() {
        return this.level * 1000;
    }

    /**
     * Update boss state
     */
    update(deltaTime, playerPosition = null) {
        this.time += deltaTime;

        // Update based on state
        switch (this.state) {
            case 'entering':
                this.updateEntering(deltaTime);
                break;
            case 'fighting':
                this.updateFighting(deltaTime, playerPosition);
                break;
            case 'defeated':
                this.updateDefeated(deltaTime);
                break;
        }

        // Update damage flash
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime * 3;
        }

        // Update phase based on health
        this.updatePhase();
    }

    /**
     * Boss entrance animation
     */
    updateEntering(deltaTime) {
        // Move down to target position
        const distance = this.targetY - this.position.y;

        if (Math.abs(distance) > 5) {
            this.position.y += this.speed * deltaTime;
        } else {
            this.position.y = this.targetY;
            this.state = 'fighting';
        }
    }

    /**
     * Main fighting behavior
     */
    updateFighting(deltaTime, playerPosition) {
        // Horizontal movement
        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveDuration) {
            this.moveTimer = 0;
            this.pickNewTarget();
        }

        // Move towards target
        const dx = this.targetX - this.position.x;
        if (Math.abs(dx) > 5) {
            this.position.x += Math.sign(dx) * this.speed * deltaTime;
        }

        // Keep in bounds
        if (this.position.x < this.width / 2 + 20) {
            this.position.x = this.width / 2 + 20;
        }
        if (this.position.x > CANVAS.WIDTH - this.width / 2 - 20) {
            this.position.x = CANVAS.WIDTH - this.width / 2 - 20;
        }

        // Update attack cooldown
        this.attackTimer += deltaTime;
    }

    /**
     * Death animation
     */
    updateDefeated(deltaTime) {
        // Shake and fade
        this.shakeOffset.x = (Math.random() - 0.5) * 10;
        this.shakeOffset.y = (Math.random() - 0.5) * 10;

        // Will be destroyed by game after explosion effects
    }

    /**
     * Pick a new horizontal movement target
     */
    pickNewTarget() {
        const margin = this.width / 2 + 50;
        this.targetX = margin + Math.random() * (CANVAS.WIDTH - margin * 2);
    }

    /**
     * Update attack phase based on health
     */
    updatePhase() {
        const healthPercent = (this.health / this.maxHealth) * 100;

        for (let i = BOSS.PHASES.length - 1; i >= 0; i--) {
            if (healthPercent <= BOSS.PHASES[i].healthPercent) {
                if (this.phase !== i) {
                    this.phase = i;
                    this.currentPattern = BOSS.PHASES[i].pattern;
                    this.attackCooldown = Math.max(0.5, 1.5 - this.phase * 0.3);
                }
                break;
            }
        }
    }

    /**
     * Check if boss can attack
     */
    canAttack() {
        return this.state === 'fighting' && this.attackTimer >= this.attackCooldown;
    }

    /**
     * Reset attack timer after attacking
     */
    attack() {
        this.attackTimer = 0;
    }

    /**
     * Get bullet spawn data based on current pattern
     */
    getAttackPattern(playerPosition) {
        const bullets = [];
        const baseY = this.position.y + this.height / 2;

        switch (this.currentPattern) {
            case 'spread':
                // Spread shot (5-7 bullets in arc)
                const spreadCount = 5 + this.phase;
                const spreadAngle = Math.PI * 0.4;
                for (let i = 0; i < spreadCount; i++) {
                    const angle = Math.PI / 2 - spreadAngle / 2 + (spreadAngle / (spreadCount - 1)) * i;
                    bullets.push({
                        x: this.position.x,
                        y: baseY,
                        angle: angle,
                        speed: 200 + this.phase * 30
                    });
                }
                break;

            case 'circle':
                // Circular pattern (8-12 bullets)
                const circleCount = 8 + this.phase * 2;
                for (let i = 0; i < circleCount; i++) {
                    const angle = (Math.PI * 2 / circleCount) * i + this.time;
                    bullets.push({
                        x: this.position.x,
                        y: this.position.y,
                        angle: angle,
                        speed: 150 + this.phase * 20
                    });
                }
                break;

            case 'aimed':
                // Aimed shots at player
                if (playerPosition) {
                    const aimAngle = Vector2.angleBetween(this.position, playerPosition);

                    // Main aimed shot
                    bullets.push({
                        x: this.position.x,
                        y: baseY,
                        angle: aimAngle,
                        speed: 280
                    });

                    // Side shots
                    bullets.push({
                        x: this.position.x - 30,
                        y: baseY,
                        angle: aimAngle - 0.2,
                        speed: 250
                    });
                    bullets.push({
                        x: this.position.x + 30,
                        y: baseY,
                        angle: aimAngle + 0.2,
                        speed: 250
                    });
                }
                break;
        }

        return bullets;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.state !== 'fighting') return false;

        this.health -= amount;
        this.damageFlash = 1;

        if (this.health <= 0) {
            this.health = 0;
            this.state = 'defeated';
            return true; // Destroyed
        }
        return false;
    }

    /**
     * Check if boss is active (not defeated)
     */
    isActive() {
        return this.active && this.state !== 'defeated';
    }

    /**
     * Check if boss is in fighting state
     */
    isFighting() {
        return this.state === 'fighting';
    }

    /**
     * Get health percentage for UI
     */
    getHealthPercent() {
        return this.health / this.maxHealth;
    }

    /**
     * Render the boss
     */
    render(ctx) {
        ctx.save();
        ctx.translate(
            this.position.x + this.shakeOffset.x,
            this.position.y + this.shakeOffset.y
        );

        // Damage flash
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.8;
        }

        // Draw boss body
        this.renderBody(ctx);

        // Draw health indicator on boss
        this.renderHealthIndicator(ctx);

        ctx.restore();
    }

    /**
     * Render boss body
     */
    renderBody(ctx) {
        const flash = this.damageFlash > 0;

        // Main body
        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 4);
        ctx.lineTo(-this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 4);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.fillStyle = flash ? '#ffffff' : '#aa0000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, 0);
        ctx.lineTo(-this.width / 2 - 20, this.height / 3);
        ctx.lineTo(-this.width / 2, this.height / 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.width / 3, 0);
        ctx.lineTo(this.width / 2 + 20, this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 4);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = flash ? '#ffffff' : '#330000';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye (glows based on phase)
        const eyeColors = ['#ffff00', '#ff8800', '#ff0000'];
        ctx.fillStyle = eyeColors[this.phase] || '#ffff00';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -this.height / 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cannons
        ctx.fillStyle = '#660000';
        ctx.fillRect(-this.width / 2 - 5, this.height / 4, 15, 20);
        ctx.fillRect(this.width / 2 - 10, this.height / 4, 15, 20);

        // Engine glow
        const enginePulse = Math.sin(this.time * 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 0, ${enginePulse})`;
        ctx.beginPath();
        ctx.ellipse(-this.width / 4, this.height / 2 + 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(this.width / 4, this.height / 2 + 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render small health indicator on boss
     */
    renderHealthIndicator(ctx) {
        const barWidth = 60;
        const barHeight = 6;
        const y = -this.height / 2 - 15;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(-barWidth / 2, y, barWidth, barHeight);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' :
            healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(-barWidth / 2, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, y, barWidth, barHeight);
    }
}
