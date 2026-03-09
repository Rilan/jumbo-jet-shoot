import { Enemy, createEnemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { PowerUp, getRandomPowerUpType } from '../entities/PowerUp.js';
import { SPAWN, ENEMY_TYPES, POWERUPS, BOSS, CANVAS } from '../utils/Constants.js';

/**
 * Manages spawning of enemies, bosses, and power-ups.
 * Requires a Phaser scene reference so entities can create Graphics.
 */
export class SpawnManager {
    constructor() {
        this.spawnTimer    = SPAWN.INITIAL_DELAY;
        this.spawnInterval = SPAWN.MAX_INTERVAL;
        this.difficulty    = 1;
        this.waveNumber    = 0;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave       = 10;

        this.bossActive        = false;
        this.bossLevel         = 0;
        this.lastBossThreshold = 0;

        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]:    50,
            [ENEMY_TYPES.ZIGZAG]:   30,
            [ENEMY_TYPES.CIRCULAR]: 15,
            [ENEMY_TYPES.SHOOTER]:   5
        };
    }

    /** @param {Phaser.Scene} scene */
    update(scene, deltaTime, score, currentEnemyCount) {
        const result = { enemies: [], boss: null, powerUps: [] };

        if (this.bossActive) return result;

        const boss = this.checkBossSpawn(scene, score);
        if (boss) {
            result.boss  = boss;
            this.bossActive = true;
            return result;
        }

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            const enemy = this.spawnEnemy(scene);
            if (enemy) {
                result.enemies.push(enemy);
                this.enemiesSpawnedInWave++;
            }
            if (this.enemiesSpawnedInWave >= this.enemiesPerWave) this.advanceWave();
            this.spawnTimer = this.spawnInterval + (Math.random() - 0.5) * 0.5;
        }

        this.updateDifficulty(deltaTime);
        return result;
    }

    spawnEnemy(scene) {
        const type = this.getRandomEnemyType();
        return createEnemy(scene, this.getSpawnX(), -50, type);
    }

    getRandomEnemyType() {
        const total = Object.values(this.enemyWeights).reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (const [type, w] of Object.entries(this.enemyWeights)) {
            r -= w;
            if (r <= 0) return type;
        }
        return ENEMY_TYPES.BASIC;
    }

    getSpawnX() {
        const margin = 50;
        return margin + Math.random() * (CANVAS.WIDTH - margin * 2);
    }

    checkBossSpawn(scene, score) {
        for (let i = 0; i < BOSS.SPAWN_THRESHOLDS.length; i++) {
            const threshold = BOSS.SPAWN_THRESHOLDS[i];
            if (score >= threshold && this.lastBossThreshold < threshold) {
                this.lastBossThreshold = threshold;
                this.bossLevel         = i + 1;
                return new Boss(scene, CANVAS.WIDTH / 2, -80, this.bossLevel);
            }
        }
        return null;
    }

    onBossDefeated() {
        this.bossActive  = false;
        this.spawnTimer  = 3;
    }

    advanceWave() {
        this.waveNumber++;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave = Math.min(20, 10 + this.waveNumber * 2);
        this.spawnTimer = 2;
        this.updateEnemyWeights();
    }

    updateEnemyWeights() {
        const w = this.waveNumber;
        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]:    Math.max(20, 50 - w * 3),
            [ENEMY_TYPES.ZIGZAG]:   Math.min(35, 30 + w),
            [ENEMY_TYPES.CIRCULAR]: Math.min(30, 15 + w * 2),
            [ENEMY_TYPES.SHOOTER]:  Math.min(25,  5 + w * 2)
        };
    }

    updateDifficulty(deltaTime) {
        this.spawnInterval = Math.max(
            SPAWN.MIN_INTERVAL,
            this.spawnInterval - SPAWN.DIFFICULTY_INCREASE * deltaTime
        );
        this.difficulty = 1 + (SPAWN.MAX_INTERVAL - this.spawnInterval);
    }

    shouldDropPowerUp() { return Math.random() < POWERUPS.DROP_CHANCE; }

    createPowerUp(scene, x, y) {
        return new PowerUp(scene, x, y, getRandomPowerUpType());
    }

    reset() {
        this.spawnTimer    = SPAWN.INITIAL_DELAY;
        this.spawnInterval = SPAWN.MAX_INTERVAL;
        this.difficulty    = 1;
        this.waveNumber    = 0;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave       = 10;
        this.bossActive        = false;
        this.bossLevel         = 0;
        this.lastBossThreshold = 0;
        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]: 50, [ENEMY_TYPES.ZIGZAG]: 30,
            [ENEMY_TYPES.CIRCULAR]: 15, [ENEMY_TYPES.SHOOTER]: 5
        };
    }

    getWaveNumber()  { return this.waveNumber; }
    getDifficulty()  { return this.difficulty; }
}
