import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";

interface PageTransitionProps {
  children: ReactNode;
  pageKey: string | number;
  className?: string;
}

/**
 * PageTransition Component
 * 
 * Wraps page content to provide smooth GSAP transitions between pages.
 * Automatically handles fade out/in animations when pageKey changes.
 * 
 * GSAP Timing Customization:
 * - transitionOutDuration: Duration of fade out (default: 0.25)
 * - transitionInDuration: Duration of fade in (default: 0.5)
 * - transitionOutEasing: Easing for fade out (default: "power2.in")
 * - transitionInEasing: Easing for fade in (default: "power2.out")
 */
export function PageTransition({ 
  children, 
  pageKey, 
  className = "" 
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousKeyRef = useRef<string | number | undefined>(pageKey);

  // GSAP Timing Configuration - Customize these values as needed
  // Smooth cinematic page transitions matching the landing page style
  const GSAP_CONFIG = {
    transitionOutDuration: 0.3,
    transitionInDuration: 0.6,
    transitionOutEasing: "power2.in" as const,
    transitionInEasing: "power4.out" as const, // Match landing page easing
  };

  useEffect(() => {
    // Wait for next tick to ensure element is mounted
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        console.log("[PageTransition] Animating container element:", containerRef.current);
        const isPageChange = previousKeyRef.current !== pageKey;
        
        if (isPageChange && previousKeyRef.current !== undefined) {
          // Page change: fade out then fade in
          console.log("[PageTransition] Page change from", previousKeyRef.current, "to", pageKey);
          const tl = gsap.timeline();
          
          tl.to(containerRef.current, {
            opacity: 0,
            y: -10,
            duration: GSAP_CONFIG.transitionOutDuration,
            ease: GSAP_CONFIG.transitionOutEasing,
          })
          .set(containerRef.current, {
            clearProps: "all",
          })
          .from(containerRef.current, {
            opacity: 0,
            y: 30,
            scale: 0.98, // Subtle scale effect
            duration: GSAP_CONFIG.transitionInDuration,
            ease: GSAP_CONFIG.transitionInEasing,
          });
        } else {
          // Initial render: fade in with slight scale for cinematic effect
          console.log("[PageTransition] Initial render animation");
          gsap.from(containerRef.current, {
            opacity: 0,
            y: 30,
            scale: 0.98, // Subtle scale effect like landing page
            duration: GSAP_CONFIG.transitionInDuration,
            ease: GSAP_CONFIG.transitionInEasing,
          });
        }

        previousKeyRef.current = pageKey;
      } else {
        console.warn("[PageTransition] containerRef.current is null");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pageKey]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ opacity: 1 }} // Ensure content is visible initially, GSAP will animate
    >
      {children}
    </div>
  );
}

