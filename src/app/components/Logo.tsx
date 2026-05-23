import { motion } from "motion/react";

export function Logo({ className = "", size = 120 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 200 230"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Shield shape */}
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="200" y2="230">
          <stop offset="0%" stopColor="#0F1B3A" />
          <stop offset="100%" stopColor="#1A2D5C" />
        </linearGradient>
        <linearGradient id="roadGrad" x1="0" y1="80" x2="200" y2="150">
          <stop offset="0%" stopColor="#E63946" />
          <stop offset="50%" stopColor="#1D3557" />
          <stop offset="100%" stopColor="#0F1B3A" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield outline */}
      <motion.path
        d="M100 10 L180 40 L180 130 Q180 180 100 210 Q20 180 20 130 L20 40 Z"
        fill="url(#shieldGrad)"
        stroke="#E63946"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Sun */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="55" cy="70" r="16" fill="#F4A261" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1={55 + 20 * Math.cos((angle * Math.PI) / 180)}
            y1={70 + 20 * Math.sin((angle * Math.PI) / 180)}
            x2={55 + 26 * Math.cos((angle * Math.PI) / 180)}
            y2={70 + 26 * Math.sin((angle * Math.PI) / 180)}
            stroke="#F4A261"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
      </motion.g>

      {/* Road */}
      <path d="M30 100 L170 100 L100 190 Z" fill="#1D3557" />
      <path d="M50 100 L150 100 L100 170 Z" fill="#457B9D" opacity="0.6" />
      {/* Road center line */}
      <line x1="100" y1="100" x2="100" y2="180" stroke="#F1FAEE" strokeWidth="2" strokeDasharray="6 6" />

      {/* Location pin */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M145 55 C145 45 137 38 128 38 C119 38 111 45 111 55 C111 65 128 82 128 82 C128 82 145 65 145 55Z"
          fill="#E9C46A"
          stroke="#1D3557"
          strokeWidth="1.5"
        />
        <circle cx="128" cy="54" r="6" fill="#1D3557" />
        <motion.path
          d="M124 52 L128 56 L134 50"
          stroke="#1D3557"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
      </motion.g>

      {/* Book / open pages */}
      <path d="M60 115 L100 100 L100 165 L60 150 Z" fill="#F1FAEE" />
      <path d="M100 100 L140 115 L140 150 L100 165 Z" fill="#E8EEF2" />
      <path d="M60 115 L100 100 L140 115" stroke="#1D3557" strokeWidth="1.5" fill="none" />

      {/* Steering wheel */}
      <motion.g
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 135px" }}
      >
        <circle cx="100" cy="135" r="22" stroke="#1D3557" strokeWidth="3" fill="none" />
        <circle cx="100" cy="135" r="8" stroke="#1D3557" strokeWidth="2.5" fill="none" />
        <line x1="100" y1="113" x2="100" y2="127" stroke="#1D3557" strokeWidth="2.5" />
        <line x1="100" y1="143" x2="100" y2="157" stroke="#1D3557" strokeWidth="2.5" />
        <line x1="78" y1="135" x2="92" y2="135" stroke="#1D3557" strokeWidth="2.5" />
        <line x1="108" y1="135" x2="122" y2="135" stroke="#1D3557" strokeWidth="2.5" />
        {/* Center dot */}
        <circle cx="100" cy="135" r="3" fill="#1D3557" />
      </motion.g>

      {/* Bottom red accent */}
      <path d="M100 210 Q130 195 145 175 L100 190 L55 175 Q70 195 100 210Z" fill="#E63946" opacity="0.9" />
    </motion.svg>
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`flex flex-col items-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <motion.h1
        className="text-white text-3xl font-bold tracking-tight"
        style={{ fontFamily: "Poppins" }}
      >
        SmartDrive
      </motion.h1>
      <div className="flex items-center gap-3 mt-1">
        <motion.div
          className="h-[2px] w-8 bg-white/40 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <span
          className="text-[#E63946] text-lg font-extrabold tracking-[0.2em]"
          style={{ fontFamily: "Poppins" }}
        >
          NAIJA
        </span>
        <motion.div
          className="h-[2px] w-8 bg-white/40 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
