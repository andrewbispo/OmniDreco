import Phaser from 'phaser';

export default class ChordGrid {
    constructor(scene, x, y, onChordSelect, isMobile = false, isCompact = false) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.onChordSelect = onChordSelect;
        this.isMobile = isMobile;
        this.isCompact = isCompact;
        this.buttons = [];
        this.selectedButton = null;

        this.chordData = this.createChordData();
        this.createGrid();

        // Limpar cache quando a cena for destruída
        this.scene.events.once('shutdown', this.cleanup, this);
    }

    createChordData() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Cores vibrantes e modernas mantendo a paleta original
        const colors = [
            0xFBE0E5, 0xFDCEDF, 0xFDFFBC, 0xFFF89A,
            0xE8D5FD, 0xDFCCFB, 0xD0BFFF, 0xBEADFA,
            0xD6EAFF, 0xB4E4FF, 0xD7F7E5, 0xCCF6C8
        ];

        const chordTypes = [
            { suffix: '', intervals: [0, 4, 7], name: 'Maior' },
            { suffix: 'm', intervals: [0, 3, 7], name: 'Menor' },
            { suffix: 'M7', intervals: [0, 4, 7, 11], name: 'Maior 7' },
            { suffix: 'm7', intervals: [0, 3, 7, 10], name: 'Menor 7' },
            { suffix: '7', intervals: [0, 4, 7, 10], name: 'Dominante' },
            { suffix: '+', intervals: [0, 4, 8], name: 'Aumentado' },
            { suffix: '°', intervals: [0, 3, 6], name: 'Diminuto' }
        ];

        const chords = [];
        chordTypes.forEach((type, rowIndex) => {
            notes.forEach((note, colIndex) => {
                chords.push({
                    name: note + type.suffix,
                    root: note,
                    intervals: type.intervals,
                    typeName: type.name,
                    color: colors[colIndex],
                    row: rowIndex,
                    col: colIndex
                });
            });
        });

        return chords;
    }

    createGrid() {
        const cols = 12;
        const rows = 7;

        // Sistema responsivo simplificado
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const isPortrait = screenHeight > screenWidth;

        // Cálculos base
        const gridPadding = 20;
        const minButtonSize = 40;
        const maxButtonSize = this.isMobile ? 60 : 70;

        // Calcular área disponível
        const availableWidth = screenWidth * (isPortrait ? 0.95 : 0.65) - (gridPadding * 2);
        const availableHeight = screenHeight * (isPortrait ? 0.6 : 0.8) - (gridPadding * 2);

        // Calcular tamanho dos botões e espaçamento
        const maxSpacingX = Math.floor(availableWidth / cols);
        const maxSpacingY = Math.floor(availableHeight / rows);
        const spacing = Math.min(maxSpacingX, maxSpacingY);

        // Garantir tamanho mínimo e máximo dos botões
        const buttonSize = Math.max(minButtonSize,
            Math.min(maxButtonSize, Math.floor(spacing * 0.8))
        );

        // Fonte proporcional ao botão
        const fontSize = this.isMobile ?
            `${Math.max(11, Math.min(16, Math.floor(buttonSize / 3)))}px` :
            `${Math.max(13, Math.min(18, Math.floor(buttonSize / 2.5)))}px`;

        // Calcular dimensões do grid
        const gridWidth = (cols - 1) * spacing;
        const gridHeight = (rows - 1) * spacing;

        // Background com efeito glassmorphism
        const bgGraphics = this.scene.add.graphics();
        bgGraphics.fillStyle(0x1a1a2e, 0.4);
        bgGraphics.fillRoundedRect(
            this.x - gridWidth / 2 - 30,
            this.y - gridHeight / 2 - 30,
            gridWidth + 60,
            gridHeight + 60,
            20
        );
        bgGraphics.lineStyle(2, 0x6B46C1, 0.5);
        bgGraphics.strokeRoundedRect(
            this.x - gridWidth / 2 - 30,
            this.y - gridHeight / 2 - 30,
            gridWidth + 60,
            gridHeight + 60,
            20
        );

        const startX = this.x - (cols - 1) * spacing / 2;
        const startY = this.y - (rows - 1) * spacing / 2;

        this.chordData.forEach((chord) => {
            const btnX = startX + chord.col * spacing;
            const btnY = startY + chord.row * spacing;

            const button = this.scene.add.container(btnX, btnY);

            // Background do botão com sombra
            const shadow = this.scene.add.graphics();
            shadow.fillStyle(0x000000, 0.3);
            shadow.fillRoundedRect(
                -buttonSize / 2 + 2,
                -buttonSize / 2 + 2,
                buttonSize,
                buttonSize,
                12
            );

            const bg = this.scene.add.graphics();
            bg.fillStyle(chord.color, 1);
            bg.fillRoundedRect(
                -buttonSize / 2,
                -buttonSize / 2,
                buttonSize,
                buttonSize,
                12
            );            // Borda sutil
            bg.lineStyle(2, 0xffffff, 0.3);
            bg.strokeRoundedRect(
                -buttonSize / 2,
                -buttonSize / 2,
                buttonSize,
                buttonSize,
                12
            );

            const text = this.scene.add.text(0, 0, chord.name, {
                fontSize: fontSize,
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            button.add([shadow, bg, text]);
            button.setSize(buttonSize, buttonSize);

            // Criar uma hitarea maior e mais precisa
            const hitArea = new Phaser.Geom.Rectangle(
                -buttonSize * 0.7,  // Aumentar área de toque
                -buttonSize * 0.7,
                buttonSize * 1.4,   // 40% maior que o botão
                buttonSize * 1.4
            );

            // Configurar input com prioridade alta
            button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, true)
                .setData('touchStartY', 0);

            // Debug: visualizar área de toque
            if (this.isMobile) {
                const touchArea = this.scene.add.graphics();
                touchArea.lineStyle(1, 0xffffff, 0.2);
                touchArea.strokeRect(
                    hitArea.x,
                    hitArea.y,
                    hitArea.width,
                    hitArea.height
                );
                button.add(touchArea);
            }

            // Novo sistema de detecção de toque
            button.on('pointerdown', (pointer) => {
                button.setData('touchStartY', pointer.y);

                // Feedback visual imediato
                this.scene.tweens.add({
                    targets: button,
                    scale: 0.95,
                    duration: 50,
                    ease: 'Power2'
                });
            });

            button.on('pointerup', (pointer) => {
                const touchStartY = button.getData('touchStartY');
                const touchDistance = Math.abs(pointer.y - touchStartY);

                // Se o movimento vertical for pequeno, considerar como toque válido
                if (touchDistance < 10) {
                    this.scene.tweens.add({
                        targets: button,
                        scale: 1,
                        duration: 50,
                        ease: 'Power2',
                        onComplete: () => {
                            // Vibração em dispositivos mobile
                            if (this.isMobile && navigator.vibrate) {
                                navigator.vibrate(20);
                            }
                            this.selectButton(button, chord, bg);
                        }
                    });
                } else {
                    // Reset visual se for um movimento muito longo
                    this.scene.tweens.add({
                        targets: button,
                        scale: 1,
                        duration: 100
                    });
                }
            });

            button.on('pointerover', () => {
                if (!this.isMobile) {
                    this.scene.tweens.add({
                        targets: button,
                        scale: 1.1,
                        duration: 150,
                        ease: 'Back.easeOut'
                    });
                }
            });

            button.on('pointerout', () => {
                if (!this.isMobile && this.selectedButton !== button) {
                    this.scene.tweens.add({
                        targets: button,
                        scale: 1,
                        duration: 150
                    });
                }
            });

            button.chordData = chord;
            button.background = bg;
            button.shadow = shadow;
            button.originalColor = chord.color;
            button.buttonSize = buttonSize;
            this.buttons.push(button);
        });
    }

    selectButton(button, chord, bg) {
        const buttonSize = button.buttonSize;

        // Deselecionar se clicar no mesmo botão
        if (this.selectedButton === button) {
            bg.clear();
            bg.fillStyle(chord.color, 1);
            bg.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12);
            bg.lineStyle(2, 0xffffff, 0.3);
            bg.strokeRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12);

            this.scene.tweens.add({
                targets: button,
                scale: 1,
                duration: 200
            });

            this.selectedButton = null;
            this.onChordSelect(null);
            return;
        }

        // Resetar botão anteriormente selecionado
        if (this.selectedButton && this.selectedButton.background) {
            const prevChord = this.selectedButton.chordData;
            this.selectedButton.background.clear();
            this.selectedButton.background.fillStyle(prevChord.color, 1);
            this.selectedButton.background.fillRoundedRect(
                -buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12
            );
            this.selectedButton.background.lineStyle(2, 0xffffff, 0.3);
            this.selectedButton.background.strokeRoundedRect(
                -buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12
            );

            this.scene.tweens.add({
                targets: this.selectedButton,
                scale: 1,
                duration: 200
            });
        }

        // Selecionar novo botão com visual destacado
        this.selectedButton = button;
        bg.clear();

        // Fundo branco com borda colorida grossa
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12);
        bg.lineStyle(5, chord.color, 1);
        bg.strokeRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 12);

        // Adicionar brilho
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokeRoundedRect(
            -buttonSize / 2 + 3,
            -buttonSize / 2 + 3,
            buttonSize - 6,
            buttonSize - 6,
            10
        );

        this.scene.tweens.add({
            targets: button,
            scale: 1.15,
            duration: 200,
            ease: 'Back.easeOut'
        });

        this.onChordSelect(chord);
    }

    // Método para limpar recursos
    cleanup() {
        if (this.buttons && Array.isArray(this.buttons)) {
            this.buttons.forEach(button => {
                if (button && button.destroy) {
                    button.destroy();
                }
            });
            this.buttons = [];
        }
    }
}
