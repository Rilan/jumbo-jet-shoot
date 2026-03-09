import { Entity } from './Entity.js';
import { PLAYER, CANVAS, hexColor } from '../utils/Constants.js';

const DEPTH = 40;

export class Player extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, PLAYER.WIDTH, PLAYER.HEIGHT, DEPTH);

        this.health        = PLAYER.MAX_HEALTH;
        this.maxHealth     = PLAYER.MAX_HEALTH;
        this.lives         = PLAYER.STARTING_LIVES;
        this.speed         = PLAYER.SPEED;
        this.fireRate      = PLAYER.FIRE_RATE;
        this.fireCooldown  = 0;
        this.bulletDamage  = PLAYER.BULLET_DAMAGE;
        this.bulletSpeed   = PLAYER.BULLET_SPEED;

        // Power-up state
        this.invincible         = false;
        this.invincibilityTimer = 0;
        this.shieldActive       = false;
        this.shieldTimer        = 0;
        this.speedBoostActive   = false;
        this.speedBoostTimer    = 0;
        this.rapidFireActive    = false;
        this.rapidFireTimer     = 0;
        this.weaponLevel        = 1;

        // Visuals
        this.thrustFlicker = 0;
        this.damageFlash   = 0;
        this.trail         = [];
        this.maxTrailLength = 8;
    }

    update(deltaTime, inputManager) {
        const dir          = inputManager.getMovementDirection();
        const currentSpeed = this.speedBoostActive ? this.speed * 1.5 : this.speed;

        this.velocity.x = dir.x * currentSpeed;
        this.velocity.y = dir.y * currentSpeed;
        super.update(deltaTime);
        this.constrainToBounds();

        if (this.fireCooldown > 0) this.fireCooldown -= deltaTime;

        if (this.invincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) this.invincible = false;
        }
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
        if (this.speedBoostActive) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) this.speedBoostActive = false;
        }
        if (this.rapidFireActive) {
            this.rapidFireTimer -= deltaTime;
            if (this.rapidFireTimer <= 0) this.rapidFireActive = false;
        }

        this.thrustFlicker += deltaTime * 20;
        if (this.damageFlash > 0) this.damageFlash -= deltaTime * 5;

        this.updateTrail();
    }

    updateTrail() {
        this.trail.unshift({ x: this.position.x, y: this.position.y + this.height / 2, alpha: 1 });
        while (this.trail.length > this.maxTrailLength) this.trail.pop();
        this.trail.forEach((p, i) => { p.alpha = 1 - i / this.maxTrailLength; });
    }

    constrainToBounds() {
        const hw = this.width  / 2;
        const hh = this.height / 2;
        this.position.x = Math.max(hw,               Math.min(CANVAS.WIDTH  - hw, this.position.x));
        this.position.y = Math.max(hh,               Math.min(CANVAS.HEIGHT - hh, this.position.y));
    }

    canShoot() { return this.fireCooldown <= 0; }
    getCurrentFireRate() { return this.rapidFireActive ? this.fireRate * 0.4 : this.fireRate; }
    shoot() { this.fireCooldown = this.getCurrentFireRate(); }

    getBulletSpawnPositions() {
        const bx = this.position.x;
        const by = this.position.y - this.height / 2;
        switch (this.weaponLevel) {
            case 1: return [{ x: bx,      y: by,     angle: -Math.PI / 2 }];
            case 2: return [{ x: bx - 10, y: by,     angle: -Math.PI / 2 },
                            { x: bx + 10, y: by,     angle: -Math.PI / 2 }];
            case 3: return [{ x: bx,      y: by,     angle: -Math.PI / 2 },
                            { x: bx - 14, y: by + 5, angle: -Math.PI / 2 - 0.15 },
                            { x: bx + 14, y: by + 5, angle: -Math.PI / 2 + 0.15 }];
            default:return [{ x: bx - 8,  y: by,     angle: -Math.PI / 2 },
                            { x: bx + 8,  y: by,     angle: -Math.PI / 2 },
                            { x: bx - 20, y: by + 8, angle: -Math.PI / 2 - 0.2 },
                            { x: bx + 20, y: by + 8, angle: -Math.PI / 2 + 0.2 }];
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.shieldActive) return false;
        this.health -= amount;
        this.damageFlash = 1;
        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) this.respawn();
            return true;
        }
        this.invincible = true;
        this.invincibilityTimer = 0.5;
        return false;
    }

    respawn() {
        this.health = this.maxHealth;
        this.position.set(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);
        this.invincible = true;
        this.invincibilityTimer = PLAYER.INVINCIBILITY_TIME;
    }

    applyPowerUp(type, duration) {
        switch (type) {
            case 'weapon': if (this.weaponLevel < 4) this.weaponLevel++; break;
            case 'shield': this.shieldActive = true;  this.shieldTimer = duration; break;
            case 'speed':  this.speedBoostActive = true; this.speedBoostTimer = duration; break;
            case 'health': this.health = Math.min(this.health + 30, this.maxHealth); break;
            case 'life':   this.lives++; break;
            case 'rapid':  this.rapidFireActive = true; this.rapidFireTimer = duration; break;
        }
    }

    getActivePowerUps() {
        const list = [];
        if (this.shieldActive)     list.push({ type: 'shield', timer: this.shieldTimer });
        if (this.speedBoostActive) list.push({ type: 'speed',  timer: this.speedBoostTimer });
        if (this.rapidFireActive)  list.push({ type: 'rapid',  timer: this.rapidFireTimer });
        return list;
    }

    isGameOver() { return this.lives <= 0 && this.health <= 0; }

    reset() {
        this.health = this.maxHealth;
        this.lives  = PLAYER.STARTING_LIVES;
        this.position.set(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);
        this.velocity.set(0, 0);
        this.weaponLevel = 1;
        this.invincible = this.shieldActive = this.speedBoostActive = this.rapidFireActive = false;
        this.fireCooldown = 0;
        this.trail = [];
    }

    // ---- Phaser Graphics rendering ----

    draw() {
        if (!this.graphic) return;
        const g  = this.graphic;
        const px = this.position.x;
        const py = this.position.y;
        const w  = this.width;
        const h  = this.height;

        // Invincibility flash
        const flashOff = this.invincible &&
            Math.floor(this.invincibilityTimer * 10) % 2 === 0;
        const alpha = flashOff ? 0.3 : (this.damageFlash > 0 ? 0.65 : 1);

        g.setPosition(px, py);
        g.setAlpha(alpha);
        g.clear();

        // Engine trail
        for (let i = 0; i < this.trail.length; i++) {
            const tp   = this.trail[i];
            const lx   = tp.x - px;
            const ly   = tp.y - py;
            const size = (1 - i / this.maxTrailLength) * 7;
            g.fillStyle(0x00c8ff, tp.alpha * 0.45);
            g.fillCircle(lx, ly, size);
        }

        // Main body
        g.fillStyle(0x00ccff, 1);
        g.beginPath();
        g.moveTo(0,    -h / 2);
        g.lineTo(-w / 2, h / 2);
        g.lineTo(-w / 4, h / 3);
        g.lineTo(0,    h / 2.5);
        g.lineTo( w / 4, h / 3);
        g.lineTo( w / 2, h / 2);
        g.closePath();
        g.fillPath();

        // Cockpit
        g.fillStyle(0x0088cc, 1);
        g.beginPath();
        g.moveTo(0,    -h / 3);
        g.lineTo(-w / 6, h / 8);
        g.lineTo( w / 6, h / 8);
        g.closePath();
        g.fillPath();

        // Engine thrust flame
        const thrustSize = 8 + Math.sin(this.thrustFlicker) * 3;
        g.fillStyle(0x00ffff, 0.85);
        g.beginPath();
        g.moveTo(-7, h / 2.5);
        g.lineTo(0,  h / 2 + thrustSize);
        g.lineTo( 7, h / 2.5);
        g.closePath();
        g.fillPath();

        // Speed boost extra flame
        if (this.speedBoostActive) {
            const bSize = thrustSize * 1.6;
            g.fillStyle(0x00ff00, 0.5);
            g.beginPath();
            g.moveTo(-11, h / 2.5);
            g.lineTo(0,   h / 2 + bSize);
            g.lineTo( 11, h / 2.5);
            g.closePath();
            g.fillPath();
        }

        // Shield ring
        if (this.shieldActive) {
            const pulse  = Math.sin(Date.now() / 100) * 3;
            const radius = Math.max(w, h) / 2 + 14 + pulse;
            g.lineStyle(3, 0x00ffff, 0.65);
            g.strokeCircle(0, 0, radius);
            g.fillStyle(0x00ffff, 0.15);
            g.fillCircle(0, 0, radius);
        }
    }
}
