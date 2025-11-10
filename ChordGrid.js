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

        // Tornar a grade responsiva: calcular tamanhos a partir da área disponível
        const availableWidth = Math.min(this.scene.scale.width * 0.65, 900);
        const availableHeight = Math.min(this.scene.scale.height * 0.8, 700);

        // spacing baseado na menor dimensão disponível e no número de colunas/linhas
        const spacingX = Math.floor(availableWidth / (cols + 1));
        const spacingY = Math.floor(availableHeight / (rows + 1));
        const spacing = Math.max(40, Math.min(spacingX, spacingY));

        const buttonSize = Math.max(40, Math.min(80, Math.floor(spacing * 0.9)));
        const fontSize = this.isMobile ? `${Math.max(12, Math.floor(buttonSize / 3))}px` : `${Math.max(14, Math.floor(buttonSize / 2.5))}px`;

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
            );

            // Borda sutil
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

            // Área interativa maior para mobile
            const hitAreaSize = this.isMobile ? buttonSize + 10 : buttonSize;
            button.setInteractive(
                new Phaser.Geom.Rectangle(
                    -hitAreaSize / 2,
                    -hitAreaSize / 2,
                    hitAreaSize,
                    hitAreaSize
                ),
                Phaser.Geom.Rectangle.Contains
            );

            // Feedback tátil
            button.on('pointerdown', () => {
                this.scene.tweens.add({
                    targets: button,
                    scale: 0.9,
                    duration: 100,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
                this.selectButton(button, chord, bg);
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
}