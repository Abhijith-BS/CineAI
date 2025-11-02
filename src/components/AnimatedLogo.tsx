import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedLogoProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Animated "CineAI" logo component with GSAP animations
 * Features:
 * - Letter-by-letter stagger animation with higher color saturation
 * - Fade-in and upward motion
 * - Smooth easing with power4.out
 * - Re-animates on mount for every page
 */
export function AnimatedLogo({ className = "", onClick }: AnimatedLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const text = "CineAI";
    const container = containerRef.current;
    
    // Clear existing content
    container.innerHTML = "";
    lettersRef.current = [];

    // Split text into letters and create spans
    text.split("").forEach((letter, index) => {
      const span = document.createElement("span");
      span.textContent = letter === " " ? "\u00A0" : letter;
      span.style.display = "inline-block";
      span.style.opacity = "0";
      span.style.transform = "translateY(20px) scale(0.9)";
      
      // Apply gradient text with higher saturation
      span.className = "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent";
      span.style.backgroundImage = "linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #a855f7 100%)";
      span.style.backgroundSize = "200% 100%";
      span.style.WebkitBackgroundClip = "text";
      span.style.webkitBackgroundClip = "text";
      span.style.backgroundClip = "text";
      
      container.appendChild(span);
      lettersRef.current.push(span);
    });

    // Animate letters with stagger
    gsap.from(lettersRef.current, {
      opacity: 0,
      y: 20,
      scale: 0.9,
      rotation: -5, // Slight rotation for dynamic effect
      duration: 0.6,
      ease: "power4.out",
      stagger: {
        amount: 0.4,
        from: "start",
      },
      delay: 0.1,
    });

    // Add shimmer effect after initial animation
    lettersRef.current.forEach((letter, index) => {
      gsap.to(letter, {
        backgroundPosition: "200% 0%",
        duration: 2 + index * 0.1,
        ease: "none",
        repeat: -1,
        delay: 0.6 + index * 0.1,
      });
    });

    // Cleanup
    return () => {
      lettersRef.current.forEach((letter) => {
        gsap.killTweensOf(letter);
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`text-2xl font-bold tracking-tight cursor-pointer ${className}`}
      onClick={onClick}
    />
  );
}

