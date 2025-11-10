import Phaser from 'phaser';

export default class StrumArea {
    constructor(scene, x, y, onStrum, isMobile = false, isVertical = false) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.onStrum = onStrum;
        this.isMobile = isMobile;
        this.isVertical = isVertical;
        this.currentChord = null;
        this.isStumming = false;
        this.lastNoteIndex = -1;

        this.createStrumArea();
    }

    createStrumArea() {
        const width = this.isVertical ?
            this.scene.scale.width * 0.9 :
            this.isMobile ? 450 : 480;
        const height = this.isVertical ?
            this.scene.scale.height * 0.25 :
            this.isMobile ? this.scene.scale.height * 0.85 : 1080;

        // Background com glassmorphism
        const bgGraphics = this.scene.add.graphics();
        bgGraphics.fillStyle(0x2a2a3e, 0.6);
        bgGraphics.fillRoundedRect(
            this.x - width / 2,
            this.y - height / 2,
            width,
            height,
            20
        );
        bgGraphics.lineStyle(3, 0x6B46C1, 0.8);
        bgGraphics.strokeRoundedRect(
            this.x - width / 2,
            this.y - height / 2,
            width,
            height,
            20
        );

        // Linhas guia para as notas
        this.createNoteGuides(width, height);

        // Indicador de strum
        this.indicator = this.scene.add.graphics();
        this.indicator.fillStyle(0xffffff, 1);
        this.indicator.fillCircle(0, 0, this.isMobile ? 20 : 30);
        this.indicator.lineStyle(4, 0x6B46C1, 1);
        this.indicator.strokeCircle(0, 0, this.isMobile ? 20 : 30);
        this.indicator.setPosition(this.x, this.y);
        this.indicator.setAlpha(0);

        // Adicionar glow ao indicador
        this.indicatorGlow = this.scene.add.graphics();
        this.indicatorGlow.fillStyle(0x6B46C1, 0.3);
        this.indicatorGlow.fillCircle(0, 0, this.isMobile ? 35 : 50);
        this.indicatorGlow.setPosition(this.x, this.y);
        this.indicatorGlow.setAlpha(0);

        // Zona interativa
        this.strumZone = this.scene.add.rectangle(
            this.x,
            this.y,
            width,
            height,
            0x000000,
            0
        );
        this.strumZone.setInteractive({
            draggable: true,
            useHandCursor: !this.isMobile
        });

        this.strumZone.on('pointerdown', (pointer) => {
            this.startStrum(pointer);
        });

        this.strumZone.on('pointermove', (pointer) => {
            if (this.isStumming) {
                this.updateStrum(pointer);
            }
        });

        this.strumZone.on('pointerup', () => {
            this.stopStrum();
        });

        this.strumZone.on('pointerout', () => {
            if (!this.isMobile) {
                this.stopStrum();
            }
        });

        // Título
        const titleY = this.isVertical ?
            this.y - height / 2 - 40 :
            this.y - height / 2 + 30;

        const titleText = this.scene.add.text(this.x, titleY, 'STRUM', {
            fontSize: this.isMobile ? '28px' : '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#6B46C1',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animação pulsante no título
        this.scene.tweens.add({
            targets: titleText,
            scale: { from: 1, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Texto de instrução
        if (this.isMobile) {
            const instructionText = this.isVertical ?
                'Deslize horizontalmente' :
                'Deslize verticalmente';

            this.scene.add.text(
                this.x,
                titleY + 35,
                instructionText,
                {
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#cccccc',
                    fontStyle: 'italic'
                }
            ).setOrigin(0.5).setAlpha(0.7);
        }

        this.width = width;
        this.height = height;
    }

    createNoteGuides(width, height) {
        const noteCount = 8;
        const graphics = this.scene.add.graphics();

        graphics.lineStyle(1, 0x6B46C1, 0.3);

        for (let i = 0; i <= noteCount; i++) {
            if (this.isVertical) {
                const x = this.x - width / 2 + (width / noteCount) * i;
                graphics.lineBetween(
                    x,
                    this.y - height / 2 + 10,
                    x,
                    this.y + height / 2 - 10
                );
            } else {
                const y = this.y - height / 2 + (height / noteCount) * i;
                graphics.lineBetween(
                    this.x - width / 2 + 10,
                    y,
                    this.x + width / 2 - 10,
                    y
                );
            }
        }

        // Adicionar labels de notas
        const noteLabels = ['1', '2', '3', '4', '5', '6', '7', '8'];
        noteLabels.forEach((label, i) => {
            if (this.isVertical) {
                const x = this.x - width / 2 + (width / noteCount) * (i + 0.5);
                this.scene.add.text(x, this.y + height / 2 - 25, label, {
                    fontSize: '12px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#888888'
                }).setOrigin(0.5);
            } else {
                const y = this.y + height / 2 - (height / noteCount) * (i + 0.5);
                this.scene.add.text(this.x + width / 2 - 25, y, label, {
                    fontSize: '12px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#888888'
                }).setOrigin(0.5);
            }
        });
    }

    setChord(chord) {
        this.currentChord = chord;

        if (chord) {
            // Feedback visual ao selecionar acorde
            this.scene.tweens.add({
                targets: [this.indicator, this.indicatorGlow],
                alpha: { from: 0.5, to: 0 },
                scale: { from: 1.5, to: 1 },
                duration: 500,
                ease: 'Power2'
            });
        }
    }

    startStrum(pointer) {
        if (!this.currentChord) return;

        this.isStumming = true;

        this.scene.tweens.add({
            targets: [this.indicator, this.indicatorGlow],
            alpha: { indicator: 1, indicatorGlow: 0.6 },
            duration: 100
        });

        this.updateStrum(pointer);
    }

    updateStrum(pointer) {
        if (!this.currentChord) return;

        let normalizedPosition, noteIndex;

        if (this.isVertical) {
            // Modo horizontal (deslizar horizontalmente)
            const localX = pointer.x;
            const clampedX = Phaser.Math.Clamp(
                localX,
                this.x - this.width / 2 + 20,
                this.x + this.width / 2 - 20
            );

            this.indicator.setPosition(clampedX, this.y);
            this.indicatorGlow.setPosition(clampedX, this.y);

            normalizedPosition = (clampedX - (this.x - this.width / 2 + 20)) /
                (this.width - 40);
            noteIndex = Math.floor(normalizedPosition * 8);
        } else {
            // Modo vertical (deslizar verticalmente)
            const localY = pointer.y;
            const clampedY = Phaser.Math.Clamp(
                localY,
                this.y - this.height / 2 + 20,
                this.y + this.height / 2 - 20
            );

            this.indicator.setPosition(this.x, clampedY);
            this.indicatorGlow.setPosition(this.x, clampedY);

            normalizedPosition = (clampedY - (this.y - this.height / 2 + 20)) /
                (this.height - 40);
            noteIndex = Math.floor((1 - normalizedPosition) * 8);
        }

        // Tocar nota se mudou
        if (noteIndex !== this.lastNoteIndex && noteIndex >= 0 && noteIndex < 8) {
            this.lastNoteIndex = noteIndex;
            this.onStrum(noteIndex);

            // Feedback visual
            this.scene.tweens.add({
                targets: this.indicator,
                scale: { from: 1.5, to: 1 },
                duration: 150,
                ease: 'Back.easeOut'
            });

            this.scene.tweens.add({
                targets: this.indicatorGlow,
                scale: { from: 2, to: 1 },
                alpha: { from: 0.8, to: 0.6 },
                duration: 150
            });

            // Vibração em dispositivos mobile
            if (this.isMobile && navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    }

    stopStrum() {
        this.isStumming = false;
        this.lastNoteIndex = -1;

        this.scene.tweens.add({
            targets: [this.indicator, this.indicatorGlow],
            alpha: 0,
            scale: 0.8,
            duration: 300,
            ease: 'Power2'
        });
    }
}