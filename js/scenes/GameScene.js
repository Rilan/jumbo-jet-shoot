import { Player }           from '../entities/Player.js';
import { Bullet, BossBullet } from '../entities/Bullet.js';
import { CollisionManager }  from '../core/CollisionManager.js';
import { SpawnManager }      from '../core/SpawnManager.js';
import { UIManager }         from '../ui/UIManager.js';
import { TouchController }   from '../core/TouchController.js';
import { AudioManager }      from '../core/AudioManager.js';
import { CANVAS, GAME_STATES, PLAYER, ENEMIES, COLORS, EFFECTS, hexColor }
    from '../utils/Constants.js';

// HUD depth — above all game objects
const HUD_DEPTH = 90;

/**
 * GameScene — main Phaser scene.
 * Replaces Game.js + GameLoop.js.
 * All entities own their Phaser Graphics; HUD is rendered via Phaser Text/Graphics.
 */
export class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    // =====================================================================
    //  LIFECYCLE
    // =====================================================================

    create() {
        const W = CANVAS.WIDTH;
        const H = CANVAS.HEIGHT;

        // ---- Background starfield ----
        this.stars = this._createStarfield();
        this.starGraphics = this.add.graphics().setDepth(0);

        // ---- Explosion particles (manual, rendered on shared graphics) ----
        this.explosions    = [];
        this.fxGraphics    = this.add.graphics().setDepth(50);

        // ---- Game state ----
        this.gameState = GAME_STATES.MENU;
        this.score     = 0;

        // ---- Entity arrays ----
        this.player        = null;
        this.playerBullets = [];
        this.enemies       = [];
        this.enemyBullets  = [];
        this.powerUps      = [];
        this.boss          = null;

        // ---- Managers ----
        this.collisionManager = new CollisionManager();
        this.spawnManager     = new SpawnManager();
        this.audioManager     = new AudioManager();
        this.touchController  = new TouchController();
        this.touchController.init();

        // ---- Input ----
        this._setupInput();

        // ---- HUD (Phaser Text + Graphics, no HTML) ----
        this._createHUD();

        // ---- UI (HTML overlay screens) ----
        this.uiManager = new UIManager();
        this._setupUICallbacks();
        this.uiManager.setAudioManager(this.audioManager);

        // ---- Camera ----
        this.cameras.main.setBackgroundColor('#0a0a1a');

        // ---- Show start screen ----
        this.uiManager.showScreen('start');
    }

    update(time, delta) {
        const dt = delta / 1000;

        this._handlePause();
        this._updateStars(dt);
        this._drawStars();

        if (this.gameState !== GAME_STATES.PLAYING) {
            this._drawFX(dt);
            return;
        }

        // ---- Game logic ----
        this._updatePlayer(dt);
        this._updateBullets(dt);
        this._updateEnemies(dt);
        this._updateBoss(dt);
        this._updatePowerUps(dt);
        this._updateSpawning(dt);
        this._updateCollisions();
        this._updateFX(dt);

        // ---- Draw all entities ----
        this.player.draw();
        for (const b of this.playerBullets) b.draw();
        for (const b of this.enemyBullets)  b.draw();
        for (const e of this.enemies)       e.draw();
        if (this.boss) this.boss.draw();
        for (const p of this.powerUps)      p.draw();

        this._drawFX(dt);
        this._updateHUD();

        // ---- Game-over check ----
        if (this.player.isGameOver()) this._gameOver();
    }

    // =====================================================================
    //  GAME FLOW
    // =====================================================================

    _startGame() {
        this.gameState = GAME_STATES.PLAYING;
        this.score     = 0;

        // Destroy leftover entities
        this._clearEntities();

        // Create fresh player
        this.player = new Player(this, CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80);

        this.playerBullets = [];
        this.enemies       = [];
        this.enemyBullets  = [];
        this.powerUps      = [];
        this.boss          = null;
        this.explosions    = [];

        this.spawnManager.reset();

        this.uiManager.showScreen('game');
        this._hideBossHealthHUD();
        this._showHUD(true);

        this.audioManager.init();
        this.audioManager.resume();
        this.audioManager.startMusic();
    }

    _pauseGame() {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        this.gameState = GAME_STATES.PAUSED;
        this.uiManager.showScreen('pause');
        this.audioManager.pauseMusic();
    }

    _resumeGame() {
        if (this.gameState !== GAME_STATES.PAUSED) return;
        this.gameState = GAME_STATES.PLAYING;
        this.uiManager.showScreen('game');
        this.audioManager.resumeMusic();
    }

    _quitToMenu() {
        this.gameState = GAME_STATES.MENU;
        this._clearEntities();
        this.uiManager.showScreen('start');
        this._hideBossHealthHUD();
        this._showHUD(false);
        this.audioManager.stopMusic();
    }

    _gameOver() {
        this.gameState = GAME_STATES.GAME_OVER;
        this._showHUD(false);
        this.uiManager.showGameOver(this.score);
        this.audioManager.stopMusic();
        this.audioManager.playGameOver();
    }

    // =====================================================================
    //  UPDATE METHODS
    // =====================================================================

    _handlePause() {
        const justPause = Phaser.Input.Keyboard.JustDown(this.keyP) ||
                          Phaser.Input.Keyboard.JustDown(this.keyEsc);
        if (justPause) {
            if (this.gameState === GAME_STATES.PLAYING)  this._pauseGame();
            else if (this.gameState === GAME_STATES.PAUSED) this._resumeGame();
        }
    }

    _updatePlayer(dt) {
        this.player.update(dt, this.inputAdapter);

        if (this.inputAdapter.isShooting() && this.player.canShoot()) {
            this._playerShoot();
        }
    }

    _playerShoot() {
        for (const spawn of this.player.getBulletSpawnPositions()) {
            this.playerBullets.push(
                new Bullet(this, spawn.x, spawn.y, spawn.angle,
                    this.player.bulletSpeed, this.player.bulletDamage, true)
            );
        }
        this.player.shoot();
        this.audioManager.playShoot();
    }

    _updateBullets(dt) {
        for (const b of this.playerBullets) b.update(dt);
        for (const b of this.enemyBullets)  b.update(dt);
        this.playerBullets = this.playerBullets.filter(b => b.isActive());
        this.enemyBullets  = this.enemyBullets.filter(b => b.isActive());
    }

    _updateEnemies(dt) {
        for (const e of this.enemies) {
            e.update(dt, this.player.position);
            if (e.canShoot()) this._enemyShoot(e);
        }
        this.enemies = this.enemies.filter(e => e.isActive());
    }

    _enemyShoot(enemy) {
        this.enemyBullets.push(
            new Bullet(this, enemy.position.x, enemy.position.y + enemy.height / 2,
                Math.PI / 2, ENEMIES.SHOOTER.BULLET_SPEED, 15, false)
        );
        enemy.shoot();
    }

    _updateBoss(dt) {
        if (!this.boss) return;
        this.boss.update(dt, this.player.position);

        if (this.boss.canAttack()) this._bossAttack();

        if (this.boss.isFighting()) {
            this._showBossHealthHUD(`BOSS LV.${this.boss.level}`, this.boss.getHealthPercent());
        }

        if (this.boss.state === 'defeated') this._onBossDefeated();
    }

    _bossAttack() {
        for (const shot of this.boss.getAttackPattern(this.player.position)) {
            this.enemyBullets.push(
                new BossBullet(this, shot.x, shot.y, shot.angle, shot.speed, 20)
            );
        }
        this.boss.attack();
    }

    _onBossDefeated() {
        this.score += this.boss.score;
        this._createExplosion(this.boss.position.x, this.boss.position.y, 3);
        this.cameras.main.shake(500, 0.015);
        this.audioManager.playBossDestroyed();

        for (let i = 0; i < 3; i++) {
            this.powerUps.push(
                this.spawnManager.createPowerUp(this,
                    this.boss.position.x + (Math.random() - 0.5) * 100,
                    this.boss.position.y + (Math.random() - 0.5) * 50
                )
            );
        }

        this.boss = null;
        this.spawnManager.onBossDefeated();
        this._hideBossHealthHUD();
    }

    _updatePowerUps(dt) {
        for (const p of this.powerUps) p.update(dt);
        this.powerUps = this.powerUps.filter(p => p.isActive());
    }

    _updateSpawning(dt) {
        const spawned = this.spawnManager.update(this, dt, this.score, this.enemies.length);
        this.enemies.push(...spawned.enemies);
        if (spawned.boss) this.boss = spawned.boss;
    }

    _updateCollisions() {
        const res = this.collisionManager.checkCollisions(
            this.player, this.playerBullets,
            this.enemies, this.enemyBullets,
            this.powerUps, this.boss
        );

        if (res.playerHit) {
            const dmg = res.bulletDamage || res.collisionDamage || 10;
            this.player.takeDamage(dmg);
            this.cameras.main.shake(EFFECTS.SCREEN_SHAKE_DURATION, EFFECTS.SCREEN_SHAKE_INTENSITY);
            this.audioManager.playPlayerHit();
        }

        for (const d of res.enemiesDestroyed) {
            this.score += d.score;
            this._createExplosion(d.position.x, d.position.y);
            this.audioManager.playEnemyDestroyed();
            if (d.score > 0 && this.spawnManager.shouldDropPowerUp()) {
                this.powerUps.push(
                    this.spawnManager.createPowerUp(this, d.position.x, d.position.y)
                );
            }
        }

        for (const c of res.powerUpsCollected) {
            this.player.applyPowerUp(c.type, c.duration);
            this.audioManager.playPowerUp();
        }
    }

    // =====================================================================
    //  VISUAL EFFECTS
    // =====================================================================

    _createExplosion(x, y, size = 1) {
        const colorHex = [0xff4444, 0xff8800, 0xffcc00, 0xffffff];
        const count    = Math.floor(EFFECTS.EXPLOSION_PARTICLES * size);

        for (let i = 0; i < count; i++) {
            const angle  = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed  = 50 + Math.random() * 100 * size;
            const color  = colorHex[Math.floor(Math.random() * colorHex.length)];

            this.explosions.push({
                x, y,
                vx:    Math.cos(angle) * speed,
                vy:    Math.sin(angle) * speed,
                size:  3 + Math.random() * 4 * size,
                color,
                life:  1,
                decay: 2 + Math.random()
            });
        }
    }

    _updateFX(dt) {
        for (const p of this.explosions) {
            p.x    += p.vx * dt;
            p.y    += p.vy * dt;
            p.life -= p.decay * dt;
            p.size *= 0.98;
        }
        this.explosions = this.explosions.filter(p => p.life > 0);
    }

    _drawFX(dt) {
        if (this.gameState !== GAME_STATES.PLAYING) {
            this.fxGraphics.clear();
            return;
        }
        this.fxGraphics.clear();
        for (const p of this.explosions) {
            this.fxGraphics.fillStyle(p.color, p.life);
            this.fxGraphics.fillCircle(p.x, p.y, p.size);
        }
    }

    // =====================================================================
    //  STARFIELD
    // =====================================================================

    _createStarfield() {
        const stars = [];
        for (let i = 0; i < 110; i++) {
            stars.push({
                x:          Math.random() * CANVAS.WIDTH,
                y:          Math.random() * CANVAS.HEIGHT,
                size:       Math.random() * 2 + 0.5,
                speed:      Math.random() * 55 + 20,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }

    _updateStars(dt) {
        for (const s of this.stars) {
            s.y += s.speed * dt;
            if (s.y > CANVAS.HEIGHT) { s.y = 0; s.x = Math.random() * CANVAS.WIDTH; }
        }
    }

    _drawStars() {
        this.starGraphics.clear();
        for (const s of this.stars) {
            this.starGraphics.fillStyle(0xffffff, s.brightness);
            this.starGraphics.fillCircle(s.x, s.y, s.size);
        }
    }

    // =====================================================================
    //  HUD (Phaser Text + Graphics — scales with canvas)
    // =====================================================================

    _createHUD() {
        const textStyle = (size, color = '#ffffff') => ({
            fontFamily: 'monospace',
            fontSize:   `${size}px`,
            color,
            stroke:      '#000000',
            strokeThickness: 2
        });

        // HP label + bar
        this.hudHpLabel  = this.add.text(10, 10, 'HP', textStyle(13, '#ff4444')).setDepth(HUD_DEPTH).setScrollFactor(0);
        this.hudHealthBg = this.add.graphics().setDepth(HUD_DEPTH).setScrollFactor(0);

        // Lives
        this.hudLives = this.add.text(10, 40, 'LIVES: 3', textStyle(13, '#00ff00')).setDepth(HUD_DEPTH).setScrollFactor(0);

        // Score (centred)
        this.hudScore = this.add.text(CANVAS.WIDTH / 2, 10, 'SCORE: 0', textStyle(18))
            .setOrigin(0.5, 0).setDepth(HUD_DEPTH).setScrollFactor(0);

        // Power-up indicators (right side)
        this.hudPowerupTexts = [];
        for (let i = 0; i < 3; i++) {
            const t = this.add.text(CANVAS.WIDTH - 10, 10 + i * 22, '', textStyle(11, '#00ffff'))
                .setOrigin(1, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
            this.hudPowerupTexts.push(t);
        }

        // Boss health bar (hidden initially)
        this.hudBossGroup = this.add.graphics().setDepth(HUD_DEPTH).setScrollFactor(0);
        this.hudBossLabel = this.add.text(CANVAS.WIDTH / 2, CANVAS.HEIGHT - 60, '', textStyle(12, '#ff3333'))
            .setOrigin(0.5, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
        this.hudBossVisible = false;

        this._showHUD(false);
    }

    _showHUD(visible) {
        const els = [
            this.hudHpLabel, this.hudHealthBg, this.hudLives,
            this.hudScore, this.hudBossLabel, this.hudBossGroup,
            ...this.hudPowerupTexts
        ];
        for (const el of els) if (el) el.setVisible(visible);
        if (!visible && this.hudBossGroup) this.hudBossGroup.clear();
    }

    _updateHUD() {
        if (!this.player) return;

        // Health bar
        const hp  = this.player.health / this.player.maxHealth;
        const hpc = hp > 0.5 ? 0x00ff00 : hp > 0.25 ? 0xffff00 : 0xff0000;
        this.hudHealthBg.clear();
        this.hudHealthBg.fillStyle(0x333333, 1);
        this.hudHealthBg.fillRect(36, 10, 120, 14);
        this.hudHealthBg.fillStyle(hpc, 1);
        this.hudHealthBg.fillRect(36, 10, 120 * hp, 14);
        this.hudHealthBg.lineStyle(1, 0x666666, 1);
        this.hudHealthBg.strokeRect(36, 10, 120, 14);

        // Lives
        this.hudLives.setText(`LIVES: ${this.player.lives}`);

        // Score
        this.hudScore.setText(`SCORE: ${this.score.toLocaleString()}`);

        // Power-up timers
        const pups = this.player.getActivePowerUps();
        for (let i = 0; i < this.hudPowerupTexts.length; i++) {
            if (i < pups.length) {
                const p = pups[i];
                this.hudPowerupTexts[i].setText(`${p.type.toUpperCase()} ${p.timer.toFixed(1)}s`);
            } else {
                this.hudPowerupTexts[i].setText('');
            }
        }
    }

    // Called by UIManager callbacks
    _showBossHealthHUD(name, percent) {
        if (!this.hudBossGroup) return;
        const bw = 200;
        const bx = (CANVAS.WIDTH - bw) / 2;
        const by = CANVAS.HEIGHT - 55;
        this.hudBossGroup.clear();
        this.hudBossGroup.fillStyle(0x333333, 1);
        this.hudBossGroup.fillRect(bx, by, bw, 12);
        const bpc = percent > 0.5 ? 0xff6600 : percent > 0.25 ? 0xff3300 : 0xff0000;
        this.hudBossGroup.fillStyle(bpc, 1);
        this.hudBossGroup.fillRect(bx, by, bw * percent, 12);
        this.hudBossGroup.lineStyle(1, 0xff3333, 1);
        this.hudBossGroup.strokeRect(bx, by, bw, 12);
        this.hudBossLabel.setText(name);
        this.hudBossLabel.setVisible(true);
        this.hudBossGroup.setVisible(true);
    }

    _hideBossHealthHUD() {
        if (this.hudBossGroup) this.hudBossGroup.setVisible(false).clear();
        if (this.hudBossLabel) this.hudBossLabel.setVisible(false);
    }

    // =====================================================================
    //  INPUT
    // =====================================================================

    _setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyP    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.keyEsc  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.mouseDown = false;
        this.input.on('pointerdown', () => { this.mouseDown = true; });
        this.input.on('pointerup',   () => { this.mouseDown = false; });

        // Adapter compatible with entity update() signatures
        const scene = this;
        this.inputAdapter = {
            getMovementDirection() { return scene._getMovementDir(); },
            isShooting()           { return scene._isShooting(); },
            isPausePressed()       { return false; }, // handled directly in update
            clearPressed()         {}
        };
    }

    _getMovementDir() {
        if (this.touchController && this.touchController.isActive()) {
            return this.touchController.getDirection();
        }
        let x = 0, y = 0;
        if (this.cursors.left.isDown  || this.keyA.isDown) x = -1;
        if (this.cursors.right.isDown || this.keyD.isDown) x =  1;
        if (this.cursors.up.isDown    || this.keyW.isDown) y = -1;
        if (this.cursors.down.isDown  || this.keyS.isDown) y =  1;
        if (x !== 0 && y !== 0) { const l = Math.SQRT2; x /= l; y /= l; }
        return { x, y };
    }

    _isShooting() {
        if (this.touchController && this.touchController.isFiring()) return true;
        if (this.keySpace.isDown) return true;
        if (this.mouseDown)       return true;
        return false;
    }

    // =====================================================================
    //  UI CALLBACKS
    // =====================================================================

    _setupUICallbacks() {
        this.uiManager.setCallback('start',   () => this._startGame());
        this.uiManager.setCallback('resume',  () => this._resumeGame());
        this.uiManager.setCallback('quit',    () => this._quitToMenu());
        this.uiManager.setCallback('restart', () => this._startGame());
        this.uiManager.setCallback('menu',    () => this._quitToMenu());
    }

    // =====================================================================
    //  HELPERS
    // =====================================================================

    _clearEntities() {
        const all = [
            ...(this.playerBullets || []),
            ...(this.enemyBullets  || []),
            ...(this.enemies       || []),
            ...(this.powerUps      || [])
        ];
        if (this.boss)   { this.boss.graphic?.destroy(); this.boss = null; }
        if (this.player) { this.player.graphic?.destroy(); this.player = null; }
        for (const e of all) if (e.graphic) e.graphic.destroy();

        this.playerBullets = [];
        this.enemyBullets  = [];
        this.enemies       = [];
        this.powerUps      = [];
        this.explosions    = [];
    }
}
