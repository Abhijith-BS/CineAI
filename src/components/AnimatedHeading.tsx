import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedHeadingProps {
  text?: string;
  className?: string;
  showShimmer?: boolean;
}

/**
 * Animated heading component for "Discover Movies with AI"
 * Features:
 * - Letter-by-letter stagger animation with higher color saturation
 * - Fade-in with upward movement and 3D rotation
 * - Gradient shimmer effect
 * - Smooth easing with expo.out
 */
export function AnimatedHeading({ 
  text = "Discover Movies with AI",
  className = "",
  showShimmer = true 
}: AnimatedHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (!headingRef.current) return;

    const heading = headingRef.current;
    const originalText = heading.textContent || text;
    heading.innerHTML = "";

    lettersRef.current = [];

    // Split text into words and create letter spans
    const words = originalText.split(" ");
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
        letterSpan.style.transform = "translateY(50px) scale(0.85) rotateX(-20deg)";
        letterSpan.style.transformOrigin = "center bottom";
        
        // Higher saturation colors - more vibrant
        letterSpan.style.color = "#fefae0";
        letterSpan.style.textShadow = "0 0 20px rgba(168, 85, 247, 0.3)";
        
        wordSpan.appendChild(letterSpan);
        lettersRef.current.push(letterSpan);
      });

      heading.appendChild(wordSpan);
    });

    // Animate each letter with stagger
    gsap.from(lettersRef.current, {
      opacity: 0,
      y: 50,
      scale: 0.85,
      rotationX: -20,
      duration: 0.8,
      ease: "expo.out",
      stagger: {
        amount: 1.5,
        from: "start",
      },
      delay: 0.2,
    });

    // Add shimmer overlay effect if enabled
    if (showShimmer && shimmerRef.current) {
      gsap.to(shimmerRef.current, {
        backgroundPosition: "200% 0%",
        duration: 4,
        ease: "none",
        repeat: -1,
        delay: 1.8,
      });
    }

    // Cleanup
    return () => {
      lettersRef.current.forEach((letter) => {
        gsap.killTweensOf(letter);
      });
      if (shimmerRef.current) {
        gsap.killTweensOf(shimmerRef.current);
      }
    };
  }, [text, showShimmer]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <h1
        ref={headingRef}
        className={`text-4xl md:text-6xl font-bold text-[#fefae0] leading-tight tracking-tight relative z-10 ${className}`}
        style={{
          textShadow: "0 0 40px rgba(168, 85, 247, 0.2)",
        }}
      >
        {text}
      </h1>
      
      {showShimmer && (
        <div
          ref={shimmerRef}
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.6) 45%, rgba(236, 72, 153, 0.6) 55%, transparent 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            mixBlendMode: "overlay",
            opacity: 0.7,
          }}
        >
          <h1 className={`text-4xl md:text-6xl font-bold text-transparent leading-tight tracking-tight ${className}`}>
            {text}
          </h1>
        </div>
      )}
    </div>
  );
}

