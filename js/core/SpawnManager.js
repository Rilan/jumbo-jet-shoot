import { Enemy, createEnemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { PowerUp, getRandomPowerUpType } from '../entities/PowerUp.js';
import { SPAWN, ENEMY_TYPES, POWERUPS, BOSS, CANVAS } from '../utils/Constants.js';

/**
 * Manages spawning of enemies, bosses, and power-ups
 */
export class SpawnManager {
    constructor() {
        this.spawnTimer = SPAWN.INITIAL_DELAY;
        this.spawnInterval = SPAWN.MAX_INTERVAL;
        this.difficulty = 1;
        this.waveNumber = 0;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave = 10;

        // Boss tracking
        this.bossActive = false;
        this.bossLevel = 0;
        this.lastBossThreshold = 0;

        // Enemy type weights (change with difficulty)
        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]: 50,
            [ENEMY_TYPES.ZIGZAG]: 30,
            [ENEMY_TYPES.CIRCULAR]: 15,
            [ENEMY_TYPES.SHOOTER]: 5
        };
    }

    /**
     * Update spawn timer and create new entities
     */
    update(deltaTime, score, currentEnemyCount) {
        const spawnedEntities = {
            enemies: [],
            boss: null,
            powerUps: []
        };

        // Don't spawn regular enemies during boss fight
        if (this.bossActive) {
            return spawnedEntities;
        }

        // Check for boss spawn
        const bossToSpawn = this.checkBossSpawn(score);
        if (bossToSpawn) {
            spawnedEntities.boss = bossToSpawn;
            this.bossActive = true;
            return spawnedEntities;
        }

        // Update spawn timer
        this.spawnTimer -= deltaTime;

        if (this.spawnTimer <= 0) {
            // Spawn enemy
            const enemy = this.spawnEnemy();
            if (enemy) {
                spawnedEntities.enemies.push(enemy);
                this.enemiesSpawnedInWave++;
            }

            // Check for wave completion
            if (this.enemiesSpawnedInWave >= this.enemiesPerWave) {
                this.advanceWave();
            }

            // Reset timer with some randomness
            this.spawnTimer = this.spawnInterval + (Math.random() - 0.5) * 0.5;
        }

        // Gradually increase difficulty
        this.updateDifficulty(deltaTime);

        return spawnedEntities;
    }

    /**
     * Spawn a random enemy
     */
    spawnEnemy() {
        const type = this.getRandomEnemyType();
        const x = this.getSpawnX();
        const y = -50;

        return createEnemy(x, y, type);
    }

    /**
     * Get random enemy type based on weights
     */
    getRandomEnemyType() {
        const totalWeight = Object.values(this.enemyWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const [type, weight] of Object.entries(this.enemyWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }

        return ENEMY_TYPES.BASIC;
    }

    /**
     * Get random spawn X position
     */
    getSpawnX() {
        const margin = 50;
        return margin + Math.random() * (CANVAS.WIDTH - margin * 2);
    }

    /**
     * Check if boss should spawn
     */
    checkBossSpawn(score) {
        for (let i = 0; i < BOSS.SPAWN_THRESHOLDS.length; i++) {
            const threshold = BOSS.SPAWN_THRESHOLDS[i];

            if (score >= threshold && this.lastBossThreshold < threshold) {
                this.lastBossThreshold = threshold;
                this.bossLevel = i + 1;

                return new Boss(CANVAS.WIDTH / 2, -80, this.bossLevel);
            }
        }

        return null;
    }

    /**
     * Called when boss is defeated
     */
    onBossDefeated() {
        this.bossActive = false;
        // Give a short breather after boss
        this.spawnTimer = 3;
    }

    /**
     * Advance to next wave
     */
    advanceWave() {
        this.waveNumber++;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave = Math.min(20, 10 + this.waveNumber * 2);

        // Brief pause between waves
        this.spawnTimer = 2;

        // Increase enemy variety
        this.updateEnemyWeights();
    }

    /**
     * Update enemy type weights based on wave
     */
    updateEnemyWeights() {
        // More difficult enemies appear more frequently
        const wave = this.waveNumber;

        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]: Math.max(20, 50 - wave * 3),
            [ENEMY_TYPES.ZIGZAG]: Math.min(35, 30 + wave),
            [ENEMY_TYPES.CIRCULAR]: Math.min(30, 15 + wave * 2),
            [ENEMY_TYPES.SHOOTER]: Math.min(25, 5 + wave * 2)
        };
    }

    /**
     * Gradually increase difficulty
     */
    updateDifficulty(deltaTime) {
        // Slowly decrease spawn interval
        this.spawnInterval = Math.max(
            SPAWN.MIN_INTERVAL,
            this.spawnInterval - SPAWN.DIFFICULTY_INCREASE * deltaTime
        );

        this.difficulty = 1 + (SPAWN.MAX_INTERVAL - this.spawnInterval);
    }

    /**
     * Check if power-up should drop from destroyed enemy
     */
    shouldDropPowerUp() {
        return Math.random() < POWERUPS.DROP_CHANCE;
    }

    /**
     * Create power-up at position
     */
    createPowerUp(x, y) {
        const type = getRandomPowerUpType();
        return new PowerUp(x, y, type);
    }

    /**
     * Reset spawn manager state
     */
    reset() {
        this.spawnTimer = SPAWN.INITIAL_DELAY;
        this.spawnInterval = SPAWN.MAX_INTERVAL;
        this.difficulty = 1;
        this.waveNumber = 0;
        this.enemiesSpawnedInWave = 0;
        this.enemiesPerWave = 10;
        this.bossActive = false;
        this.bossLevel = 0;
        this.lastBossThreshold = 0;

        this.enemyWeights = {
            [ENEMY_TYPES.BASIC]: 50,
            [ENEMY_TYPES.ZIGZAG]: 30,
            [ENEMY_TYPES.CIRCULAR]: 15,
            [ENEMY_TYPES.SHOOTER]: 5
        };
    }

    /**
     * Get current wave number
     */
    getWaveNumber() {
        return this.waveNumber;
    }

    /**
     * Get current difficulty level
     */
    getDifficulty() {
        return this.difficulty;
    }
}
