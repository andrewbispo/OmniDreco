import Phaser from 'phaser';
import ChordGrid from './ChordGrid.js';
import StrumArea from './StrumArea.js';
import AudioEngine from './AudioEngine.js';

export default class OmnichordScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OmnichordScene' });
    }

    preload() {
        this.load.image('chordButton', 'https://play.rosebud.ai/assets/chordButton.png?j6LJ');
        this.load.image('chordGridBackground', 'https://play.rosebud.ai/assets/chordGridBackground.png?PFgy');
        this.load.image('strumAreaPanel', 'https://play.rosebud.ai/assets/strumAreaPanel.png?hOf4');
        this.load.image('strumIndicator', 'https://play.rosebud.ai/assets/strumIndicator.png?P2DS');
        this.load.image('appBackground', 'https://play.rosebud.ai/assets/appBackground.png?tQIO');
    }

    create() {
        // Detectar orientação e dimensões
        this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS ||
            this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone;
        this.isLandscape = this.scale.width > this.scale.height;

        // Background com gradiente
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x1a1a2e, 1);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        this.audioEngine = new AudioEngine();

        // Layout responsivo baseado em orientação
        if (this.isLandscape) {
            this.createLandscapeLayout();
        } else {
            this.createPortraitLayout();
        }

        this.selectedChord = null;
        this.setupKeyboardControls();
        this.addVisualFeedback();

        // Adicionar listener para mudança de orientação
        this.scale.on('resize', this.handleResize, this);
    }

    createLandscapeLayout() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Área de acordes ocupa 65% da largura
        const chordAreaWidth = width * 0.65;
        const strumAreaWidth = width * 0.35;

        // Título com estilo moderno
        this.createModernTitle(chordAreaWidth / 2, 40);

        // Grid de acordes centralizado na área esquerda
        this.chordGrid = new ChordGrid(
            this,
            chordAreaWidth / 2,
            height / 2 + 20,
            (chord) => this.onChordSelected(chord),
            true // mobile mode
        );

        // Área de strum na direita
        this.strumArea = new StrumArea(
            this,
            chordAreaWidth + strumAreaWidth / 2,
            height / 2,
            (noteIndex) => this.onStrum(noteIndex),
            true // mobile mode
        );

        // Indicador de acorde selecionado
        this.selectedChordText = this.add.text(
            chordAreaWidth + strumAreaWidth / 2,
            50,
            '',
            {
                fontSize: '42px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setAlpha(0);
    }

    createPortraitLayout() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Em portrait, strum fica em cima e acordes embaixo
        const strumAreaHeight = height * 0.35;
        const chordAreaHeight = height * 0.65;

        this.createModernTitle(width / 2, strumAreaHeight - 40);

        this.strumArea = new StrumArea(
            this,
            width / 2,
            strumAreaHeight / 2,
            (noteIndex) => this.onStrum(noteIndex),
            true,
            true // vertical mode
        );

        this.chordGrid = new ChordGrid(
            this,
            width / 2,
            strumAreaHeight + chordAreaHeight / 2,
            (chord) => this.onChordSelected(chord),
            true,
            true // compact mode
        );

        this.selectedChordText = this.add.text(
            width / 2,
            strumAreaHeight - 80,
            '',
            {
                fontSize: '36px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setAlpha(0);
    }

    createModernTitle(x, y) {
        const title = this.add.text(x, y, 'OMNICHORD', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#6B46C1',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Efeito de brilho pulsante
        this.tweens.add({
            targets: title,
            alpha: { from: 1, to: 0.7 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    addVisualFeedback() {
        // Partículas para feedback visual quando tocar notas
        this.particles = this.add.particles(0, 0, 'strumIndicator', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            frequency: -1
        });
    }

    onChordSelected(chord) {
        if (chord === null) {
            this.selectedChord = null;
            this.strumArea.setChord(null);
            this.audioEngine.stopSustainedChord();

            this.tweens.add({
                targets: this.selectedChordText,
                alpha: 0,
                duration: 200
            });
            return;
        }

        this.selectedChord = chord;
        this.strumArea.setChord(chord);
        this.audioEngine.playSustainedChord(chord);

        // Atualizar texto do acorde selecionado
        this.selectedChordText.setText(chord.name);
        this.selectedChordText.setColor(`#${chord.color.toString(16).padStart(6, '0')}`);

        this.tweens.add({
            targets: this.selectedChordText,
            alpha: 1,
            scale: { from: 1.3, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    onStrum(noteIndex) {
        if (this.selectedChord && noteIndex >= 0) {
            this.audioEngine.playChordNote(this.selectedChord, noteIndex);

            // Feedback visual com partículas
            const emitX = this.isLandscape ?
                this.scale.width * 0.8 : this.scale.width / 2;
            const emitY = this.isLandscape ?
                this.scale.height / 2 : this.scale.height * 0.2;

            this.particles.emitParticleAt(emitX, emitY, 5);
        }
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        // Detectar mudança de orientação
        const wasLandscape = this.isLandscape;
        this.isLandscape = width > height;

        if (wasLandscape !== this.isLandscape) {
            // Recriar layout se orientação mudou
            this.scene.restart();
        }
    }

    setupKeyboardControls() {
        // Prevenir comportamento padrão das teclas, exceto F1-F12
        window.addEventListener('keydown', (event) => {
            // Lista de teclas para prevenir comportamento padrão
            const preventDefaultKeys = [
                'Tab', '`', '-', '=', '[', ']', '\\',
                ';', "'", ',', '.', '/'
            ];

            // Se a tecla pressionada está na lista, previne o comportamento padrão
            if (preventDefaultKeys.includes(event.key) ||
                preventDefaultKeys.includes(event.key.toUpperCase())) {
                event.preventDefault();
            }

            // Prevenir combinações comuns de teclas
            if ((event.ctrlKey || event.metaKey) &&
                ['r', 'f', 's', 'p', '+', '-'].includes(event.key.toLowerCase())) {
                event.preventDefault();
            }
        }, { capture: true }); // capture: true garante que pegamos o evento antes do navegador

        const keyMap = {
            // Linha de função (F1-F12) - Para acordes normais
            'F1': { row: 0, col: 0 }, 'F2': { row: 0, col: 1 },
            'F3': { row: 0, col: 2 }, 'F4': { row: 0, col: 3 },
            'F5': { row: 0, col: 4 }, 'F6': { row: 0, col: 5 },
            'F7': { row: 0, col: 6 }, 'F8': { row: 0, col: 7 },
            'F9': { row: 0, col: 8 }, 'F10': { row: 0, col: 9 },
            'F11': { row: 0, col: 10 }, 'F12': { row: 0, col: 11 },

            // Linha de números - Linha 1
            '`': { row: 1, col: 0 }, '1': { row: 1, col: 1 },
            '2': { row: 1, col: 2 }, '3': { row: 1, col: 3 },
            '4': { row: 1, col: 4 }, '5': { row: 1, col: 5 },
            '6': { row: 1, col: 6 }, '7': { row: 1, col: 7 },
            '8': { row: 1, col: 8 }, '9': { row: 1, col: 9 },
            '0': { row: 1, col: 10 }, '-': { row: 1, col: 11 },

            // Linha QWERTY - Linha 2
            'TAB': { row: 2, col: 0 }, 'Q': { row: 2, col: 1 },
            'W': { row: 2, col: 2 }, 'E': { row: 2, col: 3 },
            'R': { row: 2, col: 4 }, 'T': { row: 2, col: 5 },
            'Y': { row: 2, col: 6 }, 'U': { row: 2, col: 7 },
            'I': { row: 2, col: 8 }, 'O': { row: 2, col: 9 },
            'P': { row: 2, col: 10 }, '[': { row: 2, col: 11 },

            // Linha ASDF - Linha 3
            'CAPSLOCK': { row: 3, col: 0 }, 'A': { row: 3, col: 1 },
            'S': { row: 3, col: 2 }, 'D': { row: 3, col: 3 },
            'F': { row: 3, col: 4 }, 'G': { row: 3, col: 5 },
            'H': { row: 3, col: 6 }, 'J': { row: 3, col: 7 },
            'K': { row: 3, col: 8 }, 'L': { row: 3, col: 9 },
            ';': { row: 3, col: 10 }, "'": { row: 3, col: 11 },

            // Linha ZXCV - Linha 4
            'SHIFT': { row: 4, col: 0 }, 'Z': { row: 4, col: 1 },
            'X': { row: 4, col: 2 }, 'C': { row: 4, col: 3 },
            'V': { row: 4, col: 4 }, 'B': { row: 4, col: 5 },
            'N': { row: 4, col: 6 }, 'M': { row: 4, col: 7 },
            ',': { row: 4, col: 8 }, '.': { row: 4, col: 9 },
            '/': { row: 4, col: 10 }, '\\': { row: 4, col: 11 }
        };

        this.input.keyboard.on('keydown', (event) => {
            // Normalizar nome da tecla
            let key = event.key;
            let mapping;

            // Tratar teclas especiais
            if (key === 'Tab') key = 'TAB';
            else if (key === 'CapsLock') key = 'CAPSLOCK';
            else if (key === 'Shift') key = 'SHIFT';
            // Tratar teclas de função corretamente
            else if (key.startsWith('F') && key.length <= 3) {
                mapping = keyMap[key.toUpperCase()];
            }
            // Tratar teclas de pontuação para cifras B
            else if (['-', '.', ',', "'", '´', '[', ']', '/', ';'].includes(key)) {
                // Mapear estas teclas para acordes B em diferentes linhas
                const bChordMappings = {
                    '-': { row: 1, col: 3, variant: 'B' },  // B na primeira linha
                    '.': { row: 2, col: 3, variant: 'B' },  // B na segunda linha
                    ',': { row: 3, col: 3, variant: 'B' },  // B na terceira linha
                    "'": { row: 4, col: 3, variant: 'B' },  // B na quarta linha
                    '´': { row: 0, col: 3, variant: 'B' },  // B na linha superior
                    '[': { row: 1, col: 4, variant: 'B' },  // B variação 1
                    ']': { row: 2, col: 4, variant: 'B' },  // B variação 2
                    '/': { row: 3, col: 4, variant: 'B' },  // B variação 3
                    ';': { row: 4, col: 4, variant: 'B' }   // B variação 4
                };
                mapping = bChordMappings[key];
            }
            // Outras teclas
            else {
                mapping = keyMap[key.toUpperCase()];
            }

            if (mapping) {
                const button = this.chordGrid.buttons.find(btn =>
                    btn.chordData.row === mapping.row &&
                    btn.chordData.col === mapping.col &&
                    (!mapping.variant || btn.chordData.name.startsWith(mapping.variant))
                );

                if (button) {
                    this.chordGrid.selectButton(button, button.chordData, button.background);
                }
            }
        });
    }
}