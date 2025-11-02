import { useEffect, useRef } from "react";
import gsap from "gsap";

interface LandingPageProps {
  onStartChat?: () => void;
  onBrowseMovies?: () => void;
  onSignIn?: () => void; // Navigate to sign in page
}

/**
 * GSAP-powered landing page with animations similar to GSAP.com homepage
 * Features:
 * - Staggered letter/word animations with fade + upward movement
 * - Smooth easing (power4.out/expo.out)
 * - 3D scale-up entrance effects
 * - Gradient shimmer effects on text
 * - Responsive design with centered layout
 */
export function LandingPage({ onStartChat, onBrowseMovies, onSignIn }: LandingPageProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Step 1: Animate navigation bar (CineAI logo)
    // Fade in with subtle upward motion and slight scale
    if (navRef.current) {
      gsap.from(navRef.current, {
        opacity: 0,
        y: -20,
        scale: 0.95,
        duration: 1,
        ease: "power4.out",
      });
    }

    // Step 2: Split heading text into individual words/letters for stagger effect
    if (headingRef.current) {
      const text = headingRef.current.textContent || "";
      headingRef.current.innerHTML = "";

      // Split into words and create spans for each
      const words = text.split(" ");
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
          letterSpan.style.transform = "translateY(40px) scale(0.8)";
          letterSpan.style.transformOrigin = "center bottom";
          letterSpan.setAttribute("data-letter", `${wordIndex}-${letterIndex}`);
          wordSpan.appendChild(letterSpan);
        });

        headingRef.current!.appendChild(wordSpan);
      });

      // Animate each letter with stagger delay
      const letters = headingRef.current.querySelectorAll("span[data-letter]");
      gsap.from(letters, {
        opacity: 0,
        y: 40,
        scale: 0.8,
        rotationX: -15, // Subtle 3D rotation
        duration: 0.8,
        ease: "expo.out",
        stagger: {
          amount: 1.2, // Total stagger duration
          from: "start",
        },
        delay: 0.3, // Delay after nav animation
      });
    }

    // Step 3: Animate container with scale-up entrance
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.5,
      });
    }

    // Step 4: Create gradient shimmer effect on heading text
    // This creates a moving gradient overlay similar to GSAP's homepage
    if (shimmerRef.current && headingRef.current) {
      // Create shimmer animation that loops
      gsap.to(shimmerRef.current, {
        backgroundPosition: "200% 0%",
        duration: 3,
        ease: "none",
        repeat: -1,
        delay: 1.5, // Start after initial animations
      });
    }

    // Cleanup function for GSAP animations
    return () => {
      const elementsToKill = [];
      if (navRef.current) elementsToKill.push(navRef.current);
      if (containerRef.current) elementsToKill.push(containerRef.current);
      if (shimmerRef.current) elementsToKill.push(shimmerRef.current);
      if (headingRef.current) {
        const letters = headingRef.current.querySelectorAll("span[data-letter]");
        letters.forEach((letter) => elementsToKill.push(letter));
      }
      if (elementsToKill.length > 0) {
        gsap.killTweensOf(elementsToKill);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Top Navigation Bar */}
      <nav
        ref={navRef}
        className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-6"
      >
        <div className="text-3xl font-bold text-[#fefae0] tracking-tight">
          CineAI
        </div>
        {/* Show Sign In button for unauthenticated users, Get Started for authenticated */}
        {onSignIn ? (
          <button
            onClick={onSignIn}
            className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-[#fefae0] rounded-full font-medium transition-all duration-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 backdrop-blur-sm"
          >
            Sign In
          </button>
        ) : onStartChat ? (
          <button
            onClick={onStartChat}
            className="px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-[#fefae0] rounded-full font-medium transition-all duration-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 backdrop-blur-sm"
          >
            Get Started
          </button>
        ) : null}
      </nav>

      {/* Main Content Container */}
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center text-center px-4 relative z-10"
      >
        {/* Heading with shimmer overlay container */}
        <div className="relative inline-block">
          {/* Main heading text */}
          <h1
            ref={headingRef}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#fefae0] leading-tight tracking-tight relative z-10"
            style={{
              textShadow: "0 0 40px rgba(254, 250, 224, 0.1)",
            }}
          >
            Discover Movies with AI
          </h1>

          {/* Gradient shimmer overlay for text effect - Higher saturation */}
          <div
            ref={shimmerRef}
            className="absolute inset-0 pointer-events-none z-20"
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
            <div className="text-5xl md:text-7xl lg:text-8xl font-bold text-transparent leading-tight tracking-tight">
              Discover Movies with AI
            </div>
          </div>
        </div>

        {/* Subtitle with fade-in animation */}
        <p
          className="mt-8 text-xl md:text-2xl text-gray-400 max-w-2xl font-light leading-relaxed"
          style={{
            animation: "fadeInUp 1s ease-out 1.5s both",
          }}
        >
          Chat with AI to find your next favorite movie or show. Describe what
          you're in the mood for and discover personalized recommendations.
        </p>

        {/* CTA Buttons with hover effects */}
        <div
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center"
          style={{
            animation: "fadeInUp 1s ease-out 1.8s both",
          }}
        >
          {/* For unauthenticated users: Show Sign In button */}
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              Sign In to Continue
            </button>
          )}
          {/* For authenticated users: Show action buttons */}
          {onStartChat && (
            <button
              onClick={onStartChat}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              Start Chatting
            </button>
          )}
          {onBrowseMovies && (
            <button
              onClick={onBrowseMovies}
              className="px-10 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-[#fefae0] font-semibold rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:bg-white/20 hover:border-white/30"
            >
              Browse Movies
            </button>
          )}
        </div>
      </div>

      {/* Add keyframes for fadeInUp animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

