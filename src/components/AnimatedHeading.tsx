import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedHeadingProps {
  text?: string;
  className?: string;
}

/**
 * Animated heading component for "Discover Movies with AI"
 * Features:
 * - Simple bounce animation only
 * - Letter-by-letter stagger effect
 * - No shadows, no fade, just bounce
 */
export function AnimatedHeading({ 
  text = "Discover Movies with AI",
  className = ""
}: AnimatedHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
        letterSpan.style.transformOrigin = "center center";
        
        // Higher saturation colors - more vibrant
        letterSpan.style.color = "#fefae0";
        
        wordSpan.appendChild(letterSpan);
        lettersRef.current.push(letterSpan);
      });

      heading.appendChild(wordSpan);
    });

    // Simple bounce animation only - no fade, no shadows
    gsap.from(lettersRef.current, {
      scale: 0,
      y: 20,
      duration: 0.6,
      ease: "back.out(1.7)",
      stagger: {
        amount: 0.8,
        from: "start",
      },
      delay: 0.2,
    });

    // Cleanup
    return () => {
      lettersRef.current.forEach((letter) => {
        gsap.killTweensOf(letter);
      });
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <h1
        ref={headingRef}
        className={`text-4xl md:text-6xl font-bold text-[#fefae0] leading-tight tracking-tight ${className}`}
      >
        {text}
      </h1>
    </div>
  );
}

