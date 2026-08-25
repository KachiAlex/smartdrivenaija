import type { ReactNode } from "react";
import { useMobile, usePullToRefresh } from "../hooks/useMobile";
import { cn } from "../lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  hasHeader?: boolean;
  hasBottomNav?: boolean;
  scrollable?: boolean;
  keyboardAware?: boolean;
}

export function MobileLayout({
  children,
  className,
  hasHeader = false,
  hasBottomNav = true,
  scrollable = true,
  keyboardAware = true,
}: MobileLayoutProps) {
  const { isMobile, safeAreaTop, safeAreaBottom } = useMobile();

  return (
    <div
      className={cn(
        "relative w-full",
        isMobile ? "mobile-full-height" : "min-h-screen",
        className
      )}
      style={{
        paddingTop: hasHeader ? undefined : safeAreaTop,
      }}
    >
      <div
        className={cn(
          "w-full h-full",
          scrollable && "overflow-y-auto ios-scroll",
          hasBottomNav && "has-bottom-nav",
          keyboardAware && "keyboard-aware"
        )}
        style={{
          paddingBottom: hasBottomNav ? undefined : safeAreaBottom,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Responsive Container
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ResponsiveContainer({
  children,
  className,
  size = "lg",
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 mobile-safe-x",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}

// Touch-friendly Button
interface TouchButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function TouchButton({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: TouchButtonProps) {
  const variantClasses = {
    primary: "bg-primary text-white active:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground active:bg-secondary/90",
    ghost: "hover:bg-accent active:bg-accent/50",
    danger: "bg-red-500 text-white active:bg-red-600",
  };

  const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base touch-target",
    lg: "h-14 px-8 text-lg touch-target",
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "focus-visible-ring touch-active no-select",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Pull to Refresh Wrapper
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
}: PullToRefreshProps) {
  const { onTouchStart, onTouchMove, onTouchEnd, pullDistance, refreshing } =
    usePullToRefresh(onRefresh);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={cn(
          "pull-indicator",
          pullDistance > 0 && "pulling",
          refreshing && "animate-spin"
        )}
        style={{
          transform: `translateX(-50%) translateY(${Math.min(
            pullDistance / 2,
            20
          )}px)`,
        }}
      >
        {refreshing ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="text-primary">↓</div>
        )}
      </div>
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance / 3, 40)}px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Bottom Sheet
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: ("top" | "middle" | "bottom")[];
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}
      <div className={cn("sheet", isOpen && "open")}>
        <div className="sheet-handle" />
        {title && (
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}

// Horizontal Scroll Container
interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  showScrollbar?: boolean;
}

export function HorizontalScroll({
  children,
  className,
  showScrollbar = false,
}: HorizontalScrollProps) {
  return (
    <div
      className={cn(
        "horizontal-scroll",
        !showScrollbar && "hide-scrollbar",
        className
      )}
    >
      {children}
    </div>
  );
}

// Safe Area Spacer
export function SafeAreaSpacer({
  position = "top",
}: {
  position?: "top" | "bottom";
}) {
  return (
    <div
      className={cn(
        "w-full shrink-0",
        position === "top" ? "status-bar-spacer" : "pb-safe"
      )}
    />
  );
}

// Sticky Header
interface StickyHeaderProps {
  children: ReactNode;
  className?: string;
}

export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <header className={cn("sticky-header safe-top safe-area-x", className)}>
      {children}
    </header>
  );
}

// Floating Action Button
interface FABProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
}

export function FAB({ onClick, icon, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fab flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-primary text-white shadow-lg",
        "hover:bg-primary/90 active:scale-95 transition-all",
        "focus-visible-ring"
      )}
      aria-label={label}
    >
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}

