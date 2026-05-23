import { motion } from "motion/react";

interface ParticleFieldProps {
  count?: number;
  colors?: string[];
  className?: string;
}

export function ParticleField({
  count = 12,
  colors = ["#818CF8", "#F59E0B", "#22D3EE", "#EC4899"],
  className = "",
}: ParticleFieldProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: Math.random() * 6 + 3,
    color: colors[i % colors.length],
    duration: Math.random() * 4 + 4,
    delay: Math.random() * -5,
    opacity: Math.random() * 0.4 + 0.2,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            filter: `blur(${p.size * 0.3}px)`,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.6, p.opacity * 1.3, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
