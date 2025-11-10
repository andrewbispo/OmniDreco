import Phaser from 'phaser';
import OmnichordScene from './OmnichordScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'phaser-game-container',
        width: window.innerWidth,
        height: window.innerHeight,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 2560,
            height: 1440
        }
    },
    backgroundColor: '#0a0a0a',
    scene: [OmnichordScene],
    audio: {
        disableWebAudio: false
    },
    input: {
        touch: true,
        mouse: true
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    }
};

const game = new Phaser.Game(config);

// Observação: remover handlers que previnem gestos globais do navegador
// para evitar comportamento inesperado em mobile. Se quiser bloquear
// gestos específicos, implemente-os apenas sobre o canvas do jogo.

// Melhorar performance em mobile
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Opcional: registrar service worker para PWA
    });
}