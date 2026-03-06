/**
 * Manages online leaderboard using JSONBin.io API
 */
export class LeaderboardManager {
    constructor() {
        // JSONBin.io configuration
        // Users should replace this with their own bin ID
        this.binId = null;
        this.apiKey = null;
        this.baseUrl = 'https://api.jsonbin.io/v3/b';

        // Cache
        this.scores = [];
        this.lastFetch = 0;
        this.cacheTimeout = 30000; // 30 seconds

        // Leaderboard settings
        this.maxScores = 10;
        this.minNameLength = 3;
        this.maxNameLength = 10;
    }

    /**
     * Configure the leaderboard with JSONBin.io credentials
     * @param {string} binId - The JSONBin.io bin ID
     * @param {string} apiKey - Optional API key for private bins
     */
    configure(binId, apiKey = null) {
        this.binId = binId;
        this.apiKey = apiKey;
    }

    /**
     * Check if leaderboard is configured
     */
    isConfigured() {
        return this.binId !== null;
    }

    /**
     * Fetch leaderboard scores from API
     * @returns {Promise<Array>} Array of score objects
     */
    async fetchScores() {
        if (!this.isConfigured()) {
            console.warn('Leaderboard not configured');
            return this.getLocalScores();
        }

        // Return cached if fresh
        if (Date.now() - this.lastFetch < this.cacheTimeout && this.scores.length > 0) {
            return this.scores;
        }

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.apiKey) {
                headers['X-Access-Key'] = this.apiKey;
            }

            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            this.scores = data.record?.scores || [];
            this.lastFetch = Date.now();

            // Sort by score descending
            this.scores.sort((a, b) => b.score - a.score);

            // Keep only top scores
            this.scores = this.scores.slice(0, this.maxScores);

            return this.scores;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            // Fall back to local scores
            return this.getLocalScores();
        }
    }

    /**
     * Submit a new score
     * @param {string} name - Player name (3-10 characters)
     * @param {number} score - Player score
     * @returns {Promise<boolean>} Success status
     */
    async submitScore(name, score) {
        // Validate name
        const cleanName = this.sanitizeName(name);
        if (!cleanName) {
            return false;
        }

        const newScore = {
            name: cleanName,
            score: Math.floor(score),
            date: new Date().toISOString().split('T')[0]
        };

        // Always save locally
        this.saveLocalScore(newScore);

        if (!this.isConfigured()) {
            return true;
        }

        try {
            // Fetch current scores
            await this.fetchScores();

            // Add new score
            const updatedScores = [...this.scores, newScore];

            // Sort and trim
            updatedScores.sort((a, b) => b.score - a.score);
            const topScores = updatedScores.slice(0, this.maxScores);

            // Update bin
            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.apiKey) {
                headers['X-Access-Key'] = this.apiKey;
            }

            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ scores: topScores })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            this.scores = topScores;
            this.lastFetch = Date.now();

            return true;
        } catch (error) {
            console.error('Failed to submit score:', error);
            return false;
        }
    }

    /**
     * Check if a score qualifies for the leaderboard
     * @param {number} score - Score to check
     * @returns {boolean} True if score qualifies
     */
    qualifiesForLeaderboard(score) {
        if (this.scores.length < this.maxScores) {
            return true;
        }

        const minScore = this.scores[this.scores.length - 1]?.score || 0;
        return score > minScore;
    }

    /**
     * Get the minimum score needed to qualify
     * @returns {number} Minimum qualifying score
     */
    getMinimumScore() {
        if (this.scores.length < this.maxScores) {
            return 0;
        }
        return this.scores[this.scores.length - 1]?.score || 0;
    }

    /**
     * Get current leaderboard scores
     * @returns {Array} Array of score objects
     */
    getScores() {
        return this.scores;
    }

    /**
     * Sanitize player name
     * @param {string} name - Raw name input
     * @returns {string|null} Sanitized name or null if invalid
     */
    sanitizeName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }

        // Remove any non-alphanumeric characters except spaces
        let clean = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();

        // Check length
        if (clean.length < this.minNameLength || clean.length > this.maxNameLength) {
            return null;
        }

        return clean.toUpperCase();
    }

    /**
     * Validate a name without sanitizing
     * @param {string} name - Name to validate
     * @returns {{valid: boolean, error: string}} Validation result
     */
    validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Name is required' };
        }

        const trimmed = name.trim();

        if (trimmed.length < this.minNameLength) {
            return { valid: false, error: `Name must be at least ${this.minNameLength} characters` };
        }

        if (trimmed.length > this.maxNameLength) {
            return { valid: false, error: `Name must be at most ${this.maxNameLength} characters` };
        }

        if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
            return { valid: false, error: 'Name can only contain letters, numbers, and spaces' };
        }

        return { valid: true, error: '' };
    }

    /**
     * Get scores from local storage
     * @returns {Array} Local scores
     */
    getLocalScores() {
        try {
            const saved = localStorage.getItem('jetShooterLeaderboard');
            if (saved) {
                const scores = JSON.parse(saved);
                return scores.sort((a, b) => b.score - a.score).slice(0, this.maxScores);
            }
        } catch (e) {
            console.error('Failed to load local scores:', e);
        }
        return [];
    }

    /**
     * Save a score to local storage
     * @param {Object} scoreData - Score object to save
     */
    saveLocalScore(scoreData) {
        try {
            const scores = this.getLocalScores();
            scores.push(scoreData);
            scores.sort((a, b) => b.score - a.score);
            const topScores = scores.slice(0, this.maxScores);
            localStorage.setItem('jetShooterLeaderboard', JSON.stringify(topScores));
        } catch (e) {
            console.error('Failed to save local score:', e);
        }
    }

    /**
     * Clear local scores (for testing)
     */
    clearLocalScores() {
        localStorage.removeItem('jetShooterLeaderboard');
    }

    /**
     * Get player's rank for a given score
     * @param {number} score - Score to check
     * @returns {number} Rank (1-based), or 0 if not on leaderboard
     */
    getRank(score) {
        for (let i = 0; i < this.scores.length; i++) {
            if (score >= this.scores[i].score) {
                return i + 1;
            }
        }

        if (this.scores.length < this.maxScores) {
            return this.scores.length + 1;
        }

        return 0;
    }
}
