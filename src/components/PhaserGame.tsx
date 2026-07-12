'use client';

import React, { useEffect, useRef } from 'react';
import type PhaserType from 'phaser';
import { useGameStore } from '../store/useGameStore';
import { THEME_DETAILS } from '../audio/AudioManager';

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let cancelled = false;

    // Dynamically import Phaser to prevent SSR issues in Next.js
    import('phaser').then((Phaser) => {
      if (cancelled || !containerRef.current) return;

      class VisualizerScene extends Phaser.Scene {
        private graphics!: Phaser.GameObjects.Graphics;
        private themeColor: string = '#08f7fe';

        constructor() {
          super({ key: 'VisualizerScene' });
        }

        create() {
          this.graphics = this.add.graphics();
          this.updateThemeColor();
          
          // Handle window resizing
          this.scale.on('resize', (gameSize: PhaserType.Structs.Size) => {
            this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
          });
        }

        updateThemeColor() {
          const theme = useGameStore.getState().theme;
          const details = THEME_DETAILS[theme];
          if (details) {
            this.themeColor = details.colors.effects || '#08f7fe';
          }
        }

        update(time: number) {
          this.graphics.clear();
          this.updateThemeColor();

          const width = this.scale.width;
          const height = this.scale.height;
          const numSlots = 11;
          const slotWidth = width / numSlots;
          const { channels, theme } = useGameStore.getState();

          // Draw the background music grid lines
          const gridColor = Phaser.Display.Color.HexStringToColor(this.themeColor).color;
          this.graphics.lineStyle(1, gridColor, 0.05);
          for (let i = 1; i < numSlots; i++) {
            const x = i * slotWidth;
            this.graphics.lineBetween(x, 0, x, height);
          }

          // Draw individual channel frequency waveforms
          channels.forEach((ch, idx) => {
            const slotX = idx * slotWidth + slotWidth / 2;
            const baseY = height * 0.65; // aligns under avatar torso

            if (ch.assignedLoop && !ch.isMuted && !ch.isCueing) {
              const amp = ch.amplitude || 0.0;
              const color = Phaser.Display.Color.HexStringToColor(THEME_DETAILS[theme].colors[ch.assignedLoop.category] || '#fff').color;
              
              // Local glowing wave under the avatar
              this.graphics.lineStyle(2, color, 0.75);
              this.graphics.fillStyle(color, 0.07);

              this.graphics.beginPath();
              
              const segments = 12;
              const halfWidth = slotWidth * 0.45;
              
              for (let s = 0; s <= segments; s++) {
                const ratio = s / segments;
                const currX = slotX - halfWidth + ratio * (halfWidth * 2);
                
                // Sine wave modulated by amplitude
                const waveOffset = Math.sin(time * 0.015 + ratio * Math.PI * 4 + idx) * (amp * 28);
                const currY = baseY - waveOffset;

                if (s === 0) {
                  this.graphics.moveTo(currX, currY);
                } else {
                  this.graphics.lineTo(currX, currY);
                }
              }
              this.graphics.strokePath();

              // Draw neon pulsing dot at the center peak
              const peakOffset = Math.sin(time * 0.015 + Math.PI * 2 + idx) * (amp * 28);
              this.graphics.fillStyle(color, 0.8);
              this.graphics.fillCircle(slotX, baseY - peakOffset, 4 + amp * 6);
            } else if (ch.isCueing) {
              // Glowing cueing rings pulsing in Phaser
              const color = Phaser.Display.Color.HexStringToColor(THEME_DETAILS[theme].colors[ch.assignedLoop?.category || 'beats']).color;
              this.graphics.lineStyle(1.5, color, 0.4 + Math.sin(time * 0.01) * 0.3);
              const pulseRadius = slotWidth * 0.25 + Math.sin(time * 0.01) * 12;
              this.graphics.strokeCircle(slotX, baseY, pulseRadius);
            }
          });

          // Draw global flowing audio wave across the stage bottom
          this.graphics.lineStyle(2.5, gridColor, 0.4);
          this.graphics.beginPath();
          for (let x = 0; x <= width; x += 10) {
            // Master amplitude from average of all channels
            const avgAmp = channels.reduce((sum, ch) => sum + (ch.assignedLoop && !ch.isMuted && !ch.isCueing ? ch.amplitude : 0), 0) / 11;
            const globalWave = Math.sin(x * 0.008 + time * 0.005) * (10 + avgAmp * 80);
            const y = height * 0.85 + globalWave;

            if (x === 0) {
              this.graphics.moveTo(x, y);
            } else {
              this.graphics.lineTo(x, y);
            }
          }
          this.graphics.strokePath();
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: containerRef.current?.clientWidth || 1200,
        height: containerRef.current?.clientHeight || 450,
        parent: containerRef.current!,
        transparent: true,
        physics: { default: 'none' },
        scene: [VisualizerScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      cancelled = true;
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      style={{ mixBlendMode: 'screen' }} 
    />
  );
}
