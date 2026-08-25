/// <reference types="vite/client" />

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.csv" {
  const src: string;
  export default src;
}

declare module "canvas-confetti" {
  const confetti: {
    (options?: {
      particleCount?: number;
      spread?: number;
      origin?: { x?: number; y?: number };
      colors?: string[];
      startVelocity?: number;
      ticks?: number;
      gravity?: number;
      decay?: number;
      drift?: number;
      flat?: boolean;
      scalar?: number;
      angle?: number;
      emoji?: string[];
      shapes?: string[];
    }): void;
  };
  export default confetti;
}
