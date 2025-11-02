import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { AnimatedLogo } from "./AnimatedLogo";

interface BaseLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  onLogoClick?: () => void;
  currentPage?: string;
}

/**
 * BaseLayout Component
 * 
 * Provides consistent styling and animations across all pages:
 * - Dark background (#0d0d0d)
 * - Fixed animated "CineAI" logo at top left
 * - Smooth page transitions using GSAP
 * - Animated page content entrance
 * 
 * GSAP Timing Customization:
 * - headerAnimationDelay: Delay before header animates (default: 0)
 * - contentAnimationDelay: Delay before content animates (default: 0.3)
 * - pageTransitionDuration: Duration of page fade out/in (default: 0.5)
 * - contentAnimationDuration: Duration of content entrance (default: 1)
 * - Easing: Use "power4.out", "expo.out", "power2.out", etc.
 */
export function BaseLayout({ 
  children, 
  showHeader = true,
  onLogoClick,
  currentPage 
}: BaseLayoutProps) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef<string | undefined>(currentPage);

  // GSAP Timing Configuration - Customize these values as needed
  // These match the cinematic landing page animations
  const GSAP_CONFIG = {
    headerAnimationDelay: 0,
    contentAnimationDelay: 0.2, // Faster initial load
    pageTransitionDuration: 0.5,
    contentAnimationDuration: 0.8, // Smooth but not too slow
    headerEasing: "power4.out" as const,
    contentEasing: "power4.out" as const,
    transitionEasing: "power2.inOut" as const,
  };

  // Animate header entrance on mount - runs after mount
  useEffect(() => {
    // Wait for next tick to ensure header is mounted
    const timeoutId = setTimeout(() => {
      if (showHeader && headerRef.current) {
        console.log("[BaseLayout] Animating header element:", headerRef.current);
        // Animate header with fade-in and downward motion
        gsap.from(headerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.8,
          ease: GSAP_CONFIG.headerEasing,
          delay: GSAP_CONFIG.headerAnimationDelay,
        });
      } else {
        console.log("[BaseLayout] Header not shown or not mounted yet");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [showHeader]);

  // Handle page transitions and content animation - runs after mount
  useEffect(() => {
    // Wait for next tick to ensure elements are mounted
    const timeoutId = setTimeout(() => {
      if (contentRef.current) {
        console.log("[BaseLayout] Animating content element:", contentRef.current);
        const isPageChange = previousPageRef.current !== currentPage && previousPageRef.current !== undefined;
        
        if (isPageChange && previousPageRef.current) {
          // Page transition: fade out old content, then fade in new content
          console.log("[BaseLayout] Page transition from", previousPageRef.current, "to", currentPage);
          const tl = gsap.timeline();
          
          // Fade out old content
          tl.to(contentRef.current, {
            opacity: 0,
            y: 20,
            duration: GSAP_CONFIG.pageTransitionDuration / 2,
            ease: GSAP_CONFIG.transitionEasing,
          })
          // Fade in new content
          .fromTo(
            contentRef.current,
            {
              opacity: 0,
              y: 30,
            },
            {
              opacity: 1,
              y: 0,
              duration: GSAP_CONFIG.contentAnimationDuration,
              ease: GSAP_CONFIG.contentEasing,
              delay: GSAP_CONFIG.contentAnimationDelay,
            }
          );
        } else {
          // Initial page load: animate content entrance with cinematic effect
          console.log("[BaseLayout] Initial page load animation");
          // Set initial state and animate in with slight scale
          gsap.fromTo(
            contentRef.current,
            {
              opacity: 0,
              y: 30,
              scale: 0.98, // Subtle scale effect matching landing page
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: GSAP_CONFIG.contentAnimationDuration,
              ease: GSAP_CONFIG.contentEasing,
              delay: GSAP_CONFIG.contentAnimationDelay,
            }
          );
        }

        // Update previous page reference
        previousPageRef.current = currentPage;
      } else {
        console.warn("[BaseLayout] contentRef.current is null - content not mounted yet");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [currentPage]);

  return (
    <div 
      ref={layoutRef}
      className="min-h-screen bg-[#0d0d0d] relative overflow-x-hidden"
    >
      {/* Gradient background overlay matching landing page style */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)",
        }}
      />

      {/* Fixed Header with Animated Logo */}
      {showHeader && (
        <header
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10"
        >
          <div className="container mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center">
              <AnimatedLogo
                className="text-2xl"
                onClick={onLogoClick}
              />
              {/* Additional navigation can be added here via children or props */}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area with Padding for Fixed Header */}
      <main 
        ref={contentRef}
        className={`relative z-10 ${showHeader ? "pt-16" : ""}`}
        style={{ opacity: 1 }} // Ensure content is visible initially
      >
        {children}
      </main>
    </div>
  );
}

