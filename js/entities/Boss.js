import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { BOSS, CANVAS, hexColor } from '../utils/Constants.js';

const DEPTH = 35;

export class Boss extends Entity {
    constructor(scene, x, y, level = 1) {
        super(scene, x, y, BOSS.WIDTH, BOSS.HEIGHT, DEPTH);

        this.level    = level;
        this.health   = this.calculateHealth();
        this.maxHealth = this.health;
        this.speed    = BOSS.SPEED;
        this.score    = this.calculateScore();

        this.state   = 'entering';
        this.phase   = 0;
        this.phaseThresholds = BOSS.PHASES.map(p => p.healthPercent);

        this.targetX     = CANVAS.WIDTH / 2;
        this.targetY     = 100;
        this.moveTimer   = 0;
        this.moveDuration = 2;

        this.attackTimer   = 0;
        this.attackCooldown = 1.5;
        this.currentPattern = 'spread';

        this.time        = 0;
        this.damageFlash = 0;
        this.shakeOffset = { x: 0, y: 0 };
    }

    calculateHealth() {
        const threshold = BOSS.SPAWN_THRESHOLDS[this.level - 1] || 1000;
        return Math.floor(threshold / BOSS.HEALTH_MULTIPLIER) * 10 + 200;
    }

    calculateScore() { return this.level * 1000; }

    update(deltaTime, playerPosition = null) {
        this.time += deltaTime;

        switch (this.state) {
            case 'entering':  this.updateEntering(deltaTime); break;
            case 'fighting':  this.updateFighting(deltaTime, playerPosition); break;
            case 'defeated':  this.updateDefeated(); break;
        }

        if (this.damageFlash > 0) this.damageFlash -= deltaTime * 3;
        this.updatePhase();
    }

    updateEntering(dt) {
        if (Math.abs(this.targetY - this.position.y) > 5) {
            this.position.y += this.speed * dt;
        } else {
            this.position.y = this.targetY;
            this.state = 'fighting';
        }
    }

    updateFighting(dt, playerPosition) {
        this.moveTimer += dt;
        if (this.moveTimer >= this.moveDuration) {
            this.moveTimer = 0;
            this.pickNewTarget();
        }

        const dx = this.targetX - this.position.x;
        if (Math.abs(dx) > 5) this.position.x += Math.sign(dx) * this.speed * dt;

        const margin = this.width / 2 + 20;
        this.position.x = Math.max(margin, Math.min(CANVAS.WIDTH - margin, this.position.x));

        this.attackTimer += dt;
    }

    updateDefeated() {
        this.shakeOffset.x = (Math.random() - 0.5) * 10;
        this.shakeOffset.y = (Math.random() - 0.5) * 10;
    }

    pickNewTarget() {
        const margin   = this.width / 2 + 50;
        this.targetX   = margin + Math.random() * (CANVAS.WIDTH - margin * 2);
    }

    updatePhase() {
        const hp = (this.health / this.maxHealth) * 100;
        for (let i = BOSS.PHASES.length - 1; i >= 0; i--) {
            if (hp <= BOSS.PHASES[i].healthPercent) {
                if (this.phase !== i) {
                    this.phase = i;
                    this.currentPattern = BOSS.PHASES[i].pattern;
                    this.attackCooldown = Math.max(0.5, 1.5 - this.phase * 0.3);
                }
                break;
            }
        }
    }

    canAttack() { return this.state === 'fighting' && this.attackTimer >= this.attackCooldown; }
    attack() { this.attackTimer = 0; }

