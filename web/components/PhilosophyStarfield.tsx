'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  connections: number[];
}

const PHILOSOPHY_COLORS = {
  Guardian: '#3b82f6',   // Blue
  Architect: '#10b981',   // Green
  Oracle: '#f59e0b',     // Amber
  Synapse: '#8b5cf6',    // Purple
  default: '#6b7280',    // Gray
};

export default function PhilosophyStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particleCount = 80;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const archetypes = Object.keys(PHILOSOPHY_COLORS).filter(k => k !== 'default');
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        z: Math.random() * 1000 - 500,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        color: PHILOSOPHY_COLORS[archetype as keyof typeof PHILOSOPHY_COLORS],
        connections: [],
      });
    }
    particlesRef.current = particles;

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      // Skip every other frame for performance
      if (frameCount % 2 !== 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(3, 7, 18, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        if (particle.z < -500) particle.z = 500;
        if (particle.z > 500) particle.z = -500;

        // Calculate 3D projection
        const scale = 1000 / (1000 + particle.z);
        const x2d = particle.x * scale + (width * (1 - scale)) / 2;
        const y2d = particle.y * scale + (height * (1 - scale)) / 2;
        const size2d = particle.size * scale;

        // Draw particle glow
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size2d * 3);
        gradient.addColorStop(0, particle.color + '80');
        gradient.addColorStop(0.5, particle.color + '20');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size2d * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw particle core
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size2d, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections (only check every 5th particle for performance)
        if (i % 5 === 0) {
          particles.slice(i + 1).forEach((other, j) => {
            if (j % 3 !== 0) return; // Skip some connections
            
            const otherScale = 1000 / (1000 + other.z);
            const otherX2d = other.x * otherScale + (width * (1 - otherScale)) / 2;
            const otherY2d = other.y * otherScale + (height * (1 - otherScale)) / 2;

            const dx = x2d - otherX2d;
            const dy = y2d - otherY2d;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              const opacity = (1 - distance / 100) * 0.3;
              ctx.strokeStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
              ctx.lineWidth = 0.5 * scale;
              ctx.beginPath();
              ctx.moveTo(x2d, y2d);
              ctx.lineTo(otherX2d, otherY2d);
              ctx.stroke();
            }
          });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: 'linear-gradient(to bottom, #030712, #0f172a)' }}
    />
  );
}