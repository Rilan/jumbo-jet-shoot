import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';

/**
 * Entry point for the Jet Shooting Game
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Get canvas element
    const canvas = document.getElementById('game-canvas');

    if (!canvas) {
        console.error('Could not find game canvas element');
        return;
    }

    // Create game instance
    const game = new Game(canvas);

    // Create and start game loop
    const gameLoop = new GameLoop(game);
    gameLoop.start();

    // Log startup
    console.log('Jet Shooting Game initialized');
    console.log('Controls:');
    console.log('  WASD / Arrow Keys - Move');
    console.log('  Spacebar / Left Click - Shoot');
    console.log('  P / Escape - Pause');
});
