/**
 * Collision detection manager using AABB
 */
export class CollisionManager {
    constructor() {
        // Collision results are stored for the current frame
        this.results = {
            playerHit: false,
            enemiesDestroyed: [],
            powerUpsCollected: [],
            bossHit: false
        };
    }

    /**
     * Reset collision results for new frame
     */
    reset() {
        this.results = {
            playerHit: false,
            enemiesDestroyed: [],
            powerUpsCollected: [],
            bossHit: false
        };
    }

    /**
     * Check AABB collision between two entities
     */
    checkAABB(a, b) {
        const boundsA = a.getBounds();
        const boundsB = b.getBounds();

        return (
            boundsA.x < boundsB.x + boundsB.width &&
            boundsA.x + boundsA.width > boundsB.x &&
            boundsA.y < boundsB.y + boundsB.height &&
            boundsA.y + boundsA.height > boundsB.y
        );
    }

    /**
     * Check circle collision (for more precise detection)
     */
    checkCircle(a, b) {
        const centerA = a.getCenter();
        const centerB = b.getCenter();
        const radiusA = Math.min(a.width, a.height) / 2;
        const radiusB = Math.min(b.width, b.height) / 2;

        const dx = centerA.x - centerB.x;
        const dy = centerA.y - centerB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < radiusA + radiusB;
    }

    /**
     * Process all collisions for the current frame
     */
    checkCollisions(player, playerBullets, enemies, enemyBullets, powerUps, boss) {
        this.reset();

        // Player bullets vs enemies
        this.checkBulletsVsEnemies(playerBullets, enemies);

        // Player bullets vs boss
        if (boss && boss.isFighting()) {
            this.checkBulletsVsBoss(playerBullets, boss);
        }

        // Enemy bullets vs player
        this.checkBulletsVsPlayer(enemyBullets, player);

        // Boss bullets vs player (same as enemy bullets)
        // Already handled in enemyBullets

        // Enemies vs player (collision damage)
        this.checkEnemiesVsPlayer(enemies, player);

        // Boss vs player
        if (boss && boss.isFighting()) {
            this.checkBossVsPlayer(boss, player);
        }

        // Power-ups vs player
        this.checkPowerUpsVsPlayer(powerUps, player);

        return this.results;
    }

    /**
     * Check player bullets against enemies
     */
    checkBulletsVsEnemies(bullets, enemies) {
        for (const bullet of bullets) {
            if (!bullet.isActive()) continue;

            for (const enemy of enemies) {
                if (!enemy.isActive()) continue;

                if (this.checkAABB(bullet, enemy)) {
                    bullet.destroy();
                    const destroyed = enemy.takeDamage(bullet.damage);

                    if (destroyed) {
                        this.results.enemiesDestroyed.push({
                            enemy: enemy,
                            position: enemy.position.clone(),
                            score: enemy.score
                        });
                    }
                    break; // Bullet can only hit one enemy
                }
            }
        }
    }

    /**
     * Check player bullets against boss
     */
    checkBulletsVsBoss(bullets, boss) {
        for (const bullet of bullets) {
            if (!bullet.isActive()) continue;

            if (this.checkAABB(bullet, boss)) {
                bullet.destroy();
                const destroyed = boss.takeDamage(bullet.damage);

                if (destroyed) {
                    this.results.bossHit = true;
                    this.results.bossDestroyed = {
                        boss: boss,
                        position: boss.position.clone(),
                        score: boss.score
                    };
                }
            }
        }
    }

    /**
     * Check enemy bullets against player
     */
    checkBulletsVsPlayer(bullets, player) {
        if (player.invincible || player.shieldActive) return;

        for (const bullet of bullets) {
            if (!bullet.isActive()) continue;

            if (this.checkAABB(bullet, player)) {
                bullet.destroy();
                this.results.playerHit = true;
                this.results.bulletDamage = bullet.damage;
                break; // Only one hit per frame
            }
        }
    }

    /**
     * Check enemy collision with player
     */
    checkEnemiesVsPlayer(enemies, player) {
        if (player.invincible || player.shieldActive) return;

        for (const enemy of enemies) {
            if (!enemy.isActive()) continue;

            if (this.checkAABB(enemy, player)) {
                // Collision damage
                this.results.playerHit = true;
                this.results.collisionDamage = 20;

                // Destroy the enemy on collision
                enemy.destroy();
                this.results.enemiesDestroyed.push({
                    enemy: enemy,
                    position: enemy.position.clone(),
                    score: 0 // No score for collision kills
                });
                break;
            }
        }
    }

    /**
     * Check boss collision with player
     */
    checkBossVsPlayer(boss, player) {
        if (player.invincible || player.shieldActive) return;

        if (this.checkAABB(boss, player)) {
            this.results.playerHit = true;
            this.results.collisionDamage = 30;
        }
    }

    /**
     * Check power-up collection
     */
    checkPowerUpsVsPlayer(powerUps, player) {
        for (const powerUp of powerUps) {
            if (!powerUp.isActive()) continue;

            if (this.checkAABB(powerUp, player)) {
                powerUp.destroy();
                this.results.powerUpsCollected.push({
                    type: powerUp.type,
                    duration: powerUp.getDuration()
                });
            }
        }
    }
}
