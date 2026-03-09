import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Jet Shooting Game — Phaser 3
 * Portrait-first canvas (450×800) with Scale.FIT for all screen sizes.
 */
const config = {
    type: Phaser.AUTO,         // WebGL with Canvas fallback
    parent: 'game-container',
    width: 450,
    height: 800,
    backgroundColor: '#0a0a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, GameScene]
};

window.addEventListener('DOMContentLoaded', () => {
    new Phaser.Game(config);
});
