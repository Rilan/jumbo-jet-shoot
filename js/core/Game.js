import { Player } from '../entities/Player.js';
import { Bullet, BossBullet } from '../entities/Bullet.js';
import { InputManager } from './InputManager.js';
import { CollisionManager } from './CollisionManager.js';
import { SpawnManager } from './SpawnManager.js';
import { UIManager } from '../ui/UIManager.js';
import { CANVAS, GAME_STATES, PLAYER, ENEMIES, COLORS, EFFECTS } from '../utils/Constants.js';

/**
 * Main game controller
 */
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CANVAS.WIDTH;
        this.canvas.height = CANVAS.HEIGHT;

        // Initialize managers
        this.inputManager = new InputManager();
        this.inputManager.setCanvas(canvas);
        this.collisionManager = new CollisionManager();
        this.spawnManager = new SpawnManager();
        this.uiManager = new UIManager();

        // Game state
        this.state = GAME_STATES.MENU;
        this.score = 0;

        // Entities
        this.player = null;
        this.playerBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;

        // Visual effects
        this.explosions = [];
        this.screenShake = { intensity: 0, duration: 0 };
        this.stars = this.createStarfield();

        // Setup UI callbacks
        this.setupUICallbacks();
    }

    /**
     * Create background starfield
     */
    createStarfield() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * CANVAS.WIDTH,
                y: Math.random() * CANVAS.HEIGHT,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 50 + 20,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }

    /**
     * Setup UI button callbacks
     */
    setupUICallbacks() {
        this.uiManager.setCallback('start', () => this.startGame());
        this.uiManager.setCallback('resume', () => this.resumeGame());
        this.uiManager.setCallback('quit', () => this.quitToMenu());
        this.uiManager.setCallback('restart', () => this.startGame());
        this.uiManager.setCallback('menu', () => this.quitToMenu());
    }

    /**
     * Start a new game
     */
    startGame() {
        this.state = GAME_STATES.PLAYING;
        this.score = 0;

        // Reset entities
        this.player = new Player(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);
        this.playerBullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.boss = null;
        this.explosions = [];

        // Reset managers
        this.spawnManager.reset();

        // Show game UI
        this.uiManager.showScreen('game');
        this.uiManager.hideBossHealth();
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.uiManager.showScreen('pause');
        }
    }

    /**
     * Resume from pause
     */
    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.uiManager.showScreen('game');
        }
    }

    /**
     * Quit to main menu
     */
    quitToMenu() {
        this.state = GAME_STATES.MENU;
        this.uiManager.showScreen('start');
        this.uiManager.hideBossHealth();
    }

    /**
     * Game over
     */
    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        this.uiManager.showGameOver(this.score);
    }

    /**
     * Main update loop
     */
    update(deltaTime) {
        // Check for pause toggle
        if (this.inputManager.isPausePressed()) {
            if (this.state === GAME_STATES.PLAYING) {
                this.pauseGame();
            } else if (this.state === GAME_STATES.PAUSED) {
                this.resumeGame();
            }
        }

        // Clear pressed keys at end of frame
        this.inputManager.clearPressed();

        // Only update game entities when playing
        if (this.state !== GAME_STATES.PLAYING) {
            // Still update stars for menu background
            this.updateStars(deltaTime);
            return;
        }

        // Update all game systems
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBoss(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateSpawning(deltaTime);
        this.updateCollisions();
        this.updateEffects(deltaTime);
        this.updateStars(deltaTime);

        // Update UI
        this.uiManager.updateHUD(this.player, this.score);

        // Check game over
        if (this.player.isGameOver()) {
            this.gameOver();
        }
    }

    /**
     * Update player
     */
    updatePlayer(deltaTime) {
        this.player.update(deltaTime, this.inputManager);

        // Handle shooting
        if (this.inputManager.isShooting() && this.player.canShoot()) {
            this.playerShoot();
        }
    }

    /**
     * Player fires bullets
     */
    playerShoot() {
        const spawnPositions = this.player.getBulletSpawnPositions();

        for (const spawn of spawnPositions) {
            const bullet = new Bullet(
                spawn.x,
                spawn.y,
                spawn.angle,
                this.player.bulletSpeed,
                this.player.bulletDamage,
                true
            );
            this.playerBullets.push(bullet);
        }

        this.player.shoot();
    }

    /**
     * Update all bullets
     */
    updateBullets(deltaTime) {
        // Update player bullets
        for (const bullet of this.playerBullets) {
            bullet.update(deltaTime);
        }

        // Update enemy bullets
        for (const bullet of this.enemyBullets) {
            bullet.update(deltaTime);
        }

        // Remove inactive bullets
        this.playerBullets = this.playerBullets.filter(b => b.isActive());
        this.enemyBullets = this.enemyBullets.filter(b => b.isActive());
    }

    /**
     * Update enemies
     */
    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.player.position);

            // Shooter enemies fire at player
            if (enemy.canShoot()) {
                this.enemyShoot(enemy);
            }
        }

        // Remove inactive enemies
        this.enemies = this.enemies.filter(e => e.isActive());
    }

    /**
     * Enemy fires bullet
     */
    enemyShoot(enemy) {
        const angle = Math.PI / 2; // Straight down
        const bullet = new Bullet(
            enemy.position.x,
            enemy.position.y + enemy.height / 2,
            angle,
            ENEMIES.SHOOTER.BULLET_SPEED,
            15,
            false
        );
        this.enemyBullets.push(bullet);
        enemy.shoot();
    }

    /**
     * Update boss
     */
    updateBoss(deltaTime) {
        if (!this.boss) return;

        this.boss.update(deltaTime, this.player.position);

        // Boss attacks
        if (this.boss.canAttack()) {
            this.bossAttack();
        }

        // Update boss health UI
        if (this.boss.isFighting()) {
            this.uiManager.showBossHealth(
                `BOSS LV.${this.boss.level}`,
                this.boss.getHealthPercent()
            );
        }

        // Check if boss is defeated
        if (this.boss.state === 'defeated') {
            this.onBossDefeated();
        }
    }

    /**
     * Boss fires attack pattern
     */
    bossAttack() {
        const pattern = this.boss.getAttackPattern(this.player.position);

        for (const shot of pattern) {
            const bullet = new BossBullet(
                shot.x,
                shot.y,
                shot.angle,
                shot.speed,
                20
            );
            this.enemyBullets.push(bullet);
        }

        this.boss.attack();
    }

    /**
     * Handle boss defeat
     */
    onBossDefeated() {
        // Add score
        this.score += this.boss.score;

        // Create big explosion
        this.createExplosion(
            this.boss.position.x,
            this.boss.position.y,
            3 // Large explosion
        );

        // Screen shake
        this.screenShake.intensity = 15;
        this.screenShake.duration = 0.5;

        // Drop multiple power-ups
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 50;
            const powerUp = this.spawnManager.createPowerUp(
                this.boss.position.x + offsetX,
                this.boss.position.y + offsetY
            );
            this.powerUps.push(powerUp);
        }

        // Clean up
        this.boss = null;
        this.spawnManager.onBossDefeated();
        this.uiManager.hideBossHealth();
    }

    /**
     * Update power-ups
     */
    updatePowerUps(deltaTime) {
        for (const powerUp of this.powerUps) {
            powerUp.update(deltaTime);
        }

        this.powerUps = this.powerUps.filter(p => p.isActive());
    }

    /**
     * Update spawning system
     */
    updateSpawning(deltaTime) {
        const spawned = this.spawnManager.update(
            deltaTime,
            this.score,
            this.enemies.length
        );

        // Add spawned enemies
        this.enemies.push(...spawned.enemies);

        // Add boss if spawned
        if (spawned.boss) {
            this.boss = spawned.boss;
        }
    }

    /**
     * Process collisions
     */
    updateCollisions() {
        const results = this.collisionManager.checkCollisions(
            this.player,
            this.playerBullets,
            this.enemies,
            this.enemyBullets,
            this.powerUps,
            this.boss
        );

        // Handle player damage
        if (results.playerHit) {
            const damage = results.bulletDamage || results.collisionDamage || 10;
            this.player.takeDamage(damage);
            this.screenShake.intensity = EFFECTS.SCREEN_SHAKE_INTENSITY;
            this.screenShake.duration = EFFECTS.SCREEN_SHAKE_DURATION;
        }

        // Handle destroyed enemies
        for (const destroyed of results.enemiesDestroyed) {
            this.score += destroyed.score;

            // Create explosion
            this.createExplosion(destroyed.position.x, destroyed.position.y);

            // Maybe drop power-up
            if (destroyed.score > 0 && this.spawnManager.shouldDropPowerUp()) {
                const powerUp = this.spawnManager.createPowerUp(
                    destroyed.position.x,
                    destroyed.position.y
                );
                this.powerUps.push(powerUp);
            }
        }

        // Handle collected power-ups
        for (const collected of results.powerUpsCollected) {
            this.player.applyPowerUp(collected.type, collected.duration);
        }
    }

    /**
     * Create explosion effect
     */
    createExplosion(x, y, size = 1) {
        const particleCount = Math.floor(EFFECTS.EXPLOSION_PARTICLES * size);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100 * size;
            const color = COLORS.EXPLOSION[Math.floor(Math.random() * COLORS.EXPLOSION.length)];

            this.explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4 * size,
                color: color,
                life: 1,
                decay: 2 + Math.random()
            });
        }
    }

    /**
     * Update visual effects
     */
    updateEffects(deltaTime) {
        // Update explosions
        for (const particle of this.explosions) {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= particle.decay * deltaTime;
            particle.size *= 0.98;
        }

        this.explosions = this.explosions.filter(p => p.life > 0);

        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
        } else {
            this.screenShake.intensity = 0;
        }
    }

    /**
     * Update background stars
     */
    updateStars(deltaTime) {
        for (const star of this.stars) {
            star.y += star.speed * deltaTime;

            // Wrap around
            if (star.y > CANVAS.HEIGHT) {
                star.y = 0;
                star.x = Math.random() * CANVAS.WIDTH;
            }
        }
    }

    /**
     * Main render loop
     */
    render() {
        const ctx = this.ctx;

        // Apply screen shake
        ctx.save();
        if (this.screenShake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            ctx.translate(shakeX, shakeY);
        }

        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

        // Draw background
        this.renderStars(ctx);

        // Only render game entities when not in menu
        if (this.state !== GAME_STATES.MENU) {
            // Draw entities (back to front)
            this.renderPowerUps(ctx);
            this.renderBullets(ctx);
            this.renderEnemies(ctx);
            this.renderBoss(ctx);
            this.renderPlayer(ctx);
            this.renderExplosions(ctx);
        }

        ctx.restore();
    }

    /**
     * Render starfield background
     */
    renderStars(ctx) {
        for (const star of this.stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Render all bullets
     */
    renderBullets(ctx) {
        for (const bullet of this.playerBullets) {
            bullet.render(ctx);
        }

        for (const bullet of this.enemyBullets) {
            bullet.render(ctx);
        }
    }

    /**
     * Render all enemies
     */
    renderEnemies(ctx) {
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }
    }

    /**
     * Render boss
     */
    renderBoss(ctx) {
        if (this.boss) {
            this.boss.render(ctx);
        }
    }

    /**
     * Render player
     */
    renderPlayer(ctx) {
        if (this.player) {
            this.player.render(ctx);
        }
    }

    /**
     * Render power-ups
     */
    renderPowerUps(ctx) {
        for (const powerUp of this.powerUps) {
            powerUp.render(ctx);
        }
    }

    /**
     * Render explosion particles
     */
    renderExplosions(ctx) {
        for (const particle of this.explosions) {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Get current game state
     */
    getState() {
        return this.state;
    }
}
