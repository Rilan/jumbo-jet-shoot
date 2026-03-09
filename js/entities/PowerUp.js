import { Entity } from './Entity.js';
import { POWERUPS, POWERUP_TYPES, CANVAS, hexColor } from '../utils/Constants.js';

const DEPTH = 15;

export class PowerUp extends Entity {
    constructor(scene, x, y, type = POWERUP_TYPES.HEALTH) {
        super(scene, x, y, POWERUPS.SIZE, POWERUPS.SIZE, DEPTH);

        this.type     = type;
        this.colorInt = hexColor(POWERUPS.COLORS[type] || '#ffffff');
        this.speed    = POWERUPS.SPEED;
        this.duration = POWERUPS.DURATION[type.toUpperCase()] || 0;

        this.time      = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation  = 0;
    }

    update(deltaTime) {
        this.time      += deltaTime;
        this.position.y += this.speed * deltaTime;
        this.position.x += Math.sin(this.time * 3 + this.bobOffset) * 0.5;
        this.rotation   += deltaTime * 2;

        if (this.position.y > CANVAS.HEIGHT + this.height) this.destroy();
    }

    getDuration() { return this.duration; }

    draw() {
        if (!this.graphic) return;
        const g    = this.graphic;
        const size = this.width / 2;
        const pulse = Math.sin(this.time * 5) * 3;
        const glow  = size + 10 + pulse;

        g.setPosition(this.position.x, this.position.y);
        g.setRotation(this.rotation);
        g.clear();

        // Outer glow circle (simulate radial gradient)
        g.fillStyle(this.colorInt, 0.22);
        g.fillCircle(0, 0, glow);
        g.fillStyle(this.colorInt, 0.1);
        g.fillCircle(0, 0, glow * 1.3);

        // Icon
        this._drawIcon(g, size);
    }

    _drawIcon(g, size) {
        g.fillStyle(this.colorInt, 1);
        g.lineStyle(2, 0xffffff, 1);

        switch (this.type) {
            case POWERUP_TYPES.WEAPON_UPGRADE:
                // Arrow / upgrade symbol
                g.beginPath();
                g.moveTo(0, -size);
                g.lineTo( size * 0.6,  size * 0.3);
                g.lineTo( size * 0.2,  size * 0.3);
                g.lineTo( size * 0.2,  size);
                g.lineTo(-size * 0.2,  size);
                g.lineTo(-size * 0.2,  size * 0.3);
                g.lineTo(-size * 0.6,  size * 0.3);
                g.closePath();
                g.fillPath();
                g.strokePath();
                break;

            case POWERUP_TYPES.SHIELD:
                // Shield polygon approximation
                g.beginPath();
                g.moveTo(0,        -size);
                g.lineTo( size * 0.7, -size * 0.35);
                g.lineTo( size,        0);
                g.lineTo( size * 0.7,  size * 0.55);
                g.lineTo(0,            size);
                g.lineTo(-size * 0.7,  size * 0.55);
                g.lineTo(-size,        0);
                g.lineTo(-size * 0.7, -size * 0.35);
                g.closePath();
                g.fillPath();
                g.strokePath();
                break;

            case POWERUP_TYPES.SPEED_BOOST:
                // Lightning bolt
                g.beginPath();
                g.moveTo( size * 0.2, -size);
                g.lineTo(-size * 0.3,  0);
                g.lineTo( size * 0.1,  0);
                g.lineTo(-size * 0.2,  size);
                g.lineTo( size * 0.3,  0);
                g.lineTo(-size * 0.1,  0);
                g.closePath();
                g.fillPath();
                g.strokePath();
                break;

            case POWERUP_TYPES.HEALTH:
                // Plus / cross
                g.fillRect(-size * 0.2, -size * 0.7, size * 0.4, size * 1.4);
                g.fillRect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.4);
                g.strokeRect(-size * 0.2, -size * 0.7, size * 0.4, size * 1.4);
                g.strokeRect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.4);
                break;

            case POWERUP_TYPES.EXTRA_LIFE: {
                // Heart — parametric approximation
                const pts = [];
                for (let i = 0; i < 24; i++) {
                    const t = (i / 24) * Math.PI * 2;
                    const hx = 16 * Math.pow(Math.sin(t), 3);
                    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                    pts.push({ x: (hx / 16) * size, y: (hy / 16) * size });
                }
                g.fillPoints(pts, true);
                g.strokePoints(pts, true);
                break;
            }

            case POWERUP_TYPES.RAPID_FIRE:
                // Three bullet ovals
                for (let i = -1; i <= 1; i++) {
                    g.fillEllipse(i * size * 0.4, 0, size * 0.3, size);
                    g.strokeEllipse(i * size * 0.4, 0, size * 0.3, size);
                }
                break;

            default:
                g.fillCircle(0, 0, size * 0.8);
                g.strokeCircle(0, 0, size * 0.8);
        }
    }
}

export function getRandomPowerUpType() {
    const weights = {
        [POWERUP_TYPES.WEAPON_UPGRADE]: 20,
        [POWERUP_TYPES.SHIELD]:          15,
        [POWERUP_TYPES.SPEED_BOOST]:     15,
        [POWERUP_TYPES.HEALTH]:          25,
        [POWERUP_TYPES.EXTRA_LIFE]:       5,
        [POWERUP_TYPES.RAPID_FIRE]:      20
    };
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [type, w] of Object.entries(weights)) {
        r -= w;
        if (r <= 0) return type;
    }
    return POWERUP_TYPES.HEALTH;
}
