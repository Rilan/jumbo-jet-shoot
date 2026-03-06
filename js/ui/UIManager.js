import { POWERUPS, GAME_STATES } from '../utils/Constants.js';

/**
 * Manages all UI elements (HUD, screens, etc.)
 */
export class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            // Screens
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),

            // Buttons
            startButton: document.getElementById('start-button'),
            resumeButton: document.getElementById('resume-button'),
            quitButton: document.getElementById('quit-button'),
            restartButton: document.getElementById('restart-button'),
            menuButton: document.getElementById('menu-button'),

            // HUD
            hud: document.getElementById('hud'),
            healthFill: document.getElementById('health-fill'),
            livesDisplay: document.getElementById('lives-display'),
            scoreDisplay: document.getElementById('score-display'),
            powerupDisplay: document.getElementById('powerup-display'),

            // Boss
            bossHealthContainer: document.getElementById('boss-health-container'),
            bossName: document.getElementById('boss-name'),
            bossHealthFill: document.getElementById('boss-health-fill'),

            // Game over
            finalScore: document.getElementById('final-score'),
            highScore: document.getElementById('high-score')
        };

        // High score from local storage
        this.highScore = this.loadHighScore();

        // Button callbacks
        this.callbacks = {
            start: null,
            resume: null,
            quit: null,
            restart: null,
            menu: null
        };

        this.setupButtonListeners();
    }

    /**
     * Set up button click listeners
     */
    setupButtonListeners() {
        this.elements.startButton.addEventListener('click', () => {
            if (this.callbacks.start) this.callbacks.start();
        });

        this.elements.resumeButton.addEventListener('click', () => {
            if (this.callbacks.resume) this.callbacks.resume();
        });

        this.elements.quitButton.addEventListener('click', () => {
            if (this.callbacks.quit) this.callbacks.quit();
        });

        this.elements.restartButton.addEventListener('click', () => {
            if (this.callbacks.restart) this.callbacks.restart();
        });

        this.elements.menuButton.addEventListener('click', () => {
            if (this.callbacks.menu) this.callbacks.menu();
        });
    }

    /**
     * Set callback for a button
     */
    setCallback(button, callback) {
        this.callbacks[button] = callback;
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');

        // Show requested screen
        switch (screenName) {
            case 'start':
                this.elements.startScreen.classList.remove('hidden');
                this.elements.hud.classList.add('hidden');
                break;
            case 'pause':
                this.elements.pauseScreen.classList.remove('hidden');
                break;
            case 'gameover':
                this.elements.gameoverScreen.classList.remove('hidden');
                break;
            case 'game':
                this.elements.hud.classList.remove('hidden');
                break;
        }
    }

    /**
     * Update HUD elements
     */
    updateHUD(player, score) {
        // Health bar
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthFill.style.width = `${healthPercent}%`;

        // Health bar color
        if (healthPercent > 50) {
            this.elements.healthFill.style.background = 'linear-gradient(to bottom, #66ff66, #33cc33)';
        } else if (healthPercent > 25) {
            this.elements.healthFill.style.background = 'linear-gradient(to bottom, #ffcc00, #ff9900)';
        } else {
            this.elements.healthFill.style.background = 'linear-gradient(to bottom, #ff6666, #ff3333)';
        }

        // Lives
        this.elements.livesDisplay.textContent = player.lives;

        // Score
        this.elements.scoreDisplay.textContent = `SCORE: ${score.toLocaleString()}`;

        // Active power-ups
        this.updatePowerUpDisplay(player.getActivePowerUps());
    }

    /**
     * Update active power-up indicators
     */
    updatePowerUpDisplay(powerUps) {
        this.elements.powerupDisplay.innerHTML = '';

        for (const powerUp of powerUps) {
            const indicator = document.createElement('div');
            indicator.className = 'powerup-indicator';

            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.style.background = POWERUPS.COLORS[powerUp.type] || '#fff';

            const timer = document.createElement('div');
            timer.className = 'timer';
            timer.textContent = Math.ceil(powerUp.timer) + 's';
            timer.style.color = POWERUPS.COLORS[powerUp.type] || '#fff';

            indicator.appendChild(icon);
            indicator.appendChild(timer);
            this.elements.powerupDisplay.appendChild(indicator);
        }
    }

    /**
     * Show boss health bar
     */
    showBossHealth(bossName, healthPercent) {
        this.elements.bossHealthContainer.classList.remove('hidden');
        this.elements.bossName.textContent = bossName;
        this.elements.bossHealthFill.style.width = `${healthPercent * 100}%`;
    }

    /**
     * Hide boss health bar
     */
    hideBossHealth() {
        this.elements.bossHealthContainer.classList.add('hidden');
    }

    /**
     * Show game over screen with scores
     */
    showGameOver(score) {
        this.elements.finalScore.textContent = `Score: ${score.toLocaleString()}`;

        // Update high score
        if (score > this.highScore) {
            this.highScore = score;
            this.saveHighScore(score);
        }

        this.elements.highScore.textContent = `High Score: ${this.highScore.toLocaleString()}`;

        this.showScreen('gameover');
    }

    /**
     * Load high score from local storage
     */
    loadHighScore() {
        const saved = localStorage.getItem('jetShooterHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * Save high score to local storage
     */
    saveHighScore(score) {
        localStorage.setItem('jetShooterHighScore', score.toString());
    }

    /**
     * Get current high score
     */
    getHighScore() {
        return this.highScore;
    }
}
