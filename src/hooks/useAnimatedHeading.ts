import { useEffect, useRef } from "react";
import gsap from "gsap";

interface UseAnimatedHeadingOptions {
  /**
   * Delay before animation starts (in seconds)
   * Default: 0.2
   */
  delay?: number;
  
  /**
   * Duration of the animation (in seconds)
   * Default: 0.8
   */
  duration?: number;
  
  /**
   * Easing function to use
   * Default: "expo.out"
   * Options: "power4.out", "expo.out", "power2.out", "power1.out", etc.
   */
  ease?: string;
  
  /**
   * Stagger amount for letters (in seconds)
   * Default: 1.2
   */
  staggerAmount?: number;
  
  /**
   * Starting Y position offset (in pixels)
   * Default: 40
   */
  startY?: number;
  
  /**
   * Starting scale value
   * Default: 0.8
   */
  startScale?: number;
  
  /**
   * 3D rotation on X axis (in degrees)
   * Default: -15
   */
  rotationX?: number;
  
  /**
   * Whether to show shimmer effect
   * Default: true
   */
  showShimmer?: boolean;
}

/**
 * Custom hook to animate headings with GSAP
 * 
 * Usage:
 * ```tsx
 * const headingRef = useAnimatedHeading({
 *   delay: 0.3,
 *   duration: 1,
 *   ease: "power4.out",
 *   showShimmer: true,
 * });
 * 
 * <h1 ref={headingRef}>Your Heading Text</h1>
 * ```
 * 
 * Customizes the same animation style as "Discover Movies with AI"
 * with higher color saturation gradients.
 */
export function useAnimatedHeading(options: UseAnimatedHeadingOptions = {}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shimmerRef = useRef<HTMLDivElement | null>(null);

  const {
    delay = 0.2,
    duration = 0.8,
    ease = "expo.out",
    staggerAmount = 1.2,
    startY = 40,
    startScale = 0.8,
    rotationX = -15,
    showShimmer = true,
  } = options;

  useEffect(() => {
    if (!headingRef.current) return;

    const heading = headingRef.current;
    const originalText = heading.textContent || "";
    heading.innerHTML = "";

    // Split text into words and create letter spans
    const words = originalText.split(" ");
    const lettersRefs: HTMLSpanElement[] = [];

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.marginRight = "0.5em";

      // Split each word into letters
      word.split("").forEach((letter, letterIndex) => {
        const letterSpan = document.createElement("span");
        letterSpan.textContent = letter === " " ? "\u00A0" : letter;
        letterSpan.style.display = "inline-block";
        letterSpan.style.opacity = "0";
        letterSpan.style.transform = `translateY(${startY}px) scale(${startScale})`;
        letterSpan.style.transformOrigin = "center bottom";
        
        wordSpan.appendChild(letterSpan);
        lettersRefs.push(letterSpan);
      });

      heading.appendChild(wordSpan);
    });

    // Animate each letter with stagger
    gsap.from(lettersRefs, {
      opacity: 0,
      y: startY,
      scale: startScale,
      rotationX: rotationX,
      duration: duration,
      ease: ease as any,
      stagger: {
        amount: staggerAmount,
        from: "start",
      },
      delay: delay,
    });

    // Create shimmer effect if enabled
    if (showShimmer) {
      // Find or create shimmer overlay
      const shimmerContainer = heading.parentElement?.querySelector(
        '[data-shimmer-overlay]'
      ) as HTMLDivElement | null;

      if (shimmerContainer) {
        shimmerRef.current = shimmerContainer;
        gsap.to(shimmerContainer, {
          backgroundPosition: "200% 0%",
          duration: 3,
          ease: "none",
          repeat: -1,
          delay: delay + staggerAmount + 0.3,
        });
      }
    }

    // Cleanup function
    return () => {
      lettersRefs.forEach((letter) => {
        gsap.killTweensOf(letter);
      });
      if (shimmerRef.current) {
        gsap.killTweensOf(shimmerRef.current);
      }
    };
  }, [delay, duration, ease, staggerAmount, startY, startScale, rotationX, showShimmer]);

  return headingRef;
}

/**
 * AnimatedHeadingWrapper Component
 * 
 * Wraps a heading element and applies GSAP animations automatically.
 * Use this if you prefer component-based approach over the hook.
 */
export function AnimatedHeadingWrapper({
  children,
  className = "",
  shimmerClassName = "",
  ...options
}: {
  children: string;
  className?: string;
  shimmerClassName?: string;
} & UseAnimatedHeadingOptions) {
  const headingRef = useAnimatedHeading(options);

  return (
    <div className="relative inline-block">
      <h1
        ref={headingRef}
        className={`font-bold text-[#fefae0] leading-tight tracking-tight relative z-10 ${className}`}
        style={{
          textShadow: "0 0 40px rgba(168, 85, 247, 0.2)",
        }}
      >
        {children}
      </h1>
      
      {options.showShimmer !== false && (
        <div
          data-shimmer-overlay
          className={`absolute inset-0 pointer-events-none z-20 ${shimmerClassName}`}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.7) 45%, rgba(236, 72, 153, 0.7) 55%, transparent 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            mixBlendMode: "overlay",
            opacity: 0.8,
          }}
        >
          <h1 className={`font-bold text-transparent leading-tight tracking-tight ${className}`}>
            {children}
          </h1>
        </div>
      )}
    </div>
  );
}

