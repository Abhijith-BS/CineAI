import { Authenticated, Unauthenticated, useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";
import { ChatInterface } from "./components/ChatInterface";
import { ContentDetails } from "./components/ContentDetails";
import { SearchResults } from "./components/SearchResults";
import { LandingPage } from "./components/LandingPage";
import { BaseLayout } from "./components/BaseLayout";
import { PageTransition } from "./components/PageTransition";
import { useState, useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import gsap from "gsap";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "chat" | "movie" | "search" | "signin">("home");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<"movie" | "tv">("movie");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [hasNavigatedAway, setHasNavigatedAway] = useState<boolean>(false);
  const [showSignIn, setShowSignIn] = useState<boolean>(false);
  const [forceHomePage, setForceHomePage] = useState<boolean>(false);
  const navButtonsRef = useRef<HTMLButtonElement[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const prevAuthStateRef = useRef<boolean>(false);

  // Helper function to clear all auth-related storage
  const clearAuthStorage = () => {
    // Clear all Convex and auth-related items from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes("convex") || key.toLowerCase().includes("auth") || key.toLowerCase().includes("token"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  // Auto sign out when browser closes or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear auth storage when browser closes
      clearAuthStorage();
      sessionStorage.clear();
    };

    const handlePageHide = () => {
      // pagehide is more reliable than beforeunload
      clearAuthStorage();
      sessionStorage.clear();
    };

    // Listen for page unload events
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  // Clear auth on initial load if sessionStorage is empty (browser was closed)
  // This ensures users are signed out when browser closes and reopens
  // Also handles server restarts when the page reloads
  useEffect(() => {
    const sessionKey = "app:session:started";
    const sessionStarted = sessionStorage.getItem(sessionKey);
    
    // If no session flag exists, this means:
    // 1. Browser was closed and reopened (sessionStorage cleared)
    // 2. Server was restarted and page reloaded (sessionStorage cleared)
    // In both cases, clear auth to sign user out
    if (!sessionStarted) {
      clearAuthStorage();
      // Mark session as started
      sessionStorage.setItem(sessionKey, Date.now().toString());
    }
  }, []);

  // Track authentication state changes to show loading
  useEffect(() => {
    // If user was not authenticated and now is, they just signed in
    if (!prevAuthStateRef.current && isAuthenticated) {
      setIsSigningIn(true);
    }
    // If sign-in fails (authLoading becomes false but still not authenticated), reset loading
    if (isSigningIn && !authLoading && !isAuthenticated && showSignIn) {
      setIsSigningIn(false);
    }
    prevAuthStateRef.current = isAuthenticated;
  }, [isAuthenticated, authLoading, isSigningIn, showSignIn]);

  // Reset state when user successfully authenticates
  useEffect(() => {
    if (isAuthenticated && showSignIn) {
      // User just signed in - go directly to home page (no landing page)
      setShowSignIn(false);
      setShowLanding(false);
      setHasNavigatedAway(true);
      setForceHomePage(true);
      setCurrentView("home");
    }
  }, [isAuthenticated, showSignIn]);

  // Hide loading after a short delay once authenticated and content is ready
  useEffect(() => {
    if (isAuthenticated && isSigningIn && !authLoading) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        setIsSigningIn(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSigningIn, authLoading]);

  // Show landing page:
  // - For unauthenticated users: Always show landing page (unless they clicked Sign In)
  // - For authenticated users: Never show landing page - go directly to home
  // - Never show landing page if forceHomePage is true (when clicking Back to Home)
  const showLandingPage = !isAuthenticated && !showSignIn && currentView === "home" && showLanding && !hasNavigatedAway && !forceHomePage;

  // Scroll to top only when explicitly navigating to home (not on re-renders)
  const prevViewRef = useRef<string>("");
  useEffect(() => {
    // Only scroll if we actually changed views TO home (not if we're already on home)
    if (currentView === "home" && !showLandingPage && prevViewRef.current !== "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevViewRef.current = currentView;
  }, [currentView, showLandingPage]);
  
  // Show header when:
  // - Authenticated users on non-landing pages (chat, search, movie details, etc.)
  // - Unauthenticated users on sign in page
  // - Do NOT show header on landing pages (both authenticated and unauthenticated)
  const shouldShowHeader = (isAuthenticated && !showLandingPage) || (showSignIn && !isAuthenticated);

  // Animate nav buttons when they appear (not needed in BaseLayout, but keeping for nav buttons)
  useEffect(() => {
    if (!showLandingPage && navButtonsRef.current.length > 0) {
      gsap.from(navButtonsRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.1,
        delay: 0.2,
      });
    }
  }, [showLandingPage]);

  return (
    <BaseLayout
      showHeader={shouldShowHeader}
      currentPage={currentView}
      onLogoClick={() => {
        setShowLanding(false);
        setHasNavigatedAway(true);
        setCurrentView("home");
        setSelectedMovieId(null);
        setSelectedContentType("movie");
        setSearchQuery("");
      }}
    >
      {/* Additional Navigation - Shown for authenticated users when not on landing page */}
      {shouldShowHeader && (
        <Authenticated>
          <nav className="container mx-auto px-4 py-4 flex justify-between items-center relative z-10">
            <div className="hidden md:flex space-x-6">
              <button 
                ref={(el) => {
                  if (el) navButtonsRef.current[0] = el;
                }}
                onClick={() => {
                  setShowLanding(false);
                  setHasNavigatedAway(true);
                  setCurrentView("home");
                  setSelectedMovieId(null);
                  setSelectedContentType("movie");
                  setSearchQuery("");
                }}
                className={`text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  currentView === "home" 
                    ? "text-purple-500" 
                    : "text-gray-300 hover:text-purple-400"
                }`}
                onMouseEnter={(e) => {
                  if (currentView !== "home") {
                    gsap.to(e.currentTarget, {
                      scale: 1.1,
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }}
              >
                Home
              </button>
              <button 
                ref={(el) => {
                  if (el) navButtonsRef.current[1] = el;
                }}
                onClick={() => {
                  setCurrentView("chat");
                  setShowLanding(false);
                  setHasNavigatedAway(true);
                }}
                className={`text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  currentView === "chat" 
                    ? "text-purple-500" 
                    : "text-gray-300 hover:text-purple-400"
                }`}
                onMouseEnter={(e) => {
                  if (currentView !== "chat") {
                    gsap.to(e.currentTarget, {
                      scale: 1.1,
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }}
              >
                AI Chat
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search movies & shows..."
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setCurrentView("search");
                      setShowLanding(false);
                      setHasNavigatedAway(true);
                    }
                  }}
                  onFocus={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1.05,
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                  onBlur={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                />
              </div>
              <SignOutButton 
                onSignOut={() => {
                  // Reset app state to show landing page after logout
                  setCurrentView("home");
                  setShowLanding(true);
                  setHasNavigatedAway(false);
                  setShowSignIn(false);
                  setSelectedMovieId(null);
                  setSelectedContentType("movie");
                  setSearchQuery("");
                }}
              />
            </div>
          </nav>
        </Authenticated>
      )}

      {/* Page Content with Transitions */}
      {/* Use a composite key that includes auth state to ensure proper transitions */}
      {/* Loading overlay during sign-in */}
      {(isSigningIn || (authLoading && showSignIn)) && (
        <div className="fixed inset-0 bg-[#0d0d0d]/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
              </div>
            </div>
            <p className="text-white text-lg font-medium">Signing you in...</p>
            <p className="text-gray-400 text-sm">Please wait a moment</p>
          </div>
        </div>
      )}

      <PageTransition pageKey={`${currentView}-${showLandingPage}`}>
        <div className={showLandingPage ? "" : "container mx-auto px-4 py-8"}>
          <Authenticated>
            {/* Authenticated users always see Content, never LandingPage */}
            <Content 
              currentView={currentView}
              selectedMovieId={selectedMovieId}
              selectedContentType={selectedContentType}
              searchQuery={searchQuery}
              setCurrentView={setCurrentView}
              setSelectedMovieId={setSelectedMovieId}
              setSelectedContentType={setSelectedContentType}
              onGoHome={() => {
                // Force HomePage to show (not LandingPage) by setting forceHomePage flag
                setForceHomePage(true);
                setShowLanding(false);
                setHasNavigatedAway(true);
                setSelectedMovieId(null);
                setSelectedContentType("movie");
                setSearchQuery("");
                setCurrentView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </Authenticated>
          
          <Unauthenticated>
            {/* Unauthenticated users: Show landing page by default, or Sign In form if they clicked Sign In */}
            {showSignIn ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-full max-w-md">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                      Welcome to CineAI
                    </h1>
                    <p className="text-gray-300 text-lg">
                      Discover movies and shows with AI-powered conversations
                    </p>
                  </div>
                  <SignInForm 
                    onSignInStart={() => setIsSigningIn(true)}
                  />
                </div>
              </div>
            ) : (
              <LandingPage
                onSignIn={() => {
                  setShowSignIn(true);
                  setShowLanding(false);
                  setCurrentView("signin");
                }}
              />
            )}
          </Unauthenticated>
        </div>
      </PageTransition>
      
      <Toaster />
    </BaseLayout>
  );
}

function Content({ 
  currentView, 
  selectedMovieId,
  selectedContentType,
  searchQuery, 
  setCurrentView, 
  setSelectedMovieId,
  setSelectedContentType,
  onGoHome
}: {
  currentView: string;
  selectedMovieId: string | null;
  selectedContentType: "movie" | "tv";
  searchQuery: string;
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string | null) => void;
  setSelectedContentType: (type: "movie" | "tv") => void;
  onGoHome: () => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  switch (currentView) {
    case "home":
      // Always show HomePage when currentView is "home" (not LandingPage)
      return <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} setSelectedContentType={setSelectedContentType} />;
    case "chat":
      return <ChatInterface setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} setSelectedContentType={setSelectedContentType} onGoHome={onGoHome} />;
    case "movie":
      return selectedMovieId ? (
        <ContentDetails 
          contentId={selectedMovieId} 
          contentType={selectedContentType}
          setCurrentView={setCurrentView} 
          onGoHome={onGoHome} 
        />
      ) : (
        <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} setSelectedContentType={setSelectedContentType} />
      );
    case "search":
      return <SearchResults query={searchQuery} setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} setSelectedContentType={setSelectedContentType} onGoHome={onGoHome} />;
    default:
      // Fallback to HomePage
      return <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} setSelectedContentType={setSelectedContentType} />;
  }
}
