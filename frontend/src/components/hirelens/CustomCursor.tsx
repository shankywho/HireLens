import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * CustomCursor — Tactical OSINT Targeting Reticle
 * 
 * Behavior:
 * - Activates only on fine pointer devices (pointer: fine). Touch devices silently fall back to native cursor.
 * - Respects prefers-reduced-motion: reduce — if set, does not mount.
 * - Tracks exact mouse coordinates via translate3d with zero lag/inertia.
 * - Displays live X/Y coordinates in sub-radar emerald.
 * - Transitions to "TARGET LOCKED" reticle brackets & state on hover over interactive elements.
 */
export function CustomCursor() {
  const [active, setActive] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Media query checks
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const checkEligibility = () => {
      const isEligible = finePointerQuery.matches && !reducedMotionQuery.matches;
      setActive(isEligible);
      if (isEligible) {
        document.documentElement.classList.add("has-custom-cursor");
      } else {
        document.documentElement.classList.remove("has-custom-cursor");
      }
    };

    checkEligibility();

    // Listen for environmental/preference changes
    finePointerQuery.addEventListener("change", checkEligibility);
    reducedMotionQuery.addEventListener("change", checkEligibility);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      finePointerQuery.removeEventListener("change", checkEligibility);
      reducedMotionQuery.removeEventListener("change", checkEligibility);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const interactiveSelector =
      'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"]), label, summary, [data-interactive="true"], .clickable';

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (!visible) setVisible(true);
      setCoords({ x: Math.round(x), y: Math.round(y) });

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(interactiveSelector)) {
        setLocked(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(interactiveSelector)) {
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !related.closest(interactiveSelector)) {
          setLocked(false);
        }
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
      setLocked(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [active, visible]);

  if (!active || !isMounted) return null;

  const cursorContent = (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 999999,
        willChange: "transform",
        opacity: visible ? 1 : 0,
        transition: "opacity 120ms ease-out",
        mixBlendMode: "normal",
      }}
    >
      {/* Reticle crosshair centered at (0, 0) */}
      <div
        className="relative"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Horizontal thin line (~20px) */}
        <div
          className={`absolute left-1/2 top-1/2 h-[1.5px] -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
            locked
              ? "w-[24px] bg-legit-bright shadow-[0_0_8px_var(--legit-bright)]"
              : "w-[20px] bg-amber shadow-[0_0_0_1px_rgba(0,0,0,1)]"
          }`}
        />

        {/* Vertical thin line (~20px) */}
        <div
          className={`absolute left-1/2 top-1/2 w-[1.5px] -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
            locked
              ? "h-[24px] bg-legit-bright shadow-[0_0_8px_var(--legit-bright)]"
              : "h-[20px] bg-amber shadow-[0_0_0_1px_rgba(0,0,0,1)]"
          }`}
        />

        {/* Center reticle point */}
        <div
          className={`absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-100 ${
            locked ? "bg-legit-bright" : "bg-amber shadow-[0_0_0_1px_rgba(0,0,0,1)]"
          }`}
        />

        {/* Tactical bracket lock box when hovering interactive elements */}
        {locked && (
          <div className="absolute left-1/2 top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 animate-pulse border border-legit-bright/90 bg-legit/10 shadow-[0_0_12px_color-mix(in_oklab,var(--legit-bright)_40%,transparent)]" />
        )}
      </div>

      {/* Live Coordinate HUD Badge */}
      <div
        className={`absolute left-4 top-4 flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] hl-mono uppercase tracking-[0.14em] whitespace-nowrap transition-colors duration-100 ${
          locked
            ? "border border-legit-bright bg-ink text-legit-bright shadow-[0_0_10px_color-mix(in_oklab,var(--legit-bright)_35%,transparent)] shadow-[2px_2px_0px_var(--ink)]"
            : "font-bold text-amber border border-ink bg-ink/90 shadow-[2px_2px_0px_var(--ink)]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            locked ? "bg-legit-bright animate-ping" : "bg-amber"
          }`}
        />
        <span>
          {locked ? "LOCK // " : ""}X:{coords.x} Y:{coords.y}
        </span>
      </div>
    </div>
  );

  return createPortal(cursorContent, document.body);
}
