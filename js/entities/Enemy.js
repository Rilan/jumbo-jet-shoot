import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { ENEMIES, ENEMY_TYPES, CANVAS, hexColor } from '../utils/Constants.js';

const DEPTH = 30;

export class Enemy extends Entity {
    constructor(scene, x, y, type = ENEMY_TYPES.BASIC) {
        const cfg = ENEMIES[type.toUpperCase()] || ENEMIES.BASIC;
        super(scene, x, y, cfg.WIDTH, cfg.HEIGHT, DEPTH);

        this.type     = type;
        this.config   = cfg;
        this.health   = cfg.HEALTH;
        this.maxHealth = cfg.HEALTH;
        this.speed    = cfg.SPEED;
        this.score    = cfg.SCORE;
        this.colorInt = hexColor(cfg.COLOR);

        this.startX = x;
        this.startY = y;
        this.time   = Math.random() * Math.PI * 2;

        this.fireCooldown = 0;
        this.fireRate     = cfg.FIRE_RATE || 2;
        this.damageFlash  = 0;
    }

    update(deltaTime, playerPosition = null) {
        this.time += deltaTime;

        switch (this.type) {
            case ENEMY_TYPES.BASIC:    this.updateBasic(deltaTime); break;
            case ENEMY_TYPES.ZIGZAG:   this.updateZigZag(deltaTime); break;
            case ENEMY_TYPES.CIRCULAR: this.updateCircular(deltaTime); break;
            case ENEMY_TYPES.SHOOTER:  this.updateShooter(deltaTime, playerPosition); break;
            default: this.updateBasic(deltaTime);
        }

        if (this.damageFlash > 0) this.damageFlash -= deltaTime * 5;
        if (this.position.y > CANVAS.HEIGHT + 100) this.destroy();
    }

    updateBasic(dt) {
        this.velocity.set(0, this.speed);
        this.position.y += this.velocity.y * dt;
    }

    updateZigZag(dt) {
        const cfg = ENEMIES.ZIGZAG;
        const ho  = Math.sin(this.time * cfg.FREQUENCY) * cfg.AMPLITUDE;
        this.position.x  = this.startX + ho;
        this.position.y += this.speed * dt;
        if (this.position.x < this.width / 2)                  this.startX = this.width / 2 - ho;
        if (this.position.x > CANVAS.WIDTH - this.width / 2)   this.startX = CANVAS.WIDTH - this.width / 2 - ho;
    }

    updateCircular(dt) {
        const cfg   = ENEMIES.CIRCULAR;
        const angle = this.time * cfg.ANGULAR_SPEED;
        this.position.x  = this.startX + Math.cos(angle) * cfg.RADIUS;
        this.position.y += this.speed * dt;
        this.startX += Math.sin(angle) * 0.5;
        this.startX = Math.max(cfg.RADIUS + this.width, Math.min(CANVAS.WIDTH - cfg.RADIUS - this.width, this.startX));
    }

    updateShooter(dt, playerPosition) {
        this.position.y += this.speed * dt;
        if (playerPosition) {
            const dx = playerPosition.x - this.position.x;
            this.position.x += Math.sign(dx) * this.speed * 0.3 * dt;
        }
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
    }

    canShoot() {
        return this.type === ENEMY_TYPES.SHOOTER &&
            this.fireCooldown <= 0 &&
            this.position.y > 50 &&
            this.position.y < CANVAS.HEIGHT - 100;
    }

    shoot() { this.fireCooldown = this.fireRate; }

    takeDamage(amount) {
        this.health -= amount;
        this.damageFlash = 1;
        if (this.health <= 0) { this.destroy(); return true; }
        return false;
    }

    draw() {
        if (!this.graphic) return;
        const g = this.graphic;
        const px = this.position.x;
        const py = this.position.y;
        const w  = this.width;
        const h  = this.height;
        const fl = this.damageFlash > 0;
        const c  = fl ? 0xffffff : this.colorInt;

        g.setPosition(px, py);
        g.setAlpha(1);
        g.clear();

        switch (this.type) {
            case ENEMY_TYPES.BASIC:    this._drawBasic(g, w, h, c, fl); break;
            case ENEMY_TYPES.ZIGZAG:   this._drawZigZag(g, w, h, c); break;
            case ENEMY_TYPES.CIRCULAR: this._drawCircular(g, w, h, c); break;
            case ENEMY_TYPES.SHOOTER:  this._drawShooter(g, w, h, c); break;
            default: this._drawBasic(g, w, h, c, fl);
        }
    }

    _drawBasic(g, w, h, c) {
        g.fillStyle(c, 1);
        g.beginPath();
        g.moveTo(0,    h / 2);
        g.lineTo(-w / 2, -h / 2);
        g.lineTo( w / 2, -h / 2);
        g.closePath();
        g.fillPath();

        g.fillStyle(0x880000, 1);
        g.fillCircle(0, -h / 6, 5);
    }

    _drawZigZag(g, w, h, c) {
        g.fillStyle(c, 1);
        g.beginPath();
        g.moveTo(0,     -h / 2);
        g.lineTo( w / 2, 0);
        g.lineTo(0,      h / 2);
        g.lineTo(-w / 2, 0);
        g.closePath();
        g.fillPath();

        g.lineStyle(2, 0x553300, 1);
        g.beginPath();
        g.moveTo(-w / 4, -h / 4);
        g.lineTo( w / 4,  h / 4);
        g.strokePath();
        g.beginPath();
        g.moveTo( w / 4, -h / 4);
        g.lineTo(-w / 4,  h / 4);
        g.strokePath();
    }

    _drawCircular(g, w, h, c) {
        g.fillStyle(c, 1);
        g.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + this.time;
            const x = Math.cos(a) * w / 2;
            const y = Math.sin(a) * h / 2;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.closePath();
        g.fillPath();

        g.fillStyle(0xff00ff, 1);
        g.fillCircle(0, 0, 6);
    }

    _drawShooter(g, w, h, c) {
        g.fillStyle(c, 1);
        g.beginPath();
        g.moveTo(0,     h / 2);
        g.lineTo(-w / 2, -h / 4);
        g.lineTo(-w / 4, -h / 2);
        g.lineTo( w / 4, -h / 2);
        g.lineTo( w / 2, -h / 4);
        g.closePath();
        g.fillPath();

        // Cannons
        g.fillStyle(0x442288, 1);
        g.fillRect(-w / 2 - 5, h / 4, 10, 14);
        g.fillRect( w / 2 - 5, h / 4, 10, 14);

        // Eye
        g.fillStyle(0xffff00, 1);
        g.fillCircle(0, 0, 6);
    }
}

export function createEnemy(scene, x, y, type) {
    return new Enemy(scene, x, y, type);
}
