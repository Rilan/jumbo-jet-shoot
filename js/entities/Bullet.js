import { Entity } from './Entity.js';
import { Vector2 } from '../utils/Vector2.js';
import { BULLET, CANVAS, hexColor } from '../utils/Constants.js';

const DEPTH = 20;

export class Bullet extends Entity {
    constructor(scene, x, y, angle, speed, damage, isPlayerBullet = true) {
        super(scene, x, y, BULLET.WIDTH, BULLET.HEIGHT, DEPTH);

        this.angle          = angle;
        this.speed          = speed;
        this.damage         = damage;
        this.isPlayerBullet = isPlayerBullet;
        this.colorStr       = isPlayerBullet ? BULLET.PLAYER_COLOR : BULLET.ENEMY_COLOR;
        this.colorInt       = hexColor(this.colorStr);

        this.velocity = Vector2.fromAngle(angle, speed);

        this.trail        = [];
        this.maxTrailLength = 5;
    }

    update(deltaTime) {
        this.trail.unshift({ x: this.position.x, y: this.position.y, alpha: 1 });
        while (this.trail.length > this.maxTrailLength) this.trail.pop();
        this.trail.forEach((p, i) => { p.alpha = 1 - i / this.maxTrailLength; });

        super.update(deltaTime);

        if (!this.isInBounds(CANVAS.WIDTH, CANVAS.HEIGHT)) this.destroy();
    }

    draw() {
        if (!this.graphic) return;
        const g = this.graphic;
        g.setPosition(this.position.x, this.position.y);
        g.setRotation(this.angle + Math.PI / 2);
        g.clear();

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const tp   = this.trail[i];
            const size = (1 - i / this.maxTrailLength) * 3;
            // convert to local coords relative to current pos (unrotated)
            const dx = tp.x - this.position.x;
            const dy = tp.y - this.position.y;
            // un-rotate trail points back to local space
            const cos = Math.cos(-(this.angle + Math.PI / 2));
            const sin = Math.sin(-(this.angle + Math.PI / 2));
            const lx  = dx * cos - dy * sin;
            const ly  = dx * sin + dy * cos;
            g.fillStyle(this.colorInt, tp.alpha * 0.5);
            g.fillCircle(lx, ly, size);
        }

        // Bullet body (ellipse centred at local origin)
        g.fillStyle(this.colorInt, 1);
        g.fillEllipse(0, 0, this.width, this.height);

        // Glow layer
        g.fillStyle(this.colorInt, 0.35);
        g.fillEllipse(0, 0, this.width * 2.2, this.height * 1.4);
    }

    getBounds() {
        return {
            x:      this.position.x - this.width  / 2,
            y:      this.position.y - this.height / 2,
            width:  this.width,
            height: this.height
        };
    }
}

export class BossBullet extends Bullet {
    constructor(scene, x, y, angle, speed, damage) {
        super(scene, x, y, angle, speed, damage, false);
        this.width    = 10;
        this.height   = 10;
        this.colorInt = 0xff3333;
    }

    draw() {
        if (!this.graphic) return;
        const g = this.graphic;
        g.setPosition(this.position.x, this.position.y);
        g.setRotation(0);
        g.clear();

        // Outer glow
        g.fillStyle(0xff3333, 0.3);
        g.fillCircle(0, 0, this.width * 1.4);

        // Main orb
        g.fillStyle(0xff3333, 1);
        g.fillCircle(0, 0, this.width / 2);

        // Inner bright core
        g.fillStyle(0xffaaaa, 1);
        g.fillCircle(0, 0, this.width / 4);
    }
}
