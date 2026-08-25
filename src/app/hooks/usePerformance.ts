import { useEffect, useRef, useCallback, useState } from 'react';

// Intersection Observer hook for lazy loading/animations
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [options]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Lazy load images with intersection observer
export function useLazyImage(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
      }
    }, { rootMargin: '100px' });

    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [shouldLoad, src]);

  return { imgRef, isLoaded, shouldLoad };
}

// RAF-based smooth animation (GPU optimized)
export function useSmoothAnimation(
  duration: number = 300,
  easing: (t: number) => number = t => t
) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const animate = useCallback((toValue: number) => {
    startTimeRef.current = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current!;
      const t = Math.min(elapsed / duration, 1);
      const eased = easing(t);
      
      setProgress(eased * toValue);
      
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    
    rafRef.current = requestAnimationFrame(step);
  }, [duration, easing]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { progress, animate };
}

// Debounced resize handler
export function useDebouncedResize(delay: number = 250) {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [delay]);

  return size;
}

// Visibility change detection (pause animations when tab hidden)
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// Throttled scroll handler for performance
export function useThrottledScroll(throttleMs: number = 16) {
  const [scrollY, setScrollY] = useState(0);
  const lastScrollRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      lastScrollRef.current = window.scrollY;

      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          setScrollY(lastScrollRef.current);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [throttleMs]);

  return scrollY;
}

// Media query hook for responsive behavior
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Device pixel ratio for retina optimization
export function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(window.devicePixelRatio);

  useEffect(() => {
    const media = window.matchMedia(`(-webkit-min-device-pixel-ratio: ${dpr})`);
    const listener = () => setDpr(window.devicePixelRatio);
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [dpr]);

  return dpr;
}

// Preload critical resources
export function usePreloadResources(resources: string[]) {
  useEffect(() => {
    resources.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = src.endsWith('.css') ? 'style' : src.endsWith('.js') ? 'script' : 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [resources]);
}

// Performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
  });

  useEffect(() => {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      setMetrics(prev => ({ ...prev, cls: clsValue }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return metrics;
}

// Easing functions for animations
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};
