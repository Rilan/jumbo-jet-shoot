/**
 * BootScene — minimal boot, no assets to load (all graphics are procedural).
 * Transitions immediately to GameScene.
 */
export class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    create() {
        this.scene.start('GameScene');
    }
}
