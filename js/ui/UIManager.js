import { POWERUPS, GAME_STATES } from '../utils/Constants.js';
import { LeaderboardManager } from '../core/LeaderboardManager.js';

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
            leaderboardButton: document.getElementById('leaderboard-button'),

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
            highScore: document.getElementById('high-score'),

            // Audio controls
            muteButton: document.getElementById('mute-button'),
            soundIcon: document.getElementById('sound-icon'),

            // Leaderboard modal
            leaderboardModal: document.getElementById('leaderboard-modal'),
            nameInputSection: document.getElementById('name-input-section'),
            newScoreMsg: document.getElementById('new-score-msg'),
            yourScoreDisplay: document.getElementById('your-score-display'),
            playerNameInput: document.getElementById('player-name-input'),
            nameError: document.getElementById('name-error'),
            submitScoreButton: document.getElementById('submit-score-button'),
            scoresListSection: document.getElementById('scores-list-section'),
            scoresList: document.getElementById('scores-list'),
            loadingScores: document.getElementById('loading-scores'),
            noScores: document.getElementById('no-scores'),
            closeLeaderboardButton: document.getElementById('close-leaderboard-button')
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

        // Audio manager reference (set by Game)
        this.audioManager = null;

        // Leaderboard manager
        this.leaderboardManager = new LeaderboardManager();

        // Current score for submission
        this.currentScore = 0;

        this.setupButtonListeners();
        this.setupAudioControls();
        this.setupLeaderboardControls();
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

        this.elements.leaderboardButton.addEventListener('click', () => {
            this.showLeaderboard(this.currentScore, true);
        });
    }

    /**
     * Set up audio control listeners
     */
    setupAudioControls() {
        this.elements.muteButton.addEventListener('click', () => {
            if (this.audioManager) {
                const isMuted = this.audioManager.toggleMute();
                this.updateMuteButton(isMuted);
            }
        });
    }

    /**
     * Update mute button appearance
     */
    updateMuteButton(isMuted) {
        this.elements.soundIcon.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            this.elements.muteButton.classList.add('muted');
        } else {
            this.elements.muteButton.classList.remove('muted');
        }
    }

    /**
     * Set audio manager reference
     */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Set up leaderboard control listeners
     */
    setupLeaderboardControls() {
        // Close button
        this.elements.closeLeaderboardButton.addEventListener('click', () => {
            this.hideLeaderboard();
        });

        // Submit score button
        this.elements.submitScoreButton.addEventListener('click', () => {
            this.submitScore();
        });

        // Enter key submits
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });

        // Validate name on input
        this.elements.playerNameInput.addEventListener('input', () => {
            this.elements.nameError.textContent = '';
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
        this.currentScore = score;
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
     * Show leaderboard modal
     * @param {number} score - Current score (for submission)
     * @param {boolean} showNameInput - Whether to show name input for new score
     */
    async showLeaderboard(score, showNameInput = false) {
        this.elements.leaderboardModal.classList.remove('hidden');
        this.elements.loadingScores.style.display = 'block';
        this.elements.noScores.classList.add('hidden');
        this.elements.scoresList.innerHTML = '';

        // Show/hide name input section
        if (showNameInput && score > 0) {
            this.elements.nameInputSection.classList.remove('hidden');
            this.elements.yourScoreDisplay.textContent = `Your Score: ${score.toLocaleString()}`;
            this.elements.playerNameInput.value = '';
            this.elements.nameError.textContent = '';
            this.elements.playerNameInput.focus();
        } else {
            this.elements.nameInputSection.classList.add('hidden');
        }

        // Fetch scores
        try {
            const scores = await this.leaderboardManager.fetchScores();
            this.displayScores(scores);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            this.elements.loadingScores.textContent = 'Failed to load scores';
        }
    }

    /**
     * Hide leaderboard modal
     */
    hideLeaderboard() {
        this.elements.leaderboardModal.classList.add('hidden');
    }

    /**
     * Display scores in the list
     */
    displayScores(scores) {
        this.elements.loadingScores.style.display = 'none';
        this.elements.scoresList.innerHTML = '';

        if (scores.length === 0) {
            this.elements.noScores.classList.remove('hidden');
            return;
        }

        this.elements.noScores.classList.add('hidden');

        scores.forEach((entry, index) => {
            const li = document.createElement('li');

            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = `#${index + 1}`;

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = entry.name;

            const score = document.createElement('span');
            score.className = 'score';
            score.textContent = entry.score.toLocaleString();

            const date = document.createElement('span');
            date.className = 'date';
            date.textContent = entry.date || '';

            li.appendChild(rank);
            li.appendChild(name);
            li.appendChild(score);
            li.appendChild(date);

            this.elements.scoresList.appendChild(li);
        });
    }

    /**
     * Submit score to leaderboard
     */
    async submitScore() {
        const name = this.elements.playerNameInput.value;

        // Validate
        const validation = this.leaderboardManager.validateName(name);
        if (!validation.valid) {
            this.elements.nameError.textContent = validation.error;
            return;
        }

        // Disable button during submission
        this.elements.submitScoreButton.disabled = true;
        this.elements.submitScoreButton.textContent = 'SUBMITTING...';

        try {
            const success = await this.leaderboardManager.submitScore(name, this.currentScore);

            if (success) {
                // Hide name input and refresh scores
                this.elements.nameInputSection.classList.add('hidden');
                const scores = await this.leaderboardManager.fetchScores();
                this.displayScores(scores);
            } else {
                this.elements.nameError.textContent = 'Failed to submit score';
            }
        } catch (error) {
            console.error('Score submission error:', error);
            this.elements.nameError.textContent = 'Error submitting score';
        }

        // Re-enable button
        this.elements.submitScoreButton.disabled = false;
        this.elements.submitScoreButton.textContent = 'SUBMIT';
    }

    /**
     * Get leaderboard manager (for configuration)
     */
    getLeaderboardManager() {
        return this.leaderboardManager;
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
