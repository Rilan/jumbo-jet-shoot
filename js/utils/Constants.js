/**
 * Game configuration constants
 */
export const CANVAS = {
    WIDTH: 800,
    HEIGHT: 600
};

export const PLAYER = {
    WIDTH: 40,
    HEIGHT: 50,
    SPEED: 300,
    MAX_HEALTH: 100,
    STARTING_LIVES: 3,
    INVINCIBILITY_TIME: 2,
    FIRE_RATE: 0.15,           // Seconds between shots
    BULLET_SPEED: 500,
    BULLET_DAMAGE: 25
};

export const ENEMY_TYPES = {
    BASIC: 'basic',
    ZIGZAG: 'zigzag',
    CIRCULAR: 'circular',
    SHOOTER: 'shooter'
};

export const ENEMIES = {
    BASIC: {
        WIDTH: 35,
        HEIGHT: 35,
        SPEED: 120,
        HEALTH: 25,
        SCORE: 100,
        COLOR: '#ff4444'
    },
    ZIGZAG: {
        WIDTH: 30,
        HEIGHT: 30,
        SPEED: 100,
        HEALTH: 25,
        SCORE: 150,
        COLOR: '#ff8800',
        AMPLITUDE: 100,
        FREQUENCY: 3
    },
    CIRCULAR: {
        WIDTH: 25,
        HEIGHT: 25,
        SPEED: 80,
        HEALTH: 35,
        SCORE: 200,
        COLOR: '#ff00ff',
        RADIUS: 50,
        ANGULAR_SPEED: 4
    },
    SHOOTER: {
        WIDTH: 40,
        HEIGHT: 40,
        SPEED: 60,
        HEALTH: 50,
        SCORE: 300,
        COLOR: '#8844ff',
        FIRE_RATE: 2,
        BULLET_SPEED: 200
    }
};

export const BOSS = {
    WIDTH: 120,
    HEIGHT: 80,
    SPEED: 80,
    HEALTH_MULTIPLIER: 20,     // Health = threshold / multiplier * 100
    SCORE_MULTIPLIER: 10,
    COLOR: '#cc0000',
    SPAWN_THRESHOLDS: [1000, 3000, 6000, 10000],
    PHASES: [
        { healthPercent: 100, pattern: 'spread' },
        { healthPercent: 66, pattern: 'circle' },
        { healthPercent: 33, pattern: 'aimed' }
    ]
};

export const BULLET = {
    WIDTH: 6,
    HEIGHT: 15,
    PLAYER_COLOR: '#00ffff',
    ENEMY_COLOR: '#ff6600'
};

export const POWERUP_TYPES = {
    WEAPON_UPGRADE: 'weapon',
    SHIELD: 'shield',
    SPEED_BOOST: 'speed',
    HEALTH: 'health',
    EXTRA_LIFE: 'life',
    RAPID_FIRE: 'rapid'
};

export const POWERUPS = {
    SIZE: 25,
    SPEED: 100,
    DROP_CHANCE: 0.15,         // 15% chance to drop
    DURATION: {
        SHIELD: 5,
        SPEED_BOOST: 8,
        RAPID_FIRE: 6
    },
    COLORS: {
        weapon: '#ffff00',
        shield: '#00ffff',
        speed: '#00ff00',
        health: '#ff4444',
        life: '#ff69b4',
        rapid: '#ff8800'
    }
};

export const SPAWN = {
    INITIAL_DELAY: 2,          // Seconds before first enemy
    MIN_INTERVAL: 0.5,         // Minimum spawn interval
    MAX_INTERVAL: 2,           // Maximum spawn interval
    DIFFICULTY_INCREASE: 0.001 // Spawn rate increase per frame
};

export const COLORS = {
    PLAYER: '#00ccff',
    PLAYER_ACCENT: '#0088cc',
    EXPLOSION: ['#ff4444', '#ff8800', '#ffcc00', '#ffffff'],
    TRAIL: 'rgba(0, 200, 255, 0.3)'
};

export const EFFECTS = {
    EXPLOSION_PARTICLES: 15,
    TRAIL_LENGTH: 5,
    SCREEN_SHAKE_INTENSITY: 5,
    SCREEN_SHAKE_DURATION: 0.2
};

export const KEYS = {
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    SHOOT: ['Space'],
    PAUSE: ['KeyP', 'Escape']
};

export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
};