    getAttackPattern(playerPosition) {
        const bullets = [];
        const baseY   = this.position.y + this.height / 2;

        switch (this.currentPattern) {
            case 'spread': {
                const cnt    = 5 + this.phase;
                const spread = Math.PI * 0.4;
                for (let i = 0; i < cnt; i++) {
                    const a = Math.PI / 2 - spread / 2 + (spread / (cnt - 1)) * i;
                    bullets.push({ x: this.position.x, y: baseY, angle: a, speed: 200 + this.phase * 30 });
                }
                break;
            }
            case 'circle': {
                const cnt = 8 + this.phase * 2;
                for (let i = 0; i < cnt; i++) {
                    const a = (Math.PI * 2 / cnt) * i + this.time;
                    bullets.push({ x: this.position.x, y: this.position.y, angle: a, speed: 150 + this.phase * 20 });
                }
                break;
            }
            case 'aimed': {
                if (playerPosition) {
                    const aim = Vector2.angleBetween(this.position, playerPosition);
                    bullets.push({ x: this.position.x,      y: baseY, angle: aim,         speed: 280 });
                    bullets.push({ x: this.position.x - 30, y: baseY, angle: aim - 0.2,   speed: 250 });
                    bullets.push({ x: this.position.x + 30, y: baseY, angle: aim + 0.2,   speed: 250 });
                }
                break;
            }
        }
        return bullets;
    }

    takeDamage(amount) {
        if (this.state !== 'fighting') return false;
        this.health -= amount;
        this.damageFlash = 1;
        if (this.health <= 0) {
            this.health = 0;
            this.state  = 'defeated';
            return true;
        }
        return false;
    }

    isActive()   { return this.active && this.state !== 'defeated'; }
    isFighting() { return this.state === 'fighting'; }
    getHealthPercent() { return this.health / this.maxHealth; }

    draw() {
        if (!this.graphic) return;
        const g  = this.graphic;
        const px = this.position.x + this.shakeOffset.x;
        const py = this.position.y + this.shakeOffset.y;
        const w  = this.width;
        const h  = this.height;
        const fl = this.damageFlash > 0;

        g.setPosition(px, py);
        g.clear();

        // Main body
        g.fillStyle(fl ? 0xffffff : 0xcc0000, 1);
        g.beginPath();
        g.moveTo(0,      -h / 2);
        g.lineTo(-w / 2,  h / 4);
        g.lineTo(-w / 3,  h / 2);
        g.lineTo( w / 3,  h / 2);
        g.lineTo( w / 2,  h / 4);
        g.closePath();
        g.fillPath();

        // Wings
        g.fillStyle(fl ? 0xffffff : 0xaa0000, 1);
        g.beginPath();
        g.moveTo(-w / 3,      0);
        g.lineTo(-w / 2 - 18, h / 3);
        g.lineTo(-w / 2,      h / 4);
        g.closePath();
        g.fillPath();

        g.beginPath();
        g.moveTo( w / 3,      0);
        g.lineTo( w / 2 + 18, h / 3);
        g.lineTo( w / 2,      h / 4);
        g.closePath();
        g.fillPath();

        // Cockpit
        g.fillStyle(fl ? 0xffffff : 0x330000, 1);
        g.fillEllipse(0, -h / 6, 30, 40);

        // Phase eye
        const eyeColors = [0xffff00, 0xff8800, 0xff0000];
        const eyeColor  = eyeColors[this.phase] || 0xffff00;
        g.fillStyle(eyeColor, 1);
        g.fillCircle(0, -h / 6, 8);
        // Eye glow ring
        g.lineStyle(2, eyeColor, 0.5);
        g.strokeCircle(0, -h / 6, 14);

        // Cannons
        g.fillStyle(0x660000, 1);
        g.fillRect(-w / 2 - 5, h / 4,      14, 18);
        g.fillRect( w / 2 - 9, h / 4,      14, 18);

        // Engine glow
        const pulse = Math.sin(this.time * 10) * 0.3 + 0.7;
        g.fillStyle(0xff6400, pulse);
        g.fillEllipse(-w / 4, h / 2 + 5, 16, 8);
        g.fillEllipse( w / 4, h / 2 + 5, 16, 8);

        // Mini health bar
        const barW = 60;
        const barY = -h / 2 - 14;
        g.fillStyle(0x333333, 1);
        g.fillRect(-barW / 2, barY, barW, 6);
        const hp   = this.health / this.maxHealth;
        const hpC  = hp > 0.5 ? 0x00ff00 : hp > 0.25 ? 0xffff00 : 0xff0000;
        g.fillStyle(hpC, 1);
        g.fillRect(-barW / 2, barY, barW * hp, 6);
        g.lineStyle(1, 0xffffff, 0.8);
        g.strokeRect(-barW / 2, barY, barW, 6);
    }
}
