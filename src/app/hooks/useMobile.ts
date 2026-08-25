import { useState, useEffect, useCallback } from 'react';

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  keyboardOpen: boolean;
  touchSupported: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'web';
}

export function useMobile(): MobileState {
  const [state, setState] = useState<MobileState>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: false,
    isPortrait: true,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    keyboardOpen: false,
    touchSupported: 'ontouchstart' in window,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true,
    platform: /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 
              /Android/.test(navigator.userAgent) ? 'android' : 'web',
  }));

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isLandscape = width > height;
      const isPortrait = width <= height;

      // Calculate safe area insets
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');

      // Detect keyboard (viewport height significantly smaller than screen height)
      const keyboardOpen = height < screen.height * 0.75;

      setState(prev => ({
        ...prev,
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
        screenWidth: width,
        screenHeight: height,
        safeAreaTop,
        safeAreaBottom,
        keyboardOpen,
      }));
    };

    updateState();
    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);

    // Handle visual viewport changes (keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateState);
    }

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateState);
      }
    };
  }, []);

  return state;
}

// Hook for swipe gestures
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold: number = 50
) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > threshold) {
      if (distanceX > 0 && onSwipeLeft) onSwipeLeft();
      else if (distanceX < 0 && onSwipeRight) onSwipeRight();
    } else if (!isHorizontalSwipe && Math.abs(distanceY) > threshold) {
      if (distanceY > 0 && onSwipeUp) onSwipeUp();
      else if (distanceY < 0 && onSwipeDown) onSwipeDown();
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Hook for pull-to-refresh
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useState<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY[0] = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [startY]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    const distance = Math.max(0, y - startY[0]);
    setPullDistance(Math.min(distance, 150));
    
    if (distance > 0) {
      e.preventDefault();
    }
  }, [isPulling, startY]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance > 80 && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    pullDistance,
    refreshing,
  };
}

// Hook for bottom sheet/drawer
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState<'top' | 'middle' | 'bottom'>('bottom');

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const snapTo = useCallback((point: 'top' | 'middle' | 'bottom') => {
    setSnapPoint(point);
    setIsOpen(point !== 'bottom');
  }, []);

  return { isOpen, snapPoint, open, close, toggle, snapTo };
}
