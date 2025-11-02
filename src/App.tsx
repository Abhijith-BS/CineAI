import { Authenticated, Unauthenticated, useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";
import { ChatInterface } from "./components/ChatInterface";
import { MovieDetails } from "./components/MovieDetails";
import { SearchResults } from "./components/SearchResults";
import { LandingPage } from "./components/LandingPage";
import { BaseLayout } from "./components/BaseLayout";
import { PageTransition } from "./components/PageTransition";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "chat" | "movie" | "search" | "signin">("home");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [hasNavigatedAway, setHasNavigatedAway] = useState<boolean>(false);
  const [showSignIn, setShowSignIn] = useState<boolean>(false);
  const navButtonsRef = useRef<HTMLButtonElement[]>([]);
  const { isAuthenticated } = useConvexAuth();

  // Reset state when user successfully authenticates
  useEffect(() => {
    if (isAuthenticated && showSignIn) {
      // User just signed in - reset to show authenticated landing page
      setShowSignIn(false);
      setShowLanding(true);
      setHasNavigatedAway(false);
      setCurrentView("home");
    }
  }, [isAuthenticated, showSignIn]);

  // Show landing page:
  // - For unauthenticated users: Always show landing page (unless they clicked Sign In)
  // - For authenticated users: Show landing on first visit only (when on home and not navigated away)
  const showLandingPage = !showSignIn && currentView === "home" && showLanding && !hasNavigatedAway;
  
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
        setCurrentView("home");
        setShowLanding(true);
        setHasNavigatedAway(false);
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
                  setCurrentView("home");
                  setShowLanding(true);
                  setHasNavigatedAway(false);
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
                  setSearchQuery("");
                }}
              />
            </div>
          </nav>
        </Authenticated>
      )}

      {/* Page Content with Transitions */}
      {/* Use a composite key that includes auth state to ensure proper transitions */}
      <PageTransition pageKey={`${currentView}-${showLandingPage}`}>
        <div className={showLandingPage ? "" : "container mx-auto px-4 py-8"}>
          <Authenticated>
            {showLandingPage ? (
              <LandingPage
                onStartChat={() => {
                  setCurrentView("chat");
                  setShowLanding(false);
                  setHasNavigatedAway(true);
                }}
                onBrowseMovies={() => {
                  setCurrentView("home");
                  setShowLanding(false);
                  setHasNavigatedAway(true);
                }}
              />
            ) : (
              <Content 
                currentView={currentView}
                selectedMovieId={selectedMovieId}
                searchQuery={searchQuery}
                setCurrentView={setCurrentView}
                setSelectedMovieId={setSelectedMovieId}
              />
            )}
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
                  <SignInForm />
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
  searchQuery, 
  setCurrentView, 
  setSelectedMovieId 
}: {
  currentView: string;
  selectedMovieId: string | null;
  searchQuery: string;
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string | null) => void;
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
    case "chat":
      return <ChatInterface setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
    case "movie":
      return selectedMovieId ? (
        <MovieDetails movieId={selectedMovieId} setCurrentView={setCurrentView} />
      ) : (
        <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />
      );
    case "search":
      return <SearchResults query={searchQuery} setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
    default:
      // When on home but not showing landing, show the regular HomePage
      return <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
  }
}
