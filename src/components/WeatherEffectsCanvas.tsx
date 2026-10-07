import React, { useEffect, useRef } from 'react';
import { WeatherEffectType } from '../types';

interface WeatherEffectsCanvasProps {
  effect: WeatherEffectType;
  psiLevel?: number;
}

export const WeatherEffectsCanvas: React.FC<WeatherEffectsCanvasProps> = ({ effect, psiLevel = 45 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine actual effect if 'auto'
  const resolvedEffect: 'sunny' | 'hazy' | 'rain' | 'overcast' | 'night' = React.useMemo(() => {
    if (effect !== 'auto') return effect;
    if (psiLevel > 100) return 'hazy';
    if (psiLevel > 70) return 'overcast';
    return 'sunny';
  }, [effect, psiLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle classes
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    interface HazeParticle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }

    interface SunBeamParticle {
      x: number;
      y: number;
      radius: number;
      pulse: number;
      speed: number;
    }

    // Init particles
    const rainDrops: RainDrop[] = [];
    const rainCount = Math.min(120, Math.floor(width / 10));
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 14 + Math.random() * 10,
        opacity: 0.2 + Math.random() * 0.4
      });
    }

    const hazeParticles: HazeParticle[] = [];
    const hazeCount = Math.min(80, Math.floor(width / 15));
    for (let i = 0; i < hazeCount; i++) {
      hazeParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1.5 + Math.random() * 3.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: 0.15 + Math.random() * 0.35
      });
    }

    const sunBeams: SunBeamParticle[] = [];
    const sunCount = 35;
    for (let i = 0; i < sunCount; i++) {
      sunBeams.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7),
        radius: 2 + Math.random() * 4,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      if (resolvedEffect === 'rain') {
        // Soft dark blue ambient wash
        ctx.fillStyle = 'rgba(10, 24, 40, 0.22)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(186, 215, 255, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const drop of rainDrops) {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          drop.y += drop.speed;
          drop.x -= 1.2;
          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 50);
          }
        }
        ctx.stroke();

        // Puddle splash ripples at bottom
        for (let i = 0; i < 4; i++) {
          const splashX = (Math.sin(time + i * 2) * 0.5 + 0.5) * width;
          const splashY = height - 20 - (i % 2) * 15;
          const radius = (Math.sin(time * 3 + i) * 0.5 + 0.5) * 18;
          ctx.strokeStyle = `rgba(186, 215, 255, ${0.15 - radius * 0.007})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(splashX, splashY, radius * 1.5, radius * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (resolvedEffect === 'hazy') {
        // Amber / ochre smog veil
        const hazeGrad = ctx.createLinearGradient(0, 0, 0, height);
        hazeGrad.addColorStop(0, 'rgba(194, 114, 42, 0.18)');
        hazeGrad.addColorStop(0.5, 'rgba(168, 98, 35, 0.12)');
        hazeGrad.addColorStop(1, 'rgba(70, 50, 30, 0.22)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, 0, width, height);

        // Smog particulate dust
        for (const p of hazeParticles) {
          ctx.fillStyle = `rgba(240, 185, 120, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }
      } else if (resolvedEffect === 'sunny') {
        // Golden sunlight glow from top-right
        const sunGrad = ctx.createRadialGradient(width * 0.85, 40, 20, width * 0.85, 40, width * 0.75);
        sunGrad.addColorStop(0, 'rgba(255, 214, 110, 0.20)');
        sunGrad.addColorStop(0.4, 'rgba(255, 179, 71, 0.08)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, width, height);

        // Floating sunbeam motes
        for (const s of sunBeams) {
          s.pulse += s.speed;
          const currentAlpha = 0.2 + Math.sin(s.pulse) * 0.25;
          ctx.fillStyle = `rgba(255, 240, 190, ${Math.max(0.05, currentAlpha)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (resolvedEffect === 'overcast') {
        // Soft cool grey cloud mist
        const cloudGrad = ctx.createLinearGradient(0, 0, 0, height);
        cloudGrad.addColorStop(0, 'rgba(100, 116, 139, 0.22)');
        cloudGrad.addColorStop(0.6, 'rgba(51, 65, 85, 0.15)');
        cloudGrad.addColorStop(1, 'rgba(15, 23, 42, 0.20)');
        ctx.fillStyle = cloudGrad;
        ctx.fillRect(0, 0, width, height);

        // Drifting cloud layers
        ctx.fillStyle = 'rgba(148, 163, 184, 0.04)';
        for (let i = 0; i < 3; i++) {
          const cloudX = ((time * 15 * (i + 1) + i * 300) % (width + 400)) - 200;
          const cloudY = 60 + i * 90;
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, 120, 0, Math.PI * 2);
          ctx.arc(cloudX + 90, cloudY - 20, 140, 0, Math.PI * 2);
          ctx.arc(cloudX + 180, cloudY + 10, 110, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (resolvedEffect === 'night') {
        // Deep midnight gradient with subtle stars
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
        nightGrad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
        nightGrad.addColorStop(1, 'rgba(2, 6, 23, 0.45)');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);

        // Twinkling stars
        for (let i = 0; i < 40; i++) {
          const starX = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
          const starY = (Math.cos(i * 678.9) * 0.5 + 0.5) * (height * 0.6);
          const twinkle = Math.sin(time * 2 + i) * 0.4 + 0.5;
          ctx.fillStyle = `rgba(226, 232, 240, ${twinkle * 0.7})`;
          ctx.fillRect(starX, starY, 1.5, 1.5);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedEffect]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
